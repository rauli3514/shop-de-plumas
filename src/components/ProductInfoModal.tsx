import React from 'react';
import { useApp } from '../context/AppContext';
import { Package } from 'lucide-react';
import '../components/common.css';

interface ProductInfoModalProps {
    productId: string;
    onClose: () => void;
}

const ProductInfoModal: React.FC<ProductInfoModalProps> = ({ productId, onClose }) => {
    const { products, getActiveExchangeRate } = useApp();
    const product = products.find(p => p.id === productId);

    if (!product) return null;

    // Calcular cotización si es necesaria
    let alternativePrice: string | null = null;

    // Si está en USD, mostramos aprox en ARS
    if (product.currency === 'USD') {
        const rate = getActiveExchangeRate('USD', 'ARS');
        if (rate) {
            alternativePrice = `≈ $${(product.price * rate.rate).toFixed(0)} ARS`;
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ width: '90%', maxWidth: '350px', height: 'auto', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
                    <h3 className="modal-title" style={{ fontSize: '1.2rem' }}>Consulta de Producto</h3>
                </div>

                <div className="modal-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>

                    {/* IMAGEN O ICONO */}
                    <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Package size={48} color="#ccc" />
                        )}
                    </div>

                    {/* DATOS PRINCIPALES */}
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>{product.name}</h2>
                        <span style={{ fontSize: '0.9rem', color: '#666', background: '#eee', padding: '2px 8px', borderRadius: '4px' }}>{product.code}</span>
                    </div>

                    {/* PRECIO */}
                    <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', width: '100%' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Precio</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {product.currency === 'USD' ? 'U$D ' : '$'}{product.price}
                        </div>
                        {alternativePrice && (
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{alternativePrice}</div>
                        )}
                    </div>

                    {/* STOCK */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Stock</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: product.stock <= product.minStock ? 'var(--color-error)' : 'var(--color-success)' }}>
                                {product.stock}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Color</div>
                            <div style={{ fontSize: '1.1rem' }}>
                                {product.color}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="modal-footer" style={{ borderTop: 'none', justifyContent: 'center', paddingBottom: '1.5rem' }}>
                    <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '120px' }}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductInfoModal;
