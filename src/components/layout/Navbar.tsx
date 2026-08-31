import React, { useState } from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  FileSpreadsheet,
  Receipt,
  ChefHat,
  Database,
  Cloud,
  RefreshCw,
  Users,
  LogOut,
  Shield,
  Trash2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    insumos,
    pedidos,
    cotizaciones,
    currentUser,
    logout,
    resetAllData,
    isSupabaseOnline,
    isSyncing,
    syncFromSupabase,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = currentUser?.rol === 'admin';

  const lowStockCount = insumos.filter((i) => i.activo && i.stock_actual <= i.stock_minimo).length;
  const activeOrdersCount = pedidos.list.filter(
    (p) => p.estado === 'confirmado' || p.estado === 'en_produccion'
  ).length;
  const pendingQuotesCount = cotizaciones.filter((c) => c.estado === 'pendiente').length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    {
      id: 'inventory',
      label: 'Insumos',
      icon: <Package className="w-3.5 h-3.5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'recipes', label: 'Recetario BOM', icon: <BookOpen className="w-3.5 h-3.5" /> },
    {
      id: 'quotes',
      label: 'Cotizador',
      icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
      badge: pendingQuotesCount > 0 ? pendingQuotesCount : undefined,
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: <Receipt className="w-3.5 h-3.5" />,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    // Pestañas exclusivas para el Administrador
    ...(isAdmin
      ? [
          { id: 'users' as ActiveTab, label: 'Usuarios', icon: <Users className="w-3.5 h-3.5" />, adminOnly: true },
          { id: 'database' as ActiveTab, label: 'Base SQL', icon: <Database className="w-3.5 h-3.5" />, adminOnly: true },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-trigo-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Marca (shrink-0 para evitar que se comprima o corte) */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer group select-none shrink-0 py-1"
          >
            <img
              src="/logo.png"
              alt="Delicias del Valle"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden xl:flex items-center gap-1 bg-canvas/90 p-1 rounded-2xl border border-trigo-200">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-chocolate-700 text-white shadow-md'
                      : 'text-chocolate-600 hover:text-chocolate-900 hover:bg-crema/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-frambuesa-500 text-white'
                          : 'bg-frambuesa-100 text-frambuesa-700 border border-frambuesa-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Acciones Rápidas Derecha */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Supabase Sync: Solo Admin */}
            {isAdmin && isSupabaseOnline && (
              <button
                onClick={() => syncFromSupabase(false)}
                title="Conectado a Supabase. Clic para sincronizar."
                disabled={isSyncing}
                className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold transition-all"
              >
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isSyncing ? 'Sync...' : 'Supabase Sync'}</span>
                <RefreshCw className={`w-3 h-3 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Modo Cocina */}
            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-warm ${
                activeTab === 'kitchen'
                  ? 'bg-frambuesa-600 text-white ring-4 ring-frambuesa-200'
                  : 'bg-gradient-to-r from-frambuesa-500 to-frambuesa-600 hover:from-frambuesa-600 hover:to-frambuesa-700 text-white shadow-frambuesa-glow hover:scale-105 active:scale-95'
              }`}
            >
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              <span className="hidden sm:inline">Modo Cocina</span>
            </button>

            {/* Menú de Usuario / Perfil */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-canvas hover:bg-crema border border-trigo-300 text-chocolate-800 text-xs font-bold transition-all shadow-sm"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-chocolate-700 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left max-w-[110px]">
                    <span className="block text-xs font-bold leading-tight truncate">
                      {currentUser.nombre_completo}
                    </span>
                    <span className="block text-[9px] text-frambuesa-600 font-bold uppercase">
                      {currentUser.rol}
                    </span>
                  </div>
                </button>

                {/* Dropdown flotante */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-trigo-200 shadow-2xl p-2 z-50 animate-scale-up text-xs">
                    <div className="p-2.5 bg-crema/60 rounded-xl mb-1 border border-trigo-100">
                      <span className="font-bold text-chocolate-900 block truncate">
                        {currentUser.nombre_completo}
                      </span>
                      <span className="text-[11px] text-gray-500 block truncate font-mono">
                        @{currentUser.username}
                      </span>
                      <div className="mt-1 flex items-center gap-1">
                        {currentUser.rol === 'admin' ? (
                          <span className="bg-frambuesa-100 text-frambuesa-700 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Admin Maestro
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full capitalize">
                            Rol: {currentUser.rol}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-chocolate-700 hover:bg-crema font-bold transition-colors text-left"
                      >
                        <Users className="w-4 h-4 text-frambuesa-600" />
                        <span>Gestión de Usuarios</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('database');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-chocolate-700 hover:bg-crema font-bold transition-colors text-left"
                      >
                        <Database className="w-4 h-4 text-chocolate-600" />
                        <span>Base SQL & Supabase</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors text-left mt-0.5 border-t border-trigo-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navegación Móvil / Pantallas Medianas */}
        <div className="flex xl:hidden overflow-x-auto py-2 gap-1.5 border-t border-trigo-200 scrollbar-none text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold ${
                  isActive
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 bg-white/80 border border-trigo-200 hover:bg-crema'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-frambuesa-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
