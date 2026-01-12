import React from 'react';
import { useApp } from '../context/AppContext';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateDeliveryNotePDF } from '../utils/pdfGenerator';
import './DeliveryNotes.css';

const DeliveryNotes: React.FC = () => {
    const { deliveryNotes } = useApp();

    const sortedNotes = [...deliveryNotes].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="delivery-notes">
            <div className="delivery-notes-header">
                <div>
                    <h2>Remitos de Salida</h2>
                    <p className="subtitle">Total: {deliveryNotes.length} remitos</p>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>N° Remito</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Productos</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedNotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center">
                                        <p className="empty-state">No hay remitos generados</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedNotes.map(note => (
                                    <tr key={note.id}>
                                        <td><strong>{note.noteNumber}</strong></td>
                                        <td>{format(new Date(note.date), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                                        <td>{note.customerName || 'Cliente general'}</td>
                                        <td>{note.items.length} {note.items.length === 1 ? 'producto' : 'productos'}</td>
                                        <td><strong>${note.total.toFixed(2)}</strong></td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => generateDeliveryNotePDF(note)}
                                                    title="Descargar PDF"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeliveryNotes;
