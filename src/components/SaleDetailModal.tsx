import React from 'react';
import { X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Sale } from '../types';
import { generateSalePDF } from '../utils/pdfGenerator';

interface SaleDetailModalProps {
    sale: Sale;
    onClose: () => void;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Detalle de Venta {sale.saleNumber}</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <strong>Fecha:</strong> {format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: es })}
                        </p>
                        <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <strong>Cliente:</strong> {sale.customerName || 'Cliente general'}
                        </p>
                        {sale.notes && (
                            <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <strong>Notas:</strong> {sale.notes}
                            </p>
                        )}
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                    <th>Ganancia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map(item => (
                                    <tr key={item.productId}>
                                        <td>{item.productName}</td>
                                        <td>{item.quantity}</td>
                                        <td>${item.unitPrice.toFixed(2)}</td>
                                        <td><strong>${item.subtotal.toFixed(2)}</strong></td>
                                        <td className="text-success">${item.profit.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 600, backgroundColor: 'var(--color-bg)' }}>
                                    <td colSpan={3}>TOTAL</td>
                                    <td>${sale.total.toFixed(2)}</td>
                                    <td className="text-success">${sale.totalProfit.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                            <span>Costo Total:</span>
                            <strong>${sale.totalCost.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                            <span>Total Venta:</span>
                            <strong>${sale.total.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--spacing-sm)', borderTop: '2px solid var(--color-border)' }}>
                            <span style={{ fontSize: 'var(--font-size-lg)' }}>Ganancia Total:</span>
                            <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-success)' }}>
                                ${sale.totalProfit.toFixed(2)}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                    <button className="btn btn-primary" onClick={() => generateSalePDF(sale)}>
                        <Download size={18} />
                        Descargar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaleDetailModal;
