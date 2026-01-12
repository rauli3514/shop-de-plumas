import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { COMPANY_INFO } from '../config/company';
import './Login.css';

interface LoginProps {
    onLogin: (username: string, password: string) => void;
    error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <div className="login-logo-img">
                        <img
                            src={COMPANY_INFO.logoDarkUrl}
                            alt="Shop de Plumas Logo"
                            style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                    <h1 style={{ marginTop: '1rem' }}>Shop de Plumas</h1>
                    <p>Sistema de Gestión</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Usuario</label>
                        <div className="input-with-icon">
                            <User size={18} />
                            <input
                                type="text"
                                className="input"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <div className="input-with-icon">
                            <Lock size={18} />
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Ingresa tu contraseña"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-block">
                        Iniciar Sesión
                    </button>
                </form>

                <div className="login-footer">
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                        &copy; {new Date().getFullYear()} Shop de Plumas
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
