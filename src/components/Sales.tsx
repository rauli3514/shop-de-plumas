import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Download } from 'lucide-react';
import { generateSalePDF } from '../utils/pdfGenerator';
import SaleDetailModal from './SaleDetailModal';
import './Sales.css';

const Sales: React.FC = () => {
    const { sales, currentUser } = useApp();
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isOwner = currentUser?.role === 'owner';

    // Filtrar ventas por rol
    const accessibleSales = isOwner
        ? sales
        : sales.filter(s => s.userId === currentUser?.id);

    const filteredSales = accessibleSales.filter(sale =>
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDownloadPDF = (e: React.MouseEvent, saleId: string) => {
        e.stopPropagation();
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            generateSalePDF(sale);
        }
    };

    return (
        <div className="sales">
            <div className="sales-header">
                <h2>Historial de Ventas {isOwner ? '(Todas)' : '(Mis Ventas)'}</h2>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder="Buscar por cliente o número de venta..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nº Venta</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            {isOwner && <th>Ganancia</th>}
                            <th>Vendedor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(sale => (
                            <tr key={sale.id} onClick={() => setSelectedSaleId(sale.id)} style={{ cursor: 'pointer' }}>
                                <td>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}</td>
                                <td className="font-mono font-bold">{sale.saleNumber}</td>
                                <td>{sale.customerName}</td>
                                <td className="font-bold text-primary">${sale.total.toFixed(2)}</td>
                                {isOwner && (
                                    <td className="text-success">+${sale.totalProfit?.toFixed(2) || '0.00'}</td>
                                )}
                                <td>{sale.userName || 'Desconocido'}</td>
                                <td>
                                    <button
                                        className="btn-icon"
                                        onClick={(e) => handleDownloadPDF(e, sale.id)}
                                        title="Descargar PDF"
                                    >
                                        <Download size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={isOwner ? 7 : 6} className="empty-state">
                                    No se encontraron ventas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedSaleId && (
                <SaleDetailModal
                    sale={sales.find(s => s.id === selectedSaleId)!}
                    onClose={() => setSelectedSaleId(null)}
                />
            )}
        </div>
    );
};

export default Sales;
