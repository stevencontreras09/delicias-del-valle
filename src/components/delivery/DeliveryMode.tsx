import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pedido, EstadoPedido } from '../../types';
import {
  Truck,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Snowflake,
  Car,
  User,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDisplayTamano } from '../../utils/formatters';
import { getGoogleMapsUrl, getWazeUrl, generateClientDeliveryNotificationUrl } from '../../utils/deliveryHelper';
import { CakeCareCard } from './CakeCareCard';
import { LocationGoogleMapsModal } from '../quotes/LocationGoogleMapsModal';
import confetti from 'canvas-confetti';

type FilterType = 'pendientes' | 'en_camino' | 'entregados' | 'todos';

export const DeliveryMode: React.FC = () => {
  const { pedidos, zonasDelivery, currentUser, showToast, syncFromSupabase, isSyncing } = useApp();

  const [filter, setFilter] = useState<FilterType>('pendientes');
  const [onlyMine, setOnlyMine] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [careModalPedido, setCareModalPedido] = useState<Pedido | null>(null);
  const [cobroModalPedido, setCobroModalPedido] = useState<Pedido | null>(null);
  const [mapModalPedido, setMapModalPedido] = useState<Pedido | null>(null);

  // Registro local de pedidos que el chofer marcó como "En camino"
  const [enRutaIds, setEnRutaIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('delicias_delivery_en_ruta');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('delicias_delivery_en_ruta', JSON.stringify(enRutaIds));
  }, [enRutaIds]);

  // Lista base de pedidos con despacho o entrega a domicilio
  const deliveryPedidos = useMemo(() => {
    return pedidos.list.filter((p) => {
      const isDeliveryType =
        p.tipo_despacho === 'delivery' ||
        p.tipo_entrega === 'domicilio' ||
        Boolean(p.direccion_entrega && p.direccion_entrega.trim().length > 3);
      const notCancelled = p.estado !== 'cancelado';
      return isDeliveryType && notCancelled;
    });
  }, [pedidos.list]);

  // Filtrado por chofer asignado y búsqueda
  const filteredList = useMemo(() => {
    let list = deliveryPedidos;

    // Filtro por chofer si aplica
    if (onlyMine && currentUser?.nombre_completo) {
      const driverName = currentUser.nombre_completo.toLowerCase();
      const driverUser = currentUser.username.toLowerCase();
      const hasMine = list.some(
        (p) =>
          (p.repartidor_nombre && p.repartidor_nombre.toLowerCase().includes(driverName)) ||
          (p.repartidor_nombre && p.repartidor_nombre.toLowerCase().includes(driverUser))
      );
      // Solo filtrar estrictamente si hay al menos uno asignado a este chofer; si no, mostrar todos
      if (hasMine) {
        list = list.filter(
          (p) =>
            (p.repartidor_nombre && p.repartidor_nombre.toLowerCase().includes(driverName)) ||
            (p.repartidor_nombre && p.repartidor_nombre.toLowerCase().includes(driverUser))
        );
      }
    }

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.numero_factura.toLowerCase().includes(q) ||
          p.cliente_nombre.toLowerCase().includes(q) ||
          p.cliente_telefono.includes(q) ||
          (p.direccion_entrega && p.direccion_entrega.toLowerCase().includes(q)) ||
          (p.punto_referencia && p.punto_referencia.toLowerCase().includes(q))
      );
    }

    // Filtro por estado
    switch (filter) {
      case 'pendientes':
        return list.filter((p) => p.estado !== 'entregado' && !enRutaIds.includes(p.id));
      case 'en_camino':
        return list.filter((p) => p.estado !== 'entregado' && enRutaIds.includes(p.id));
      case 'entregados':
        return list.filter((p) => p.estado === 'entregado');
      case 'todos':
      default:
        return list;
    }
  }, [deliveryPedidos, onlyMine, currentUser, searchTerm, filter, enRutaIds]);

  // Contadores para chips superiores
  const counts = useMemo(() => {
    const pendientes = deliveryPedidos.filter((p) => p.estado !== 'entregado' && !enRutaIds.includes(p.id)).length;
    const enCamino = deliveryPedidos.filter((p) => p.estado !== 'entregado' && enRutaIds.includes(p.id)).length;
    const entregados = deliveryPedidos.filter((p) => p.estado === 'entregado').length;
    return { pendientes, enCamino, entregados, total: deliveryPedidos.length };
  }, [deliveryPedidos, enRutaIds]);

  // Manejador para marcar "Salir a Entregar"
  const handleIniciarRuta = (pedido: Pedido) => {
    if (!enRutaIds.includes(pedido.id)) {
      setEnRutaIds((prev) => [...prev, pedido.id]);
    }
    // Si el pedido no estaba en listo, actualizar estado a listo para que cocina sepa que salió
    if (pedido.estado === 'confirmado' || pedido.estado === 'en_produccion') {
      pedidos.cambiarEstadoPedido(pedido.id, 'listo');
    }
    showToast('info', '¡Ruta Iniciada!', `Vas en camino a entregar el pedido #${pedido.numero_factura}.`);
  };

  // Manejador para completar la entrega
  const handleConfirmarEntrega = (pedido: Pedido) => {
    const flete = Number(pedido.costo_delivery ?? pedido.costo_envio ?? 0);
    const saldo = Number(pedido.saldo_pendiente ?? 0);
    const totalCobro = saldo + (pedido.cobro_delivery_al_recibir ? flete : 0);

    if (totalCobro > 0) {
      setCobroModalPedido(pedido);
    } else {
      finalizarEntrega(pedido.id);
    }
  };

  const finalizarEntrega = (pedidoId: number) => {
    pedidos.cambiarEstadoPedido(pedidoId, 'entregado');
    setEnRutaIds((prev) => prev.filter((id) => id !== pedidoId));
    setCobroModalPedido(null);
    showToast('success', '¡Entrega Completada!', 'El pedido fue marcado como entregado exitosamente.');
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {}
  };

  const finalizarEntregaConCobro = (pedido: Pedido) => {
    const flete = Number(pedido.costo_delivery ?? pedido.costo_envio ?? 0);
    const saldo = Number(pedido.saldo_pendiente ?? 0);
    const totalCobro = saldo + (pedido.cobro_delivery_al_recibir ? flete : 0);

    if (saldo > 0) {
      pedidos.registrarPago(
        pedido.id,
        saldo,
        'efectivo',
        `Cobro en efectivo contra entrega por repartidor (${currentUser?.nombre_completo || 'Delivery'})`,
        'saldo_50',
        'Efectivo'
      );
    }

    finalizarEntrega(pedido.id);
    showToast('success', '¡Cobro y Entrega Registrados!', `Se registró el cobro de ${formatCurrency(totalCobro)} en efectivo.`);
  };

  const handleReabrir = (pedidoId: number) => {
    pedidos.cambiarEstadoPedido(pedidoId, 'listo');
    setEnRutaIds((prev) => [...prev, pedidoId]);
    showToast('info', 'Pedido Reabierto', 'El estado volvió a pendiente de entrega.');
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 select-none">
      {/* 1. Barra Superior del Chofer */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-trigo-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-trigo-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-frambuesa-600 text-white flex items-center justify-center shadow-warm shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-chocolate-900 tracking-tight font-serif">
                  Modo Delivery
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  En Servicio
                </span>
              </div>
              <p className="text-xs text-chocolate-600 font-medium">
                Chofer: <strong className="text-chocolate-900">{currentUser?.nombre_completo || currentUser?.username || 'Repartidor'}</strong>
              </p>
            </div>
          </div>

          {/* Toggle Mis Asignados vs Todos */}
          <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-canvas p-1 rounded-2xl border border-trigo-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setOnlyMine(true)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl transition-all ${
                onlyMine ? 'bg-chocolate-700 text-white shadow-sm' : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              Mis Envíos
            </button>
            <button
              type="button"
              onClick={() => setOnlyMine(false)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl transition-all ${
                !onlyMine ? 'bg-chocolate-700 text-white shadow-sm' : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => {
                syncFromSupabase(false);
                showToast('info', 'Sincronizando', 'Actualizando entregas desde la nube...');
              }}
              disabled={isSyncing}
              className="p-1.5 rounded-xl border border-trigo-200 hover:bg-stone-100 text-chocolate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Refrescar y sincronizar entregas"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-chocolate-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline text-[11px] font-bold">Refrescar</span>
            </button>
          </div>
        </div>

        {/* Banner de Cuidados Rápidos durante Conducción */}
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 rounded-xl bg-amber-200/80 text-amber-800 shrink-0">
              <Snowflake className="w-4 h-4 animate-spin-slow" />
            </div>
            <p className="text-[11px] sm:text-xs font-medium truncate">
              <strong>Recordatorio:</strong> A/C encendido • Pastel en piso copiloto • No frenar brusco.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCareModalPedido(deliveryPedidos[0] || null)}
            className="shrink-0 px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Guía de Cuidados</span>
            <span className="sm:hidden">Cuidados</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="mt-3 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-chocolate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, factura o dirección..."
            className="w-full pl-10 pr-10 py-2.5 bg-canvas rounded-2xl border border-trigo-200 text-xs sm:text-sm text-chocolate-900 placeholder:text-chocolate-400 focus:outline-none focus:ring-2 focus:ring-frambuesa-500 font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-chocolate-400 hover:text-chocolate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Chips / Filtros Táctiles Grandes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setFilter('pendientes')}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            filter === 'pendientes'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
              : 'bg-white text-chocolate-800 border-trigo-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-xl font-black">{counts.pendientes}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Por Entregar
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('en_camino')}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            filter === 'en_camino'
              ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300'
              : 'bg-white text-chocolate-800 border-trigo-200 hover:bg-sky-50/50'
          }`}
        >
          <span className="text-xl font-black">{counts.enCamino}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3 h-3" /> En Camino
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('entregados')}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            filter === 'entregados'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
              : 'bg-white text-chocolate-800 border-trigo-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-xl font-black">{counts.entregados}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Entregados
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('todos')}
          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            filter === 'todos'
              ? 'bg-chocolate-700 text-white border-chocolate-800 shadow-md ring-2 ring-chocolate-300'
              : 'bg-white text-chocolate-800 border-trigo-200 hover:bg-crema'
          }`}
        >
          <span className="text-xl font-black">{counts.total}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider">Todos</span>
        </button>
      </div>

      {/* 3. Lista de Tarjetas de Entrega (Mobile-First) */}
      <div className="space-y-3.5">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-trigo-200 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-chocolate-900 mb-1">
              {filter === 'pendientes'
                ? '¡Excelente trabajo! No hay entregas pendientes.'
                : filter === 'en_camino'
                ? 'No tienes ningún pedido marcado en camino actualmente.'
                : 'No se encontraron entregas con los filtros aplicados.'}
            </h3>
            <p className="text-xs text-chocolate-600 max-w-sm mx-auto mb-4">
              Revisa los demás filtros o actualiza la lista para ver nuevos despachos generados por el taller.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('todos');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold rounded-xl shadow-warm transition-all"
            >
              Ver Todas las Entregas
            </button>
          </div>
        ) : (
          filteredList.map((p) => {
            const isEnRuta = enRutaIds.includes(p.id) && p.estado !== 'entregado';
            const isEntregado = p.estado === 'entregado';
            const flete = Number(p.costo_delivery ?? p.costo_envio ?? 0);
            const saldo = Number(p.saldo_pendiente ?? 0);
            const fleteAlRecibir = Boolean(p.cobro_delivery_al_recibir);
            const totalACobrar = saldo + (fleteAlRecibir ? flete : 0);

            const mapsUrl =
              p.maps_url && (p.maps_url.startsWith('http://') || p.maps_url.startsWith('https://'))
                ? p.maps_url
                : getGoogleMapsUrl(p.direccion_entrega || '', p.punto_referencia, p.maps_url);

            let wazeUrl = getWazeUrl(p.direccion_entrega || '');
            if (p.maps_url) {
              const coordsMatch =
                p.maps_url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                p.maps_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
              if (coordsMatch) {
                wazeUrl = `https://waze.com/ul?ll=${coordsMatch[1]},${coordsMatch[2]}&navigate=yes`;
              }
            }
            const clientNotifyWaUrl = generateClientDeliveryNotificationUrl(p);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border-2 transition-all shadow-sm overflow-hidden ${
                  isEnRuta
                    ? 'border-sky-500 ring-2 ring-sky-200 shadow-md'
                    : isEntregado
                    ? 'border-emerald-200 bg-stone-50/50 opacity-90'
                    : 'border-trigo-200 hover:border-frambuesa-400'
                }`}
              >
                {/* Encabezado de la Tarjeta */}
                <div
                  className={`px-4 py-2.5 flex items-center justify-between gap-2 border-b ${
                    isEnRuta
                      ? 'bg-sky-600 text-white border-sky-700'
                      : isEntregado
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-crema/80 text-chocolate-900 border-trigo-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm sm:text-base">
                      #{p.numero_factura}
                    </span>
                    {isEnRuta && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-sky-800 shadow-sm animate-pulse">
                        <Truck className="w-3 h-3" /> En Camino
                      </span>
                    )}
                    {isEntregado && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                        <Check className="w-3 h-3" /> Entregado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {formatDate(p.fecha_entrega)} • {p.hora_entrega || 'Hora convenida'}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Cliente y Botones Gigantes de Contacto */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-chocolate-500 block">
                        Cliente
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-chocolate-900 font-serif leading-tight">
                        {p.cliente_nombre}
                      </h2>
                      <p className="text-xs text-chocolate-600 font-medium">
                        Tel: <span className="font-mono font-bold text-chocolate-900">{p.cliente_telefono}</span>
                      </p>
                    </div>

                    {/* Botones de Contacto Rápido */}
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                      <a
                        href={`tel:${p.cliente_telefono.replace(/\D/g, '')}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-warm active:scale-95 transition-all text-center"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Llamar</span>
                      </a>

                      <a
                        href={clientNotifyWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-black shadow-warm active:scale-95 transition-all text-center"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Avisar WA</span>
                      </a>
                    </div>
                  </div>

                  {/* Cuadro de Dirección & Referencia (Alta Visibilidad Nocturna y Diurna) */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2.5 shadow-inner">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Dirección de Entrega
                          </span>
                          <p className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                            {p.direccion_entrega || 'Dirección acordada por teléfono'}
                          </p>
                        </div>
                      </div>

                      {/* Botón para ver/ajustar mapa interactivo directamente */}
                      <button
                        type="button"
                        onClick={() => setMapModalPedido(p)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                        title="Ver mapa interactivo o ajustar ubicación de entrega"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Ver Mapa</span>
                      </button>
                    </div>

                    {p.punto_referencia && (
                      <div className="pt-2 border-t border-slate-800 flex items-start gap-2">
                        <span className="text-xs font-black text-amber-400 shrink-0">📌 Ref:</span>
                        <p className="text-xs sm:text-sm font-bold text-amber-300">
                          {p.punto_referencia}
                        </p>
                      </div>
                    )}

                    {p.zona_delivery_id && (
                      <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Zona:</span>
                        <span className="text-slate-200 font-semibold">
                          {zonasDelivery.find((z) => z.id === p.zona_delivery_id)?.nombre || 'Zona asignada'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BOTONES DE NAVEGACIÓN GPS DIRECTA DE 1 SOLO TOQUE */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-chocolate-500 tracking-wider block">
                      Navegación GPS Directa
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md transition-all text-center"
                      >
                        <Navigation className="w-4 h-4 shrink-0" />
                        <span>Google Maps</span>
                      </a>

                      <a
                        href={wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs sm:text-sm font-black shadow-md transition-all text-center"
                      >
                        <Navigation className="w-4 h-4 shrink-0" />
                        <span>Abrir en Waze</span>
                      </a>
                    </div>
                  </div>

                  {/* COBRO EN DESTINO: Alerta Financiera para el Chofer */}
                  <div className="pt-1">
                    {totalACobrar > 0 ? (
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs uppercase tracking-wider">
                            <DollarSign className="w-4 h-4 text-amber-700" />
                            <span>Cobrar en Destino:</span>
                          </div>
                          <div className="text-right">
                            <span className="text-base sm:text-xl font-black text-frambuesa-700">
                              {formatCurrency(totalACobrar)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-amber-200/80 grid grid-cols-2 text-[11px] text-amber-900">
                          <div>
                            Saldo pastel: <strong>{formatCurrency(saldo)}</strong>
                          </div>
                          <div className="text-right">
                            Flete chofer:{' '}
                            <strong>
                              {fleteAlRecibir ? `${formatCurrency(flete)} (Efectivo)` : 'Prepagado'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>¡PEDIDO PAGADO AL 100%! No cobrar dinero al cliente.</span>
                      </div>
                    )}
                  </div>

                  {/* Resumen de Productos / Cajas a transportar */}
                  <div className="bg-canvas p-3 rounded-2xl border border-trigo-200 text-xs text-chocolate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-chocolate-500 block">
                      Contenido a Entregar ({p.items.length} {p.items.length === 1 ? 'producto' : 'productos'})
                    </span>
                    {p.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>
                          • {it.cantidad}x <strong>{it.receta_nombre}</strong> ({formatDisplayTamano(it.tamano_porciones)})
                        </span>
                      </div>
                    ))}
                    {p.items.some((i) => i.dedicatoria) && (
                      <p className="text-[11px] text-frambuesa-700 italic pt-1">
                        Dedicatoria: "{p.items.find((i) => i.dedicatoria)?.dedicatoria}"
                      </p>
                    )}
                  </div>

                  {/* BOTONES DE ACCIÓN RÁPIDA DE 1 TOQUE */}
                  <div className="pt-2">
                    {!isEntregado ? (
                      <div className="space-y-2">
                        {!isEnRuta && (
                          <button
                            type="button"
                            onClick={() => handleIniciarRuta(p)}
                            className="w-full py-3.5 px-4 rounded-2xl bg-chocolate-700 hover:bg-chocolate-800 active:scale-95 text-white font-black text-sm shadow-warm flex items-center justify-center gap-2 transition-all"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Iniciar Reparto (Marcar En Camino)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleConfirmarEntrega(p)}
                          className={`w-full py-4 px-4 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isEnRuta
                              ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                              : 'bg-emerald-700 hover:bg-emerald-800'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>
                            {totalACobrar > 0
                              ? `✅ Marcar Entregado & Cobrar ${formatCurrency(totalACobrar)}`
                              : '✅ Marcar como Entregado'}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
                        <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Entregado con éxito
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReabrir(p.id)}
                          className="text-[11px] text-chocolate-600 hover:text-chocolate-900 underline font-semibold px-2 py-1"
                        >
                          Reabrir por error
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Confirmación de Cobro en Efectivo */}
      {cobroModalPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border-2 border-amber-300 space-y-4 animate-scale-in">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-chocolate-900 font-serif">
                Confirmar Cobro en Destino
              </h3>
              <p className="text-xs text-chocolate-600 mt-0.5">
                Pedido #{cobroModalPedido.numero_factura} • {cobroModalPedido.cliente_nombre}
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
              <span className="text-xs uppercase font-bold text-amber-800 block">
                Total a recibir del cliente
              </span>
              <span className="text-2xl font-black text-frambuesa-700 block mt-1">
                {formatCurrency(
                  Number(cobroModalPedido.saldo_pendiente ?? 0) +
                    (cobroModalPedido.cobro_delivery_al_recibir
                      ? Number(cobroModalPedido.costo_delivery ?? cobroModalPedido.costo_envio ?? 0)
                      : 0)
                )}
              </span>
              <p className="text-[11px] text-amber-700 mt-1">
                ¿El cliente te entregó el dinero en efectivo?
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => finalizarEntregaConCobro(cobroModalPedido)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-warm flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Sí, Cobro Recibido y Entregado</span>
              </button>

              <button
                type="button"
                onClick={() => finalizarEntrega(cobroModalPedido.id)}
                className="w-full py-2.5 px-4 rounded-2xl bg-canvas hover:bg-crema text-chocolate-700 font-bold text-xs border border-trigo-200 transition-all text-center"
              >
                Entregado sin Cobro (Ya pagado o transferido)
              </button>

              <button
                type="button"
                onClick={() => setCobroModalPedido(null)}
                className="w-full py-2 text-center text-xs text-chocolate-500 hover:text-chocolate-800 font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Guía de Cuidados del Pastel */}
      {careModalPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setCareModalPedido(null)}
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-white text-chocolate-700 shadow-md hover:bg-rose-50 hover:text-rose-600 border border-trigo-200"
            >
              <X className="w-4 h-4" />
            </button>
            <CakeCareCard
              pedidoId={careModalPedido.numero_factura}
              nombrePastel={careModalPedido.items[0]?.receta_nombre || 'Pastel Artesanal'}
              clienteNombre={careModalPedido.cliente_nombre}
              fechaEntrega={careModalPedido.fecha_entrega}
              onClose={() => setCareModalPedido(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL: Vista Previa y Corrección de Ubicación en Tiempo Real */}
      {mapModalPedido && (
        <LocationGoogleMapsModal
          isOpen={Boolean(mapModalPedido)}
          onClose={() => setMapModalPedido(null)}
          direccion={mapModalPedido.direccion_entrega || ''}
          puntoReferencia={mapModalPedido.punto_referencia}
          mapsUrl={mapModalPedido.maps_url}
          zonaNombre={zonasDelivery.find((z) => z.id === mapModalPedido.zona_delivery_id)?.nombre}
          clienteNombre={mapModalPedido.cliente_nombre}
          onSave={(data) => {
            pedidos.updatePedido(mapModalPedido.id, {
              direccion_entrega: data.direccion,
              punto_referencia: data.punto_referencia,
              maps_url: data.mapsUrl,
            });
            setMapModalPedido(null);
            showToast('success', 'Ubicación Actualizada', 'La ubicación del pedido fue actualizada y guardada con éxito.');
          }}
        />
      )}
    </div>
  );
};
