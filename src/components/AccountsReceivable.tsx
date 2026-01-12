import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DollarSign, User, Calendar, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PaymentModal from './PaymentModal';
import type { Sale } from '../types';
import './common.css';

const AccountsReceivable: React.FC = () => {
    const { sales } = useApp();
    const [filter, setFilter] = useState<'all' | 'pending' | 'partial'>('all');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Filtrar ventas con saldo pendiente
    const pendingSales = sales.filter(sale => sale.balance > 0);

    const filteredSales = filter === 'all'
        ? pendingSales
        : pendingSales.filter(sale => sale.paymentStatus === filter);

    // Calcular totales
    const totalPending = pendingSales.reduce((sum, sale) => sum + sale.balance, 0);
    const totalPartialPaid = pendingSales
        .filter(s => s.paymentStatus === 'partial')
        .reduce((sum, sale) => sum + sale.amountPaid, 0);

    // Agrupar por cliente
    const customerBalances = pendingSales.reduce((acc, sale) => {
        const existing = acc.find(item => item.customerId === sale.customerId);
        if (existing) {
            existing.balance += sale.balance;
            existing.sales.push(sale);
        } else {
            acc.push({
                customerId: sale.customerId,
                customerName: sale.customerName,
                balance: sale.balance,
                sales: [sale]
            });
        }
        return acc;
    }, [] as { customerId: string; customerName: string; balance: number; sales: typeof sales }[]);

    customerBalances.sort((a, b) => b.balance - a.balance);

    return (
        <div className="view-container">
            <div className="view-header">
                <h2 className="view-title">
                    <DollarSign size={24} />
                    Cuentas Corrientes
                </h2>
            </div>

            {/* Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                <div className="card" style={{ padding: 'var(--spacing-lg)', borderLeft: '4px solid var(--color-danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Total a Cobrar</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>${totalPending.toFixed(2)}</p>
                        </div>
                        <AlertCircle size={32} style={{ color: 'var(--color-danger)', opacity: 0.3 }} />
                    </div>
                </div>

                <div className="card" style={{ padding: 'var(--spacing-lg)', borderLeft: '4px solid var(--color-warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Ventas Pendientes</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{pendingSales.length}</p>
                        </div>
                        <DollarSign size={32} style={{ color: 'var(--color-warning)', opacity: 0.3 }} />
                    </div>
                </div>

                <div className="card" style={{ padding: 'var(--spacing-lg)', borderLeft: '4px solid var(--color-info)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Pagos Parciales</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-info)' }}>${totalPartialPaid.toFixed(2)}</p>
                        </div>
                        <CheckCircle size={32} style={{ color: 'var(--color-info)', opacity: 0.3 }} />
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <button
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilter('all')}
                >
                    Todas ({pendingSales.length})
                </button>
                <button
                    className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-secondary'}`}
                    onClick={() => setFilter('pending')}
                >
                    Pendientes ({pendingSales.filter(s => s.paymentStatus === 'pending').length})
                </button>
                <button
                    className={`btn ${filter === 'partial' ? 'btn-info' : 'btn-secondary'}`}
                    onClick={() => setFilter('partial')}
                >
                    Parciales ({pendingSales.filter(s => s.paymentStatus === 'partial').length})
                </button>
            </div>

            {/* Resumen por Cliente */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Resumen por Cliente</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th><User size={16} /> Cliente</th>
                                <th style={{ textAlign: 'center' }}>Ventas Pendientes</th>
                                <th style={{ textAlign: 'right' }}>Saldo Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerBalances.map(customer => (
                                <tr key={customer.customerId}>
                                    <td><strong>{customer.customerName}</strong></td>
                                    <td style={{ textAlign: 'center' }}>{customer.sales.length}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                                        ${customer.balance.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {customerBalances.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                                        ✅ No hay cuentas pendientes
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detalle de Ventas */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Detalle de Ventas Pendientes</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Venta</th>
                                <th><User size={16} /> Cliente</th>
                                <th><Calendar size={16} /> Fecha</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th style={{ textAlign: 'right' }}>Pagado</th>
                                <th style={{ textAlign: 'right' }}>Saldo</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map(sale => (
                                <tr key={sale.id}>
                                    <td><strong>{sale.saleNumber}</strong></td>
                                    <td>{sale.customerName}</td>
                                    <td>{format(new Date(sale.date), 'dd/MM/yyyy', { locale: es })}</td>
                                    <td style={{ textAlign: 'right' }}>${sale.total.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>
                                        ${sale.amountPaid.toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                                        ${sale.balance.toFixed(2)}
                                    </td>
                                    <td>
                                        {sale.paymentStatus === 'pending' && (
                                            <span className="badge badge-warning">Pendiente</span>
                                        )}
                                        {sale.paymentStatus === 'partial' && (
                                            <span className="badge badge-info">Parcial</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => setSelectedSale(sale)}
                                            title="Registrar Pago"
                                        >
                                            <Plus size={14} /> Pago
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                                        No hay ventas con los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Pago */}
            {selectedSale && (
                <PaymentModal
                    sale={selectedSale}
                    onClose={() => setSelectedSale(null)}
                />
            )}
        </div>
    );
};

export default AccountsReceivable;
