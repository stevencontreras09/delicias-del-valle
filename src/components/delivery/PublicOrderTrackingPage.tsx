import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { getSupabaseClient } from '../../utils/supabaseClient';
import { Pedido, EstadoPedido } from '../../types';
import { formatCurrency, formatDate, formatDisplayTamano } from '../../utils/formatters';
import {
  DELICIAS_WORKSHOP_COORDS,
  calculateHaversineDistanceKm,
  extractCoordsFromPedido,
} from '../../utils/routeOptimizer';
import {
  Cake,
  Flame,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Share2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Store,
  Navigation,
  Compass,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const GOOGLE_LIBRARIES: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '280px',
  borderRadius: '1rem',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

interface PublicOrderTrackingPageProps {
  orderQuery: string;
  onBackToApp?: () => void;
}

export const PublicOrderTrackingPage: React.FC<PublicOrderTrackingPageProps> = ({
  orderQuery,
  onBackToApp,
}) => {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : '') ||
    '';

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-tracking-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_LIBRARIES,
  });

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Coordenadas en tiempo real del repartidor
  const [driverCoords, setDriverCoords] = useState<{
    lat: number;
    lng: number;
    driverName?: string;
    speed?: number | null;
    timestamp?: number;
  } | null>(null);

  const supabase = getSupabaseClient();

  // 1. Cargar pedido público desde Supabase por ID o por número de factura
  const loadPedido = async () => {
    if (!orderQuery) return;
    if (!supabase) {
      console.warn('Supabase no inicializado');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setNotFound(false);

    try {
      const query = decodeURIComponent(orderQuery).trim();
      let found: Pedido | null = null;

      // Intento A: Si es número, buscar por ID numérico
      const numericId = parseInt(query, 10);
      if (!isNaN(numericId) && String(numericId) === query) {
        const { data } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', numericId)
          .maybeSingle();

        if (data) found = data as Pedido;
      }

      // Intento B: Si no se encontró, buscar por número de factura (ej. 'PED-2026-001')
      if (!found) {
        const { data } = await supabase
          .from('pedidos')
          .select('*')
          .ilike('numero_factura', `%${query}%`)
          .limit(1);

        if (data && data.length > 0) found = data[0] as Pedido;
      }

      // Intento C: Buscar por teléfono del cliente
      if (!found && query.length >= 7) {
        const cleanPhone = query.replace(/\D/g, '');
        const { data } = await supabase
          .from('pedidos')
          .select('*')
          .ilike('cliente_telefono', `%${cleanPhone}%`)
          .order('id', { ascending: false })
          .limit(1);

        if (data && data.length > 0) found = data[0] as Pedido;
      }

      if (found) {
        setPedido(found);
        setNotFound(false);
        setLastUpdated(new Date());
      } else {
        setNotFound(true);
        setPedido(null);
      }
    } catch (err) {
      console.warn('Error al cargar pedido de seguimiento:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderQuery]);

  // 2. Suscripción en Tiempo Real con Supabase WebSockets para este pedido específico
  useEffect(() => {
    if (!pedido?.id || !supabase) return;
    const client = supabase;

    const channel = client
      .channel(`public:tracking:${pedido.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedido.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const updated = payload.new as Pedido;
            const previousStatus = pedido.estado;
            setPedido(updated);
            setLastUpdated(new Date());

            if (previousStatus !== updated.estado && updated.estado === 'entregado') {
              try {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
              } catch (_) {}
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [pedido?.id, pedido?.estado, supabase]);

  // 3. Suscripción al Canal Broadcast GPS en Tiempo Real del Repartidor
  useEffect(() => {
    if (!pedido || !supabase) return;
    const client = supabase;

    // Verificar si hay coordenadas cacheadas recientes
    try {
      const cached = localStorage.getItem('delicias_driver_live_coords');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - (parsed.timestamp || 0) < 1000 * 60 * 45) {
          setDriverCoords(parsed);
        }
      }
    } catch (_) {}

    const trackingChannel = client
      .channel('delicias-live-tracking')
      .on('broadcast', { event: 'driver-location' }, (payload: any) => {
        if (payload?.payload) {
          setDriverCoords(payload.payload);
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(trackingChannel);
    };
  }, [pedido, supabase]);

  // Etapa numérica del stepper (1 a 4)
  const currentStep = useMemo(() => {
    if (!pedido) return 1;
    const st = (pedido.estado || '').toLowerCase().trim();
    if (st === 'cancelado') return -1;
    if (st === 'entregado') return 4;
    if (st === 'en_camino' || st === 'listo') return 3;
    if (st === 'en_produccion' || st === 'en_preparacion' || st === 'confirmado') return 2;
    return 1;
  }, [pedido]);

  // Coordenadas del cliente
  const clientCoords = useMemo(() => {
    if (!pedido) return null;
    return extractCoordsFromPedido(pedido);
  }, [pedido]);

  // Distancia y tiempo restante estimado entre repartidor y cliente
  const liveDistanceInfo = useMemo(() => {
    if (!clientCoords || !driverCoords) return null;
    const dist = calculateHaversineDistanceKm(
      driverCoords.lat,
      driverCoords.lng,
      clientCoords.lat,
      clientCoords.lng
    );
    const roadDist = Math.round(dist * 1.3 * 10) / 10;
    const mins = Math.max(2, Math.round((roadDist / 22) * 60));
    return { km: roadDist, minutes: mins };
  }, [clientCoords, driverCoords]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-frambuesa-500/20 text-frambuesa-600 flex items-center justify-center animate-bounce mb-3 shadow-warm">
          <Cake className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-chocolate-900">Consultando tu pedido en vivo...</p>
        <p className="text-xs text-chocolate-500 mt-1">Delicias del Valle • Repostería Fina</p>
      </div>
    );
  }

  if (notFound || !pedido) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-chocolate-900 mb-1">Pedido no encontrado</h2>
        <p className="text-xs text-chocolate-600 max-w-sm mb-5">
          No pudimos localizar una orden con el código "{orderQuery}". Verifica el enlace que te enviamos por WhatsApp o comunícate con el taller.
        </p>
        {onBackToApp && (
          <button
            type="button"
            onClick={onBackToApp}
            className="px-4 py-2 bg-chocolate-700 text-white rounded-xl text-xs font-bold"
          >
            Volver al Inicio
          </button>
        )}
      </div>
    );
  }

  const isEnCamino = (pedido.estado as string) === 'en_camino' || pedido.estado === 'listo';
  const isEntregado = pedido.estado === 'entregado';
  const saldoPendiente = Number(pedido.saldo_pendiente) || 0;

  return (
    <div className="min-h-screen bg-canvas text-chocolate-900 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Encabezado de Marca */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-trigo-200 shadow-warm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-frambuesa-500 to-frambuesa-600 text-white flex items-center justify-center shadow-warm shrink-0">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-frambuesa-600 tracking-wider block">
                Seguimiento en Tiempo Real
              </span>
              <h1 className="text-base sm:text-lg font-black text-chocolate-900">
                Delicias del Valle
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-black text-chocolate-900 block">
              {pedido.numero_factura}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>En vivo</span>
            </span>
          </div>
        </div>

        {/* Stepper Visual de Estado del Pedido */}
        <div className="bg-white p-5 rounded-3xl border border-trigo-200 shadow-warm space-y-5">
          <div className="flex items-center justify-between border-b border-trigo-100 pb-3">
            <div>
              <h2 className="text-xs font-black uppercase text-chocolate-800 tracking-wider">
                Estado de tu Pedido
              </h2>
              <p className="text-sm font-bold text-frambuesa-600 mt-0.5">
                {isEntregado
                  ? '🎉 ¡Tu pedido ha sido entregado!'
                  : isEnCamino
                  ? '🛵 ¡Tu pedido va en camino a tu dirección!'
                  : currentStep === 2
                  ? '🍰 En taller: Horneando y decorando con amor'
                  : '📋 Pedido confirmado en taller'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-crema hover:bg-amber-100 text-chocolate-700 text-xs font-bold flex items-center gap-1.5 transition"
              title="Copiar enlace de seguimiento"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? '¡Copiado!' : 'Compartir'}</span>
            </button>
          </div>

          {/* Stepper Gráfico de 4 Pasos */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Paso 1 */}
            <div className="space-y-1.5">
              <div
                className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 1
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-trigo-100 text-gray-400'
                }`}
              >
                ✓
              </div>
              <span className="text-[10px] font-bold block text-chocolate-700">Confirmado</span>
            </div>

            {/* Paso 2 */}
            <div className="space-y-1.5">
              <div
                className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 2
                    ? 'bg-amber-500 text-white shadow-xs ring-4 ring-amber-100 animate-pulse'
                    : 'bg-trigo-100 text-gray-400'
                }`}
              >
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold block text-chocolate-700">En Taller</span>
            </div>

            {/* Paso 3 */}
            <div className="space-y-1.5">
              <div
                className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 3
                    ? 'bg-sky-500 text-white shadow-xs ring-4 ring-sky-100 animate-pulse'
                    : 'bg-trigo-100 text-gray-400'
                }`}
              >
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold block text-chocolate-700">En Camino</span>
            </div>

            {/* Paso 4 */}
            <div className="space-y-1.5">
              <div
                className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= 4
                    ? 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-100'
                    : 'bg-trigo-100 text-gray-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold block text-chocolate-700">Entregado</span>
            </div>
          </div>
        </div>

        {/* Rastreo GPS en Vivo en Google Maps (Solo cuando va en camino) */}
        {isEnCamino && isMapLoaded && (
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-trigo-200 shadow-warm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-chocolate-900 tracking-wider">
                    Ubicación en Vivo del Repartidor
                  </h3>
                  {liveDistanceInfo ? (
                    <p className="text-xs text-sky-600 font-bold">
                      A ~{liveDistanceInfo.minutes} minutos de tu dirección ({liveDistanceInfo.km} km restantes)
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500">Repartidor en trayecto hacia tu entrega</p>
                  )}
                </div>
              </div>

              {driverCoords?.speed && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold">
                  {Math.round(driverCoords.speed * 3.6)} km/h
                </span>
              )}
            </div>

            {/* Mapa de Google con Repartidor y Cliente */}
            <div className="relative rounded-2xl overflow-hidden border border-trigo-300 shadow-xs">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={driverCoords ? { lat: driverCoords.lat, lng: driverCoords.lng } : clientCoords || DELICIAS_WORKSHOP_COORDS}
                zoom={14}
                options={mapOptions}
              >
                {/* Pin del Cliente */}
                {clientCoords && (
                  <Marker
                    position={clientCoords}
                    title="Tu Ubicación de Entrega"
                    label="🏠"
                  />
                )}

                {/* Pin del Repartidor en Vivo */}
                {driverCoords && (
                  <Marker
                    position={{ lat: driverCoords.lat, lng: driverCoords.lng }}
                    title={driverCoords.driverName || 'Repartidor'}
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/motorcycle.png',
                    }}
                  />
                )}
              </GoogleMap>

              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-trigo-200 text-[10px] text-chocolate-800 font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                <span>Transmisión GPS activa</span>
              </div>
            </div>
          </div>
        )}

        {/* Datos de Entrega y Repartidor */}
        <div className="bg-white p-5 rounded-3xl border border-trigo-200 shadow-warm space-y-4">
          <div className="flex items-center justify-between border-b border-trigo-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-frambuesa-600" />
              <span className="text-xs font-bold text-chocolate-800 uppercase tracking-wider">
                Dirección de Despacho
              </span>
            </div>
            <span className="text-xs font-bold text-chocolate-700">
              Hora: {pedido.hora_entrega || 'Por coordinar'}
            </span>
          </div>

          <p className="text-xs text-chocolate-900 font-medium">
            {pedido.direccion_entrega || 'Retiro en taller'}
          </p>

          {pedido.punto_referencia && (
            <p className="text-[11px] text-frambuesa-700 font-medium italic">
              Punto de referencia: {pedido.punto_referencia}
            </p>
          )}

          {pedido.repartidor_nombre && (
            <div className="p-3 rounded-2xl bg-crema/70 border border-trigo-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-chocolate-700 text-white flex items-center justify-center font-bold text-xs">
                  🛵
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Tu Repartidor Asignado</span>
                  <span className="text-xs font-bold text-chocolate-900">{pedido.repartidor_nombre}</span>
                </div>
              </div>

              {pedido.repartidor_telefono && (
                <a
                  href={`tel:${pedido.repartidor_telefono}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Llamar</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Resumen del Pedido y Saldo */}
        <div className="bg-white p-5 rounded-3xl border border-trigo-200 shadow-warm space-y-3">
          <h3 className="text-xs font-bold text-chocolate-800 uppercase tracking-wider border-b border-trigo-100 pb-2">
            Detalle del Pedido ({pedido.items.length} producto{pedido.items.length !== 1 ? 's' : ''})
          </h3>

          <div className="divide-y divide-trigo-100 text-xs">
            {pedido.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-chocolate-900 block">
                    {item.cantidad}x {item.receta_nombre}
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    {item.tamano_porciones} • {item.masa_base} • {item.relleno}
                  </span>
                  {item.dedicatoria && (
                    <span className="text-[10px] text-frambuesa-700 italic block mt-0.5">
                      Dedicatoria: "{item.dedicatoria}"
                    </span>
                  )}
                </div>
                <span className="font-extrabold text-chocolate-900 font-mono">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-trigo-200 flex items-center justify-between text-xs font-bold">
            <span className="text-gray-500">Total de la Orden:</span>
            <span className="font-mono text-sm text-chocolate-900">{formatCurrency(pedido.total)}</span>
          </div>

          {saldoPendiente > 0 && !isEntregado && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Saldo Pendiente al Recibir:</span>
              <span className="font-black text-sm text-red-600 font-mono">
                {formatCurrency(saldoPendiente)}
              </span>
            </div>
          )}
        </div>

        {/* Pie de Página */}
        <div className="text-center text-[11px] text-gray-500 py-4">
          <p>Delicias del Valle • Repostería Artesanal Dominicana</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};
export default PublicOrderTrackingPage;
