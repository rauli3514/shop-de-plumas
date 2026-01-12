import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import NetworkStatus from './components/NetworkStatus';
import POS from './components/POS'; // Nueva vista principal
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Stock from './components/Stock';
import Customers from './components/Customers';
import Sales from './components/Sales';
import DeliveryNotes from './components/DeliveryNotes';
import AccountsReceivable from './components/AccountsReceivable';
import Reports from './components/Reports';
import Admin from './components/Admin'; // Nueva vista admin
import Login from './components/Login';
import type { ViewType } from './types';

function MainApp() {
  const { currentUser, login, logout } = useApp();
  // Vista por defecto ahora es POS
  const [currentView, setCurrentView] = useState<ViewType>('pos');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (username: string, password: string) => {
    const success = login(username, password);
    if (success) {
      setLoginError('');
      setCurrentView('pos'); // Redirigir a POS al login
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <POS />;
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'stock':
        return <Stock />;
      case 'customers':
        return <Customers />;
      case 'sales':
        return <Sales />;
      case 'delivery-notes':
        return <DeliveryNotes />;
      case 'accounts-receivable':
        return <AccountsReceivable />;
      case 'reports':
        return <Reports />;
      case 'admin':
      case 'settings':
        // Reutilizo el componente Admin para ambas rutas por simplicidad
        // Podría pasarle una prop para activar tab por defecto
        return <Admin />;
      default:
        return <POS />;
    }
  };

  if (!currentUser) {
    return (
      <>
        <NetworkStatus />
        <Login onLogin={handleLogin} error={loginError} />
      </>
    );
  }

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView} onLogout={logout} currentUser={currentUser}>
      {renderView()}
      <NetworkStatus />
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
