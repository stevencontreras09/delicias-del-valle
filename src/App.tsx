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
import { canAccessTab, getDefaultTabForRole } from './utils/security';
import { ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();

  // Si no hay sesión iniciada, mostrar pantalla de Login
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Verificación estricta de RBAC: validar si el rol del usuario tiene acceso a la pestaña solicitada
  const hasAccess = canAccessTab(currentUser.rol, activeTab);

  const renderContent = () => {
    if (!hasAccess) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-canvas animate-fade-in">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-chocolate-900 mb-2">Acceso Restringido (RBAC)</h2>
          <p className="text-sm text-chocolate-600 max-w-md mb-6">
            Tu rol asignado (<span className="font-bold text-frambuesa-600 uppercase">{currentUser.rol}</span>) no
            cuenta con permisos de seguridad para acceder al módulo de <span className="font-bold uppercase">{activeTab}</span>.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(getDefaultTabForRole(currentUser.rol))}
            className="px-5 py-2.5 bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold rounded-xl shadow-warm transition-all"
          >
            Ir a mi Módulo Autorizado
          </button>
        </div>
      );
    }

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
        return <UserManager />;
      case 'database':
        return <DatabaseViewer />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderContent()}</Layout>;
};

export default App;
