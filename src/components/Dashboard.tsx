import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Package, TrendingUp, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, startOfDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { products, sales, currentUser } = useApp();
    const isOwner = currentUser?.role === 'owner';

    const stats = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const dayStart = startOfDay(now);

        // Stock total (visible para todos)
        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

        // Productos con stock bajo (visible para todos)
        const lowStockProducts = products.filter(p => p.stock <= p.minStock);

        // Filtrar ventas según rol
        const accessibleSales = isOwner
            ? sales
            : sales.filter(s => s.userId === currentUser?.id);

        // Ventas del día
        const todaySales = accessibleSales.filter(s => isAfter(new Date(s.date), dayStart));
        const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
        const todayProfit = todaySales.reduce((sum, s) => sum + s.totalProfit, 0);

        // Ventas del mes
        const monthSales = accessibleSales.filter(s => isAfter(new Date(s.date), monthStart));
        const monthSalesTotal = monthSales.reduce((sum, s) => sum + s.total, 0);
        const monthProfit = monthSales.reduce((sum, s) => sum + s.totalProfit, 0);

        // Productos más vendidos (basado en ventas accesibles)
        const productSales = new Map<string, { quantity: number; revenue: number }>();
        accessibleSales.forEach(sale => {
            sale.items.forEach(item => {
                const current = productSales.get(item.productId) || { quantity: 0, revenue: 0 };
                productSales.set(item.productId, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + item.subtotal,
                });
            });
        });

        const topProducts = Array.from(productSales.entries())
            .map(([productId, data]) => ({
                product: products.find(p => p.id === productId)!,
                ...data,
            }))
            .filter(item => item.product)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            totalStock,
            lowStockProducts,
            todaySalesCount: todaySales.length,
            todaySalesTotal,
            todayProfit,
            monthSalesCount: monthSales.length,
            monthSalesTotal,
            monthProfit,
            topProducts,
        };
    }, [products, sales, currentUser, isOwner]);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Dashboard {isOwner ? '(Vista Global)' : '(Mis Ventas)'}</h2>
                <p className="dashboard-date">
                    {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'hsl(220, 85%, 96%)' }}>
                        <Package size={24} color="hsl(220, 85%, 58%)" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Stock Total</p>
                        <p className="stat-value">{stats.totalStock}</p>
                        <p className="stat-subtitle">unidades en inventario</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'hsl(160, 60%, 96%)' }}>
                        <ShoppingCart size={24} color="hsl(160, 60%, 45%)" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Ventas del Día</p>
                        <p className="stat-value">${stats.todaySalesTotal.toFixed(2)}</p>
                        <p className="stat-subtitle">{stats.todaySalesCount} ventas</p>
                    </div>
                </div>

                {isOwner && (
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: 'hsl(140, 70%, 96%)' }}>
                            <DollarSign size={24} color="hsl(140, 70%, 45%)" />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Ganancia del Día</p>
                            <p className="stat-value">${stats.todayProfit.toFixed(2)}</p>
                            <p className="stat-subtitle">margen del día</p>
                        </div>
                    </div>
                )}

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'hsl(40, 95%, 96%)' }}>
                        <TrendingUp size={24} color="hsl(40, 95%, 55%)" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Ventas del Mes</p>
                        <p className="stat-value">${stats.monthSalesTotal.toFixed(2)}</p>
                        <p className="stat-subtitle">
                            {stats.monthSalesCount} ventas
                            {isOwner && ` - Ganancia: $${stats.monthProfit.toFixed(2)}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Productos con stock bajo */}
                {stats.lowStockProducts.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <div className="section-title">
                                <AlertTriangle size={20} color="hsl(0, 75%, 55%)" />
                                <h3>Productos con Stock Crítico</h3>
                            </div>
                            <span className="badge badge-error">{stats.lowStockProducts.length}</span>
                        </div>
                        <div className="card">
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Producto</th>
                                            <th>Stock Actual</th>
                                            <th>Stock Mínimo</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.lowStockProducts.map(product => (
                                            <tr key={product.id}>
                                                <td><strong>{product.code}</strong></td>
                                                <td>{product.name}</td>
                                                <td><strong>{product.stock}</strong></td>
                                                <td>{product.minStock}</td>
                                                <td>
                                                    <span className={`badge ${product.stock === 0 ? 'badge-error' : 'badge-warning'}`}>
                                                        {product.stock === 0 ? 'Sin stock' : 'Stock bajo'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top productos */}
                {stats.topProducts.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <div className="section-title">
                                <TrendingUp size={20} color="hsl(220, 85%, 58%)" />
                                <h3>Productos Más Vendidos {isOwner ? '' : '(Mis Ventas)'}</h3>
                            </div>
                        </div>
                        <div className="card">
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Color</th>
                                            <th>Cantidad Vendida</th>
                                            <th>Ingresos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.topProducts.map(({ product, quantity, revenue }) => (
                                            <tr key={product.id}>
                                                <td><strong>{product.name}</strong></td>
                                                <td>{product.color}</td>
                                                <td><strong>{quantity}</strong> unidades</td>
                                                <td className="text-success"><strong>${revenue.toFixed(2)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
