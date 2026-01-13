import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, Customer, Sale, StockMovement, DeliveryNote, User, PaymentMethodConfig, ExchangeRate, Currency } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    stockMovements: StockMovement[];
    deliveryNotes: DeliveryNote[];
    paymentMethods: PaymentMethodConfig[];
    exchangeRates: ExchangeRate[];
    users: User[];
    currentUser: User | null;
    isLoading: boolean;

    // Productos
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => Promise<void>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    // Clientes
    addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer | null>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;

    // Ventas
    addSale: (sale: Omit<Sale, 'id' | 'saleNumber' | 'date'>, deliveryType?: 'paid' | 'cash_on_delivery' | 'pending') => Promise<{ sale: Sale; deliveryNote: DeliveryNote } | null>;
    registerPayment: (saleId: string, amount: number, paymentMethodId: string, notes?: string) => Promise<void>;

    // Movimientos Stock
    addStockMovement: (movement: Omit<StockMovement, 'id'>) => Promise<void>;

    // Pagos
    addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id'>) => void; // Local config
    updatePaymentMethod: (id: string, method: Partial<PaymentMethodConfig>) => void;
    deletePaymentMethod: (id: string) => void;

    // Usuarios
    addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
    updateUser: (id: string, user: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    // Tipos de Cambio
    addExchangeRate: (rate: Omit<ExchangeRate, 'id' | 'date'>) => Promise<void>;
    getActiveExchangeRate: (fromCurrency: Currency, toCurrency: Currency) => ExchangeRate | null;

    // Consultas
    getProductById: (id: string) => Product | undefined;
    getCustomerById: (id: string) => Customer | undefined;
    getSalesByCustomer: (customerId: string) => Sale[];

    // Auth
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
    PRODUCTS: 'shop-plumas-products',
    CUSTOMERS: 'shop-plumas-customers',
    SALES: 'shop-plumas-sales',
    STOCK_MOVEMENTS: 'shop-plumas-stock-movements',
    DELIVERY_NOTES: 'shop-plumas-delivery-notes',
    PAYMENT_METHODS: 'shop-plumas-payment-methods',
    EXCHANGE_RATES: 'shop-plumas-exchange-rates',
    USERS: 'shop-plumas-users',
    CURRENT_USER: 'shop-plumas-current-user',
};

