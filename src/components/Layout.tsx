import React, { useEffect, useState } from 'react';
import { LayoutGrid, Package, TrendingUp, Users, FileText, Receipt, BarChart3, LogOut, ShoppingCart, DollarSign, Settings, ShieldCheck, Menu, X } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavigation = (view: string) => {
        onViewChange(view as ViewType);
        setIsMobileMenuOpen(false);
    };

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

    // Listener global para lector de código de barras / QR
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const char = e.key;

            if (now - lastKeyTime > 50) {
                buffer = '';
            }
            lastKeyTime = now;

            if (char === 'Enter') {
                if (buffer.length > 3) {
                    console.log("QR Detectado global:", buffer);
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
            {/* Overlay para cerrar menú en móvil */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Botón Hamburguesa Móvil */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ display: 'none' }} // Controlado por CSS
                aria-label="Menu"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <img
                            src={COMPANY_INFO.logoDarkUrl}
                            alt="Logo"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                        <div>
                            <h1>ShopPlumas</h1>
                            <span className="brand-subtitle" style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block' }}>by Lila</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <p className="nav-section-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#666', marginBottom: '8px', paddingLeft: '12px', fontWeight: 'bold' }}>Principal</p>
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                                onClick={() => handleNavigation(item.id)}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                        <div className="nav-section" style={{ marginTop: '1rem' }}>
                            <p className="nav-section-title" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#666', marginBottom: '8px', paddingLeft: '12px', fontWeight: 'bold' }}>Administración</p>
                            {adminItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                                    onClick={() => handleNavigation(item.id)}
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
                            <p className="user-name">{currentUser?.name}</p>
                            <p className="user-role badge badge-info" style={{ display: 'inline-block', fontSize: '0.7rem' }}>
                                {currentUser?.role === 'owner' || currentUser?.role === 'admin' ? 'Administrador' : 'Vendedor'}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-logout" onClick={onLogout}>
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <p className="text-secondary" style={{ fontSize: '0.7rem' }}>v1.4.0</p>
                    </div>
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
