import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cotizacion,
  CotizacionItem,
  EstadoCotizacion,
  CatalogOrderRequest,
} from '../../types';
import {
  Plus,
  Search,
  FileText,
  MessageCircle,
  Calendar,
  Phone,
  Trash2,
  Edit2,
  ArrowRight,
  ShoppingBag,
  Store,
  Bell,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDisplayTamano } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { QuoteBuilderModal } from './QuoteBuilderModal';
import { QuoteDetailModal } from './QuoteDetailModal';
import { generarPdfCotizacion } from '../../utils/pdfGenerator';
import { generarMensajeCotizacionWhatsApp } from '../../utils/whatsappShare';
import {
  fetchCatalogOrdersFromSupabase,
  syncCatalogOrdersToSupabase,
} from '../../services/supabaseService';
import { calcularCostosReceta } from '../../utils/calculations';
import { sanitizeDominicanPhone } from '../../utils/whatsappHelper';

// Determina si una cotización provino del Catálogo Público Interactivo
export function isCatalogOriginQuote(cot: Cotizacion): boolean {
  const desc = (cot.descripcion || '').toLowerCase();
  const notas = (cot.notas || '').toLowerCase();
  return (
    desc.includes('solicitud catálogo') ||
    desc.includes('catálogo #cat-') ||
    notas.includes('catálogo interactivo') ||
    notas.includes('#cat-')
  );
}

