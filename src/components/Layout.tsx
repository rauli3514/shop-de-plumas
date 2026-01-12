import React, { useEffect } from 'react';
import { LayoutGrid, Package, TrendingUp, Users, FileText, Receipt, BarChart3, LogOut, UserCircle, Settings, ShieldCheck, ShoppingCart, DollarSign } from 'lucide-react';
import { COMPANY_INFO } from '../config/company';
import type { ViewType, User } from '../types';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onLogout: () => void;
    currentUser: User;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, onLogout, currentUser }) => {

    // Menú dinámico según rol
    const menuItems = [
        { id: 'pos', label: 'Punto de Venta', icon: <ShoppingCart size={20} /> },
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={20} /> },
        { id: 'products', label: 'Productos', icon: <Package size={20} /> },
        { id: 'stock', label: 'Stock', icon: <TrendingUp size={20} /> },
        { id: 'customers', label: 'Clientes', icon: <Users size={20} /> },
        { id: 'sales', label: 'Historial Ventas', icon: <Receipt size={20} /> },
        { id: 'delivery-notes', label: 'Remitos', icon: <FileText size={20} /> },
        { id: 'accounts-receivable', label: 'Cuentas Corrientes', icon: <DollarSign size={20} /> },
        { id: 'reports', label: 'Reportes', icon: <BarChart3 size={20} /> },
    ];

    const adminItems = [
        { id: 'admin', label: 'Usuarios', icon: <ShieldCheck size={20} /> },
        { id: 'settings', label: 'Configuración', icon: <Settings size={20} /> },
    ];

    // Listener global para lector de código de barras / QR (Simulación USB)
    // Normalmente los lectores USB envían las teclas muy rápido y terminan con Enter.
    // Esta es una implementación básica.
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const char = e.key;

            // Si pasa mucho tiempo entre teclas, reiniciar buffer (usuario escribiendo manual)
            if (now - lastKeyTime > 50) {
                buffer = '';
            }
            lastKeyTime = now;

            if (char === 'Enter') {
                if (buffer.length > 3) {
                    // Aquí podríamos disparar una acción global si el buffer parece un código de producto
                    // Por ahora, solo lo logueamos o lo dejamos para la vista activa
                    console.log("QR Detectado global:", buffer);
                    // TODO: Implementar lógica global de "Scan -> Action"
                }
                buffer = '';
            } else if (char.length === 1) {
                buffer += char;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <img
                            src={COMPANY_INFO.logoDarkUrl}
                            alt="Shop de Plumas Logo"
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginRight: '10px'
                            }}
                        />
                        <div>
                            <h1>Shop de Plumas</h1>
                            <span className="brand-subtitle">by Lila</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <p className="nav-section-title">Principal</p>
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                                onClick={() => onViewChange(item.id as ViewType)}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {currentUser.role === 'owner' && (
                        <div className="nav-section">
                            <p className="nav-section-title">Administración</p>
                            {adminItems.map(item => (
                                <button
                                    key={item.id}
                                    className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                                    onClick={() => onViewChange(item.id as ViewType)}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <UserCircle size={32} />
                        <div>
                            <p className="user-name">{currentUser.name}</p>
                            <p className="user-role badge badge-info">
                                {currentUser.role === 'owner' ? 'Propietario' : 'Vendedor'}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-logout" onClick={onLogout}>
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
