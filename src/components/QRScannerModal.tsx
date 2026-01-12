import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Keyboard } from 'lucide-react';

interface QRScannerModalProps {
    onScan: (productId: string) => void;
    onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ onScan, onClose }) => {
    const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
    const [manualCode, setManualCode] = useState('');

    React.useEffect(() => {
        if (scanMode === 'camera') {
            const html5QrcodeScanner = new Html5QrcodeScanner(
                'qr-reader',
                { fps: 10, qrbox: 250 },
                false
            );

            html5QrcodeScanner.render(
                (decodedText) => {
                    try {
                        const data = JSON.parse(decodedText);
                        if (data.id) {
                            onScan(data.id);
                            html5QrcodeScanner.clear();
                        }
                    } catch {
                        // Si no es JSON, intenta usar el texto como ID del producto
                        onScan(decodedText);
                        html5QrcodeScanner.clear();
                    }
                },
                () => {
                    // Ignora errores de escaneo
                }
            );

            return () => {
                html5QrcodeScanner.clear().catch(() => { });
            };
        }
    }, [scanMode, onScan]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScan(manualCode.trim());
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Escanear Producto</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <button
                            className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScanMode('camera')}
                        >
                            <Camera size={18} />
                            Cámara
                        </button>
                        <button
                            className={`btn ${scanMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScanMode('manual')}
                        >
                            <Keyboard size={18} />
                            Manual
                        </button>
                    </div>

                    {scanMode === 'camera' ? (
                        <div>
                            <div id="qr-reader" style={{ width: '100%' }}></div>
                            <p style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                                Apunta la cámara al código QR del producto
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit}>
                            <div className="form-group">
                                <label className="form-label">Código del Producto</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={manualCode}
                                    onChange={e => setManualCode(e.target.value)}
                                    placeholder="Ingresa el código del producto"
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Agregar Producto
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
