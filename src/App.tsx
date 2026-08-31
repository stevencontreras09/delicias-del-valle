import React from 'react';
import { useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { LoginScreen } from './components/auth/LoginScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { InventoryManager } from './components/inventory/InventoryManager';
import { RecipeManager } from './components/recipes/RecipeManager';
import { QuoteManager } from './components/quotes/QuoteManager';
import { OrderManager } from './components/orders/OrderManager';
import { KitchenMode } from './components/kitchen/KitchenMode';
import { DatabaseViewer } from './components/database/DatabaseViewer';
import { UserManager } from './components/users/UserManager';

export const App: React.FC = () => {
  const { activeTab, currentUser } = useApp();

  // Si no hay sesión iniciada, mostrar pantalla de Login
  if (!currentUser) {
    return <LoginScreen />;
  }

  const isAdmin = currentUser.rol === 'admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryManager />;
      case 'recipes':
        return <RecipeManager />;
      case 'quotes':
        return <QuoteManager />;
      case 'orders':
        return <OrderManager />;
      case 'kitchen':
        return <KitchenMode />;
      case 'users':
        // Protección de ruta: Solo para administradores
        return isAdmin ? <UserManager /> : <Dashboard />;
      case 'database':
        // Protección de ruta: Solo para administradores
        return isAdmin ? <DatabaseViewer /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderContent()}</Layout>;
};

export default App;
