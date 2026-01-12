import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import StockModal from './StockModal';
import './Stock.css';

const Stock: React.FC = () => {
    const { products, stockMovements, currentUser } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'incoming'>('all');

    // Calcular totales inline (Solo visible para admin)
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : product.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const isOwner = currentUser?.role === 'owner';

    // Ordenar movimientos cronológicamente inverso
    const recentMovements = [...stockMovements].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 10);

    return (
        <div className="stock-dashboard">
            <div className="stats-grid">
                {isOwner && (
                    <div className="stat-card">
                        <h3>Valor Total del Stock</h3>
                        <p className="stat-number">${totalValue.toLocaleString()}</p>
                    </div>
                )}
                <div className="stat-card">
                    <h3>Total de Artículos</h3>
                    <p className="stat-number">{totalItems}</p>
                </div>
                <div className="stat-card action-card" onClick={() => setIsModalOpen(true)}>
                    <h3>Registrar Movimiento</h3>
                    <div className="icon-circle">
                        <ArrowUpRight />
                    </div>
                </div>

                {/* Relleno visual si no es owner para mantener grid balanceado o simplemente grid-column auto */}
            </div>

            <div className="stock-content">
                <div className="section-header">
                    <h2>Inventario Actual</h2>
                    <div className="filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por código o nombre..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="select filter-select"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="in_stock">En Depósito</option>
                            <option value="incoming">En Camino</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Estado</th>
                                <th>Stock</th>
                                {isOwner && <th>Costo Unit.</th>}
                                {isOwner && <th>Valor Total</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td className="font-mono">{product.code}</td>
                                    <td>
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-variant">{product.color}</div>
                                    </td>
                                    <td>
                                        {product.status === 'incoming' ? (
                                            <span className="badge badge-warning">En Camino</span>
                                        ) : (
                                            <span className="badge badge-success">En Depósito</span>
                                        )}
                                    </td>
                                    <td className={product.stock <= product.minStock ? 'text-error font-bold' : ''}>
                                        {product.stock}
                                    </td>
                                    {isOwner && <td>${product.cost}</td>}
                                    {isOwner && <td>${(product.stock * product.cost).toFixed(2)}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Historial de Movimientos - Visible para todos, pero oculte costo si no es admin? 
                En StockMovements solo guardamos cost, quantity, type. 
                El costo unitario podría ser sensible.
            */}
            <div className="movements-history">
                <h3>Últimos Movimientos</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMovements.map(move => {
                                const product = products.find(p => p.id === move.productId);
                                return (
                                    <tr key={move.id}>
                                        <td>{new Date(move.date).toLocaleDateString()} {new Date(move.date).toLocaleTimeString()}</td>
                                        <td>
                                            {move.type === 'in' ? (
                                                <span className="text-success flex items-center gap-1">
                                                    <ArrowDownRight size={16} /> Entrada
                                                </span>
                                            ) : (
                                                <span className="text-error flex items-center gap-1">
                                                    <ArrowUpRight size={16} /> Salida
                                                </span>
                                            )}
                                        </td>
                                        <td>{product ? product.name : 'Producto Eliminado'}</td>
                                        <td>{move.quantity}</td>
                                        <td className="text-muted">{move.notes}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <StockModal
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Stock;
