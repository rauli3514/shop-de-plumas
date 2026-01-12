import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Package, Users, QrCode } from 'lucide-react';
import SaleModal from './SaleModal';
import QRScannerModal from './QRScannerModal';
import './POS.css';

const POS: React.FC = () => {
    const { currentUser, stockMovements } = useApp();
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [preScannedProduct, setPreScannedProduct] = useState<string | null>(null);

    const handleQRScan = (productId: string) => {
        setPreScannedProduct(productId);
        setShowQRScanner(false);
        setShowSaleModal(true);
    };

    const recentActivity = stockMovements.slice(-5).reverse();

    return (
        <div className="pos-dashboard">
            <header className="pos-header">
                <div>
                    <h2>Bienvenido, {currentUser?.name}</h2>
                    <p className="subtitle">Punto de Venta - Shop de Plumas</p>
                </div>
                <div className="date-badge">
                    {new Date().toLocaleDateString()}
                </div>
            </header>

            <div className="pos-actions-grid">
                <button className="pos-card primary" onClick={() => setShowSaleModal(true)}>
                    <div className="icon-wrapper">
                        <ShoppingCart size={48} />
                    </div>
                    <h3>Nueva Venta</h3>
                    <p>Registrar venta manual o seleccionar productos</p>
                </button>

                <button className="pos-card secondary" onClick={() => setShowQRScanner(true)}>
                    <div className="icon-wrapper">
                        <QrCode size={48} />
                    </div>
                    <h3>Escanear QR</h3>
                    <p>Iniciar venta escaneando producto</p>
                </button>

                {/* Accesos rápidos que podrían redirigir o abrir modales */}
                <div className="pos-stat-card">
                    <div className="stat-icon bg-info">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <h4>Stock Bajo</h4>
                        <p className="stat-value">Revisar Alertas</p>
                    </div>
                </div>

                <div className="pos-stat-card">
                    <div className="stat-icon bg-success">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <h4>Clientes</h4>
                        <p className="stat-value">Gestión Rápida</p>
                    </div>
                </div>
            </div>

            <div className="pos-recent-section">
                <h3>Actividad Reciente</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Tipo</th>
                                <th>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map(move => (
                                <tr key={move.id}>
                                    <td>{new Date(move.date).toLocaleTimeString()}</td>
                                    <td>
                                        <span className={`badge ${move.type === 'in' ? 'badge-success' : 'badge-warning'}`}>
                                            {move.type === 'in' ? 'Entrada' : 'Salida'}
                                        </span>
                                    </td>
                                    <td>{move.notes || 'Movimiento de stock'}</td>
                                </tr>
                            ))}
                            {recentActivity.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center">Sin actividad reciente</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showSaleModal && (
                <SaleModal
                    onClose={() => {
                        setShowSaleModal(false);
                        setPreScannedProduct(null);
                    }}
                    initialProductId={preScannedProduct}
                />
            )}

            {showQRScanner && (
                <QRScannerModal
                    onScan={handleQRScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}
        </div>
    );
};

export default POS;
