import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, MapPin, Phone } from 'lucide-react';
import type { Customer } from '../types';
import CustomerModal from './CustomerModal';
import './Customers.css';

const Customers: React.FC = () => {
    const { customers, deleteCustomer, getSalesByCustomer } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            deleteCustomer(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="customers">
            <div className="customers-header">
                <h2>Gestión de Clientes</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    className="input"
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Contacto</th>
                            <th>Dirección</th>
                            <th>Compras</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => {
                            const purchaseHistory = getSalesByCustomer(customer.id);
                            const totalSpent = purchaseHistory.reduce((sum, sale) => sum + sale.total, 0);

                            return (
                                <tr key={customer.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{customer.name} {customer.lastName}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>{customer.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={14} className="text-secondary" />
                                            {customer.phone}
                                        </div>
                                    </td>
                                    <td>
                                        {customer.address && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={14} className="text-secondary" />
                                                {customer.address}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="badge badge-info">
                                            {purchaseHistory.length} ventas
                                        </div>
                                        <div style={{ fontSize: '0.8em', marginTop: '4px' }}>
                                            Total: ${totalSpent.toFixed(2)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(customer)}
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                className="btn-icon btn-icon-danger"
                                                onClick={() => handleDelete(customer.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No se encontraron clientes
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <CustomerModal
                    customer={editingCustomer}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default Customers;
