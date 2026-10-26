import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Pedido } from '../../types';
import {
  DELICIAS_WORKSHOP_COORDS,
  optimizeDeliveryRoute,
  RouteStop,
  OptimizedRouteResult,
  extractCoordsFromPedido,
  buildGoogleMapsMultiStopUrl,
} from '../../utils/routeOptimizer';
import { formatCurrency, formatDisplayTamano } from '../../utils/formatters';
import { getGoogleMapsUrl, getWazeUrl, generateClientDeliveryNotificationUrl } from '../../utils/deliveryHelper';
import {
  Navigation,
  Compass,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronRight,
  Crosshair,
  Truck,
  Store,
  Check,
} from 'lucide-react';

const LIBRARIES: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '360px',
  borderRadius: '1.25rem',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

interface DeliveryRoutePlannerProps {
  pedidos: Pedido[];
  onMarkAsDelivered: (pedido: Pedido) => void;
  onStartRoute: (pedidoId: number) => void;
  onOpenLocationModal?: (pedido: Pedido) => void;
}

export const DeliveryRoutePlanner: React.FC<DeliveryRoutePlannerProps> = ({
  pedidos,
  onMarkAsDelivered,
  onStartRoute,
  onOpenLocationModal,
}) => {
  const apiKey =
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : '') ||
    '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-route-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  // Modo de origen: 'workshop' (Taller Delicias del Valle) o 'current_gps' (Ubicación actual del motorista)
  const [originMode, setOriginMode] = useState<'workshop' | 'current_gps'>('workshop');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Lista de pedidos mapeados ordenada
  const [customSequence, setCustomSequence] = useState<Pedido[]>([]);

  // Origen activo
  const activeOrigin = useMemo(() => {
    if (originMode === 'current_gps' && currentGps) {
      return {
        lat: currentGps.lat,
        lng: currentGps.lng,
        name: 'Mi Ubicación Actual (Motorista)',
      };
    }
    return DELICIAS_WORKSHOP_COORDS;
  }, [originMode, currentGps]);

  // Inicializar o resetear la ruta cuando cambian los pedidos
  useEffect(() => {
    const route = optimizeDeliveryRoute(pedidos, activeOrigin);
    const ordered = route.stops.map((s) => s.pedido);
    setCustomSequence(ordered);
  }, [pedidos, activeOrigin]);

  // Obtener geolocalización del motorista
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador o dispositivo no soporta geolocalización GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginMode('current_gps');
        setIsLocating(false);
      },
      (err) => {
        console.warn('Error obteniendo GPS:', err.message);
        alert('No se pudo acceder a tu GPS. Verifica los permisos de ubicación en tu navegador.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Re-optimizar la ruta calculada según la secuencia actual
  const currentRouteData: OptimizedRouteResult = useMemo(() => {
    // Si la secuencia fue alterada manualmente, construimos paradas respetando el orden
    if (customSequence.length > 0) {
      const stops: RouteStop[] = [];
      let prevLat = activeOrigin.lat;
      let prevLng = activeOrigin.lng;
      let totalKm = 0;
      let totalMins = 0;

      customSequence.forEach((p, idx) => {
        const coords = extractCoordsFromPedido(p);
        if (!coords) return;

        const legDist = Math.round(
          ((Math.acos(
            Math.sin((prevLat * Math.PI) / 180) * Math.sin((coords.lat * Math.PI) / 180) +
              Math.cos((prevLat * Math.PI) / 180) *
                Math.cos((coords.lat * Math.PI) / 180) *
                Math.cos(((coords.lng - prevLng) * Math.PI) / 180)
          ) *
            6371) ||
            0) * 1.3 * 10
        ) / 10;

        const legMins = Math.max(3, Math.round((legDist / 22) * 60 + 4));

        totalKm += legDist;
        totalMins += legMins;

        stops.push({
          pedido: p,
          stopIndex: idx + 1,
          latitude: coords.lat,
          longitude: coords.lng,
          distanceFromPreviousKm: legDist,
          estimatedMinutesFromPrevious: legMins,
          cumulativeDistanceKm: Math.round(totalKm * 10) / 10,
          cumulativeMinutes: totalMins,
        });

        prevLat = coords.lat;
        prevLng = coords.lng;
      });

      const unmapped = pedidos.filter((p) => !extractCoordsFromPedido(p));

      return {
        origin: activeOrigin,
        stops,
        totalDistanceKm: Math.round(totalKm * 10) / 10,
        totalEstimatedMinutes: totalMins,
        unmappedPedidos: unmapped,
        googleMapsUrl: buildGoogleMapsMultiStopUrl(
          activeOrigin,
          stops.map((s) => ({ pedido: s.pedido, lat: s.latitude, lng: s.longitude }))
        ),
      };
    }

    return optimizeDeliveryRoute(pedidos, activeOrigin);
  }, [customSequence, activeOrigin, pedidos]);

  // Reordenar paradas manualmente
  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= customSequence.length) return;

    const updated = [...customSequence];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setCustomSequence(updated);
  };

  // Re-optimizar automáticamente desde cero
  const handleResetOptimalRoute = () => {
    const route = optimizeDeliveryRoute(pedidos, activeOrigin);
    setCustomSequence(route.stops.map((s) => s.pedido));
  };

  // Polilínea de ruta para el mapa
  const polylinePath = useMemo(() => {
    const path = [{ lat: activeOrigin.lat, lng: activeOrigin.lng }];
    currentRouteData.stops.forEach((s) => {
      path.push({ lat: s.latitude, lng: s.longitude });
    });
    return path;
  }, [activeOrigin, currentRouteData.stops]);

  // Centro y bounds del mapa
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map);
      if (typeof window !== 'undefined' && window.google?.maps) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(activeOrigin);
        currentRouteData.stops.forEach((s) => {
          bounds.extend({ lat: s.latitude, lng: s.longitude });
        });
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeOrigin, currentRouteData.stops.length]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Panel Superior de Métricas y Control de Ruta */}
      <div className="bg-gradient-to-r from-chocolate-900 via-chocolate-800 to-chocolate-900 text-white p-4 sm:p-5 rounded-3xl shadow-warm border border-chocolate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-frambuesa-500/20 text-frambuesa-300 border border-frambuesa-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2">
                <span>Ruta Inteligente de Entrega</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-frambuesa-500 text-white font-mono">
                  {currentRouteData.stops.length} Paradas
                </span>
              </h3>
              <p className="text-[11px] text-trigo-200 mt-0.5">
                Secuencia optimizada con algoritmo 2-Opt para menor distancia y tiempo en tránsito.
              </p>
            </div>
          </div>

          {/* Selector de Origen: Taller vs GPS */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/10 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setOriginMode('workshop')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                originMode === 'workshop'
                  ? 'bg-frambuesa-500 text-white shadow-xs'
                  : 'text-trigo-200 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Taller</span>
            </button>
            <button
              type="button"
              onClick={handleGetGpsLocation}
              disabled={isLocating}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                originMode === 'current_gps'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-trigo-200 hover:text-white'
              }`}
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Ubicando...' : 'Mi GPS'}</span>
            </button>
          </div>
        </div>

        {/* Métricas Ejecutivas de la Ruta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-trigo-300 block">Distancia Total</span>
            <p className="text-base font-black text-white font-mono mt-0.5">
              {currentRouteData.totalDistanceKm} <span className="text-xs text-trigo-300 font-normal">km</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-trigo-300 block">Tiempo en Ruta</span>
            <p className="text-base font-black text-amber-300 font-mono mt-0.5">
              ~{currentRouteData.totalEstimatedMinutes} <span className="text-xs text-amber-200 font-normal">min</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-trigo-300 block">Punto de Inicio</span>
            <p className="text-xs font-bold text-white truncate mt-0.5" title={activeOrigin.name}>
              {originMode === 'workshop' ? '🏬 Taller Central' : '📍 Tu GPS en Vivo'}
            </p>
          </div>

          <div className="flex flex-col justify-center">
            {currentRouteData.googleMapsUrl ? (
              <a
                href={currentRouteData.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-warm flex items-center justify-center gap-1.5 transition-all"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Iniciar en Google Maps</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full px-3 py-2.5 bg-white/10 text-white/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
              >
                <span>Sin coordenadas</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Mapa Interactivo de la Ruta con Google Maps oficial */}
      {apiKey && isLoaded ? (
        <div className="relative rounded-3xl overflow-hidden border-2 border-trigo-300 shadow-warm">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={activeOrigin}
            zoom={13}
            onLoad={onMapLoad}
            options={mapOptions}
          >
            {/* Marcador del Origen (Taller o GPS) */}
            <Marker
              position={activeOrigin}
              title={activeOrigin.name}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />

            {/* Marcadores numerados de cada parada */}
            {currentRouteData.stops.map((stop) => (
              <Marker
                key={stop.pedido.id}
                position={{ lat: stop.latitude, lng: stop.longitude }}
                label={{
                  text: String(stop.stopIndex),
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
                title={`#${stop.stopIndex} - ${stop.pedido.cliente_nombre}`}
              />
            ))}

            {/* Línea de Ruta de conducción */}
            {polylinePath.length >= 2 && (
              <Polyline
                path={polylinePath}
                options={{
                  strokeColor: '#e11d48',
                  strokeOpacity: 0.85,
                  strokeWeight: 4,
                }}
              />
            )}
          </GoogleMap>

          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-trigo-200 text-[10px] text-chocolate-800 font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>Ruta Secuenciada (Paradas 1 a {currentRouteData.stops.length})</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Google Maps API no configurada en el cliente</p>
              <p className="text-[11px] text-amber-700">
                La ruta matemática ya está optimizada arriba y puedes abrirla directamente en Google Maps con el botón verde.
              </p>
            </div>
          </div>
          {currentRouteData.googleMapsUrl && (
            <a
              href={currentRouteData.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
            >
              <span>Abrir Navegación</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* 3. Lista Interactiva de Paradas Secuenciadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-chocolate-800 tracking-wider flex items-center gap-2">
            <span>Secuencia de Entrega Recomendada</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crema text-chocolate-700 border border-trigo-200">
              {currentRouteData.stops.length} pedidos listos
            </span>
          </h4>

          <button
            type="button"
            onClick={handleResetOptimalRoute}
            className="text-[11px] text-frambuesa-600 hover:text-frambuesa-700 font-bold flex items-center gap-1 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-optimizar Ruta</span>
          </button>
        </div>

        {currentRouteData.stops.length === 0 ? (
          <div className="p-8 text-center bg-canvas rounded-3xl border-2 border-dashed border-trigo-300 text-chocolate-500 text-xs">
            No hay pedidos activos con coordenadas GPS para trazar la ruta. Revisa la sección de abajo para añadir ubicaciones a los pedidos pendientes.
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentRouteData.stops.map((stop, idx) => {
              const p = stop.pedido;
              const isFirst = idx === 0;
              const isLast = idx === currentRouteData.stops.length - 1;
              const isEnCamino = (p.estado as string) === 'en_camino' || p.estado === 'listo';
              const isEntregado = p.estado === 'entregado';
              const saldo = Number(p.saldo_pendiente) || 0;
              const mapsUrl = p.maps_url || getGoogleMapsUrl(p.direccion_entrega || '', p.punto_referencia);
              const wazeUrl = getWazeUrl(p.direccion_entrega || '');
              const clientNotifyWaUrl = generateClientDeliveryNotificationUrl(p);

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                    isEnCamino
                      ? 'border-sky-500 ring-2 ring-sky-200'
                      : isEntregado
                      ? 'border-emerald-200 bg-stone-50/60 opacity-80'
                      : 'border-trigo-200 hover:border-frambuesa-300'
                  }`}
                >
                  {/* Info de Parada */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-chocolate-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs font-mono">
                      {stop.stopIndex}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-chocolate-900">
                          {p.cliente_nombre}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-crema text-chocolate-700 font-bold border border-trigo-200">
                          {p.numero_factura}
                        </span>
                        {p.hora_entrega && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {p.hora_entrega}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mt-1 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-frambuesa-500 shrink-0" />
                        <span>{p.direccion_entrega || 'Dirección sin especificar'}</span>
                      </p>

                      {p.punto_referencia && (
                        <p className="text-[11px] text-frambuesa-700 font-medium italic mt-0.5 pl-4.5 truncate">
                          Ref: {p.punto_referencia}
                        </p>
                      )}

                      {/* Tramo intermedio */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500 font-mono">
                        <span>
                          Tramo: <b>+{stop.distanceFromPreviousKm} km</b> (~{stop.estimatedMinutesFromPrevious} min)
                        </span>
                        <span>•</span>
                        <span>
                          Acumulado: <b>{stop.cumulativeDistanceKm} km</b> (~{stop.cumulativeMinutes} min)
                        </span>
                        {saldo > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-bold">
                              Cobrar: {formatCurrency(saldo)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas del Motorista */}
                  <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto shrink-0">
                    {/* Botones de Reordenamiento */}
                    <div className="flex items-center border border-trigo-200 rounded-lg overflow-hidden mr-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStop(idx, 'up')}
                        disabled={isFirst}
                        title="Mover parada antes"
                        className="p-1 hover:bg-crema disabled:opacity-30 text-chocolate-700"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStop(idx, 'down')}
                        disabled={isLast}
                        title="Mover parada después"
                        className="p-1 hover:bg-crema disabled:opacity-30 text-chocolate-700"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Teléfono */}
                    {p.cliente_telefono && (
                      <a
                        href={`tel:${p.cliente_telefono}`}
                        className="p-2 rounded-xl bg-crema hover:bg-amber-100 text-chocolate-800 transition"
                        title="Llamar al cliente"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {/* WhatsApp */}
                    {p.cliente_telefono && (
                      <a
                        href={clientNotifyWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                        title="Avisar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}

                    {/* Navegar a esta parada en Google Maps */}
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                      title="Navegar a esta parada con Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Ir</span>
                    </a>

                    {/* Botón de Estado */}
                    {!isEntregado && (
                      <>
                        {!isEnCamino && (
                          <button
                            type="button"
                            onClick={() => onStartRoute(p.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>En camino</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onMarkAsDelivered(p)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Entregado</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Pedidos Sin Coordenadas GPS (Para ubicarlos en el mapa) */}
      {currentRouteData.unmappedPedidos.length > 0 && (
        <div className="bg-amber-50/70 p-4 rounded-3xl border border-amber-200 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {currentRouteData.unmappedPedidos.length} Pedido(s) sin Coordenadas GPS exactas
            </span>
          </div>
          <p className="text-[11px] text-amber-800">
            Estos pedidos tienen dirección escrita pero no cuentan con pin geográfico. Puedes hacer clic en "📍 Ubicar en Mapa" para posicionar su marcador y sumarlos a la ruta optimizada.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {currentRouteData.unmappedPedidos.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-chocolate-900 block truncate">
                    {p.cliente_nombre} ({p.numero_factura})
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {p.direccion_entrega || 'Sin dirección'}
                  </span>
                </div>

                {onOpenLocationModal && (
                  <button
                    type="button"
                    onClick={() => onOpenLocationModal(p)}
                    className="px-2.5 py-1.5 rounded-lg bg-frambuesa-50 hover:bg-frambuesa-100 text-frambuesa-700 font-bold text-[11px] shrink-0 border border-frambuesa-200 transition"
                  >
                    📍 Ubicar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default DeliveryRoutePlanner;
