import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Navigation,
  Compass,
  Loader2,
  Crosshair,
  ExternalLink,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { DELICIAS_WORKSHOP_COORDS } from '../../utils/routeOptimizer';

export const GOOGLE_MAPS_KEY_STORAGE = 'delicias_google_maps_api_key';

export function getResolvedGoogleMapsApiKey(): string {
  try {
    const savedLocal = localStorage.getItem(GOOGLE_MAPS_KEY_STORAGE);
    if (savedLocal && savedLocal.trim().length > 10 && savedLocal !== 'tu-google-maps-api-key') {
      return savedLocal.trim();
    }
  } catch {}

  const envKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : '') ||
    '';

  if (envKey && envKey !== 'tu-google-maps-api-key' && envKey.trim().length > 10) {
    return envKey.trim();
  }
  return '';
}

export function saveGoogleMapsApiKey(key: string): void {
  try {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(GOOGLE_MAPS_KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(GOOGLE_MAPS_KEY_STORAGE);
    }
  } catch {}
}

export interface MapLocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  address: string;
  puntoReferencia?: string;
  onChangeLocation: (location: {
    latitude: number;
    longitude: number;
    address?: string;
    mapsUrl?: string;
  }) => void;
}

interface PlaceSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  source?: 'google' | 'osm';
}

