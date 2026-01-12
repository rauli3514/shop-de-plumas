import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
    onScan: (productId: string) => void;
    onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ onScan, onClose }) => {
    const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
    const [manualCode, setManualCode] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            if (scanMode !== 'camera') return;

            // Limpiar instancia previa si existe
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (e) { /* ignore */ }
            }

            try {
                // Esperar a que el elemento DOM exista
                await new Promise(r => setTimeout(r, 100));

                if (!document.getElementById('qr-reader-box')) return;

                const scanner = new Html5Qrcode("qr-reader-box");
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        if (!isMounted) return;

                        // Lógica de éxito
                        try {
                            const data = JSON.parse(decodedText);
                            if (data.id) {
                                onScan(data.id);
                            } else {
                                onScan(decodedText);
                            }
                        } catch {
                            onScan(decodedText);
                        }
                    },
                    () => {
                        // Ignorar errores de frame (es normal cuando no detecta QR)
                    }
                );

                if (isMounted) setIsScanning(true);

            } catch (err) {
                console.error("Error iniciando cámara", err);
                if (isMounted) {
                    setError("No se pudo acceder a la cámara. Revisa los permisos.");
                    setIsScanning(false);
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error).finally(() => {
                    scannerRef.current?.clear();
                });
            }
        };
    }, [scanMode]); // Solo reiniciar si cambia el modo

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScan(manualCode.trim());
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '20px' }}>
            <div className="modal" style={{ maxWidth: '500px', width: '95%', margin: '0 10px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Escanear Producto</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button
                            className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScanMode('camera')}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            <Camera size={18} />
                            Cámara
                        </button>
                        <button
                            className={`btn ${scanMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScanMode('manual')}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            <Keyboard size={18} />
                            Manual
                        </button>
                    </div>

                    {scanMode === 'camera' ? (
                        <div style={{ position: 'relative', minHeight: '300px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                            <div id="qr-reader-box" style={{ width: '100%', height: '100%' }}></div>

                            {!isScanning && !error && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                                    Iniciando cámara...
                                </div>
                            )}

                            {error && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white', textAlign: 'center' }}>
                                    <AlertCircle size={40} color="#ff4d4f" style={{ marginBottom: '10px' }} />
                                    <p>{error}</p>
                                    <button
                                        onClick={() => setScanMode('manual')}
                                        style={{ marginTop: '15px', padding: '8px 16px', background: 'white', color: 'black', border: 'none', borderRadius: '4px' }}
                                    >
                                        Usar modo manual
                                    </button>
                                </div>
                            )}

                            <p style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                                Apunta al código QR
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
                                    style={{ fontSize: '1.2rem', padding: '12px' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
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
