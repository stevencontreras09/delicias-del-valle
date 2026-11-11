import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BazaarEvent,
  BazaarVentaItem,
  MetodoPagoBazaar,
  CategoriaGastoBazaar,
  BazaarItemStock,
} from '../../types';
import {
  Store,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  UploadCloud,
  History,
  Phone,
  User,
  Coffee,
  Coins,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calcularCostosReceta } from '../../utils/calculations';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

// Productos rápidos comunes en bazares de repostería artesanal
const PRODUCTOS_PREDETERMINADOS_BAZAAR = [
  { nombre: 'Porción Pastel Tres Leches', precio: 175, icono: '🍰' },
  { nombre: 'Porción Bizcocho Dominicano', precio: 150, icono: '🎂' },
  { nombre: 'Brownie Fudge Artesanal', precio: 120, icono: '🍫' },
  { nombre: 'Pack Cupcakes x 2', precio: 190, icono: '🧁' },
  { nombre: 'Cupcake Individual', precio: 100, icono: '🧁' },
  { nombre: 'Alfajor Dulce de Leche', precio: 80, icono: '🍪' },
  { nombre: 'Galleta Chispas Chocolate', precio: 75, icono: '🍪' },
  { nombre: 'Galleta Red Velvet', precio: 85, icono: '🍪' },
  { nombre: 'Café Caliente / Frío', precio: 90, icono: '☕' },
  { nombre: 'Botella de Agua', precio: 50, icono: '💧' },
];

