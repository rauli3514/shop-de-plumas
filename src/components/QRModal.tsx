import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';
import type { Product } from '../types';
import { generateProductLabelPDF } from '../utils/pdfGenerator';
import '../components/common.css';

interface QRModalProps {
    product: Product;
    onClose: () => void;
}

const QRModal: React.FC<QRModalProps> = ({ product, onClose }) => {

    const handleDownload = async () => {
        // Generar y descargar PDF listo para imprimir
        await generateProductLabelPDF(product);
    };

    const qrValue = JSON.stringify({
        id: product.id,
        code: product.code,
        name: product.name,
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Código QR del Producto</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>{product.name}</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Código: {product.code}
                        </p>
                    </div>

                    <div
                        style={{
                            padding: 'var(--spacing-xl)',
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-block',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <QRCodeSVG value={qrValue} size={200} level="H" />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                    <button className="btn btn-primary" onClick={handleDownload}>
                        <Printer size={18} />
                        Imprimir Etiqueta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QRModal;
