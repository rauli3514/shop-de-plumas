import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, DollarSign } from 'lucide-react';
import type { Sale } from '../types';
import './common.css';

interface PaymentModalProps {
    sale: Sale;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ sale, onClose }) => {
    const { registerPayment, paymentMethods } = useApp();
    const [amount, setAmount] = useState(sale.balance.toString());
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
    const [notes, setNotes] = useState('');

    // Establecer método de pago por defecto
    React.useEffect(() => {
        if (paymentMethods.length > 0 && !selectedPaymentMethodId) {
            const cash = paymentMethods.find(p => p.type === 'cash');
            setSelectedPaymentMethodId(cash ? cash.id : paymentMethods[0].id);
        }
    }, [paymentMethods, selectedPaymentMethodId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const paymentAmount = parseFloat(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert('Por favor ingresa un monto válido');
            return;
        }

        if (paymentAmount > sale.balance) {
            alert(`El monto no puede ser mayor al saldo pendiente ($${sale.balance.toFixed(2)})`);
            return;
        }

        if (!selectedPaymentMethodId) {
            alert('Selecciona un método de pago');
            return;
        }

        registerPayment(sale.id, paymentAmount, selectedPaymentMethodId, notes);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <DollarSign size={20} />
                        Registrar Pago - {sale.saleNumber}
                    </h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Info de la venta */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', backgroundColor: '#f8f9fa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Cliente:</span>
                                <strong>{sale.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Total de la venta:</span>
                                <strong>${sale.total.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--color-success)' }}>
                                <span>Ya pagado:</span>
                                <strong>${sale.amountPaid.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #dee2e6' }}>
                                <span style={{ fontSize: '1.1rem' }}>Saldo pendiente:</span>
                                <strong style={{ fontSize: '1.3rem', color: 'var(--color-danger)' }}>${sale.balance.toFixed(2)}</strong>
                            </div>
                        </div>

                        {/* Monto a pagar */}
                        <div className="form-group">
                            <label className="form-label">Monto a Registrar *</label>
                            <input
                                type="number"
                                className="input"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                step="0.01"
                                min="0.01"
                                max={sale.balance}
                                placeholder="0.00"
                                required
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setAmount((sale.balance / 2).toFixed(2))}
                                >
                                    50%
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setAmount(sale.balance.toFixed(2))}
                                >
                                    Total
                                </button>
                            </div>
                        </div>

                        {/* Método de pago */}
                        <div className="form-group">
                            <label className="form-label">Método de Pago *</label>
                            <select
                                className="select"
                                value={selectedPaymentMethodId}
                                onChange={e => setSelectedPaymentMethodId(e.target.value)}
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                {paymentMethods.filter(pm => pm.active).map(pm => (
                                    <option key={pm.id} value={pm.id}>
                                        {pm.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Notas */}
                        <div className="form-group">
                            <label className="form-label">Notas (opcional)</label>
                            <textarea
                                className="input"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Ej: Pago parcial acordado, etc."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-success">
                            Registrar ${parseFloat(amount || '0').toFixed(2)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
