import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../utils/currency';
import { generateMonthlyReportPDF } from '../utils/pdfGenerator';
import './Reports.css';

const Reports: React.FC = () => {
    const { sales, products } = useApp();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const monthStats = useMemo(() => {
        // Fix zona horaria: crear fecha local explícita usando componentes
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthDate = new Date(year, month - 1, 1); // Mes 0-indexado en constructor Date
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        const monthSales = sales.filter(sale =>
            isWithinInterval(new Date(sale.date), { start, end })
        );

        const totalSales = monthSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalCost = monthSales.reduce((sum, sale) => sum + sale.totalCost, 0);
        const totalProfit = monthSales.reduce((sum, sale) => sum + sale.totalProfit, 0);

        // Top products
        const productSales = new Map<string, { quantity: number; revenue: number }>();
        monthSales.forEach(sale => {
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
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return {
            monthDate,
            salesCount: monthSales.length,
            totalSales,
            totalCost,
            totalProfit,
            topProducts,
            monthSales,
        };
    }, [sales, products, selectedMonth]);

    const handleDownloadReport = () => {
        generateMonthlyReportPDF(
            monthStats.monthDate,
            monthStats.monthSales,
            monthStats.totalSales,
            monthStats.totalProfit,
            monthStats.topProducts
        );
    };

    return (
        <div className="reports">
            <div className="reports-header">
                <div>
                    <h2>Reportes</h2>
                    <p className="subtitle">Análisis de ventas y ganancias</p>
                </div>
            </div>

            <div className="reports-toolbar">
                <div className="month-selector">
                    <Calendar size={18} />
                    <input
                        type="month"
                        className="input"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleDownloadReport}>
                    <Download size={18} />
                    Descargar Reporte PDF
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <p className="stat-label">Total de Ventas</p>
                        <p className="stat-value">{monthStats.salesCount}</p>
                        <p className="stat-subtitle">
                            {format(monthStats.monthDate, "MMMM yyyy", { locale: es })}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <p className="stat-label">Ingresos Totales</p>
                        <p className="stat-value">{formatCurrency(monthStats.totalSales, 'ARS')}</p>
                        <p className="stat-subtitle">del mes</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <p className="stat-label">Costo Total</p>
                        <p className="stat-value">{formatCurrency(monthStats.totalCost, 'ARS')}</p>
                        <p className="stat-subtitle">del mes</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <p className="stat-label">Ganancia Total</p>
                        <p className="stat-value text-success">{formatCurrency(monthStats.totalProfit, 'ARS')}</p>
                        <p className="stat-subtitle">del mes</p>
                    </div>
                </div>
            </div>

            {monthStats.topProducts.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3>Top 10 Productos - {format(monthStats.monthDate, "MMMM yyyy", { locale: es })}</h3>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Producto</th>
                                        <th>Color</th>
                                        <th>Unidades Vendidas</th>
                                        <th>Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthStats.topProducts.map((item, index) => (
                                        <tr key={item.product.id}>
                                            <td><strong>#{index + 1}</strong></td>
                                            <td>{item.product.name}</td>
                                            <td>{item.product.color}</td>
                                            <td><strong>{item.quantity}</strong></td>
                                            <td className="text-success"><strong>{formatCurrency(item.revenue, 'ARS')}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
