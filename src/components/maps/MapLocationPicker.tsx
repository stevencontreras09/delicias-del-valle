import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from '@react-google-maps/api';
import {
  MapPin,
  Search,
  Navigation,
  Compass,
  Loader2,
  AlertTriangle,
  Crosshair,
  ExternalLink,
} from 'lucide-react';
import { DELICIAS_WORKSHOP_COORDS } from '../../utils/routeOptimizer';

const LIBRARIES: ('places')[] = ['places'];

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

const mapContainerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '1rem',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'on' }],
    },
  ],
};

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
}

const GoogleMapsSdkView: React.FC<
  MapLocationPickerProps & {
    apiKey: string;
    currentCoords: { lat: number; lng: number };
    hasCustomCoords: boolean;
    onSwitchToFallback: () => void;
  }
> = ({
  apiKey,
  latitude,
  longitude,
  address,
  onChangeLocation,
  currentCoords,
  hasCustomCoords,
  onSwitchToFallback,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
      if (hasCustomCoords) {
        mapInstance.panTo(currentCoords);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasCustomCoords, latitude, longitude]
  );

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocompleteInstance;
  };

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || place.name || address;
      const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

      onChangeLocation({
        latitude: lat,
        longitude: lng,
        address: formattedAddress,
        mapsUrl,
      });

      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(16);
      }
    }
  };

  const handleMarkerUpdate = (lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onChangeLocation({
            latitude: lat,
            longitude: lng,
            address: results[0].formatted_address,
            mapsUrl,
          });
        } else {
          onChangeLocation({
            latitude: lat,
            longitude: lng,
            mapsUrl,
          });
        }
      });
    } else {
      onChangeLocation({
        latitude: lat,
        longitude: lng,
        mapsUrl,
      });
    }

    if (map) {
      map.panTo({ lat, lng });
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      handleMarkerUpdate(e.latLng.lat(), e.latLng.lng());
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      handleMarkerUpdate(e.latLng.lat(), e.latLng.lng());
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          handleMarkerUpdate(lat, lng);
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(16);
          }
        },
        (error) => {
          console.warn('Error obteniendo geolocalización:', error.message);
        }
      );
    }
  };

  useEffect(() => {
    if (loadError) {
      onSwitchToFallback();
    }
  }, [loadError, onSwitchToFallback]);

  if (!isLoaded) {
    return (
      <div className="w-full h-72 rounded-2xl bg-canvas border border-trigo-200 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-6 h-6 text-frambuesa-600 animate-spin" />
        <span className="text-xs text-chocolate-600 font-medium">
          Cargando Google Maps y Places Autocomplete...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="gmaps-places-search"
          className="block text-xs font-bold text-chocolate-700 mb-1 uppercase tracking-wider"
        >
          Buscar Dirección Oficial (Google Places)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chocolate-400 z-10">
            <Search className="w-4 h-4" />
          </div>
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              id="gmaps-places-search"
              type="text"
              placeholder="Escribe la calle, sector, residencial o punto en RD..."
              defaultValue={address}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-trigo-300 bg-white text-chocolate-900 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 focus:border-frambuesa-400 transition-all shadow-2xs font-medium"
            />
          </Autocomplete>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            title="Usar mi ubicación GPS actual"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-frambuesa-600 hover:text-frambuesa-700 transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-trigo-300 shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentCoords}
          zoom={hasCustomCoords ? 16 : 14}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onClick={handleMapClick}
          options={mapOptions}
        >
          <Marker
            position={currentCoords}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            animation={google.maps.Animation.DROP}
            title="Arrastra este pin para ajustar la ubicación exacta de entrega"
          />
        </GoogleMap>

        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-trigo-200 text-[10px] text-chocolate-700 font-bold flex items-center space-x-1.5 shadow-sm">
          <Navigation className="w-3 h-3 text-frambuesa-600 animate-pulse" />
          <span>Arrastra el pin o toca el mapa para afinar el punto de entrega</span>
        </div>
      </div>
    </div>
  );
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = (props) => {
  const { latitude, longitude, address, onChangeLocation } = props;
  const apiKey = getResolvedGoogleMapsApiKey();
  const [useFallbackMap, setUseFallbackMap] = useState<boolean>(false);

  // Buscador de lugares (Photon / Nominatim RD) para modo híbrido / sin llave JS
  const [searchQuery, setSearchQuery] = useState<string>(address || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

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

  const hasCustomCoords =
    latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  useEffect(() => {
    if (address && address !== searchQuery) {
      setSearchQuery(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleSearchPlaces = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${query.trim()}, República Dominicana`);
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${q}&lat=${DELICIAS_WORKSHOP_COORDS.lat}&lon=${DELICIAS_WORKSHOP_COORDS.lng}&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.features && Array.isArray(data.features)) {
          const mapped: PlaceSuggestion[] = data.features
            .map((f: any) => {
              const p = f.properties || {};
              const coords = f.geometry?.coordinates || [];
              const parts = [p.name, p.street, p.district, p.city, p.state, 'RD'].filter(Boolean);
              const uniqueParts = Array.from(new Set(parts));
              return {
                display_name: uniqueParts.join(', '),
                lon: Number(coords[0]),
                lat: Number(coords[1]),
              };
            })
            .filter((item: PlaceSuggestion) => !isNaN(item.lat) && !isNaN(item.lon));
          setSuggestions(mapped);
        }
      }
    } catch {
      // Fallback silencioso
    } finally {
      setIsSearching(false);
    }
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

  const handleGetCurrentLocationFallback = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
        onChangeLocation({
          latitude: lat,
          longitude: lng,
          address: searchQuery.trim() || `Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          mapsUrl,
        });
      },
      (err) => {
        console.warn('Error GPS:', err.message);
      }
    );
  };

  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    hasCustomCoords
      ? `${currentCoords.lat},${currentCoords.lng}`
      : searchQuery.trim()
      ? `${searchQuery.trim()}, Santo Domingo, República Dominicana`
      : `${currentCoords.lat},${currentCoords.lng}`
  )}&z=16&output=embed`;

  return (
    <div className="space-y-3">
      {apiKey && !useFallbackMap ? (
        <GoogleMapsSdkView
          {...props}
          apiKey={apiKey}
          currentCoords={currentCoords}
          hasCustomCoords={hasCustomCoords}
          onSwitchToFallback={() => setUseFallbackMap(true)}
        />
      ) : (
        <div className="space-y-3">
          {/* Buscador interactivo de calles y sectores con geocodificación + GPS */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="hybrid-places-search"
                className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider"
              >
                Buscar Calle, Sector o Residencial (Google Maps & Geocoder RD)
              </label>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chocolate-400">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-frambuesa-600" /> : <Search className="w-4 h-4" />}
              </div>
              <input
                id="hybrid-places-search"
                type="text"
                placeholder="Ej: Piantini, Naco, Arroyo Hondo, Ágora Mall, Calle..."
                value={searchQuery}
                onChange={(e) => handleSearchPlaces(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-trigo-300 bg-white text-chocolate-900 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 font-medium"
              />
              <button
                type="button"
                onClick={handleGetCurrentLocationFallback}
                title="Usar mi ubicación GPS actual"
                className="absolute inset-y-1 right-1 px-2.5 rounded-lg bg-frambuesa-50 hover:bg-frambuesa-100 text-frambuesa-700 border border-frambuesa-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Mi GPS</span>
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl border border-trigo-300 shadow-lg divide-y divide-trigo-100 max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2 hover:bg-crema/70 text-xs flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-frambuesa-600 shrink-0" />
                    <span className="truncate font-medium text-chocolate-900">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mapa Interactivo de Google Maps Embebido en Tiempo Real */}
          <div className="relative rounded-2xl overflow-hidden border border-trigo-300 shadow-sm bg-canvas">
            <iframe
              title="Mapa de Ubicación de Entrega Google Maps"
              src={googleEmbedUrl}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-2.5 bg-white border-t border-trigo-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-chocolate-700 font-semibold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-frambuesa-600" />
                <span>Vista en vivo de Google Maps para el punto de entrega</span>
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  searchQuery.trim() || `${currentCoords.lat},${currentCoords.lng}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>Abrir mapa completo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Muestra visual y ajuste fino de Coordenadas GPS en tiempo real */}
      <div className="p-3 rounded-xl bg-canvas border border-trigo-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-6 h-6 rounded-lg bg-frambuesa-50 text-frambuesa-600 flex items-center justify-center flex-shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-chocolate-900">Coordenadas GPS de Entrega:</span>
            <span className="text-[11px] text-gray-500 ml-1">
              (Listas para la ruta inteligente del motorista)
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
                    mapsUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${currentCoords.lng.toFixed(6)}`,
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
                    mapsUrl: `https://www.google.com/maps?q=${currentCoords.lat.toFixed(6)},${lng.toFixed(6)}`,
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
