import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, QrCode } from 'lucide-react';
import SaleModal from './SaleModal';
import QRScannerModal from './QRScannerModal';
import ProductInfoModal from './ProductInfoModal';
import './POS.css';

const POS: React.FC = () => {
    const { currentUser, stockMovements } = useApp();
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [preScannedProduct, setPreScannedProduct] = useState<string | null>(null);
    const [showProductInfoModal, setShowProductInfoModal] = useState(false);
    const [infoProductId, setInfoProductId] = useState<string | null>(null);

    const handleQRScan = (productId: string) => {
        // En lugar de iniciar venta, abrimos modal de info
        setInfoProductId(productId);
        setShowQRScanner(false);
        setShowProductInfoModal(true);
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
                    <h3>Consultar Precio</h3>
                    <p>Buscar producto y ver stock/precio</p>
                </button>


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

            {showProductInfoModal && infoProductId && (
                <ProductInfoModal
                    productId={infoProductId}
                    onClose={() => {
                        setShowProductInfoModal(false);
                        setInfoProductId(null);
                    }}
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
