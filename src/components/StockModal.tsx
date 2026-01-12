import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import '../components/common.css';

interface StockModalProps {
    onClose: () => void;
}

const StockModal: React.FC<StockModalProps> = ({ onClose }) => {
    const { products, addStockMovement, updateProduct } = useApp();
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');
    const [type, setType] = useState<'in' | 'out'>('in');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const product = products.find(p => p.id === productId);
        if (!product) {
            alert('Por favor selecciona un producto');
            return;
        }

        const qty = parseInt(quantity);
        if (type === 'out' && qty > product.stock) {
            alert(`Stock insuficiente. Stock disponible: ${product.stock}`);
            return;
        }

        // Registrar movimiento
        addStockMovement({
            productId,
            quantity: qty,
            cost: parseFloat(cost),
            type,
            date: new Date(),
            notes: notes || undefined,
        });

        // Actualizar stock del producto
        const newStock = type === 'in'
            ? product.stock + qty
            : product.stock - qty;

        updateProduct(productId, { stock: newStock });

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Registrar Movimiento de Stock</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Tipo de Movimiento *</label>
                            <select
                                className="select"
                                value={type}
                                onChange={e => setType(e.target.value as 'in' | 'out')}
                                required
                            >
                                <option value="in">Entrada (Agregar stock)</option>
                                <option value="out">Salida (Retirar stock)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Producto *</label>
                            <select
                                className="select"
                                value={productId}
                                onChange={e => {
                                    setProductId(e.target.value);
                                    const product = products.find(p => p.id === e.target.value);
                                    if (product) {
                                        setCost(product.cost.toString());
                                    }
                                }}
                                required
                            >
                                <option value="">Seleccionar producto...</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} - {product.color} (Stock: {product.stock})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Cantidad *</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="1"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Costo Unitario *</label>
                                <input
                                    type="number"
                                    className="input"
                                    step="0.01"
                                    min="0"
                                    value={cost}
                                    onChange={e => setCost(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notas</label>
                            <textarea
                                className="textarea"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Observaciones del movimiento..."
                                style={{ minHeight: '80px' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Registrar Movimiento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockModal;
