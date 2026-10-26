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
} from 'lucide-react';
import { DELICIAS_WORKSHOP_COORDS } from '../../utils/routeOptimizer';

const LIBRARIES: ('places')[] = ['places'];

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

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  address,
  puntoReferencia,
  onChangeLocation,
}) => {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : '') ||
    '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Coordenadas activas (o el centro por defecto si aún no hay coordenadas guardadas)
  const currentCoords = {
    lat: latitude !== null && latitude !== undefined && !isNaN(latitude) ? latitude : DELICIAS_WORKSHOP_COORDS.lat,
    lng: longitude !== null && longitude !== undefined && !isNaN(longitude) ? longitude : DELICIAS_WORKSHOP_COORDS.lng,
  };

  const hasCustomCoords = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

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

  const onAutocompleteLoad = (
    autocompleteInstance: google.maps.places.Autocomplete
  ) => {
    autocompleteRef.current = autocompleteInstance;
  };

  // Manejar selección de lugar en Google Places Autocomplete
  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || place.name || address;
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

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

  // Manejar arrastre del marcador o clic en el mapa
  const handleMarkerUpdate = (lat: number, lng: number) => {
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results, status) => {
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
        }
      );
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

  // Centrar en ubicación actual del usuario por GPS
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

  if (!apiKey) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-chocolate-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Google Maps API no detectada en este despliegue</span>
        </div>
        <p className="text-[11px] text-amber-800">
          Si acabas de agregar la variable <code>VITE_GOOGLE_MAPS_API_KEY</code> en <strong>Vercel</strong>, recuerda hacer un <strong>Redeploy</strong> en la pestaña <em>Deployments</em> para que se compile con la nueva clave.
        </p>
        <p className="text-[11px] text-amber-800">
          Si estás en local (localhost), reinicia tu terminal con <code>npm run dev</code>.
        </p>
        <p className="text-[11px] text-gray-500">
          Mientras tanto, puedes hacer clic en la pestaña superior <strong>Satélite HD / Relieve / OSM</strong> para ubicar la entrega en el mapa.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Error al conectar con Google Maps</span>
        </div>
        <p className="text-[11px] text-rose-800">
          Google Maps no pudo cargarse ({loadError.message || 'Verifica la consola'}). Asegúrate de que tu clave tenga habilitadas en Google Cloud Console: <strong>Maps JavaScript API</strong> y <strong>Places API</strong>, y que tu dominio esté autorizado.
        </p>
        <p className="text-[11px] text-gray-600">
          Puedes hacer clic en la pestaña <strong>Satélite HD / Relieve / OSM</strong> para continuar trabajando.
        </p>
      </div>
    );
  }

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
      {/* Buscador de Direcciones con Google Places Autocomplete */}
      <div>
        <label className="block text-xs font-bold text-chocolate-700 mb-1 uppercase tracking-wider">
          Buscar Dirección Oficial (Google Places)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-chocolate-400 z-10">
            <Search className="w-4 h-4" />
          </div>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
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

      {/* Mapa interactivo con Marcador Arrastrable */}
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

        {/* Instrucción visual sobre el mapa */}
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-trigo-200 text-[10px] text-chocolate-700 font-bold flex items-center space-x-1.5 shadow-sm">
          <Navigation className="w-3 h-3 text-frambuesa-600 animate-pulse" />
          <span>Arrastra el pin o toca el mapa para afinar el punto de entrega</span>
        </div>
      </div>

      {/* Muestra visual de Coordenadas en tiempo real */}
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
          <span className="px-2.5 py-1 rounded-lg bg-white text-chocolate-800 border border-trigo-300 font-bold shadow-2xs">
            Lat: <strong className="text-frambuesa-600">{currentCoords.lat.toFixed(6)}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white text-chocolate-800 border border-trigo-300 font-bold shadow-2xs">
            Lng: <strong className="text-frambuesa-600">{currentCoords.lng.toFixed(6)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
export default MapLocationPicker;