export const BazaarManager: React.FC = () => {
  const {
    bazaarEvents,
    activeBazaar,
    setActiveBazaarId,
    crearBazaarEvent,
    actualizarBazaarEvent,
    agregarVentaBazaar,
    agregarGastoBazaar,
    actualizarStockBazaar,
    finalizarBazaar,
    importarBazaarAContabilidadGeneral,
    eliminarBazaarEvent,
    recetas,
    insumosMap,
  } = useApp();

  // Pestañas internas del módulo de Bazar
  type SubTab = 'pos' | 'gastos' | 'inventario' | 'arqueo' | 'historial';
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>('pos');

  // Modal para iniciar nuevo bazar
  const [isNewBazaarModalOpen, setIsNewBazaarModalOpen] = useState(false);
  const [newBazaarNombre, setNewBazaarNombre] = useState('');
  const [newBazaarFecha, setNewBazaarFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newBazaarFechaFin, setNewBazaarFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [newBazaarFondo, setNewBazaarFondo] = useState('2000');
  const [newBazaarUbicacion, setNewBazaarUbicacion] = useState('');
  const [newBazaarNotas, setNewBazaarNotas] = useState('');

  // Helpers para calcular duración en días y formatear rango de fechas del bazar
  const getBazaarDurationDays = (inicio: string, fin?: string): number => {
    if (!fin || fin === inicio) return 1;
    const d1 = new Date(`${inicio}T00:00:00`);
    const d2 = new Date(`${fin}T00:00:00`);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const formatBazaarDateRange = (inicio: string, fin?: string): string => {
    if (!fin || fin === inicio) {
      return formatDate(inicio);
    }
    return `Del ${formatDate(inicio)} al ${formatDate(fin)}`;
  };

  // Estados del POS Express
  const [cart, setCart] = useState<BazaarVentaItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoBazaar>('efectivo');
  const [dineroRecibido, setDineroRecibido] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [customItemNombre, setCustomItemNombre] = useState('');
  const [customItemPrecio, setCustomItemPrecio] = useState('');

  // Estados de Gastos
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoCategoria, setGastoCategoria] = useState<CategoriaGastoBazaar>('stand_mesa');
  const [gastoPagadoCon, setGastoPagadoCon] = useState<'caja_efectivo' | 'cuenta_banco'>('caja_efectivo');

  // Estados de Inventario Llevado
  const [stockItemNombre, setStockItemNombre] = useState('');
  const [stockItemPrecio, setStockItemPrecio] = useState('');
  const [stockItemCantidad, setStockItemCantidad] = useState('');

  // Estados de Arqueo
  const [efectivoContadoFisico, setEfectivoContadoFisico] = useState('');
  const [notasCierre, setNotasCierre] = useState('');

  // Totales y Métricas del Bazar Activo
  const metricas = useMemo(() => {
    if (!activeBazaar) {
      return {
        totalVentas: 0,
        ventasEfectivo: 0,
        ventasTransferencia: 0,
        ventasTarjeta: 0,
        totalGastos: 0,
        gastosEfectivo: 0,
        gastosBanco: 0,
        gananciaNeta: 0,
        efectivoEsperadoCaja: 0,
        unidadesVendidas: 0,
      };
    }

    const totalVentas = activeBazaar.ventas.reduce((acc, v) => acc + v.total, 0);
    const ventasEfectivo = activeBazaar.ventas
      .filter((v) => v.metodo_pago === 'efectivo')
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTransferencia = activeBazaar.ventas
      .filter((v) => v.metodo_pago === 'transferencia')
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTarjeta = activeBazaar.ventas
      .filter((v) => v.metodo_pago === 'tarjeta')
      .reduce((acc, v) => acc + v.total, 0);

    const totalGastos = activeBazaar.gastos.reduce((acc, g) => acc + g.monto, 0);
    const gastosEfectivo = activeBazaar.gastos
      .filter((g) => g.pagado_con === 'caja_efectivo')
      .reduce((acc, g) => acc + g.monto, 0);
    const gastosBanco = totalGastos - gastosEfectivo;

    const gananciaNeta = totalVentas - totalGastos;
    const efectivoEsperadoCaja = activeBazaar.fondo_caja_inicial + ventasEfectivo - gastosEfectivo;

    const unidadesVendidas = activeBazaar.ventas.reduce(
      (acc, v) => acc + v.items.reduce((sum, item) => sum + item.cantidad, 0),
      0
    );

    return {
      totalVentas,
      ventasEfectivo,
      ventasTransferencia,
      ventasTarjeta,
      totalGastos,
      gastosEfectivo,
      gastosBanco,
      gananciaNeta,
      efectivoEsperadoCaja,
      unidadesVendidas,
    };
  }, [activeBazaar]);

  // Total del carrito POS
  const totalCarrito = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  // Cálculo del cambio en efectivo
  const dineroRecibidoNum = Number(dineroRecibido) || 0;
  const cambioDevuelto = dineroRecibidoNum > 0 ? Math.max(0, dineroRecibidoNum - totalCarrito) : 0;

  // Manejo de adición de producto al carrito
  const handleAddItemToCart = (nombre: string, precio: number, receta_id?: number) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.producto_nombre === nombre);
      if (existingIndex !== -1) {
        const copy = [...prev];
        const item = copy[existingIndex];
        const newCantidad = item.cantidad + 1;
        copy[existingIndex] = {
          ...item,
          cantidad: newCantidad,
          subtotal: newCantidad * item.precio_unitario,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          producto_nombre: nombre,
          precio_unitario: precio,
          cantidad: 1,
          subtotal: precio,
          receta_id,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const newCant = item.cantidad + delta;
      if (newCant <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = {
        ...item,
        cantidad: newCant,
        subtotal: newCant * item.precio_unitario,
      };
      return copy;
    });
  };

  const handleCobrarVenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBazaar) return;
    if (cart.length === 0) {
      alert('Por favor selecciona al menos un producto para despachar.');
      return;
    }

    if (metodoPago === 'efectivo' && dineroRecibidoNum > 0 && dineroRecibidoNum < totalCarrito) {
      alert(`El dinero recibido (RD$${dineroRecibidoNum.toLocaleString()}) es menor al total de la venta (RD$${totalCarrito.toLocaleString()}).`);
      return;
    }

    agregarVentaBazaar(activeBazaar.id, {
      items: cart,
      total: totalCarrito,
      metodo_pago: metodoPago,
      dinero_recibido: metodoPago === 'efectivo' ? dineroRecibidoNum : undefined,
      cambio_devuelto: metodoPago === 'efectivo' ? cambioDevuelto : undefined,
      cliente_nombre: clienteNombre.trim() || undefined,
      cliente_telefono: clienteTelefono.trim() || undefined,
    });

    // Limpiar carrito para la siguiente venta inmediata
    setCart([]);
    setDineroRecibido('');
    setClienteNombre('');
    setClienteTelefono('');
  };

  const handleCrearNuevoBazaar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBazaarNombre.trim()) {
      alert('Por favor indica el nombre del bazar o evento.');
      return;
    }
    if (newBazaarFechaFin && newBazaarFechaFin < newBazaarFecha) {
      alert('La fecha final del evento no puede ser anterior a la fecha de inicio.');
      return;
    }
    const fondo = Number(newBazaarFondo) || 0;
    crearBazaarEvent(
      newBazaarNombre.trim(),
      newBazaarFecha,
      fondo,
      newBazaarUbicacion.trim() || undefined,
      newBazaarNotas.trim() || undefined,
      newBazaarFechaFin || newBazaarFecha
    );

    setIsNewBazaarModalOpen(false);
    setNewBazaarNombre('');
    setNewBazaarUbicacion('');
    setNewBazaarNotas('');
    setCurrentSubTab('pos');
  };

  const handleRegistrarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBazaar) return;
    const monto = Number(gastoMonto);
    if (!gastoConcepto.trim() || isNaN(monto) || monto <= 0) {
      alert('Por favor escribe un concepto y un monto válido.');
      return;
    }

    agregarGastoBazaar(activeBazaar.id, {
      concepto: gastoConcepto.trim(),
      monto,
      categoria: gastoCategoria,
      pagado_con: gastoPagadoCon,
    });

    setGastoConcepto('');
    setGastoMonto('');
  };

  const handleAgregarItemStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBazaar) return;
    const precio = Number(stockItemPrecio) || 0;
    const cant = Number(stockItemCantidad) || 0;
    if (!stockItemNombre.trim() || cant <= 0) {
      alert('Por favor ingresa el nombre del producto y la cantidad llevada.');
      return;
    }

    const newItem: BazaarItemStock = {
      id: `stock-bz-${Date.now()}`,
      producto_nombre: stockItemNombre.trim(),
      precio_unitario: precio,
      cantidad_inicial: cant,
      cantidad_vendida: 0,
      cantidad_degustacion: 0,
      cantidad_sobrante: cant,
    };

    actualizarStockBazaar(activeBazaar.id, [newItem, ...activeBazaar.inventario]);
    setStockItemNombre('');
    setStockItemPrecio('');
    setStockItemCantidad('');
  };

  const handleActualizarDegustacion = (itemId: string, degus: number) => {
    if (!activeBazaar) return;
    const updated = activeBazaar.inventario.map((item) => {
      if (item.id !== itemId) return item;
      const deg = Math.max(0, degus);
      return {
        ...item,
        cantidad_degustacion: deg,
        cantidad_sobrante: Math.max(0, item.cantidad_inicial - item.cantidad_vendida - deg),
      };
    });
    actualizarStockBazaar(activeBazaar.id, updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Encabezado Principal y Selector de Bazar Activo */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-frambuesa-500/10 via-amber-400/5 to-transparent rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-frambuesa-600 to-rose-700 text-white rounded-2xl shadow-md shadow-frambuesa-600/30 shrink-0">
              <Store className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-chocolate-900 leading-tight">
                  {activeBazaar ? activeBazaar.nombre : 'Venta de Bazar & Pop-Up'}
                </h1>
                {activeBazaar && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      activeBazaar.estado === 'activo'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeBazaar.estado === 'activo' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {activeBazaar.estado === 'activo' ? 'Bazar en Curso' : 'Bazar Finalizado'}
                  </span>
                )}
                {activeBazaar?.importado_a_central && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Importado a Central
                  </span>
                )}
              </div>
              <p className="text-xs text-chocolate-600 mt-0.5 flex items-center gap-3 flex-wrap">
                {activeBazaar?.fecha && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-chocolate-700">
                    <Calendar className="w-3.5 h-3.5 text-frambuesa-600" />
                    <span>{formatBazaarDateRange(activeBazaar.fecha, activeBazaar.fecha_fin)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-200">
                      {getBazaarDurationDays(activeBazaar.fecha, activeBazaar.fecha_fin)}{' '}
                      {getBazaarDurationDays(activeBazaar.fecha, activeBazaar.fecha_fin) === 1 ? 'día' : 'días'}
                    </span>
                  </span>
                )}
                {activeBazaar?.ubicacion && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-frambuesa-500" />
                    {activeBazaar.ubicacion}
                  </span>
                )}
                <span>• POS Express & Arqueo Independiente</span>
              </p>
            </div>
          </div>

          {/* Selector de Bazares & Botón Iniciar Nuevo */}
          <div className="flex items-center gap-2 flex-wrap">
            {bazaarEvents.length > 0 && (
              <select
                value={activeBazaar?.id || ''}
                onChange={(e) => setActiveBazaarId(e.target.value)}
                className="text-xs font-bold text-chocolate-800 bg-canvas border border-trigo-300 rounded-xl px-3 py-2 shadow-xs focus:ring-2 focus:ring-frambuesa-400"
              >
                {bazaarEvents.map((b) => {
                  const rango = b.fecha_fin && b.fecha_fin !== b.fecha ? `${b.fecha} al ${b.fecha_fin}` : b.fecha;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.nombre} ({rango}) {b.estado === 'activo' ? '⚡' : '✓'}
                    </option>
                  );
                })}
              </select>
            )}

            <button
              onClick={() => setIsNewBazaarModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Bazar</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas en Tiempo Real */}
        {activeBazaar && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-trigo-100">
            <div className="bg-canvas/80 p-3 rounded-2xl border border-trigo-200">
              <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block">
                Fondo Caja Inicial
              </span>
              <span className="text-sm sm:text-base font-bold text-chocolate-800">
                {formatCurrency(activeBazaar.fondo_caja_inicial)}
              </span>
              <span className="text-[9px] text-chocolate-400 block mt-0.5">Para cambio</span>
            </div>

            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Total Vendido
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-900">
                {formatCurrency(metricas.totalVentas)}
              </span>
              <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                {metricas.unidadesVendidas} unid. ({activeBazaar.ventas.length} tickets)
              </span>
            </div>

            <div className="bg-red-50/80 p-3 rounded-2xl border border-red-200">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                Gastos del Bazar
              </span>
              <span className="text-sm sm:text-base font-bold text-red-900">
                {formatCurrency(metricas.totalGastos)}
              </span>
              <span className="text-[9px] text-red-700 font-semibold block mt-0.5">
                {activeBazaar.gastos.length} gastos reg.
              </span>
            </div>

            <div className="bg-gradient-to-br from-frambuesa-50 to-rose-100 p-3 rounded-2xl border border-frambuesa-200">
              <span className="text-[10px] font-bold text-frambuesa-800 uppercase tracking-wider block">
                Ganancia Neta Bazar
              </span>
              <span className="text-sm sm:text-base font-bold text-frambuesa-950">
                {formatCurrency(metricas.gananciaNeta)}
              </span>
              <span className="text-[9px] text-frambuesa-700 font-semibold block mt-0.5">
                Margen: {metricas.totalVentas > 0 ? `${Math.round((metricas.gananciaNeta / metricas.totalVentas) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Si no hay bazares creados aún */}
      {!activeBazaar && (
        <div className="bg-white rounded-3xl p-10 text-center border border-trigo-200 shadow-sm max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-frambuesa-50 text-frambuesa-600 flex items-center justify-center mx-auto mb-4 border border-frambuesa-200">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-serif font-bold text-chocolate-900">
            No hay ningún bazar activo en este momento
          </h2>
          <p className="text-xs text-chocolate-600 mt-2 max-w-md mx-auto">
            Inicia un evento de bazar para despachar con el POS rápido táctil, calcular cambio al instante, registrar
            gastos independientes y luego importar las ventas a la contabilidad general de Delicias del Valle.
          </p>
          <button
            onClick={() => setIsNewBazaarModalOpen(true)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Iniciar Nuevo Bazar Ahora</span>
          </button>
        </div>
      )}

      {/* 2. Barra de Navegación de Sub-Módulos del Bazar */}
      {activeBazaar && (
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-trigo-200 shadow-xs overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setCurrentSubTab('pos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'pos'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Despachador POS Express</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('gastos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'gastos'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Gastos del Evento ({activeBazaar.gastos.length})</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('inventario')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'inventario'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock Llevado vs Sobrante</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('arqueo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'arqueo'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Arqueo de Caja & Cierre</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('historial')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ml-auto ${
              currentSubTab === 'historial'
                ? 'bg-chocolate-800 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Bazares</span>
          </button>
        </div>
      )}

      {/* 3. Contenido según la Pestaña Activa */}
      {activeBazaar && currentSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lado Izquierdo: Catálogo de Productos Táctiles (7 columnas) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-serif font-bold text-chocolate-900">
                    Productos Táctiles de Bazar
                  </h2>
                  <p className="text-[11px] text-chocolate-500">
                    Toca un producto para añadirlo de inmediato a la orden
                  </p>
                </div>
                <span className="text-[10px] font-bold text-frambuesa-600 bg-frambuesa-50 px-2.5 py-1 rounded-full border border-frambuesa-200">
                  Despacho en 1-Toque
                </span>
              </div>

              {/* Botones de Productos Frecuentes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRODUCTOS_PREDETERMINADOS_BAZAAR.map((prod, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddItemToCart(prod.nombre, prod.precio)}
                    className="p-3 rounded-2xl bg-canvas hover:bg-crema border border-trigo-200/80 hover:border-frambuesa-300 text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between h-24 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{prod.icono}</span>
                      <span className="text-xs font-bold text-frambuesa-700 bg-white px-2 py-0.5 rounded-full border border-trigo-200 shadow-2xs">
                        {formatCurrency(prod.precio)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-chocolate-900 leading-tight line-clamp-2 group-hover:text-frambuesa-700">
                      {prod.nombre}
                    </span>
                  </button>
                ))}
              </div>

              {/* Catálogo Maestro de Recetas Disponibles */}
              {recetas.length > 0 && (
                <div className="pt-4 border-t border-trigo-100">
                  <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block mb-2">
                    O añadir desde el Recetario Maestro
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                    {recetas.slice(0, 9).map((rec) => {
                      const costCalculated = calcularCostosReceta(rec, insumosMap);
                      const recPrecio = costCalculated.precio_sugerido_margen_venta || costCalculated.precio_sugerido_venta || 150;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => handleAddItemToCart(rec.nombre, recPrecio, rec.id)}
                          className="p-2 rounded-xl bg-white hover:bg-crema border border-trigo-200 text-left text-xs transition-colors flex flex-col justify-between h-16"
                        >
                          <span className="font-semibold text-chocolate-800 text-[11px] truncate">
                            {rec.nombre}
                          </span>
                          <span className="text-[10px] font-bold text-chocolate-600">
                            {formatCurrency(recPrecio)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agregar Producto Manual Rápido */}
              <div className="pt-3 border-t border-trigo-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Otro producto / extra..."
                  value={customItemNombre}
                  onChange={(e) => setCustomItemNombre(e.target.value)}
                  className="flex-1 text-xs border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
                <input
                  type="number"
                  placeholder="Precio RD$"
                  value={customItemPrecio}
                  onChange={(e) => setCustomItemPrecio(e.target.value)}
                  className="w-24 text-xs border border-trigo-200 rounded-xl px-2 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const pr = Number(customItemPrecio);
                    if (!customItemNombre.trim() || isNaN(pr) || pr <= 0) {
                      alert('Ingresa el nombre y precio del producto');
                      return;
                    }
                    handleAddItemToCart(customItemNombre.trim(), pr);
                    setCustomItemNombre('');
                    setCustomItemPrecio('');
                  }}
                  className="px-3 py-2 rounded-xl bg-chocolate-700 text-white text-xs font-bold hover:bg-chocolate-800 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Carrito / Ticket de Cobro Express (5 columnas) */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleCobrarVenta}
              className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-trigo-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-frambuesa-600" />
                  <h3 className="text-sm font-serif font-bold text-chocolate-900">
                    Ticket de Cobro #{activeBazaar.ventas.length + 1}
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    Vaciar Carrito
                  </button>
                )}
              </div>

              {/* Items del Carrito */}
              {cart.length === 0 ? (
                <div className="py-8 text-center text-chocolate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Toca productos de la izquierda para agregarlos</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                  {cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-canvas border border-trigo-200/70 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-chocolate-900 block truncate">
                          {item.producto_nombre}
                        </span>
                        <span className="text-[10px] text-chocolate-500">
                          {formatCurrency(item.precio_unitario)} c/u
                        </span>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(idx, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-trigo-300 text-chocolate-700 font-bold flex items-center justify-center hover:bg-crema"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-chocolate-900">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQuantity(idx, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-trigo-300 text-chocolate-700 font-bold flex items-center justify-center hover:bg-crema"
                        >
                          +
                        </button>
                      </div>

                      <span className="w-16 text-right font-bold text-chocolate-900 shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Prominente */}
              <div className="p-3.5 bg-crema/70 rounded-2xl border border-trigo-200 flex items-center justify-between">
                <span className="text-xs font-bold text-chocolate-700 uppercase tracking-wider">
                  Total a Cobrar:
                </span>
                <span className="text-xl font-bold font-serif text-frambuesa-700">
                  {formatCurrency(totalCarrito)}
                </span>
              </div>

              {/* Selector de Método de Pago */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-chocolate-600 uppercase tracking-wider block">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['efectivo', 'transferencia', 'tarjeta'] as MetodoPagoBazaar[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPago(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        metodoPago === m
                          ? 'bg-chocolate-800 text-white border-chocolate-800 shadow-sm'
                          : 'bg-white text-chocolate-700 border-trigo-200 hover:bg-crema'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculadora de Cambio en Efectivo (DOP) */}
              {metodoPago === 'efectivo' && totalCarrito > 0 && (
                <div className="p-3 bg-canvas rounded-2xl border border-trigo-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-chocolate-700 uppercase flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600" />
                      Calculadora de Cambio
                    </span>
                    {cambioDevuelto > 0 && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                        Cambio: {formatCurrency(cambioDevuelto)}
                      </span>
                    )}
                  </div>

                  {/* Botones de Billetes Dominicanos Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[100, 200, 500, 1000, 2000].map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setDineroRecibido(String(billete))}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          dineroRecibido === String(billete)
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-white border-trigo-200 text-chocolate-700 hover:bg-crema'
                        }`}
                      >
                        RD${billete}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDineroRecibido(String(totalCarrito))}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    >
                      Exacto
                    </button>
                  </div>

                  <input
                    type="number"
                    placeholder="Efectivo recibido (ej. 500)..."
                    value={dineroRecibido}
                    onChange={(e) => setDineroRecibido(e.target.value)}
                    className="w-full text-xs font-bold border border-trigo-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-frambuesa-400"
                  />
                </div>
              )}

              {/* Captura Express de Cliente (Mini CRM Opcional para Fidelización) */}
              <div className="pt-2 border-t border-trigo-100 space-y-2">
                <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block">
                  Captar Cliente (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Nombre cliente"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="border border-trigo-200 rounded-xl px-2.5 py-1.5 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="border border-trigo-200 rounded-xl px-2.5 py-1.5 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  />
                </div>
              </div>

              {/* Botón Principal de Cobro */}
              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COBRAR Y DESPACHAR ({formatCurrency(totalCarrito)})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Sub-Pestaña: Gastos del Evento */}
      {activeBazaar && currentSubTab === 'gastos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-serif font-bold text-chocolate-900">
              Registrar Gasto del Bazar
            </h2>
            <form onSubmit={handleRegistrarGasto} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-chocolate-700 block mb-1">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago de stand / mesa, hielo, transporte..."
                  value={gastoConcepto}
                  onChange={(e) => setGastoConcepto(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-chocolate-700 block mb-1">
                    Monto RD$ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-chocolate-700 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value as CategoriaGastoBazaar)}
                    className="w-full border border-trigo-200 rounded-xl px-2 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  >
                    <option value="stand_mesa">Alquiler de Stand</option>
                    <option value="transporte_gasolina">Transporte / Uber</option>
                    <option value="hielo_insumos">Hielo / Enfriado</option>
                    <option value="empaques">Empaques / Servilletas</option>
                    <option value="merienda_socias">Comida / Socias</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-chocolate-700 block mb-1">
                  Fuente de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGastoPagadoCon('caja_efectivo')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      gastoPagadoCon === 'caja_efectivo'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                        : 'bg-white border-trigo-200 text-chocolate-700'
                    }`}
                  >
                    <span>Efectivo de Caja</span>
                    <span className="block text-[9px] text-chocolate-400">Resta del arqueo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGastoPagadoCon('cuenta_banco')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      gastoPagadoCon === 'cuenta_banco'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                        : 'bg-white border-trigo-200 text-chocolate-700'
                    }`}
                  >
                    <span>Cuenta de Banco</span>
                    <span className="block text-[9px] text-chocolate-400">Transferencia previa</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Guardar Gasto
              </button>
            </form>
          </div>

          {/* Tabla de Gastos */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-chocolate-900">
                Historial de Gastos del Evento
              </h3>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                Total: {formatCurrency(metricas.totalGastos)}
              </span>
            </div>

            {activeBazaar.gastos.length === 0 ? (
              <p className="text-xs text-chocolate-400 py-6 text-center">
                Aún no hay gastos registrados para este bazar.
              </p>
            ) : (
              <div className="divide-y divide-trigo-100">
                {activeBazaar.gastos.map((g) => (
                  <div key={g.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-chocolate-900 block">{g.concepto}</span>
                      <span className="text-[10px] text-chocolate-500 capitalize">
                        {g.categoria.replace('_', ' ')} • Pagado con {g.pagado_con === 'caja_efectivo' ? 'Caja Efectivo' : 'Banco'} • {g.hora}
                      </span>
                    </div>
                    <span className="font-bold text-red-700">{formatCurrency(g.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Sub-Pestaña: Control de Inventario Llevado vs Sobrante */}
      {activeBazaar && currentSubTab === 'inventario' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm">
            <h2 className="text-sm font-serif font-bold text-chocolate-900 mb-1">
              Registro de Productos Llevados al Bazar
            </h2>
            <p className="text-xs text-chocolate-500 mb-4">
              Anota las unidades preparadas en el taller que se llevaron al evento para controlar sobrantes y muestras
            </p>

            <form onSubmit={handleAgregarItemStock} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nombre del producto (ej: Brownies)..."
                value={stockItemNombre}
                onChange={(e) => setStockItemNombre(e.target.value)}
                className="sm:col-span-2 border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
              <input
                type="number"
                placeholder="Cantidad llevada"
                value={stockItemCantidad}
                onChange={(e) => setStockItemCantidad(e.target.value)}
                className="border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold transition-colors"
              >
                + Añadir al Stock
              </button>
            </form>
          </div>

          {/* Tabla de Inventario */}
          <div className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-trigo-200 text-[10px] uppercase font-bold text-chocolate-500">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-center">Llevado</th>
                  <th className="pb-2 text-center">Vendido</th>
                  <th className="pb-2 text-center">Muestras / Degustación</th>
                  <th className="pb-2 text-center">Sobrante Devuelto</th>
                  <th className="pb-2 text-right">Efectividad Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {activeBazaar.inventario.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-chocolate-400">
                      No has cargado inventario para este bazar todavía. Puedes agregarlo arriba.
                    </td>
                  </tr>
                ) : (
                  activeBazaar.inventario.map((item) => {
                    const pct = item.cantidad_inicial > 0 ? Math.round((item.cantidad_vendida / item.cantidad_inicial) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-crema/40">
                        <td className="py-2.5 font-bold text-chocolate-900">{item.producto_nombre}</td>
                        <td className="py-2.5 text-center font-semibold">{item.cantidad_inicial}</td>
                        <td className="py-2.5 text-center font-bold text-emerald-700">{item.cantidad_vendida}</td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.cantidad_degustacion || 0}
                            onChange={(e) => handleActualizarDegustacion(item.id, Number(e.target.value))}
                            className="w-14 text-center border border-trigo-200 rounded-lg p-1 bg-canvas font-bold text-amber-800"
                          />
                        </td>
                        <td className="py-2.5 text-center font-semibold text-chocolate-600">{item.cantidad_sobrante}</td>
                        <td className="py-2.5 text-right font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pct}% vendido
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Sub-Pestaña: Arqueo de Caja & Cierre */}
      {activeBazaar && currentSubTab === 'arqueo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-trigo-100">
              <h2 className="text-base font-serif font-bold text-chocolate-900">
                Arqueo de Caja & Conciliación
              </h2>
              <span className="text-xs font-bold text-chocolate-600">
                {activeBazaar.nombre}
              </span>
            </div>

            {/* Desglose de Caja */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-dashed border-trigo-200">
                <span className="text-chocolate-600">Fondo Inicial de Caja (Cambio):</span>
                <span className="font-bold text-chocolate-900">{formatCurrency(activeBazaar.fondo_caja_inicial)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-trigo-200 text-emerald-700">
                <span>(+) Ventas Cobradas en Efectivo:</span>
                <span className="font-bold">{formatCurrency(metricas.ventasEfectivo)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-trigo-200 text-red-600">
                <span>(-) Gastos Pagados con Efectivo de Caja:</span>
                <span className="font-bold">-{formatCurrency(metricas.gastosEfectivo)}</span>
              </div>
              <div className="flex justify-between py-2.5 bg-canvas p-3 rounded-2xl border border-trigo-200 font-bold text-sm">
                <span className="text-chocolate-900">Total Efectivo Físico Esperado en Caja:</span>
                <span className="text-emerald-800 text-base">{formatCurrency(metricas.efectivoEsperadoCaja)}</span>
              </div>
            </div>

            {/* Comparación con Efectivo Contado */}
            <div className="p-4 bg-crema/60 rounded-2xl border border-trigo-200 space-y-3">
              <label className="text-xs font-bold text-chocolate-800 block">
                Ingresa el Efectivo Físico Contado al Cerrar el Bazar:
              </label>
              <input
                type="number"
                placeholder="RD$ contado en la caja física..."
                value={efectivoContadoFisico}
                onChange={(e) => setEfectivoContadoFisico(e.target.value)}
                className="w-full text-base font-bold border border-trigo-300 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-frambuesa-400"
              />

              {efectivoContadoFisico && (
                <div className="text-xs font-bold pt-1">
                  {(() => {
                    const diff = Number(efectivoContadoFisico) - metricas.efectivoEsperadoCaja;
                    if (Math.abs(diff) < 1) {
                      return (
                        <p className="text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          ¡Caja Cuadrada Exacta! No hay sobrante ni faltante.
                        </p>
                      );
                    }
                    if (diff > 0) {
                      return (
                        <p className="text-blue-700">
                          Sobrante de caja: +{formatCurrency(diff)}
                        </p>
                      );
                    }
                    return (
                      <p className="text-red-700">
                        Faltante de caja: {formatCurrency(diff)}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Botón Finalizar Bazar */}
            {activeBazaar.estado === 'activo' && (
              <div className="space-y-2 pt-2">
                <textarea
                  placeholder="Notas de cierre (ej: excelente flujo de clientes, se agotaron los tres leches a las 4pm)..."
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  className="w-full text-xs border border-trigo-200 rounded-xl p-3 bg-canvas"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => finalizarBazaar(activeBazaar.id, notasCierre)}
                  className="w-full py-2.5 px-4 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold text-xs transition-colors"
                >
                  Finalizar Bazar Oficialmente
                </button>
              </div>
            )}
          </div>

          {/* Tarjeta de Importación a Contabilidad General */}
          <div className="lg:col-span-5 bg-gradient-to-br from-white to-frambuesa-50/40 rounded-3xl p-5 sm:p-6 border border-frambuesa-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-frambuesa-800">
              <UploadCloud className="w-5 h-5 text-frambuesa-600" />
              <h3 className="font-serif font-bold text-sm">
                Importar a Contabilidad General
              </h3>
            </div>
            <p className="text-xs text-chocolate-600 leading-relaxed">
              Al hacer clic en este botón, todos los ingresos y ventas consolidadas del bazar{' '}
              <span className="font-bold text-chocolate-900">"{activeBazaar.nombre}"</span> se transferirán de
              forma automática a la contabilidad general de Delicias del Valle, registrando una orden pagada y oficial.
            </p>

            <div className="p-3 bg-white rounded-2xl border border-frambuesa-100 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-chocolate-700">
                <span>Ingresos Brutos a Importar:</span>
                <span className="font-bold text-chocolate-900">{formatCurrency(metricas.totalVentas)}</span>
              </div>
              <div className="flex justify-between font-semibold text-chocolate-700">
                <span>Gastos Deducidos del Evento:</span>
                <span className="font-bold text-red-600">-{formatCurrency(metricas.totalGastos)}</span>
              </div>
              <div className="flex justify-between font-bold text-frambuesa-800 pt-1 border-t border-trigo-100">
                <span>Ganancia Neta Reportada:</span>
                <span>{formatCurrency(metricas.gananciaNeta)}</span>
              </div>
            </div>

            {activeBazaar.importado_a_central ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Este evento ya fue importado a la contabilidad central el{' '}
                  {formatDate(activeBazaar.fecha_importado || activeBazaar.updated_at)}.
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => importarBazaarAContabilidadGeneral(activeBazaar.id)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-frambuesa-600 to-rose-700 hover:from-frambuesa-700 hover:to-rose-800 text-white text-xs font-extrabold shadow-md shadow-frambuesa-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>IMPORTAR DATOS A CONTABILIDAD GENERAL</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. Sub-Pestaña: Historial de Bazares */}
      {currentSubTab === 'historial' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-chocolate-900">
                Historial de Bazares Asistidos
              </h2>
              <p className="text-xs text-chocolate-500">
                Registro histórico de eventos, recaudación total y márgenes
              </p>
            </div>
            <span className="text-xs font-bold text-chocolate-600">
              {bazaarEvents.length} eventos registrados
            </span>
          </div>

          <div className="divide-y divide-trigo-100">
            {bazaarEvents.length === 0 ? (
              <p className="text-xs text-chocolate-400 py-8 text-center">
                No hay historial de bazares aún.
              </p>
            ) : (
              bazaarEvents.map((b) => {
                const ventasTot = b.ventas.reduce((acc, v) => acc + v.total, 0);
                const gastosTot = b.gastos.reduce((acc, g) => acc + g.monto, 0);
                const ganancia = ventasTot - gastosTot;

                return (
                  <div
                    key={b.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-crema/20 rounded-xl px-2 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-chocolate-900">
                          {b.nombre}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                            b.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {b.estado === 'activo' ? 'En Curso' : 'Finalizado'}
                        </span>
                        {b.importado_a_central && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                            ✓ Importado
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-chocolate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-chocolate-700">
                          {formatBazaarDateRange(b.fecha, b.fecha_fin)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {getBazaarDurationDays(b.fecha, b.fecha_fin)}{' '}
                          {getBazaarDurationDays(b.fecha, b.fecha_fin) === 1 ? 'día' : 'días'}
                        </span>
                        <span>• {b.ubicacion || 'Sin ubicación registrada'}</span>
                        <span>• {b.ventas.length} tickets</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-chocolate-400 block">Ganancia Neta</span>
                        <span className="font-bold text-emerald-700 text-sm">{formatCurrency(ganancia)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBazaarId(b.id);
                            setCurrentSubTab('pos');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold text-xs"
                        >
                          Ver / Operar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarBazaarEvent(b.id)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50"
                          title="Eliminar historial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Bazar */}
      <Modal
        isOpen={isNewBazaarModalOpen}
        onClose={() => setIsNewBazaarModalOpen(false)}
        title="Iniciar Nuevo Bazar o Evento Pop-Up"
        maxWidth="lg"
      >
        <form onSubmit={handleCrearNuevoBazaar} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-chocolate-700 block mb-1">
              Nombre del Evento o Bazar *
            </label>
            <input
              type="text"
              placeholder="Ej: Bazar Primavera Agora Mall, Mercadito Gourmet..."
              value={newBazaarNombre}
              onChange={(e) => setNewBazaarNombre(e.target.value)}
              className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-chocolate-700 block mb-1">
                Fecha de Inicio del Evento *
              </label>
              <input
                type="date"
                value={newBazaarFecha}
                onChange={(e) => {
                  const nuevaFechaInicio = e.target.value;
                  setNewBazaarFecha(nuevaFechaInicio);
                  if (newBazaarFechaFin < nuevaFechaInicio) {
                    setNewBazaarFechaFin(nuevaFechaInicio);
                  }
                }}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-chocolate-700 flex items-center justify-between mb-1">
                <span>Fecha Final del Evento *</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-frambuesa-50 text-frambuesa-700 border border-frambuesa-200">
                  {getBazaarDurationDays(newBazaarFecha, newBazaarFechaFin)}{' '}
                  {getBazaarDurationDays(newBazaarFecha, newBazaarFechaFin) === 1 ? 'día' : 'días'}
                </span>
              </label>
              <input
                type="date"
                min={newBazaarFecha}
                value={newBazaarFechaFin}
                onChange={(e) => setNewBazaarFechaFin(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-chocolate-700 block mb-1">
                Fondo Inicial de Caja (RD$) *
              </label>
              <input
                type="number"
                placeholder="2000"
                value={newBazaarFondo}
                onChange={(e) => setNewBazaarFondo(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-chocolate-700 block mb-1">
                Ubicación / Plaza (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Ágora Mall, Nivel 1, Santo Domingo"
                value={newBazaarUbicacion}
                onChange={(e) => setNewBazaarUbicacion(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-chocolate-700 block mb-1">
              Notas Adicionales
            </label>
            <textarea
              placeholder="Detalles sobre stand, horario de montaje, etc..."
              value={newBazaarNotas}
              onChange={(e) => setNewBazaarNotas(e.target.value)}
              className="w-full border border-trigo-200 rounded-xl p-3 bg-canvas"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewBazaarModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold shadow-sm"
            >
              Iniciar Bazar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
