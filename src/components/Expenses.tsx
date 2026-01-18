import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Search } from 'lucide-react';
import ExpenseModal from './ExpenseModal';
import { formatCurrency } from '../utils/currency';
import './Expenses.css';

const Expenses: React.FC = () => {
    const { expenses, deleteExpense, currentUser } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isOwner = currentUser?.role === 'owner';

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar este registro de gasto?')) {
            await deleteExpense(id);
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return (
        <div className="expenses-page">
            <div className="page-header">
                <h2>Control de Gastos</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    Registrar Gasto
                </button>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <h3>Total Gastos (Vista Actual)</h3>
                    <p className="stat-number text-error">{formatCurrency(totalExpenses, 'ARS')}</p>
                </div>
            </div>

            <div className="search-bar">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Buscar gastos..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Monto</th>
                            <th>Notas</th>
                            {isOwner && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{new Date(expense.date).toLocaleDateString()}</td>
                                <td>{expense.description}</td>
                                <td><span className="badge">{expense.category}</span></td>
                                <td className="font-bold text-error">-{formatCurrency(expense.amount, 'ARS')}</td>
                                <td className="text-muted">{expense.notes}</td>
                                {isOwner && (
                                    <td>
                                        <button
                                            className="btn-icon btn-icon-danger"
                                            onClick={() => handleDelete(expense.id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center p-4">No hay gastos registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <ExpenseModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Expenses;
