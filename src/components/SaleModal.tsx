import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Trash2, QrCode, UserPlus, AlertCircle, Check, Pencil } from 'lucide-react';
import type { SaleItem, Currency } from '../types';
import { generateSalePDF, generateDeliveryNotePDF } from '../utils/pdfGenerator';
import { convertCurrency, EXCHANGE_RATE_URL } from '../utils/currency';
import QRScannerModal from './QRScannerModal';
import CustomerModal from './CustomerModal';
import '../components/common.css';

interface SaleModalProps {
    onClose: () => void;
    initialProductId?: string | null;
}

const SaleModal: React.FC<SaleModalProps> = ({ onClose, initialProductId }) => {
    const { products, customers, sales, addSale, currentUser, paymentMethods, getActiveExchangeRate, addExchangeRate } = useApp();
    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState<SaleItem[]>([]);
    const [notes, setNotes] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    // Tipo de pago: 'paid' (completo), 'cash_on_delivery' (contra entrega), 'pending' (a cuenta)
    const [paymentType, setPaymentType] = useState<'paid' | 'cash_on_delivery' | 'pending'>('paid');
    const [saleCurrency, setSaleCurrency] = useState<Currency>('ARS');
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [customRate, setCustomRate] = useState('');

    // Obtener cotización activa (siempre de USD a ARS por defecto para visualización)
    const activeRate = getActiveExchangeRate('USD', 'ARS');

    useEffect(() => {
        if (activeRate) {
            setCustomRate(activeRate.rate.toString());
        }
    }, [activeRate]);

    const quantityInputRef = useRef<HTMLInputElement>(null);

    const handleUpdateRate = () => {
        const newRate = parseFloat(customRate);
        if (isNaN(newRate) || newRate <= 0) {
            alert('Ingrese una cotización válida');
            return;
        }

        addExchangeRate({
            fromCurrency: 'USD',
            toCurrency: 'ARS',
            rate: newRate,
            source: 'Manual (Venta)'
        });
        setIsEditingRate(false);
    };

    // Calcular deuda pendiente del cliente seleccionado
    const customerDebt = customerId
        ? sales
            .filter(s => s.customerId === customerId && s.balance > 0)
            .reduce((total, s) => total + s.balance, 0)
        : 0;

    const hasPendingDebt = customerDebt > 0;

    // Establecer método de pago por defecto (Efectivo si existe)
    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedPaymentMethodId) {
            const cash = paymentMethods.find(p => p.type === 'cash');
            setSelectedPaymentMethodId(cash ? cash.id : paymentMethods[0].id);
        }
    }, [paymentMethods, selectedPaymentMethodId]);

    // Manejar producto inicial (escaneado antes de abrir modal)
    useEffect(() => {
        if (initialProductId) {
            addItemToCart(initialProductId, 1);
        }
    }, [initialProductId]);

    const addItemToCart = (productId: string, qty: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (qty > product.stock) {
            alert(`Stock insuficiente. Stock disponible: ${product.stock}`);
            return;
        }

        // Determinar precio convertido según la moneda de la venta
        let finalUnitPrice = product.price;
        let finalCost = product.cost;

        // Si las monedas son diferentes, convertir
        if (product.currency !== saleCurrency) {
            if (!activeRate) {
                alert(`No hay cotización definida para convertir de ${product.currency} a ${saleCurrency}. Configure el tipo de cambio primero.`);
                return;
            }
            // convertCurrency maneja la lógica (si es USD->ARS multiplica, si es ARS->USD divide)
            finalUnitPrice = convertCurrency(product.price, product.currency, saleCurrency, activeRate.rate);
            finalCost = convertCurrency(product.cost, product.currency, saleCurrency, activeRate.rate);
        }

        const existingItemIndex = items.findIndex(item => item.productId === productId);

        if (existingItemIndex >= 0) {
            // Actualizar cantidad si ya existe (asumiendo misma moneda de venta)
            const newItems = [...items];
            const item = newItems[existingItemIndex];

            newItems[existingItemIndex] = {
                ...item,
                quantity: item.quantity + qty,
                subtotal: (item.quantity + qty) * item.unitPrice, // Usar unitPrice ya convertido del item existente
                profit: (item.quantity + qty) * (item.unitPrice - item.cost),
            };
            setItems(newItems);
        } else {
            // Agregar nuevo item con precio convertido
            const newItem: SaleItem = {
                productId: product.id,
                productName: `${product.name} - ${product.color}`,
                quantity: qty,
                unitPrice: finalUnitPrice,
                currency: saleCurrency, // El item queda en la moneda de la venta
                subtotal: qty * finalUnitPrice,
                cost: finalCost,
                profit: qty * (finalUnitPrice - finalCost),
            };
            setItems([...items, newItem]);
        }

        setSelectedProductId('');
        setQuantity('1');
    };

    const handleAddItem = () => {
        if (!selectedProductId) return;
        const qty = parseFloat(quantity); // Usar parseFloat para permitir decimales
        if (isNaN(qty) || qty <= 0) return;
        addItemToCart(selectedProductId, qty);
    };

    const handleQRScan = (productId: string) => {
        // Buscar por ID o Código
        const product = products.find(p => p.id === productId || p.code === productId);
        if (!product) {
            alert('Producto no encontrado');
            return;
        }

        // Cambio solicitado: No agregar automático. 
        // Seleccionar producto y enfocar cantidad para ingreso manual.
        setSelectedProductId(product.id);
        setQuantity(''); // Limpiar para obligar ingreso
        setShowQRScanner(false);

        // Dar foco al input de cantidad
        setTimeout(() => {
            if (quantityInputRef.current) {
                quantityInputRef.current.focus();
            }
        }, 300); // Pequeño delay para asegurar que el modal QR cerró
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerId) {
            alert('Por favor selecciona un cliente para la venta. Es obligatorio.');
            return;
        }

        if (items.length === 0) {
            alert('Debes agregar al menos un producto');
            return;
        }

        const selectedPayment = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
        if (!selectedPayment) return;

        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const surcharge = subtotal * (selectedPayment.surchargePercentage / 100);
        const total = subtotal + surcharge;
        const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
        const totalProfit = total - totalCost;

        const customer = customers.find(c => c.id === customerId);

        if (!customer) return;

        // Cálculos de pago según el tipo seleccionado
        const amountPaid = paymentType === 'paid' ? total : 0;
        const balance = total - amountPaid;
        const paymentStatus = paymentType === 'paid' ? 'paid' : 'pending';

        const result = await addSale({
            customerId: customerId,
            customerName: customer.name + ' ' + (customer.lastName || ''),
            customerAddress: customer.address || 'Sin dirección',
            items,
            subtotal,
            payment: {
                methodId: selectedPayment.id,
                methodName: selectedPayment.name,
                subtotal,
                surcharge,
                total,
            },
            total,
            totalCost,
            totalProfit,
            paymentStatus,
            amountPaid,
            balance,
            notes: notes || undefined,
            currency: saleCurrency,
            exchangeRateSnapshot: activeRate || undefined,
            userId: currentUser?.id,
            userName: currentUser?.name,
        }, paymentType);

        if (result) {
            const { sale, deliveryNote } = result;
            generateSalePDF(sale);
            generateDeliveryNotePDF(deliveryNote);
        }

        onClose();
    };

    // Cálculos para render
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const selectedPayment = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
    const surchargePercent = selectedPayment ? selectedPayment.surchargePercentage : 0;
    const surcharge = subtotal * (surchargePercent / 100);
    const total = subtotal + surcharge;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal sale-modal-content" onClick={e => e.stopPropagation()}>
                <style>{`
                    .sale-modal-content {
                        max-width: 900px;
                        height: 90vh;
                        display: flex;
                        flex-direction: column;
                    }
                    @media (max-width: 768px) {
                        .sale-modal-content {
                            width: 100vw !important;
                            height: 100vh !important;
                            max-width: none !important;
                            max-height: none !important;
                            border-radius: 0;
                        }
                    }
                `}</style>

                <div className="modal-header">
                    <h3 className="modal-title">Nueva Venta</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>

                        {/* CONFIGURACIÓN MONEDA Y COTIZACIÓN (Movido aquí para mejor UI Mobile) */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '15px',
                            marginBottom: 'var(--spacing-lg)',
                            padding: '12px',
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-light)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <label style={{ fontSize: '0.9rem', color: '#666' }}>Moneda:</label>
                                <select
                                    className="select"
                                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.9rem' }}
                                    value={saleCurrency}
                                    onChange={(e) => {
                                        if (items.length > 0) {
                                            if (confirm('Cambiar la moneda recalculará los precios del carrito. ¿Continuar?')) {
                                                setSaleCurrency(e.target.value as Currency);
                                                // TODO: Recalcular items si cambio la moneda
                                                setItems([]);
                                            }
                                        } else {
                                            setSaleCurrency(e.target.value as Currency);
                                        }
                                    }}
                                >
                                    <option value="ARS">ARS ($)</option>
                                    <option value="USD">USD (U$D)</option>
                                </select>
                            </div>

                            {saleCurrency === 'ARS' && (
                                <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', alignItems: 'center' }}>
                                    Cotización USD:
                                    {isEditingRate ? (
                                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
                                            <span style={{ marginRight: '2px' }}>$</span>
                                            <input
                                                type="number"
                                                value={customRate}
                                                onChange={(e) => setCustomRate(e.target.value)}
                                                style={{
                                                    width: '70px',
                                                    padding: '2px 4px',
                                                    border: '1px solid var(--primary-color)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem'
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleUpdateRate}
                                                className="btn-icon"
                                                style={{ marginLeft: '4px', color: 'green' }}
                                                title="Guardar"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingRate(false)}
                                                className="btn-icon"
                                                style={{ marginLeft: '2px', color: 'red' }}
                                                title="Cancelar"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>
                                                ${activeRate ? activeRate.rate : '---'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCustomRate(activeRate ? activeRate.rate.toString() : '');
                                                    setIsEditingRate(true);
                                                }}
                                                className="btn-icon"
                                                style={{ marginLeft: '4px', color: '#666', cursor: 'pointer' }}
                                                title="Editar cotización"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </>
                                    )}
                                    <a
                                        href={EXCHANGE_RATE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--primary-color)' }}
                                    >
                                        (DolarHoy)
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN CLIENTE */}
                        <div className={`card ${!customerId ? 'border-warning' : ''}`} style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                <label className="form-label" style={{ margin: 0 }}>Cliente (Obligatorio)</label>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    onClick={() => setShowCustomerModal(true)}
                                >
                                    <UserPlus size={14} /> Nuevo Cliente
                                </button>
                            </div>

                            <select
                                className="select"
                                value={customerId}
                                onChange={e => setCustomerId(e.target.value)}
                                required
                                style={{ borderColor: !customerId ? 'var(--color-warning)' : '' }}
                            >
                                <option value="">-- Seleccionar Cliente --</option>
                                {customers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} {customer.lastName} - {customer.phone}
                                    </option>
                                ))}
                            </select>
                            {!customerId && (
                                <div style={{ color: 'var(--color-warning)', fontSize: '0.8em', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertCircle size={12} /> Debes seleccionar o crear un cliente
                                </div>
                            )}

                            {/* ALERTA DE DEUDA PENDIENTE */}
                            {hasPendingDebt && (
                                <div style={{
                                    marginTop: 'var(--spacing-md)',
                                    padding: '1rem',
                                    backgroundColor: '#fff3cd',
                                    border: '2px solid #ffc107',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <AlertCircle size={24} color="#856404" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '4px', fontSize: '1.1em' }}>
                                            ⚠️ Cliente con Deuda Pendiente
                                        </div>
                                        <div style={{ color: '#856404', fontSize: '0.9em' }}>
                                            Este cliente tiene un saldo adeudado de <strong style={{ fontSize: '1.2em' }}>${customerDebt.toFixed(2)}</strong>
                                        </div>
                                        <div style={{ color: '#856404', fontSize: '0.8em', marginTop: '4px', fontStyle: 'italic' }}>
                                            💡 Puedes gestionar los pagos en "Cuentas por Cobrar"
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN PRODUCTOS */}
                        <div className="form-group">
                            <label className="form-label">Productos</label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowQRScanner(true)}
                                    style={{ flex: 1, minWidth: '120px' }}
                                >
                                    <QrCode size={18} /> Scannear (Cam)
                                </button>

                                <div style={{ flex: 2, display: 'flex', gap: 'var(--spacing-sm)', minWidth: '200px' }}>
                                    <select
                                        className="select"
                                        value={selectedProductId}
                                        onChange={e => setSelectedProductId(e.target.value)}
                                        style={{ flex: 1 }}
                                    >
                                        <option value="">Buscar producto...</option>
                                        {products
                                            .filter(p => p.status === 'in_stock' && p.stock > 0)
                                            .map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.code} - {product.name} ({product.color}) - ${product.price}
                                                </option>
                                            ))}
                                    </select>
                                    <input
                                        ref={quantityInputRef}
                                        type="number"
                                        className="input"
                                        placeholder="#"
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                        min="0.1"
                                        step="any"
                                        style={{ width: '80px' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleAddItem}
                                        disabled={!selectedProductId}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* LISTA DE ITEMS */}
                            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                <table className="table">
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th>Producto</th>
                                            <th style={{ textAlign: 'center' }}>Cant.</th>
                                            <th style={{ textAlign: 'right' }}>Precio</th>
                                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.productId}>
                                                <td>{item.productName}</td>
                                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${item.subtotal.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="btn-icon btn-icon-danger"
                                                        onClick={() => handleRemoveItem(item.productId)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                                                    No hay productos agregados
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SECCIÓN PAGOS (Solo si hay items) */}
                        {items.length > 0 && (
                            <div className="card" style={{ marginTop: 'var(--spacing-lg)', borderColor: 'var(--color-primary)' }}>
                                <label className="form-label" style={{ marginBottom: 'var(--spacing-md)' }}>Método de Pago</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                                    {paymentMethods.filter(pm => pm.active).map(pm => (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            className={`payment-method-btn ${selectedPaymentMethodId === pm.id ? 'active' : ''}`}
                                            onClick={() => setSelectedPaymentMethodId(pm.id)}
                                        >
                                            <div style={{ width: '100%' }}>
                                                <strong>{pm.name}</strong>
                                                {pm.surchargePercentage > 0 ? (
                                                    <p className="text-warning">+{pm.surchargePercentage}% Recargo</p>
                                                ) : (
                                                    <p className="text-success">Sin recargo</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>Subtotal:</span>
                                        <strong>${subtotal.toFixed(2)}</strong>
                                    </div>
                                    {surcharge > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--color-warning)' }}>
                                            <span>Recargo ({surchargePercent}%):</span>
                                            <strong>+${surcharge.toFixed(2)}</strong>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-md)', fontSize: '1.5em' }}>
                                        <span>Total:</span>
                                        <strong className="text-primary">${total.toFixed(2)}</strong>
                                    </div>

                                    {/* Opciones de Tipo de Pago */}
                                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: 'var(--radius-md)', border: '1px solid #dee2e6' }}>
                                        <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', color: '#495057' }}>
                                            Tipo de Pago:
                                        </div>

                                        {/* Opción 1: Pago Completo */}
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            gap: '10px',
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            backgroundColor: paymentType === 'paid' ? '#d1fae5' : '#fff',
                                            border: '2px solid',
                                            borderColor: paymentType === 'paid' ? '#10b981' : '#e5e7eb',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="paid"
                                                checked={paymentType === 'paid'}
                                                onChange={() => setPaymentType('paid')}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#059669' }}>
                                                    ✓ Pago Completo
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                    El cliente paga ahora el total
                                                </div>
                                            </div>
                                        </label>

                                        {/* Opción 2: Pago Contra Entrega */}
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            gap: '10px',
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            backgroundColor: paymentType === 'cash_on_delivery' ? '#fee2e2' : '#fff',
                                            border: '2px solid',
                                            borderColor: paymentType === 'cash_on_delivery' ? '#dc2626' : '#e5e7eb',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="cash_on_delivery"
                                                checked={paymentType === 'cash_on_delivery'}
                                                onChange={() => setPaymentType('cash_on_delivery')}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#dc2626' }}>
                                                    🚚 Pago Contra Entrega
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                    El cliente paga al recibir el producto
                                                </div>
                                            </div>
                                        </label>

                                        {/* Opción 3: Pago Pendiente (a cuenta) */}
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            gap: '10px',
                                            padding: '0.75rem',
                                            backgroundColor: paymentType === 'pending' ? '#fed7aa' : '#fff',
                                            border: '2px solid',
                                            borderColor: paymentType === 'pending' ? '#f97316' : '#e5e7eb',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="pending"
                                                checked={paymentType === 'pending'}
                                                onChange={() => setPaymentType('pending')}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#ea580c' }}>
                                                    📋 Pago Pendiente (a cuenta)
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                    Cliente debe el dinero, quedará registrado como deuda
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Notas de la venta (opcional)..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`btn ${paymentType === 'paid' ? 'btn-success' :
                                paymentType === 'cash_on_delivery' ? 'btn-danger' :
                                    'btn-warning'
                                }`}
                            disabled={items.length === 0 || !customerId}
                            style={{ minWidth: '220px' }}
                        >
                            {paymentType === 'paid' ? `✓ Cobrar $${total.toFixed(2)}` :
                                paymentType === 'cash_on_delivery' ? `🚚 Contra Entrega $${total.toFixed(2)}` :
                                    `📋 A Cuenta $${total.toFixed(2)}`}
                        </button>
                    </div>
                </form>
            </div>

            {showQRScanner && (
                <QRScannerModal
                    onScan={handleQRScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}

            {showCustomerModal && (
                <CustomerModal
                    customer={null}
                    onClose={() => setShowCustomerModal(false)}
                    onCustomerCreated={(newId) => {
                        setCustomerId(newId);
                        setShowCustomerModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default SaleModal;
