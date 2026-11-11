import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  FileSpreadsheet,
  Receipt,
  Store,
  ChefHat,
  Truck,
  Users,
  Contact,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { canAccessTab, getDefaultTabForRole } from '../../utils/security';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const {
    activeTab,
    setActiveTab,
    insumos,
    pedidos,
    cotizaciones,
    clientes,
    currentUser,
    logout,
  } = useApp();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const lowStockCount = insumos.filter((i) => i.activo && i.stock_actual <= i.stock_minimo).length;
  const activeOrdersCount = pedidos.list.filter(
    (p) => p.estado === 'confirmado' || p.estado === 'en_produccion'
  ).length;
  const pendingQuotesCount = cotizaciones.filter((c) => c.estado === 'pendiente').length;
  const pendingDeliveriesCount = pedidos.list.filter(
    (p) =>
      (p.tipo_despacho === 'delivery' || p.tipo_entrega === 'domicilio') &&
      p.estado !== 'entregado' &&
      p.estado !== 'cancelado'
  ).length;

  // Lista de pestañas autorizadas (Base SQL excluida de la navegación principal por instrucción del usuario)
  const allNavItems: {
    id: ActiveTab;
    label: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    highlight?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      description: 'Métricas generales',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory',
      label: 'Insumos',
      description: 'Inventario & costos',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'recipes',
      label: 'Recetas',
      description: 'Fichas técnicas',
      icon: BookOpen,
    },
    {
      id: 'quotes',
      label: 'Cotizador',
      description: 'Presupuestos & CRM',
      icon: FileSpreadsheet,
      badge: pendingQuotesCount > 0 ? pendingQuotesCount : undefined,
    },
    {
      id: 'orders',
      label: 'Pedidos',
      description: 'Control de órdenes',
      icon: Receipt,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      id: 'clients',
      label: 'Clientes',
      description: 'Cartera & Ubicaciones',
      icon: Contact,
      badge: clientes.length > 0 ? clientes.length : undefined,
    },
    {
      id: 'catalog',
      label: 'Catálogo',
      description: 'Fotos & Pedidos Online',
      icon: ShoppingBag,
    },
    {
      id: 'bazaar',
      label: 'Venta de Bazar',
      description: 'POS & Pop-Up Express',
      icon: Store,
      highlight: true,
    },
    {
      id: 'kitchen',
      label: 'Modo Cocina',
      description: 'Display pastelero',
      icon: ChefHat,
    },
    {
      id: 'delivery',
      label: 'Modo Delivery',
      description: 'Rutas & GPS',
      icon: Truck,
      badge: pendingDeliveriesCount > 0 ? pendingDeliveriesCount : undefined,
    },
    {
      id: 'users',
      label: 'Usuarios',
      description: 'Equipo & roles',
      icon: Users,
    },
  ];

  const authorizedNavItems = allNavItems.filter((item) =>
    canAccessTab(currentUser?.rol, item.id)
  );

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Barra Superior Móvil (Pantallas < md) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-trigo-200 shadow-sm px-4 h-16 flex items-center justify-between">
        <div
          onClick={() => setActiveTab(getDefaultTabForRole(currentUser?.rol))}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <img
            src="/logo.png"
            alt="Delicias del Valle"
            className="h-10 w-auto object-contain drop-shadow-sm"
          />
          <div>
            <span className="font-serif font-bold text-chocolate-900 text-sm block leading-tight">
              Delicias del Valle
            </span>
            <span className="text-[10px] text-frambuesa-600 font-bold uppercase tracking-wider block">
              Pastelería Artesanal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="w-8 h-8 rounded-xl bg-chocolate-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentUser.nombre_completo.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-crema text-chocolate-800 hover:bg-trigo-200 transition-colors"
            aria-label="Abrir menú"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Backdrop Móvil */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Lateral (Desktop & Tablets en columna, Móvil como drawer lateral) */}
      <aside
        className={`fixed md:sticky top-0 z-50 md:z-30 h-screen bg-gradient-to-b from-white via-crema/20 to-crema/50 border-r border-trigo-200/90 shadow-md flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0 w-72'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Encabezado del Sidebar / Logo */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-trigo-200/80 shrink-0">
          <div
            onClick={() => handleSelectTab(getDefaultTabForRole(currentUser?.rol))}
            className="flex items-center gap-3 cursor-pointer group select-none overflow-hidden"
          >
            <img
              src="/logo.png"
              alt="Delicias del Valle"
              className={`h-12 w-auto object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-serif font-bold text-chocolate-900 text-sm block leading-tight truncate">
                  Delicias del Valle
                </span>
                <span className="text-[10px] text-frambuesa-600 font-bold uppercase tracking-wider block truncate">
                  Pastelería Artesanal
                </span>
              </div>
            )}
          </div>

          {/* Botón colapsar para Tablets/Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-chocolate-500 hover:text-chocolate-900 hover:bg-trigo-200/60 transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-chocolate-600 hover:bg-trigo-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegación Vertical */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-trigo-300">
          {authorizedNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-frambuesa-600 to-rose-700 text-white shadow-md shadow-frambuesa-600/30 font-extrabold'
                      : 'bg-chocolate-800 text-white shadow-md shadow-chocolate-900/20'
                    : item.highlight
                    ? 'text-frambuesa-700 hover:bg-frambuesa-50/80 bg-frambuesa-50/40 border border-frambuesa-200/50'
                    : 'text-chocolate-700 hover:text-chocolate-900 hover:bg-white/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-frambuesa-600 bg-frambuesa-100'
                      : 'text-chocolate-600 bg-white/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-frambuesa-100 text-frambuesa-700">
                          Bazar
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <span
                        className={`block text-[10px] font-medium leading-tight truncate ${
                          isActive
                            ? 'text-trigo-200'
                            : 'text-chocolate-500/80'
                        }`}
                      >
                        {item.description}
                      </span>
                    )}
                  </div>
                )}

                {/* Badge numérico de pendientes */}
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-frambuesa-700'
                        : 'bg-frambuesa-600 text-white shadow-xs'
                    } ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sección de Usuario y Perfil al pie del Sidebar */}
        {currentUser && (
          <div className="p-3 border-t border-trigo-200/80 bg-white/60 shrink-0">
            <div
              className={`flex items-center gap-2.5 p-2 rounded-2xl bg-canvas border border-trigo-200/70 shadow-xs ${
                isCollapsed ? 'justify-center p-1.5' : ''
              }`}
            >
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-chocolate-700 to-chocolate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                title={currentUser.nombre_completo}
              >
                {currentUser.nombre_completo.charAt(0).toUpperCase()}
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-chocolate-900 leading-tight truncate">
                    {currentUser.nombre_completo}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {currentUser.rol === 'admin' ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-frambuesa-700 bg-frambuesa-50 px-1.5 py-0.2 rounded-full border border-frambuesa-200/50">
                        <Shield className="w-2.5 h-2.5" /> Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-chocolate-500 capitalize">
                        {currentUser.rol}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={logout}
                title="Cerrar sesión"
                className={`p-1.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ${
                  isCollapsed ? 'hidden' : 'block'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {isCollapsed && (
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="w-full mt-2 p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
