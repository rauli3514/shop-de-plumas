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
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
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
            setCategory(product.category || '');
            setDescription(product.description || '');
            setCost(product.cost.toString());
            setPrice(product.price.toString());
            setStock(product.stock.toString());
            setMinStock(product.minStock.toString());
            setSupplier(product.supplier || ''); // fix si supplier era opcional o string
            setStatus(product.status || 'in_stock');
            setCurrency(product.currency);
        } else {
            setName('');
            setColor('');
            setCategory('');
            setDescription('');
            setCost('');
            setPrice('');
            setStock('0');
            setMinStock('5');
            setSupplier('');
            setStatus('in_stock');
            setCurrency('ARS');
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const productData = {
            name,
            color,
            category,
            description,
            cost: parseFloat(cost),
            price: parseFloat(price),
            stock: parseInt(stock),
            minStock: parseInt(minStock),
            supplier,
            status,
            currency,
        };

        if (product) {
            await updateProduct(product.id, productData);
        } else {
            await addProduct(productData);
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body" style={{ overflowY: 'auto' }}>

                        {/* Nombre y datos básicos */}
                        <div className="form-group">
                            <label className="form-label">Nombre del Producto</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                autoFocus
                                placeholder="Ej: Pluma de Avestruz"
                            />
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Color / Variante</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    required
                                    placeholder="Ej: Rojo Intenso"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoría</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    placeholder="Ej: Plumas Largas"
                                />
                            </div>
                        </div>

                        {/* Precios y Moneda - Grid de 3 */}
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label className="form-label">Moneda</label>
                                <select
                                    className="select"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value as Currency)}
                                >
                                    <option value="ARS">ARS ($)</option>
                                    <option value="USD">USD (U$D)</option>
                                </select>
                            </div>
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
                                <label className="form-label">Precio Venta</label>
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

                        {/* Info de ganancia (Feedback visual rápido) */}
                        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
                            Ganancia estimada: <strong>{currency === 'USD' ? 'U$D' : '$'}{(parseFloat(price || '0') - parseFloat(cost || '0')).toFixed(2)}</strong>
                            {' '}
                            ({price && cost ? (((parseFloat(price) - parseFloat(cost)) / parseFloat(cost)) * 100).toFixed(0) : 0}%)
                        </div>

                        {/* Stock y Estado - Grid de 3 */}
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label className="form-label">Stock Actual</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={stock}
                                    onChange={e => setStock(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Stock Mínimo</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={minStock}
                                    onChange={e => setMinStock(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estado</label>
                                <select
                                    className="select"
                                    value={status}
                                    onChange={e => setStatus(e.target.value as ProductStatus)}
                                >
                                    <option value="in_stock">Disponible</option>
                                    <option value="incoming">En Camino</option>
                                    <option value="reserved">Reservado</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Proveedor / Notas</label>
                            <input
                                type="text"
                                className="input"
                                value={supplier}
                                onChange={e => setSupplier(e.target.value)}
                                placeholder="Nombre del proveedor..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <textarea
                                className="textarea"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Detalles adicionales..."
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
