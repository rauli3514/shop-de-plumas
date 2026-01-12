import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import type { Product, ProductStatus, Currency } from '../types';

interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
    const { addProduct, updateProduct } = useApp();
    const [name, setName] = useState('');
    const [color, setColor] = useState('');
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('');
    const [supplier, setSupplier] = useState('');
    const [status, setStatus] = useState<ProductStatus>('in_stock');
    const [currency, setCurrency] = useState<Currency>('ARS');

    useEffect(() => {
        if (product) {
            setName(product.name);
            setColor(product.color);
            setCost(product.cost.toString());
            setPrice(product.price.toString());
            setStock(product.stock.toString());
            setMinStock(product.minStock.toString());
            setSupplier(product.supplier);
            setStatus(product.status || 'in_stock');
            setCurrency(product.currency);
        } else {
            // Reset for new product
            setName('');
            setColor('');
            setCost('');
            setPrice('');
            setStock('0');
            setMinStock('5');
            setSupplier('');
            setStatus('in_stock');
            setCurrency('ARS');
        }
    }, [product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const productData = {
            name,
            color,
            cost: parseFloat(cost),
            price: parseFloat(price),
            stock: parseInt(stock),
            minStock: parseInt(minStock),
            supplier,
            status,
            currency,
        };

        if (product) {
            updateProduct(product.id, productData);
        } else {
            addProduct(productData);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* El Código ahora es automático, no se muestra/edita aquí */}

                        <div className="form-group">
                            <label className="form-label">Nombre del Producto</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Color / Variante</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estado</label>
                                <select
                                    className="select"
                                    value={status}
                                    onChange={e => setStatus(e.target.value as ProductStatus)}
                                >
                                    <option value="in_stock">En Depósito (Disponible)</option>
                                    <option value="incoming">En Camino (No Disponible)</option>
                                    <option value="reserved">Reservado</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Costo</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={cost}
                                    onChange={e => setCost(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Precio de Venta</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Moneda</label>
                            <select
                                className="select"
                                value={currency}
                                onChange={e => setCurrency(e.target.value as Currency)}
                            >
                                <option value="ARS">ARS - Peso Argentino ($)</option>
                                <option value="USD">USD - Dólar (U$D)</option>
                            </select>
                            <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                                Los precios se guardan en la moneda seleccionada
                            </small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Stock Actual</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={stock}
                                    onChange={e => setStock(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Stock Mínimo (Alerta)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={minStock}
                                    onChange={e => setMinStock(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Proveedor</label>
                            <input
                                type="text"
                                className="input"
                                value={supplier}
                                onChange={e => setSupplier(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {product ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