// Usuarios por defecto (Fallback)
const DEFAULT_USERS: User[] = [
    { id: 'user-admin-lilia', username: 'lidiacoll', password: 'Lidia040269', name: 'Lidia Coll', role: 'owner', createdAt: new Date() },
    { id: 'user-seller', username: 'vendedor', password: 'vend123', name: 'Vendedor', role: 'seller', createdAt: new Date() },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
    { id: 'cash', name: 'Efectivo', surchargePercentage: 0, active: true, type: 'cash' },
    { id: 'card', name: 'Tarjeta Crédito/Débito', surchargePercentage: 10, active: true, type: 'card' },
    { id: 'transfer', name: 'Transferencia', surchargePercentage: 0, active: true, type: 'transfer' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Carga inicial
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            try {
                // 1. Cargar Config Local (Pagos)
                const storedPM = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
                setPaymentMethods(storedPM ? JSON.parse(storedPM) : DEFAULT_PAYMENT_METHODS);

                const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
                if (storedUser) setCurrentUser(JSON.parse(storedUser));

                // 2. Intentar cargar de Supabase
                const [pRes, cRes, sRes, uRes, erRes, smRes] = await Promise.all([
                    supabase.from('products').select('*'),
                    supabase.from('customers').select('*'),
                    supabase.from('sales').select('*'),
                    supabase.from('users').select('*'), // Asumiendo tabla users creada manualmente o en schema
                    supabase.from('exchange_rates').select('*'),
                    supabase.from('stock_movements').select('*')
                ]);

                // Si hay error de red, usar LocalStorage (Modo Offline)
                if (pRes.error) throw pRes.error;

                const dbProducts = pRes.data || [];
                const dbCustomers = cRes.data || [];
                const dbSales = sRes.data || [];
                const dbUsers = uRes.data && uRes.data.length > 0 ? uRes.data : DEFAULT_USERS; // Si no hay users en DB, usar default
                const dbRates = erRes.data || [];
                const dbMovements = smRes.data || [];

                setProducts(dbProducts);
                // Mapear clientes de snake_case (DB) a camelCase (App)
                const mapCustomerFromDB = (c: any): Customer => ({
                    id: c.id,
                    name: c.name,
                    lastName: c.last_name || c.lastName || '',
                    phone: c.phone || '',
                    email: c.email || '',
                    address: c.address || '',
                    city: c.city || '',
                    province: c.province || '',
                    notes: c.notes || '',
                    createdAt: new Date(c.created_at || c.createdAt || new Date()),
                    updatedAt: new Date(c.updated_at || c.updatedAt || new Date()),
                });

                setCustomers(dbCustomers.map(mapCustomerFromDB));

                // Mapear Ventas snake_case -> camelCase
                const mapSaleFromDB = (s: any): Sale => {
                    // Intentar recuperar nombre de usuario si falta
                    const sellerObj = Array.isArray(dbUsers) ? dbUsers.find((u: any) => u.id === s.user_id) : null;
                    const finalUserName = s.user_name || (sellerObj ? sellerObj.name : 'Desconocido');

                    return {
                        id: s.id,
                        saleNumber: typeof s.sale_number === 'number' ? `V${String(s.sale_number).padStart(6, '0')}` : (s.sale_number || s.saleNumber || 'V---'),
                        customerId: s.customer_id,
                        customerName: s.customer_name || 'Cliente Final',
                        customerAddress: '',
                        items: s.items || [],
                        subtotal: s.subtotal || 0,
                        total: s.total || 0,
                        currency: s.currency || 'ARS',
                        payment: {
                            methodId: 'db',
                            methodName: s.payment_method || 'Varios',
                            subtotal: s.subtotal || 0,
                            surcharge: s.surcharge || 0,
                            total: s.total || 0
                        },
                        paymentStatus: s.payment_status || 'paid',
                        amountPaid: s.amount_paid || 0,
                        balance: s.balance || 0,
                        totalCost: s.total_cost || 0,
                        totalProfit: s.total_profit || 0,
                        date: new Date(s.date || s.created_at),
                        notes: s.notes,
                        userId: s.user_id,
                        userName: finalUserName
                    };
                };

                const loadedSales = dbSales.map(mapSaleFromDB);

                // Ordenar por fecha descendente
                loadedSales.sort((a, b) => b.date.getTime() - a.date.getTime());

                setSales(loadedSales);

                // Generar Remitos desde las Ventas cargadas
                const generatedDeliveryNotes: DeliveryNote[] = loadedSales.map(s => ({
                    id: s.id,
                    noteNumber: s.saleNumber.replace('V', 'R'),
                    saleId: s.id,
                    customerId: s.customerId,
                    customerName: s.customerName,
                    customerAddress: s.customerAddress,
                    items: s.items,
                    total: s.total,
                    deliveryType: s.paymentStatus === 'pending' ? 'pending' : 'paid',
                    date: s.date,
                    notes: s.notes
                }));
                setDeliveryNotes(generatedDeliveryNotes);

                // Mapear Movimientos de Stock
                const mapMovementFromDB = (m: any): StockMovement => ({
                    id: m.id,
                    productId: m.product_id || m.productId,
                    quantity: Number(m.quantity),
                    cost: Number(m.cost || 0),
                    type: m.type,
                    date: new Date(m.date || m.created_at),
                    notes: m.reason || m.notes || '', // Schema usa 'reason', App usa 'notes'
                    userId: m.user_id || m.userId,
                });

                setStockMovements(dbMovements.map(mapMovementFromDB));
                setUsers(dbUsers); // Si no hay en DB, usamos memoria pero NO guardamos en DB automático para no ensuciar

                // Tipos de cambio: Si vacío, crear default
                if (dbRates.length === 0) {
                    const initialRate = {
                        from_currency: 'USD',
                        to_currency: 'ARS',
                        rate: 1000,
                        source: 'Inicial',
                        date: new Date().toISOString()
                    };
                    // No insertamos automáticamente para no bloquear, solo estado
                    setExchangeRates([{ ...initialRate, id: 'temp', fromCurrency: 'USD', toCurrency: 'ARS', date: new Date() } as any]);
                } else {
                    setExchangeRates(dbRates.map((r: any) => ({
                        ...r,
                        fromCurrency: r.from_currency, // Mapeo de nombres snake_case a camelCase si es necesario, pero DB crea json. Revisar. supabase devuelve snake_case por defecto
                        toCurrency: r.to_currency
                    })));
                }

                // Mapeos adicionales si Supabase retorna snake_case y app usa camelCase
                // En este caso, asumimos que insertamos camelCase O que DB tiene columnas snake_case.
                // IMPORTANTE: El schema SQL usa snake_case (created_at). Interfaces usan camelCase (createdAt). 
                // Supabase permite mapeo automático pero hay que configurarlo o hacerlo manual.
                // Haremos un mapeo manual rápido aquí para evitar errores.

                // Helper mapeo
                const mapProduct = (p: any): Product => ({
                    ...p,
                    createdAt: new Date(p.created_at || p.createdAt),
                    updatedAt: new Date(p.updated_at || p.updatedAt),
                    // Si hay campos snake_case extra:
                    image_url: p.image_url || p.imageUrl
                });

                setProducts(dbProducts.map(mapProduct));

                // .... Resto de mapeos
                // SIMPLIFICACION: Por ahora, confiaremos en que JS maneja los objetos, pero las fechas necesitan new Date()

            } catch (error) {
                console.error("Modo Offline / Error Supabase:", error);
                // Fallback a LocalStorage
                const load = (k: string) => localStorage.getItem(k) ? JSON.parse(localStorage.getItem(k)!) : [];
                setProducts(load(STORAGE_KEYS.PRODUCTS));
                setCustomers(load(STORAGE_KEYS.CUSTOMERS));
                setSales(load(STORAGE_KEYS.SALES));
                setUsers(load(STORAGE_KEYS.USERS).length ? load(STORAGE_KEYS.USERS) : DEFAULT_USERS);
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, []);

    // --- Actions con Supabase ---

    const addProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => {
        const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `P-${codeSuffix}`;
        const newProduct = { ...data, id: crypto.randomUUID(), code, status: 'in_stock' }; // Objeto plano

        // Optimistic
        setProducts(prev => [...prev, newProduct as Product]);

        // DB: Convertir a snake_case si tabla SQL es estricta, pero Supabase suele tragar JSON.
        // Haremos insert directo con campos coincidentes.
        const dbPayload = {
            id: newProduct.id,
            code: newProduct.code,
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            cost: newProduct.cost,
            stock: newProduct.stock,
            min_stock: newProduct.minStock, // camel a snake
            category: newProduct.category,
            color: newProduct.color,
            currency: newProduct.currency,
            created_at: new Date(),
        };

        const { error } = await supabase.from('products').insert(dbPayload);
        if (error) {
            console.error("Error saving product to cloud:", error);
            alert("Error guardando en la nube. Verifique conexión.");
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        // DB mappping needed... simplified for MVP:
        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) console.error("Error updating cloud:", error);
    };

    const deleteProduct = async (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        await supabase.from('products').delete().eq('id', id);
    };

    const addCustomer = async (data: any) => {
        const newCustomer = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
        // Optimistic update
        setCustomers(prev => [...prev, newCustomer]);

        // DB Payload (snake_case)
        const dbPayload = {
            id: newCustomer.id,
            name: newCustomer.name,
            last_name: newCustomer.lastName,
            phone: newCustomer.phone,
            email: newCustomer.email,
            address: newCustomer.address,
            city: newCustomer.city,
            province: newCustomer.province,
            notes: newCustomer.notes,
            created_at: newCustomer.createdAt,
            updated_at: newCustomer.updatedAt
        };

        const { error } = await supabase.from('customers').insert(dbPayload);
        if (error) {
            console.error("Error creating customer:", error);
            alert(`Error creando cliente en nube: ${error.message}`);
        }
        return newCustomer;
    };

    const updateCustomer = async (id: string, updates: any) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

        // Mapear updates a snake_case
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.province !== undefined) dbUpdates.province = updates.province;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        dbUpdates.updated_at = new Date();

        await supabase.from('customers').update(dbUpdates).eq('id', id);
    };

    const deleteCustomer = async (id: string) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
        await supabase.from('customers').delete().eq('id', id);
    };

    const addSale = async (saleData: any, _deliveryType = 'pending') => {
        const saleNumber = `V${String(sales.length + 1).padStart(6, '0')}`;
        const newSale = {
            ...saleData,
            id: crypto.randomUUID(),
            saleNumber,
            date: new Date(),
            items: saleData.items // JSONB
        };

        // Optimistic State
        setSales(prev => [...prev, newSale]);

        // DB Insert
        // Mapear campos camelCase a snake_case DB
        const dbSale = {
            id: newSale.id,
            // sale_number autogenerado
            customer_id: newSale.customerId,
            customer_name: newSale.customerName,
            subtotal: newSale.subtotal,
            total: newSale.total,
            total_cost: newSale.totalCost, // Nuevo
            total_profit: newSale.totalProfit, // Nuevo
            items: newSale.items,
            payment_status: newSale.paymentStatus,
            amount_paid: newSale.amountPaid,
            balance: newSale.balance,
            currency: newSale.currency,
            notes: newSale.notes,
            user_id: newSale.userId, // Nuevo
            user_name: newSale.userName, // Nuevo
            created_at: new Date()
        };

        const { error } = await supabase.from('sales').insert(dbSale);
        if (error) {
            console.error("Error sales DB", error);
            alert(`Error creando venta en nube: ${error.message || JSON.stringify(error)}`);
            return null;
        }

        // Actualizar stock y registrar movimientos
        newSale.items.forEach(async (item: any) => {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
                const newStock = prod.stock - item.quantity;

                // 1. Actualizar producto local y DB
                updateProduct(item.productId, { stock: newStock });

                // 2. Registrar Movimiento de Stock
                const newMoId = crypto.randomUUID();
                const now = new Date();

                // State update
                const stateMove: StockMovement = {
                    id: newMoId,
                    productId: item.productId,
                    quantity: item.quantity,
                    cost: prod.cost,
                    type: 'out',
                    date: now,
                    notes: `Venta ${saleNumber}`,
                    userId: currentUser?.id
                };
                setStockMovements(prev => [stateMove, ...prev]);

                // DB Insert
                const dbMove = {
                    id: newMoId,
                    product_id: item.productId,
                    type: 'out',
                    quantity: item.quantity,
                    cost: prod.cost,
                    previous_stock: prod.stock,
                    new_stock: newStock,
                    reason: `Venta ${saleNumber}`,
                    reference_id: newSale.id,
                    user_id: currentUser?.id,
                    date: now,
                    created_at: now
                };

                const { error: smError } = await supabase.from('stock_movements').insert(dbMove);
                if (smError) console.error("Error creating stock movement", smError);
            }
        });

        // Generar Remito (Local - DeliveryNotes no tiene tabla SQL en este script básico aun, usamos local state)
        const deliveryNote = { id: crypto.randomUUID(), saleId: newSale.id, ...newSale }; // Mock
        setDeliveryNotes(prev => [...prev, deliveryNote as any]);

        return { sale: newSale, deliveryNote };
    };

    const registerPayment = async (saleId: string, amount: number, _paymentMethodId: string, _notes?: string) => {
        // ... logica pago parcial
        setSales(prev => prev.map(s => s.id === saleId ? { ...s, amountPaid: s.amountPaid + amount, balance: s.total - (s.amountPaid + amount) } : s));

        // DB Update simple
        // Nota: Esto es inseguro en concurrencia real, mejor usar RPC procedure "register_payment"
        // MVP: Update directo
        const sale = sales.find(s => s.id === saleId);
        if (!sale) return;
        const newPaid = sale.amountPaid + amount;
        const newBalance = sale.total - newPaid;
        const newStatus = newBalance <= 0 ? 'paid' : 'pending';

        await supabase.from('sales').update({
            amount_paid: newPaid,
            balance: newBalance,
            payment_status: newStatus
        }).eq('id', saleId);
    };

    // Funciones dummy o locales puros
    const addStockMovement = async (m: any) => { setStockMovements(prev => [...prev, m]); }; // DB lo hace auto en venta a veces
    const addPaymentMethod = (m: any) => setPaymentMethods(prev => [...prev, m]); // Local config
    const updatePaymentMethod = (id: string, m: any) => setPaymentMethods(prev => prev.map(mm => mm.id === id ? { ...mm, ...m } : mm));
    const deletePaymentMethod = (id: string) => setPaymentMethods(prev => prev.filter(m => m.id !== id));

    const addUser = async (u: any) => {
        const newUser = { ...u, id: crypto.randomUUID() };
        setUsers(prev => [...prev, newUser]);
        await supabase.from('users').insert(newUser);
    };
    const updateUser = async (id: string, u: any) => {
        setUsers(prev => prev.map(us => us.id === id ? { ...us, ...u } : us));
        await supabase.from('users').update(u).eq('id', id);
    };
    const deleteUser = async (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        await supabase.from('users').delete().eq('id', id);
    };

    const addExchangeRate = async (rate: any) => {
        setExchangeRates(prev => [...prev, rate]);
        await supabase.from('exchange_rates').insert({
            from_currency: rate.fromCurrency,
            to_currency: rate.toCurrency,
            rate: rate.rate,
            source: rate.source,
            date: new Date()
        });
    };

    // Getters
    const getProductById = (id: string) => products.find(p => p.id === id);
    const getCustomerById = (id: string) => customers.find(c => c.id === id);
    const getSalesByCustomer = (cid: string) => sales.filter(s => s.customerId === cid);
    const getActiveExchangeRate = (from: string, to: string) => {
        // ... logic
        if (from === to) return null;
        // Buscar en exchangeRates (que viene de DB)
        // Mapeo manual rápido:
        const rate = exchangeRates.find(r =>
            (r.fromCurrency === from || (r as any).from_currency === from) &&
            (r.toCurrency === to || (r as any).to_currency === to));
        return rate || null;
    };

    const login = async (u: string, p: string) => {
        const found = users.find(user => user.username === u && user.password === p);
        if (found) {
            setCurrentUser(found);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
            return true;
        }
        return false;
    };
    const logout = () => { setCurrentUser(null); localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); };

    const value = {
        products, customers, sales, stockMovements, deliveryNotes, paymentMethods, exchangeRates, users, currentUser, isLoading,
        addProduct, updateProduct, deleteProduct,
        addCustomer, updateCustomer, deleteCustomer,
        addSale, registerPayment,
        addStockMovement, addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
        addUser, updateUser, deleteUser,
        addExchangeRate, getActiveExchangeRate,
        getProductById, getCustomerById, getSalesByCustomer,
        login, logout
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
