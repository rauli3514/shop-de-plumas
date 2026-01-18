import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

interface ExpenseModalProps {
    onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ onClose }) => {
    const { addExpense } = useApp();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('varios');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addExpense({
            description,
            amount: parseFloat(amount),
            category,
            notes,
            date: new Date() // AppContext overrides this but good to have type match
        } as any);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Registrar Nuevo Gasto</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Descripción</label>
                            <input
                                type="text"
                                className="input"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                                autoFocus
                                placeholder="Ej: Pago de alquiler"
                            />
                        </div>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Monto</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoría</label>
                                <select
                                    className="select"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="alquiler">Alquiler</option>
                                    <option value="servicios">Servicios (Luz/Gas/Internet)</option>
                                    <option value="sueldos">Sueldos</option>
                                    <option value="impuestos">Impuestos</option>
                                    <option value="insumos">Insumos</option>
                                    <option value="varios">Varios</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notas Adicionales</label>
                            <textarea
                                className="textarea"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Registrar Gasto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