export const QuoteManager: React.FC = () => {
  const {
    cotizaciones,
    addCotizacion,
    updateCotizacion,
    deleteCotizacion,
    convertirCotizacionAPedido,
    recetas,
    insumosMap,
    showToast,
    setActiveTab,
  } = useApp();

  // Separación clara entre:
  // 1) 'taller': Cotizaciones creadas internamente en el taller
  // 2) 'ordenes_catalogo': Órdenes por confirmar enviadas por clientes desde el catálogo sin precios
  // 3) 'cotizaciones_catalogo': Cotizaciones ya generadas a partir del catálogo
  const [originTab, setOriginTab] = useState<'taller' | 'ordenes_catalogo' | 'cotizaciones_catalogo'>('taller');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoCotizacion>('all');

  // Solicitudes entrantes del catálogo público
  const [catalogOrders, setCatalogOrders] = useState<CatalogOrderRequest[]>([]);
  const [isLoadingCatalogOrders, setIsLoadingCatalogOrders] = useState(false);

  // Modales
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [editingCotizacion, setEditingCotizacion] = useState<Cotizacion | null>(null);

  const loadCatalogOrders = async () => {
    setIsLoadingCatalogOrders(true);
    try {
      const orders = await fetchCatalogOrdersFromSupabase();
      setCatalogOrders(orders || []);
    } finally {
      setIsLoadingCatalogOrders(false);
    }
  };

  useEffect(() => {
    loadCatalogOrders();
  }, []);

  const tallerQuotes = useMemo(
    () => cotizaciones.filter((c) => !isCatalogOriginQuote(c)),
    [cotizaciones]
  );

  const catalogQuotes = useMemo(
    () => cotizaciones.filter((c) => isCatalogOriginQuote(c)),
    [cotizaciones]
  );

  const pendingCatalogRequestsCount = useMemo(
    () => catalogOrders.filter((o) => o.estado === 'pendiente').length,
    [catalogOrders]
  );

  const activeQuotesList = originTab === 'cotizaciones_catalogo' ? catalogQuotes : tallerQuotes;

  const filteredCotizaciones = useMemo(() => {
    return activeQuotesList.filter((c) => {
      const matchesSearch =
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente_telefono.includes(searchTerm) ||
        c.items.some((i) => i.receta_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || c.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeQuotesList, searchTerm, statusFilter]);

  const buildQuoteItemsFromCatalogRequest = (req: CatalogOrderRequest): CotizacionItem[] => {
    return req.items.map((sel, idx) => {
      const matchedReceta =
        (sel.receta_id ? recetas.find((r) => r.id === sel.receta_id) : undefined) ||
        recetas.find(
          (r) => r.nombre.trim().toLowerCase() === sel.producto_nombre.trim().toLowerCase()
        );

      let unitPrice = 1200;
      if (matchedReceta) {
        const costos = calcularCostosReceta(matchedReceta, insumosMap);
        unitPrice = Math.round(
          costos.precio_sugerido_margen_venta || costos.precio_sugerido_venta || 1200
        );
      }

      return {
        id: `item-cat-${Date.now()}-${idx}`,
        receta_id: matchedReceta?.id,
        receta_nombre: sel.producto_nombre,
        tamano_porciones: sel.tamano_porciones,
        masa_base: sel.masa_base,
        relleno: sel.relleno,
        decoracion: sel.decoracion,
        empaque: 'Estándar de la Receta',
        dedicatoria: sel.dedicatoria || '',
        extras: sel.notas_personalizacion
          ? [{ id: `nota-${idx}`, nombre: `Personalización: ${sel.notas_personalizacion}`, precio: 0 }]
          : [],
        cantidad: sel.cantidad,
        precio_unitario: unitPrice,
        subtotal: unitPrice * sel.cantidad,
        factor_receta: 1,
      };
    });
  };

  // Opción 1: Asignar precios en Cotización (separada en la pestaña de Cotizaciones del Catálogo) y abrir el editor
  const handlePriceCatalogRequest = async (req: CatalogOrderRequest) => {
    const quoteItems = buildQuoteItemsFromCatalogRequest(req);
    const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);

    const createdQuote = await addCotizacion({
      descripcion: `Solicitud Catálogo #${req.folio}`,
      cliente_nombre: req.cliente_nombre,
      cliente_telefono: req.cliente_telefono,
      cliente_email: req.cliente_email,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_evento: req.fecha_entrega_deseada,
      validez_dias: 7,
      items: quoteItems,
      subtotal,
      descuento: 0,
      costo_envio: 0,
      total: subtotal,
      notas:
        req.notas_generales ||
        `Pedido configurado por el cliente desde el Catálogo Interactivo (#${req.folio}).`,
      estado: 'pendiente',
      tipo_despacho: req.tipo_despacho,
      direccion_entrega: req.direccion_entrega,
      punto_referencia: req.punto_referencia,
      maps_url: req.maps_url,
    });

    if (createdQuote) {
      const updatedOrders = catalogOrders.map((o) =>
        o.id === req.id ? { ...o, estado: 'cotizado' as const, cotizacion_id: createdQuote.id } : o
      );
      setCatalogOrders(updatedOrders);
      await syncCatalogOrdersToSupabase(updatedOrders);
      setOriginTab('cotizaciones_catalogo');
      setEditingCotizacion(createdQuote);
      setIsBuilderOpen(true);
      showToast(
        'success',
        'Cotización del Catálogo Lista',
        `Ajusta el precio final de ${req.cliente_nombre} y envíale la cotización.`
      );
    }
  };

  // Opción 2: Confirmar directamente como Pedido en Producción / Confirmados
  const handleConfirmCatalogRequestToOrder = async (req: CatalogOrderRequest) => {
    const quoteItems = buildQuoteItemsFromCatalogRequest(req);
    const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);

    const createdQuote = await addCotizacion({
      descripcion: `Solicitud Catálogo #${req.folio}`,
      cliente_nombre: req.cliente_nombre,
      cliente_telefono: req.cliente_telefono,
      cliente_email: req.cliente_email,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_evento: req.fecha_entrega_deseada,
      validez_dias: 7,
      items: quoteItems,
      subtotal,
      descuento: 0,
      costo_envio: 0,
      total: subtotal,
      notas:
        req.notas_generales ||
        `Pedido configurado por el cliente desde el Catálogo Interactivo (#${req.folio}).`,
      estado: 'aprobada',
      tipo_despacho: req.tipo_despacho,
      direccion_entrega: req.direccion_entrega,
      punto_referencia: req.punto_referencia,
      maps_url: req.maps_url,
    });

    if (createdQuote) {
      const updatedOrders = catalogOrders.map((o) =>
        o.id === req.id ? { ...o, estado: 'cotizado' as const, cotizacion_id: createdQuote.id } : o
      );
      setCatalogOrders(updatedOrders);
      await syncCatalogOrdersToSupabase(updatedOrders);

      convertirCotizacionAPedido(
        createdQuote.id,
        0,
        req.fecha_entrega_deseada || new Date().toISOString().split('T')[0],
        req.hora_entrega_deseada || '14:00',
        req.tipo_despacho === 'delivery' ? 'domicilio' : 'recogida_local',
        req.direccion_entrega || '',
        {
          punto_referencia: req.punto_referencia,
          costo_delivery: 0,
        }
      );

      showToast(
        'success',
        'Orden Confirmada en Pedidos',
        `La solicitud #${req.folio} de ${req.cliente_nombre} pasó directamente a Pedidos Confirmados.`
      );
      setActiveTab('orders');
    }
  };

  const handleDeleteCatalogRequest = async (req: CatalogOrderRequest) => {
    if (!window.confirm(`¿Eliminar la orden por confirmar #${req.folio} de ${req.cliente_nombre}?`))
      return;
    const next = catalogOrders.filter((o) => o.id !== req.id);
    setCatalogOrders(next);
    await syncCatalogOrdersToSupabase(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Cotizaciones & Órdenes por Confirmar
            </h1>
            <span className="bg-crema text-chocolate-800 text-xs font-bold px-3 py-1 rounded-full border border-trigo-300">
              {tallerQuotes.length} Taller • {catalogQuotes.length} Catálogo
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Separación inteligente entre las cotizaciones creadas dentro del taller y las órdenes enviadas por los clientes desde el catálogo.
          </p>
        </div>

        <button
          onClick={() => {
            setOriginTab('taller');
            setEditingCotizacion(null);
            setIsBuilderOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold shadow-frambuesa-glow transition-all transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización de Taller</span>
        </button>
      </div>

      {/* Selector de Canal (Evita que se mezclen las cotizaciones del Taller con las del Catálogo) */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-trigo-200 shadow-xs">
        <button
          type="button"
          onClick={() => setOriginTab('taller')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            originTab === 'taller'
              ? 'bg-chocolate-900 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Cotizaciones del Taller ({tallerQuotes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setOriginTab('ordenes_catalogo');
            loadCatalogOrders();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            originTab === 'ordenes_catalogo'
              ? 'bg-frambuesa-600 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Órdenes por Confirmar de Clientes ({catalogOrders.length})</span>
          {pendingCatalogRequestsCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                originTab === 'ordenes_catalogo'
                  ? 'bg-white text-frambuesa-700'
                  : 'bg-frambuesa-600 text-white'
              }`}
            >
              {pendingCatalogRequestsCount} por confirmar
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setOriginTab('cotizaciones_catalogo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            originTab === 'cotizaciones_catalogo'
              ? 'bg-chocolate-900 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cotizaciones del Catálogo ({catalogQuotes.length})</span>
        </button>
      </div>

      {/* VISTA 1: BANDEJA DE ÓRDENES POR CONFIRMAR DE CLIENTES (ENVIADAS DESDE EL CATÁLOGO) */}
      {originTab === 'ordenes_catalogo' ? (
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div>
              <p className="font-bold text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-frambuesa-600" />
                <span>Bandeja de Órdenes por Confirmar (Recibidas desde el Catálogo Público)</span>
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Aquí llegan todas las órdenes que los clientes configuran a su gusto en el catálogo sin precios. Puedes asignarles precio en una cotización o confirmarlas directo a Producción/Pedidos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-crema text-chocolate-900 border border-amber-300 font-bold shrink-0"
            >
              Ir al Catálogo de Fotos
            </button>
          </div>

          {isLoadingCatalogOrders ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-trigo-200 text-xs text-chocolate-600">
              Cargando órdenes por confirmar de clientes...
            </div>
          ) : catalogOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-trigo-200 space-y-2">
              <ShoppingBag className="w-10 h-10 text-chocolate-300 mx-auto" />
              <p className="text-sm font-bold text-chocolate-900">
                No tienes órdenes pendientes por confirmar desde el catálogo
              </p>
              <p className="text-xs text-chocolate-600 max-w-md mx-auto">
                Cuando un cliente entre al enlace del catálogo, elija sus productos y confirme su pedido, aparecerá aquí separado de las cotizaciones del taller.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {catalogOrders.map((req) => {
                const cleanPhone = sanitizeDominicanPhone(req.cliente_telefono);
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border border-trigo-200 shadow-warm space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-trigo-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-frambuesa-50 text-frambuesa-700 border border-frambuesa-200">
                            #{req.folio}
                          </span>
                          <h3 className="text-base font-bold text-chocolate-900">
                            {req.cliente_nombre}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.estado === 'cotizado'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {req.estado === 'cotizado'
                              ? 'Ya Procesada'
                              : 'Orden de Cliente por Confirmar'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-chocolate-600 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {req.cliente_telefono}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-frambuesa-600" />
                            Entrega solicitada: <strong>{req.fecha_entrega_deseada}</strong> (
                            {req.hora_entrega_deseada || 'Por definir'})
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {req.tipo_despacho === 'delivery'
                              ? `Delivery: ${req.direccion_entrega || 'Con ubicación GPS'}`
                              : 'Retiro en Taller'}
                          </span>
                          {req.maps_url && (
                            <a
                              href={req.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-700 font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Ver Pin GPS</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {cleanPhone.length >= 10 && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `¡Hola *${req.cliente_nombre}*! 🍰 Recibimos tu orden *#${req.folio}* desde nuestro catálogo de *Delicias del Valle*. En breve te confirmamos el monto total y los detalles de entrega.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePriceCatalogRequest(req)}
                          className="px-3.5 py-2 rounded-xl bg-chocolate-900 hover:bg-chocolate-800 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-trigo-300" />
                          <span>Asignar Precios (Cotizar)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmCatalogRequestToOrder(req)}
                          className="px-3.5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Directo a Pedido</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCatalogRequest(req)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          title="Eliminar solicitud"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {req.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-canvas border border-trigo-200 text-xs space-y-1"
                        >
                          <p className="font-bold text-chocolate-900">
                            {idx + 1}. {item.producto_nombre} (x{item.cantidad})
                          </p>
                          <p className="text-[11px] text-chocolate-700">
                            <strong>Tamaño:</strong> {item.tamano_porciones} • <strong>Masa:</strong>{' '}
                            {item.masa_base}
                          </p>
                          <p className="text-[11px] text-chocolate-700">
                            <strong>Relleno:</strong> {item.relleno} • <strong>Decoración:</strong>{' '}
                            {item.decoracion}
                          </p>
                          {item.dedicatoria && (
                            <p className="text-[11px] text-frambuesa-700 italic">
                              Dedicatoria: &ldquo;{item.dedicatoria}&rdquo;
                            </p>
                          )}
                          {item.notas_personalizacion && (
                            <p className="text-[11px] text-chocolate-600">
                              Detalles: {item.notas_personalizacion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Buscador y Filtros para Cotizaciones del Taller o Cotizaciones del Catálogo */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-trigo-200 shadow-warm space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    originTab === 'taller'
                      ? 'Buscar cotización del taller por cliente, código o producto...'
                      : 'Buscar cotización originada en el catálogo...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-trigo-200 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs text-panadero bg-canvas/40"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-chocolate-700 text-white shadow-sm'
                      : 'bg-crema/60 text-chocolate-600 hover:bg-crema'
                  }`}
                >
                  Todas ({activeQuotesList.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pendiente')}
                  className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'pendiente'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Pendientes ({activeQuotesList.filter((c) => c.estado === 'pendiente').length})
                </button>
                <button
                  onClick={() => setStatusFilter('aprobada')}
                  className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'aprobada'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Aprobadas ({activeQuotesList.filter((c) => c.estado === 'aprobada').length})
                </button>
                <button
                  onClick={() => setStatusFilter('convertida')}
                  className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'convertida'
                      ? 'bg-frambuesa-600 text-white shadow-sm'
                      : 'bg-frambuesa-50 text-frambuesa-700 hover:bg-frambuesa-100 border border-frambuesa-200'
                  }`}
                >
                  Convertidas a Pedido (
                  {activeQuotesList.filter((c) => c.estado === 'convertida').length})
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Cotizaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCotizaciones.map((cot) => {
              const { url: waUrl } = generarMensajeCotizacionWhatsApp(cot);
              const fromCatalog = isCatalogOriginQuote(cot);

              return (
                <div
                  key={cot.id}
                  className="bg-white rounded-3xl border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Encabezado */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-chocolate-800 bg-crema px-2.5 py-1 rounded-lg border border-trigo-300">
                          {cot.codigo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            fromCatalog
                              ? 'bg-frambuesa-50 text-frambuesa-700 border-frambuesa-200'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {fromCatalog ? '🛍️ Catálogo' : '🏪 Taller'}
                        </span>
                      </div>
                      <Badge
                        variant={
                          cot.estado === 'convertida'
                            ? 'frambuesa'
                            : cot.estado === 'aprobada'
                            ? 'success'
                            : cot.estado === 'enviada'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {cot.estado.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-chocolate-900 group-hover:text-frambuesa-600 transition-colors mt-2">
                      {cot.cliente_nombre}
                    </h3>

                    {cot.descripcion && (
                      <p className="text-xs text-chocolate-700 font-medium italic mt-1 line-clamp-2 bg-crema/60 px-2 py-1 rounded-lg border border-trigo-200">
                        "{cot.descripcion}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {cot.cliente_telefono}
                      </span>
                      {cot.fecha_evento && (
                        <span className="flex items-center gap-1 text-frambuesa-700 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Evento: {formatDate(cot.fecha_evento)}
                        </span>
                      )}
                    </div>

                    {/* Items Preview */}
                    <div className="mt-3 pt-3 border-t border-trigo-100 space-y-1 text-xs">
                      {cot.items.map((item, idx) => {
                        const isExtra =
                          item.es_extra ||
                          (!item.receta_id &&
                            Boolean(item.tamano_porciones?.toLowerCase().includes('extra')));
                        return (
                          <div
                            key={idx}
                            className="text-chocolate-800 font-medium flex justify-between items-center"
                          >
                            <span className="truncate pr-2 flex items-center gap-1.5">
                              {isExtra ? (
                                <>
                                  <span className="text-[9px] bg-frambuesa-100 text-frambuesa-800 font-bold px-1.5 py-0.2 rounded border border-frambuesa-200 shrink-0">
                                    EXTRA
                                  </span>
                                  <span>{item.receta_nombre}</span>
                                </>
                              ) : (
                                <span>
                                  • {item.receta_nombre} ({formatDisplayTamano(item.tamano_porciones)})
                                </span>
                              )}
                            </span>
                            <span className="font-bold flex-shrink-0">x{item.cantidad}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pie de Tarjeta */}
                  <div className="bg-crema/40 p-4 border-t border-trigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-chocolate-600 font-semibold">
                        Total Cotizado:
                      </span>
                      <span className="text-lg font-black text-frambuesa-600">
                        {formatCurrency(cot.total)}
                      </span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        onClick={() => setSelectedCotizacion(cot)}
                        className="py-2 px-2 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span>Ver</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => generarPdfCotizacion(cot)}
                        title="Exportar a PDF"
                        className="py-2 px-2 rounded-xl bg-white border border-trigo-300 hover:bg-crema text-chocolate-700 font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-chocolate-600" />
                        <span>PDF</span>
                      </button>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar mensaje por WhatsApp"
                        className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    {/* Acciones Secundarias */}
                    <div className="flex items-center justify-between pt-1 border-t border-trigo-200/60 text-xs">
                      <span className="text-[11px] text-gray-400">
                        Validez: {cot.validez_dias} días
                      </span>

                      <div className="flex items-center gap-1">
                        {cot.estado !== 'convertida' && (
                          <button
                            onClick={() => {
                              setEditingCotizacion(cot);
                              setIsBuilderOpen(true);
                            }}
                            title="Editar cotización"
                            className="p-1.5 rounded-lg text-chocolate-500 hover:text-chocolate-800 hover:bg-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`¿Deseas eliminar la cotización ${cot.codigo}?`)) {
                              deleteCotizacion(cot.id);
                            }
                          }}
                          title="Eliminar cotización"
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modales */}
      {isBuilderOpen && (
        <QuoteBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingCotizacion(null);
          }}
          recetas={recetas}
          insumosMap={insumosMap}
          initialCotizacion={editingCotizacion}
          onSave={async (data) => {
            if (editingCotizacion) {
              return await updateCotizacion(editingCotizacion.id, data);
            } else {
              return await addCotizacion(data);
            }
          }}
        />
      )}

      {selectedCotizacion && (
        <QuoteDetailModal
          isOpen={!!selectedCotizacion}
          onClose={() => setSelectedCotizacion(null)}
          cotizacion={selectedCotizacion}
          onConvertToOrder={(cotId, anticipo, fecha, hora, tipo, dir, despachoData) => {
            convertirCotizacionAPedido(cotId, anticipo, fecha, hora, tipo, dir, despachoData);
          }}
          onEdit={(c) => {
            setEditingCotizacion(c);
            setIsBuilderOpen(true);
          }}
        />
      )}
    </div>
  );
};
