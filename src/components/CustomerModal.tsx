import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';
import type { Customer } from '../types';
import '../components/common.css';

interface CustomerModalProps {
    customer: Customer | null;
    onClose: () => void;
    onCustomerCreated?: (customerId: string) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onCustomerCreated }) => {
    const { addCustomer, updateCustomer } = useApp();
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [cuit, setCuit] = useState(''); // Estado local para cuil/cuit
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (customer) {
            setName(customer.name);
            setLastName(customer.lastName || '');
            setPhone(customer.phone);
            setEmail(customer.email);
            setAddress(customer.address || '');
            setCity(customer.city || '');
            setProvince(customer.province || '');
            setCuit(customer.cuil || '');
            setNotes(customer.notes || '');
        } else {
            setName('');
            setLastName('');
            setPhone('');
            setEmail('');
            setAddress('');
            setCity('');
            setProvince('');
            setCuit('');
            setNotes('');
        }
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const customerData = {
            name,
            lastName,
            phone,
            email,
            address,
            city,
            province,
            cuil: cuit,
            notes
        };

        if (customer) {
            await updateCustomer(customer.id, customerData);
        } else {
            const newCustomer = await addCustomer(customerData);
            if (newCustomer && onCustomerCreated) {
                onCustomerCreated(newCustomer.id);
            }
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row grid-mobile-2">
                            <div className="form-group">
                                <label className="form-label">Nombre *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Nombre"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Apellido *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Apellido"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row grid-mobile-2">
                            <div className="form-group">
                                <label className="form-label">Teléfono *</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="Teléfono"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="Email (Opcional)"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dirección *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Calle y Número"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-row grid-mobile-2">
                            <div className="form-group">
                                <label className="form-label">Localidad</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ciudad"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Provincia</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Provincia"
                                    value={province}
                                    onChange={e => setProvince(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">CUIL/CUIT</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="CUIL/CUIT"
                                value={cuit}
                                onChange={e => setCuit(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Observaciones</label>
                            <textarea
                                className="textarea"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Notas adicionales sobre el cliente o entregas..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {customer ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;
