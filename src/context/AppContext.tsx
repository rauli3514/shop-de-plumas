import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, Customer, Sale, StockMovement, DeliveryNote, User, PaymentMethodConfig, ExchangeRate, Currency } from '../types';

interface AppContextType {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    stockMovements: StockMovement[];
    deliveryNotes: DeliveryNote[];
    paymentMethods: PaymentMethodConfig[];
    exchangeRates: ExchangeRate[]; // Tipos de cambio
    users: User[];
    currentUser: User | null;

    // Productos
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    // Clientes
    addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer; // Retorna el cliente creado
    updateCustomer: (id: string, customer: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;

    // Ventas
    addSale: (sale: Omit<Sale, 'id' | 'saleNumber' | 'date'>, deliveryType?: 'paid' | 'cash_on_delivery' | 'pending') => { sale: Sale; deliveryNote: DeliveryNote };
    registerPayment: (saleId: string, amount: number, paymentMethodId: string, notes?: string) => void;

    // Movimientos Stock
    addStockMovement: (movement: Omit<StockMovement, 'id'>) => void;

    // Pagos
    addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id'>) => void;
    updatePaymentMethod: (id: string, method: Partial<PaymentMethodConfig>) => void;
    deletePaymentMethod: (id: string) => void;

    // Usuarios
    addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    updateUser: (id: string, user: Partial<User>) => void;
    deleteUser: (id: string) => void;

    // Tipos de Cambio
    addExchangeRate: (rate: Omit<ExchangeRate, 'id' | 'date'>) => void;
    getActiveExchangeRate: (fromCurrency: Currency, toCurrency: Currency) => ExchangeRate | null;

    // Consultas
    getProductById: (id: string) => Product | undefined;
    getCustomerById: (id: string) => Customer | undefined;
    getSalesByCustomer: (customerId: string) => Sale[];

    // Auth
    login: (username: string, password: string) => boolean;
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

// Usuarios por defecto si no hay ninguno
// Usuarios por defecto si no hay ninguno
const DEFAULT_USERS: User[] = [
    {
        id: 'user-admin-lilia',
        username: 'lidiacoll',
        password: 'Lidia040269',
        name: 'Lidia Coll',
        role: 'owner',
        createdAt: new Date(),
    },
    {
        id: 'user-seller',
        username: 'vendedor',
        password: 'vend123',
        name: 'Vendedor',
        role: 'seller',
        createdAt: new Date(),
    },
];

// Métodos de pago por defecto
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
    const [isInitialized, setIsInitialized] = useState(false);

    // Cargar datos
    useEffect(() => {
        const loadData = () => {
            try {
                const load = (key: string) => {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                };

                setProducts(load(STORAGE_KEYS.PRODUCTS)?.map((p: any) => ({
                    ...p,
                    currency: p.currency || 'ARS' // Migración: agregar ARS a productos sin currency
                })) || []);
                setCustomers(load(STORAGE_KEYS.CUSTOMERS) || []);
                setSales(load(STORAGE_KEYS.SALES)?.map((s: any) => ({
                    ...s,
                    currency: s.currency || 'ARS', // Migración: agregar ARS a ventas sin currency
                    items: s.items?.map((item: any) => ({
                        ...item,
                        currency: item.currency || 'ARS' // Migración: agregar ARS a items sin currency
                    })) || []
                })) || []);
                setStockMovements(load(STORAGE_KEYS.STOCK_MOVEMENTS) || []);
                setDeliveryNotes(load(STORAGE_KEYS.DELIVERY_NOTES) || []);
                setPaymentMethods(load(STORAGE_KEYS.PAYMENT_METHODS) || DEFAULT_PAYMENT_METHODS);

                // Lógica especial: Asegurar que el usuario admin siempre exista Y tenga la contraseña correcta
                let loadedUsers = load(STORAGE_KEYS.USERS) || DEFAULT_USERS;

                // Buscar índice del admin
                const adminIndex = loadedUsers.findIndex((u: User) => u.username === 'lidiacoll');

                if (adminIndex === -1) {
                    // Si no existe, lo agregamos
                    loadedUsers = [...loadedUsers, DEFAULT_USERS[0]];
                } else {
                    // Si existe, FORZAMOS la contraseña correcta por seguridad
                    loadedUsers[adminIndex] = {
                        ...loadedUsers[adminIndex],
                        password: 'Lidia040269', // Restaurar contraseña siempre
                        role: 'owner' // Asegurar rol owner
                    };
                }

                // Guardar corrección inmediatamente
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(loadedUsers));

                setUsers(loadedUsers);

                // Cargar tipos de cambio o crear inicial
                let loadedRates = load(STORAGE_KEYS.EXCHANGE_RATES) || [];
                if (loadedRates.length === 0) {
                    // Crear tipo de cambio inicial USD -> ARS
                    const initialRate: ExchangeRate = {
                        id: crypto.randomUUID(),
                        fromCurrency: 'USD',
                        toCurrency: 'ARS',
                        rate: 1000, // Valor inicial
                        date: new Date(),
                        source: 'Inicial'
                    };
                    loadedRates = [initialRate];
                    localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATES, JSON.stringify(loadedRates));
                }
                setExchangeRates(loadedRates);

                const savedUser = load(STORAGE_KEYS.CURRENT_USER);
                if (savedUser) setCurrentUser(savedUser);

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsInitialized(true);
            }
        };
        loadData();
    }, []);

    // Persistencia
    // Persistencia - SOLO si ya se cargaron datos
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers)); }, [customers, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales)); }, [sales, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements)); }, [stockMovements, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.DELIVERY_NOTES, JSON.stringify(deliveryNotes)); }, [deliveryNotes, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(paymentMethods)); }, [paymentMethods, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATES, JSON.stringify(exchangeRates)); }, [exchangeRates, isInitialized]);
    useEffect(() => { if (isInitialized) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users, isInitialized]);

    // --- Productos ---
    const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'code'>) => {
        // Generar código único corto: "PROD-XXXX"
        const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `P-${codeSuffix}`;

        const newProduct: Product = {
            ...data,
            id: crypto.randomUUID(),
            code,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setProducts(prev => [...prev, newProduct]);
    };

    const updateProduct = (id: string, updates: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));
    };

    const deleteProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    // --- Clientes ---
    const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
        const newCustomer: Customer = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    };

    const updateCustomer = (id: string, updates: Partial<Customer>) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c));
    };

    const deleteCustomer = (id: string) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    // --- Ventas ---
    const addSale = (saleData: Omit<Sale, 'id' | 'saleNumber' | 'date'>, deliveryType?: 'paid' | 'cash_on_delivery' | 'pending'): { sale: Sale; deliveryNote: DeliveryNote } => {
        const saleNumber = `V${String(sales.length + 1).padStart(6, '0')}`;
        const newSale: Sale = {
            ...saleData,
            id: crypto.randomUUID(),
            saleNumber,
            date: new Date(),
        };

        setSales(prev => [...prev, newSale]);

        // Actualizar stock y generar movimiento
        newSale.items.forEach(item => {
            const currentProduct = products.find(p => p.id === item.productId);
            if (currentProduct) {
                updateProduct(item.productId, {
                    stock: currentProduct.stock - item.quantity,
                });

                addStockMovement({
                    productId: item.productId,
                    quantity: item.quantity,
                    cost: item.cost,
                    type: 'out',
                    date: new Date(),
                    notes: `Venta ${saleNumber}`,
                    userId: currentUser?.id
                });
            }
        });

        // Buscar cliente para datos completos de envío
        const customer = customers.find(c => c.id === saleData.customerId);

        // Determinar tipo de entrega (usar el pasado como parámetro o calcular)
        let finalDeliveryType: 'paid' | 'cash_on_delivery' | 'pending';
        if (deliveryType) {
            // Si se pasó explícitamente, usarlo directamente
            finalDeliveryType = deliveryType;
        } else {
            // Fallback a la lógica automática (para compatibilidad)
            if (newSale.balance <= 0) {
                finalDeliveryType = 'paid';
            } else if (newSale.paymentStatus === 'pending' && newSale.amountPaid === 0) {
                finalDeliveryType = 'cash_on_delivery';
            } else {
                finalDeliveryType = 'pending';
            }
        }

        // Generar Remito
        const deliveryNote: DeliveryNote = {
            id: crypto.randomUUID(),
            noteNumber: `R${String(deliveryNotes.length + 1).padStart(6, '0')}`,
            saleId: newSale.id,
            customerId: newSale.customerId,
            customerName: newSale.customerName,
            customerAddress: newSale.customerAddress,
            customerCity: customer?.city,
            customerProvince: customer?.province,
            items: newSale.items,
            total: newSale.total,
            amountToCollect: newSale.balance > 0 ? newSale.balance : undefined,
            deliveryType: finalDeliveryType,
            date: new Date(),
            notes: newSale.notes,
        };
        setDeliveryNotes(prev => [...prev, deliveryNote]);

        return { sale: newSale, deliveryNote };
    };

    // Registrar pagos parciales en ventas existentes
    const registerPayment = (saleId: string, amount: number, paymentMethodId: string, notes?: string) => {
        const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
        const methodName = paymentMethod?.name || 'Efectivo';

        setSales(prev => prev.map(sale => {
            if (sale.id !== saleId) return sale;

            const newAmountPaid = sale.amountPaid + amount;
            const newBalance = sale.total - newAmountPaid;
            const newStatus = newBalance <= 0 ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'pending');

            const paymentNote = `Pago $${amount.toFixed(2)} (${methodName})${notes ? ': ' + notes : ''}`;

            return {
                ...sale,
                amountPaid: newAmountPaid,
                balance: newBalance,
                paymentStatus: newStatus,
                notes: sale.notes ? `${sale.notes}\n${paymentNote}` : paymentNote
            };
        }));
    };

    // --- Stock Movements ---
    const addStockMovement = (movement: Omit<StockMovement, 'id'>) => {
        setStockMovements(prev => [...prev, { ...movement, id: crypto.randomUUID() }]);
    };

    // --- Pagos ---
    const addPaymentMethod = (method: Omit<PaymentMethodConfig, 'id'>) => {
        setPaymentMethods(prev => [...prev, { ...method, id: crypto.randomUUID() }]);
    };

    const updatePaymentMethod = (id: string, updates: Partial<PaymentMethodConfig>) => {
        setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const deletePaymentMethod = (id: string) => {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
    };

    // --- Usuarios ---
    const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
        const cleanData = {
            ...userData,
            username: userData.username.trim(),
        };
        setUsers(prev => [...prev, { ...cleanData, id: crypto.randomUUID(), createdAt: new Date() }]);
    };

    const updateUser = (id: string, updates: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    // --- Consultas ---
    const getProductById = (id: string) => products.find(p => p.id === id);
    const getCustomerById = (id: string) => customers.find(c => c.id === id);
    const getSalesByCustomer = (customerId: string) => sales.filter(s => s.customerId === customerId);

    // --- Auth ---
    const login = (username: string, password: string): boolean => {
        // En producción DEBE hashearse
        const normalizedInput = username.trim().toLowerCase();

        const user = users.find(u =>
            u.username.trim().toLowerCase() === normalizedInput &&
            u.password === password
        );

        if (user) {
            setCurrentUser(user);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    };

    // --- Tipos de Cambio ---
    const addExchangeRate = (rate: Omit<ExchangeRate, 'id' | 'date'>) => {
        const newRate: ExchangeRate = {
            ...rate,
            id: crypto.randomUUID(),
            date: new Date()
        };
        setExchangeRates(prev => [...prev, newRate]);
    };

    const getActiveExchangeRate = (fromCurrency: Currency, toCurrency: Currency): ExchangeRate | null => {
        if (fromCurrency === toCurrency) return null;
        const rates = exchangeRates
            .filter(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return rates[0] || null;
    };

    const value: AppContextType = {
        products, customers, sales, stockMovements, deliveryNotes, paymentMethods, exchangeRates, users, currentUser,
        addProduct, updateProduct, deleteProduct,
        addCustomer, updateCustomer, deleteCustomer,
        addSale, registerPayment, addStockMovement,
        addPaymentMethod, updatePaymentMethod, deletePaymentMethod,
        addExchangeRate, getActiveExchangeRate,
        addUser, updateUser, deleteUser,
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
