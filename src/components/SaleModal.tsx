import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Trash2, QrCode, UserPlus, AlertCircle, Check, Pencil } from 'lucide-react';
import type { SaleItem, Currency } from '../types';
import { generateSalePDF, generateDeliveryNotePDF } from '../utils/pdfGenerator';
import { convertCurrency } from '../utils/currency';
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
                        {/* CABECERA ULTRA COMPACTA: Moneda + Cotización */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '0.5rem' }}>
                            <select
                                className="select"
                                style={{ width: 'auto', padding: '2px 8px', fontSize: '0.85rem', height: '30px', minHeight: 'unset' }}
                                value={saleCurrency}
                                onChange={(e) => {
                                    if (items.length > 0 && confirm('Cambiar moneda recalculará todo. ¿Seguir?')) {
                                        setSaleCurrency(e.target.value as Currency);
                                        setItems([]);
                                    } else if (items.length === 0) setSaleCurrency(e.target.value as Currency);
                                }}
                            >
                                <option value="ARS">ARS ($)</option>
                                <option value="USD">USD (U$D)</option>
                            </select>

                            {saleCurrency === 'ARS' && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {isEditingRate ? (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                value={customRate}
                                                onChange={(e) => setCustomRate(e.target.value)}
                                                style={{ width: '60px', padding: '2px', fontSize: '0.85rem', height: '28px' }}
                                                autoFocus
                                            />
                                            <button onClick={handleUpdateRate} className="btn-icon" style={{ color: 'var(--color-success)', marginLeft: '4px' }}><Check size={16} /></button>
                                            <button onClick={() => setIsEditingRate(false)} className="btn-icon" style={{ color: 'var(--color-error)', marginLeft: '2px' }}><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>USD: <strong style={{ color: 'var(--color-text)' }}>${activeRate ? activeRate.rate : '---'}</strong></span>
                                            <button onClick={() => { setCustomRate(activeRate?.rate.toString() || ''); setIsEditingRate(true); }} className="btn-icon" style={{ color: 'var(--color-text-muted)' }}><Pencil size={12} /></button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CLIENTE ULTRA COMPACTO */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    {!customerId && <label style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginBottom: '2px', display: 'block', fontWeight: 600 }}>* CLIENTE REQUERIDO</label>}
                                    <select
                                        className="select"
                                        value={customerId}
                                        onChange={e => setCustomerId(e.target.value)}
                                        required
                                        style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.9rem' }}
                                    >
                                        <option value="">Seleccionar Cliente...</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name} {customer.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setShowCustomerModal(true)}
                                    title="Nuevo"
                                >
                                    <UserPlus size={18} />
                                </button>
                            </div>

                            {hasPendingDebt && (
                                <div style={{ marginTop: '4px', padding: '4px 8px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#856404' }}>
                                    <AlertCircle size={14} /> <span>Deuda: <strong>${customerDebt.toFixed(2)}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN PRODUCTOS ULTRA COMPACTA */}
                        <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', alignItems: 'stretch' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowQRScanner(true)}
                                    style={{ padding: 0, width: '40px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Scan QR"
                                >
                                    <QrCode size={20} />
                                </button>

                                <select
                                    className="select"
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                    style={{ flex: 1, padding: '0 6px', fontSize: '0.85rem', height: 'auto', minHeight: '36px', width: '0' }} // width 0 para flex shrink
                                >
                                    <option value="">Buscar prod...</option>
                                    {products
                                        .filter(p => p.status === 'in_stock' && p.stock > 0)
                                        .map(p => (
                                            <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                                        ))}
                                </select>

                                <input
                                    ref={quantityInputRef}
                                    type="number"
                                    className="input"
                                    placeholder="#"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    style={{ width: '40px', textAlign: 'center', padding: '0', height: 'auto' }}
                                    min="0.1"
                                    step="any"
                                />

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddItem}
                                    disabled={!selectedProductId}
                                    style={{ padding: 0, width: '40px', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Plus size={22} />
                                </button>
                            </div>

                            {/* LISTA DE ITEMS COMPACTA */}
                            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border-light)', borderRadius: '4px' }}>
                                <table className="table" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--color-surface)' }}>
                                        <tr>
                                            <th style={{ padding: '6px 4px' }}>Prod.</th>
                                            <th style={{ padding: '6px 4px', textAlign: 'center', width: '40px' }}>Cnt</th>
                                            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Total</th>
                                            <th style={{ padding: '6px 4px', width: '30px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.productId}>
                                                <td style={{ padding: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.productName}
                                                    <div style={{ fontSize: '0.75em', color: 'var(--color-text-muted)' }}>${item.unitPrice}</div>
                                                </td>
                                                <td style={{ padding: '4px', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>${item.subtotal.toFixed(0)}</td>
                                                <td style={{ padding: '4px', textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="btn-icon btn-icon-danger"
                                                        onClick={() => handleRemoveItem(item.productId)}
                                                        style={{ padding: '2px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem 0.5rem', opacity: 0.5, fontSize: '0.8rem' }}>
                                                    Sin productos
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