// Icono SVG estilo Pin de Google Maps arrastrable
const createDraggableGooglePinIcon = () =>
  L.divIcon({
    className: 'custom-google-draggable-pin',
    html: `
      <div style="position: relative; width: 38px; height: 46px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.35)); cursor: grab;">
        <svg viewBox="0 0 38 46" width="38" height="46" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 1C9.6 1 2 8.6 2 18c0 12.2 15.1 25.7 15.8 26.3a1.8 1.8 0 0 0 2.4 0C20.9 43.7 36 30.2 36 18 36 8.6 28.4 1 19 1z" fill="#EA4335" stroke="#ffffff" stroke-width="2.2"/>
          <circle cx="19" cy="18" r="6.5" fill="#81171b"/>
          <circle cx="19" cy="18" r="4.5" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
  });

export const MapLocationPicker: React.FC<MapLocationPickerProps> = (props) => {
  const { latitude, longitude, address, onChangeLocation } = props;
  const apiKey = getResolvedGoogleMapsApiKey();

  const [searchQuery, setSearchQuery] = useState<string>(address || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [mapLayerType, setMapLayerType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const debounceTimerRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const currentCoords = {
    lat:
      latitude !== null && latitude !== undefined && !isNaN(latitude)
        ? latitude
        : DELICIAS_WORKSHOP_COORDS.lat,
    lng:
      longitude !== null && longitude !== undefined && !isNaN(longitude)
        ? longitude
        : DELICIAS_WORKSHOP_COORDS.lng,
  };

  useEffect(() => {
    if (address && address !== searchQuery) {
      setSearchQuery(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const reverseGeocodeWithGoogle = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      if (!apiKey) return null;
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat.toFixed(
          6
        )},${lng.toFixed(6)}&language=es&key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (
            data?.status === 'OK' &&
            Array.isArray(data.results) &&
            data.results[0]?.formatted_address
          ) {
            return data.results[0].formatted_address;
          }
        }
      } catch {}
      return null;
    },
    [apiKey]
  );

  // Función que se ejecuta al arrastrar el marcador o tocar un punto en el mapa
  const handleInteractivePinMove = useCallback(
    async (lat: number, lng: number) => {
      const cleanLat = Number(lat.toFixed(6));
      const cleanLng = Number(lng.toFixed(6));
      const mapsUrl = `https://www.google.com/maps?q=${cleanLat.toFixed(6)},${cleanLng.toFixed(6)}`;

      // Actualizar inmediatamente las coordenadas para que el pin se sienta instantáneo
      onChangeLocation({
        latitude: cleanLat,
        longitude: cleanLng,
        mapsUrl,
      });

      // Consultar la dirección exacta en segundo plano con Google Geocoding API
      const resolvedAddress = await reverseGeocodeWithGoogle(cleanLat, cleanLng);
      if (resolvedAddress) {
        setSearchQuery(resolvedAddress);
        onChangeLocation({
          latitude: cleanLat,
          longitude: cleanLng,
          address: resolvedAddress,
          mapsUrl,
        });
      }
    },
    [onChangeLocation, reverseGeocodeWithGoogle]
  );

  // Mantener referencia actualizada del callback para los eventos de Leaflet
  const pinMoveCallbackRef = useRef(handleInteractivePinMove);
  useEffect(() => {
    pinMoveCallbackRef.current = handleInteractivePinMove;
  }, [handleInteractivePinMove]);

  // Inicializar el mapa interactivo con cartografía de Google Maps y marcador arrastrable
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentCoords.lat;
    const initialLng = currentCoords.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    // Capa de Google Maps (Calles por defecto) con respaldo automático a OpenStreetMap si hay bloqueo de red
    const googleTileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es';
    const tileLayer = L.tileLayer(googleTileUrl, {
      maxZoom: 20,
    }).addTo(map);

    let switchedToBackup = false;
    tileLayer.on('tileerror', () => {
      if (!switchedToBackup) {
        switchedToBackup = true;
        tileLayer.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      }
    });

    // Marcador arrastrable
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: createDraggableGooglePinIcon(),
      title: 'Arrastra este marcador al punto exacto de entrega',
    }).addTo(map);

    // Al terminar de arrastrar el marcador
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      map.panTo(pos, { animate: true });
      pinMoveCallbackRef.current(pos.lat, pos.lng);
    });

    // Al hacer clic en cualquier parte del mapa, mover el marcador ahí mismo
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng, { animate: true });
      pinMoveCallbackRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;
    tileLayerRef.current = tileLayer;

    // Asegurar dimensionamiento correcto dentro de modales
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      window.clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar posición del marcador cuando cambian las coordenadas desde buscador o GPS
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerInstanceRef.current;
    if (!map || !marker) return;

    const currentMarkerPos = marker.getLatLng();
    const diffLat = Math.abs(currentMarkerPos.lat - currentCoords.lat);
    const diffLng = Math.abs(currentMarkerPos.lng - currentCoords.lng);

    if (diffLat > 0.00001 || diffLng > 0.00001) {
      const nextLatLng = L.latLng(currentCoords.lat, currentCoords.lng);
      marker.setLatLng(nextLatLng);
      map.setView(nextLatLng, Math.max(map.getZoom(), 16), { animate: true });
    }
  }, [currentCoords.lat, currentCoords.lng]);

  // Cambiar entre Calles (Google Maps) y Satélite Híbrido (Google Earth + Calles)
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const url =
      mapLayerType === 'hybrid'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=es'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es';
    tileLayerRef.current.setUrl(url);
  }, [mapLayerType]);

  const runGeocodingSearch = async (rawQuery: string) => {
    const cleanQuery = rawQuery.trim();
    if (cleanQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const combinedResults: PlaceSuggestion[] = [];

    try {
      // 1. Consultar Google Geocoding API oficial si existe API Key activa
      if (apiKey) {
        try {
          const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            `${cleanQuery}, República Dominicana`
          )}&region=do&language=es&key=${encodeURIComponent(apiKey)}`;
          const gRes = await fetch(gUrl);
          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData?.status === 'OK' && Array.isArray(gData.results)) {
              gData.results.slice(0, 4).forEach((item: any) => {
                const lat = item?.geometry?.location?.lat;
                const lng = item?.geometry?.location?.lng;
                if (typeof lat === 'number' && typeof lng === 'number') {
                  combinedResults.push({
                    display_name: item.formatted_address || cleanQuery,
                    lat,
                    lon: lng,
                    source: 'google',
                  });
                }
              });
            }
          }
        } catch {
          // Continuar con Photon RD como respaldo
        }
      }

      // 2. Complementar con Photon / OpenStreetMap RD para calles y residenciales locales
      if (combinedResults.length < 4) {
        const q = encodeURIComponent(`${cleanQuery}, República Dominicana`);
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${q}&lat=${DELICIAS_WORKSHOP_COORDS.lat}&lon=${DELICIAS_WORKSHOP_COORDS.lng}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.features && Array.isArray(data.features)) {
            data.features.forEach((f: any) => {
              const p = f.properties || {};
              const coords = f.geometry?.coordinates || [];
              const lon = Number(coords[0]);
              const lat = Number(coords[1]);
              if (!isNaN(lat) && !isNaN(lon)) {
                const parts = [p.name, p.street, p.district, p.city, p.state, 'RD'].filter(Boolean);
                const uniqueParts = Array.from(new Set(parts));
                const label = uniqueParts.join(', ');
                const alreadyExists = combinedResults.some(
                  (existing) =>
                    Math.abs(existing.lat - lat) < 0.0008 && Math.abs(existing.lon - lon) < 0.0008
                );
                if (!alreadyExists && label) {
                  combinedResults.push({
                    display_name: label,
                    lat,
                    lon,
                    source: 'osm',
                  });
                }
              }
            });
          }
        }
      }

      setSuggestions(combinedResults.slice(0, 6));
    } catch {
      // Fallback silencioso
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (query: string) => {
    setSearchQuery(query);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceTimerRef.current = window.setTimeout(() => {
      runGeocodingSearch(query);
    }, 280);
  };

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    const mapsUrl = `https://www.google.com/maps?q=${s.lat.toFixed(6)},${s.lon.toFixed(6)}`;
    setSearchQuery(s.display_name);
    setSuggestions([]);
    onChangeLocation({
      latitude: s.lat,
      longitude: s.lon,
      address: s.display_name,
      mapsUrl,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
        const resolvedAddress =
          (await reverseGeocodeWithGoogle(lat, lng)) ||
          searchQuery.trim() ||
          `Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

        setSearchQuery(resolvedAddress);
        onChangeLocation({
          latitude: lat,
          longitude: lng,
          address: resolvedAddress,
          mapsUrl,
        });
        setIsLocatingGps(false);
      },
      (err) => {
        console.warn('Error GPS:', err.message);
        setIsLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Buscador de direcciones conectado a Google Geocoding API + GPS */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="hybrid-places-search"
            className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider"
          >
            Buscar Dirección Oficial (Google Maps Geocoding RD)
          </label>
          {apiKey && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>Google Geocoding Activo</span>
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chocolate-400">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-frambuesa-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
          <input
            id="hybrid-places-search"
            type="text"
            placeholder="Escribe la calle, sector, residencial o punto en RD..."
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runGeocodingSearch(searchQuery);
              }
            }}
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-trigo-300 bg-white text-chocolate-900 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 font-medium shadow-2xs"
          />
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocatingGps}
            title="Usar mi ubicación GPS actual"
            className="absolute inset-y-1 right-1 px-2.5 rounded-lg bg-frambuesa-50 hover:bg-frambuesa-100 text-frambuesa-700 border border-frambuesa-200 text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-60"
          >
            {isLocatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            <span>Mi GPS</span>
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-trigo-300 shadow-lg divide-y divide-trigo-100 max-h-52 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-2.5 hover:bg-crema/70 text-xs flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-frambuesa-600 shrink-0" />
                  <span className="truncate font-medium text-chocolate-900">{s.display_name}</span>
                </div>
                {s.source === 'google' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                    Google Maps
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lienzo Interactivo con Cartografía de Google Maps y Marcador Arrastrable */}
      <div className="rounded-2xl overflow-hidden border-2 border-trigo-300 shadow-sm bg-canvas">
        <div
          className="relative w-full"
          style={{ width: '100%', height: '340px', minHeight: '340px' }}
        >
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '340px',
              minHeight: '340px',
              cursor: 'crosshair',
              zIndex: 1,
            }}
          />

          {/* Banner flotante de instrucciones + Selector de vista Calles / Satélite */}
          <div className="absolute top-2.5 left-12 right-2.5 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-trigo-200 text-[11px] text-chocolate-900 font-bold flex items-center gap-1.5 shadow-sm pointer-events-auto">
              <Navigation className="w-3.5 h-3.5 text-frambuesa-600 animate-pulse shrink-0" />
              <span>Arrastra el marcador rojo o haz clic en el mapa para fijar el punto exacto</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setMapLayerType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
              }
              className="bg-white/95 hover:bg-white px-2.5 py-1.5 rounded-xl border border-trigo-300 text-[11px] font-bold text-chocolate-900 shadow-sm flex items-center gap-1.5 pointer-events-auto transition-colors"
              title="Cambiar entre vista de Calles y Satélite"
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>{mapLayerType === 'roadmap' ? '🛰️ Ver Satélite' : '🗺️ Ver Calles'}</span>
            </button>
          </div>
        </div>

        <div className="p-2.5 bg-white border-t border-trigo-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-chocolate-700 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-frambuesa-600" />
            <span>
              Pin interactivo activo: puedes arrastrarlo con el mouse/dedo o tocar cualquier calle
            </span>
          </span>
          <a
            href={`https://www.google.com/maps?q=${currentCoords.lat.toFixed(
              6
            )},${currentCoords.lng.toFixed(6)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 hover:underline font-bold inline-flex items-center gap-1"
          >
            <span>Abrir en Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Muestra visual y ajuste fino de Coordenadas GPS en tiempo real */}
      <div className="p-3 rounded-xl bg-canvas border border-trigo-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-6 h-6 rounded-lg bg-frambuesa-50 text-frambuesa-600 flex items-center justify-center flex-shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-chocolate-900">Coordenadas GPS Exactas:</span>
            <span className="text-[11px] text-gray-500 ml-1">
              (Se actualizan al arrastrar el pin)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <label className="px-2 py-1 rounded-lg bg-white text-chocolate-800 border border-trigo-300 font-bold shadow-2xs flex items-center gap-1">
            <span>Lat:</span>
            <input
              type="number"
              step="0.0001"
              aria-label="Latitud GPS"
              value={Number(currentCoords.lat.toFixed(6))}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onChangeLocation({
                    latitude: lat,
                    longitude: currentCoords.lng,
                    mapsUrl: `https://www.google.com/maps?q=${lat.toFixed(
                      6
                    )},${currentCoords.lng.toFixed(6)}`,
                  });
                }
              }}
              className="w-24 text-frambuesa-600 font-bold bg-transparent focus:outline-none"
            />
          </label>
          <label className="px-2 py-1 rounded-lg bg-white text-chocolate-800 border border-trigo-300 font-bold shadow-2xs flex items-center gap-1">
            <span>Lng:</span>
            <input
              type="number"
              step="0.0001"
              aria-label="Longitud GPS"
              value={Number(currentCoords.lng.toFixed(6))}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onChangeLocation({
                    latitude: currentCoords.lat,
                    longitude: lng,
                    mapsUrl: `https://www.google.com/maps?q=${currentCoords.lat.toFixed(
                      6
                    )},${lng.toFixed(6)}`,
                  });
                }
              }}
              className="w-24 text-frambuesa-600 font-bold bg-transparent focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
export default MapLocationPicker;
