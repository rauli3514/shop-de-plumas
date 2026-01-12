import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Trash2, Plus, CreditCard } from 'lucide-react';
import './Admin.css';

const Admin: React.FC = () => {
    const { users, addUser, updateUser, deleteUser, paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useApp();
    const [activeTab, setActiveTab] = useState<'users' | 'payments'>('users');

    // Estado para formulario de usuario
    const [newUserUser, setNewUserUser] = useState('');
    const [newUserPass, setNewUserPass] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<'owner' | 'seller'>('seller');

    // Estado para formulario de pagos
    const [newPaymentName, setNewPaymentName] = useState('');
    const [newPaymentSurcharge, setNewPaymentSurcharge] = useState('0');

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        addUser({
            username: newUserUser,
            password: newUserPass,
            name: newUserName,
            role: newUserRole,
        });
        setNewUserUser('');
        setNewUserPass('');
        setNewUserName('');
    };

    const handleCreatePayment = (e: React.FormEvent) => {
        e.preventDefault();
        addPaymentMethod({
            name: newPaymentName,
            surchargePercentage: parseFloat(newPaymentSurcharge),
            active: true,
            type: 'other',
        });
        setNewPaymentName('');
        setNewPaymentSurcharge('0');
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Administración</h2>
                <div className="admin-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Shield size={18} /> Usuarios
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payments')}
                    >
                        <CreditCard size={18} /> Pagos y Recargos
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <div className="admin-section">
                    <div className="card mb-4">
                        <h3>Crear Nuevo Usuario</h3>
                        <form onSubmit={handleCreateUser} className="admin-form">
                            <div className="form-row">
                                <input
                                    className="input"
                                    placeholder="Nombre Completo"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    required
                                />
                                <input
                                    className="input"
                                    placeholder="Usuario (Login)"
                                    value={newUserUser}
                                    onChange={e => setNewUserUser(e.target.value)}
                                    required
                                />
                                <input
                                    className="input"
                                    type="password"
                                    placeholder="Contraseña"
                                    value={newUserPass}
                                    onChange={e => setNewUserPass(e.target.value)}
                                    required
                                />
                                <select
                                    className="select"
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value as any)}
                                >
                                    <option value="seller">Vendedor</option>
                                    <option value="owner">Propietario</option>
                                </select>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={18} /> Crear
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Contraseña</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.username}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'owner' ? 'badge-info' : 'badge-warning'}`}>
                                                {user.role === 'owner' ? 'Admin' : 'Vendedor'}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>
                                            {/* Simplificación: Editable directo */}
                                            <input
                                                className="input-tiny"
                                                value={user.password}
                                                onChange={(e) => updateUser(user.id, { password: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                className="btn-icon btn-icon-danger"
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar usuario?')) deleteUser(user.id);
                                                }}
                                                disabled={user.username === 'admin'} // No borrar al admin principal
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="admin-section">
                    <div className="card mb-4">
                        <h3>Configurar Medio de Pago</h3>
                        <form onSubmit={handleCreatePayment} className="admin-form">
                            <div className="form-row">
                                <input
                                    className="input"
                                    placeholder="Nombre (ej. Transferencia)"
                                    value={newPaymentName}
                                    onChange={e => setNewPaymentName(e.target.value)}
                                    required
                                    style={{ flex: 2 }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Recargo %:</span>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="%"
                                        value={newPaymentSurcharge}
                                        onChange={e => setNewPaymentSurcharge(e.target.value)}
                                        required
                                        style={{ width: '80px' }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    <Plus size={18} /> Agregar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="payment-grid">
                        {paymentMethods.map(method => (
                            <div key={method.id} className={`payment-card ${method.active ? '' : 'inactive'}`}>
                                <div className="payment-header">
                                    <h4>{method.name}</h4>
                                    <div className="payment-actions">
                                        <input
                                            type="checkbox"
                                            checked={method.active}
                                            onChange={(e) => updatePaymentMethod(method.id, { active: e.target.checked })}
                                            title="Activar/Desactivar"
                                        />
                                        <button
                                            className="btn-icon btn-icon-danger"
                                            onClick={() => deletePaymentMethod(method.id)}
                                            disabled={['cash', 'card'].includes(method.id)} // Proteger básicos
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="payment-body">
                                    <label>Recargo:</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="number"
                                            className="input input-sm"
                                            value={method.surchargePercentage}
                                            onChange={(e) => updatePaymentMethod(method.id, { surchargePercentage: parseFloat(e.target.value) })}
                                        />
                                        <span>%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
