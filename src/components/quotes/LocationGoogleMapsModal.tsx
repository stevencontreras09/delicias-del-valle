import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  ExternalLink,
  Navigation,
  Layers,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Compass,
  AlertCircle,
  HelpCircle,
  Mountain,
  Globe,
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface LocationGoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  direccion: string;
  puntoReferencia?: string;
  mapsUrl?: string;
  zonaNombre?: string;
  clienteNombre?: string;
  onSave: (data: {
    direccion: string;
    punto_referencia: string;
    mapsUrl?: string;
  }) => void;
}

// Coordenadas por defecto (Santo Domingo / República Dominicana)
const DEFAULT_LAT = 18.4861;
const DEFAULT_LNG = -69.9312;

// Capas de mapas soportadas (priorizando Google Maps oficial)
type MapLayerType = 'google-callejero' | 'google-satelite' | 'google-terreno' | 'osm';

const MAP_LAYERS: Record<
  MapLayerType,
  { name: string; url: string; options: L.TileLayerOptions; isGoogle: boolean }
> = {
  'google-callejero': {
    name: 'Google Callejero',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
    isGoogle: true,
  },
  'google-satelite': {
    name: 'Google Satélite HD',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps Satélite (Híbrido)',
    },
    isGoogle: true,
  },
  'google-terreno': {
    name: 'Google Terreno',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    options: {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: '&copy; Google Maps Terreno',
    },
    isGoogle: true,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    },
    isGoogle: false,
  },
};

// Chips rápidos de municipios y sectores frecuentes en República Dominicana
const RD_QUICK_TAGS = [
  'Jarabacoa',
  'La Vega',
  'Santo Domingo',
  'Santiago',
  'Constanza',
  'Bonao',
  'Zona Colonial',
  'Piantini',
  'Naco',
  'Bella Vista',
];

// Crear icono personalizado tipo pin para Leaflet
const createPinIcon = () =>
  L.divIcon({
    className: 'custom-delicias-pin',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -100%); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.35)); cursor: grab;">
        <div style="
          background: linear-gradient(135deg, #E91E63, #9C27B0);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 4px 10px rgba(233,30,99,0.45);
        ">
          <span style="transform: rotate(45deg); font-size: 20px; line-height: 1; user-select: none;">🎂</span>
        </div>
        <div style="
          width: 14px;
          height: 5px;
          background: rgba(0,0,0,0.35);
          border-radius: 50%;
          margin-top: 3px;
          filter: blur(0.8px);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

interface SearchSuggestion {
  name: string;
  lat: number;
  lng: number;
}

export const LocationGoogleMapsModal: React.FC<LocationGoogleMapsModalProps> = ({
  isOpen,
  onClose,
  direccion,
  puntoReferencia = '',
  mapsUrl = '',
  zonaNombre,
  clienteNombre,
  onSave,
}) => {
  const [inputDireccion, setInputDireccion] = useState('');
  const [inputPuntoRef, setInputPuntoRef] = useState('');
  const [inputMapsUrl, setInputMapsUrl] = useState('');
  const [searchBox, setSearchBox] = useState('');
  const [mapType, setMapType] = useState<MapLayerType>('google-callejero');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Extraer coordenadas de un enlace o texto si existen
  const extractCoordsFromText = (text: string): { lat: number; lng: number } | null => {
    if (!text) return null;
    // Formato @lat,lng
    const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    // Formato q=lat,lng o query=lat,lng
    const qMatch = text.match(/(?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

    // Formato directo lat, lng (ej: "18.4861, -69.9312")
    const numMatch = text.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
    if (numMatch) return { lat: parseFloat(numMatch[1]), lng: parseFloat(numMatch[2]) };

    return null;
  };

  // Actualizar la capa de mosaicos del mapa
  const updateTileLayer = useCallback((map: L.Map, type: MapLayerType) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const layerConfig = MAP_LAYERS[type] || MAP_LAYERS['google-callejero'];
    tileLayerRef.current = L.tileLayer(layerConfig.url, layerConfig.options).addTo(map);
  }, []);

  // Función para mover el marcador y centrar mapa
  const setMarkerPosition = useCallback((lat: number, lng: number, zoom?: number) => {
    setCoords({ lat, lng });
    const generatedGoogleUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    setInputMapsUrl(generatedGoogleUrl);

    if (mapInstanceRef.current) {
      if (zoom) {
        mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.0 });
      } else {
        mapInstanceRef.current.panTo([lat, lng], { animate: true });
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPinIcon(),
          draggable: true,
        }).addTo(mapInstanceRef.current);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          setInputMapsUrl(`https://www.google.com/maps?q=${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`);
          setSearchStatus(`Pin ajustado: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
        });

        markerRef.current = marker;
      }
    }
  }, []);

  // Geocodificar texto mediante Photon (CORS habilitado, sin bloqueo 403, con sesgo hacia Rep. Dom.)
  const geocodeAddress = useCallback(
    async (query: string) => {
      if (!query || !query.trim()) return;
      setIsSearching(true);
      setSearchStatus('Buscando en Google Maps...');
      setSearchSuggestions([]);

      try {
        // Si la búsqueda son coordenadas directas o enlace
        const parsed = extractCoordsFromText(query);
        if (parsed) {
          setMarkerPosition(parsed.lat, parsed.lng, 17);
          setSearchStatus(`Punto fijado por coordenadas (${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)})`);
          setIsSearching(false);
          return;
        }

        const qClean = query.trim();
        const hasDR =
          qClean.toLowerCase().includes('rep') ||
          qClean.toLowerCase().includes('dominic') ||
          qClean.toLowerCase().includes('santo domingo') ||
          qClean.toLowerCase().includes('jarabacoa') ||
          qClean.toLowerCase().includes('santiago') ||
          qClean.toLowerCase().includes('la vega');

        const finalQ = hasDR ? qClean : `${qClean}, Republica Dominicana`;

        // Llamar a Photon con sesgo geográfico en República Dominicana (lat 18.73, lon -70.16)
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          finalQ
        )}&lat=18.7357&lon=-70.1627&limit=5`;

        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        if (data?.features && data.features.length > 0) {
          const best = data.features[0];
          const [lng, lat] = best.geometry.coordinates;
          setMarkerPosition(lat, lng, 17);

          const mainName = [
            best.properties.name,
            best.properties.street,
            best.properties.locality || best.properties.city,
            best.properties.state,
          ]
            .filter(Boolean)
            .join(', ');

          setSearchStatus(`Encontrado: ${mainName || 'Punto identificado'}`);

          // Si hay más opciones, preparar sugerencias para elegir
          if (data.features.length > 1) {
            const suggestions: SearchSuggestion[] = data.features.slice(0, 4).map((f: any) => ({
              name: [f.properties.name, f.properties.street, f.properties.locality || f.properties.city]
                .filter(Boolean)
                .join(', '),
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            }));
            setSearchSuggestions(suggestions);
          }
        } else {
          setSearchStatus('No se encontró dirección exacta. Haz clic o arrastra el pin 🎂 en el mapa.');
        }
      } catch (e) {
        setSearchStatus('Ubicación manual: arrastra el pin 🎂 o haz clic en cualquier calle del mapa.');
      } finally {
        setIsSearching(false);
      }
    },
    [setMarkerPosition]
  );

  // Inicializar Leaflet cuando el modal se abre
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
      }
      return;
    }

    setInputDireccion(direccion || '');
    setInputPuntoRef(puntoReferencia || '');
    setInputMapsUrl(mapsUrl || '');
    setSearchBox(direccion || '');
    setSearchStatus(null);
    setSearchSuggestions([]);
    setCopiedLink(false);

    // Intentar extraer coordenadas iniciales de mapsUrl o dirección
    let initialLat = DEFAULT_LAT;
    let initialLng = DEFAULT_LNG;
    let hasExplicitCoords = false;

    const coordsFromUrl = extractCoordsFromText(mapsUrl);
    const coordsFromDir = extractCoordsFromText(direccion);

    if (coordsFromUrl) {
      initialLat = coordsFromUrl.lat;
      initialLng = coordsFromUrl.lng;
      hasExplicitCoords = true;
    } else if (coordsFromDir) {
      initialLat = coordsFromDir.lat;
      initialLng = coordsFromDir.lng;
      hasExplicitCoords = true;
    }

    setCoords({ lat: initialLat, lng: initialLng });

    // Esperar a que el DOM del modal esté montado para inicializar Leaflet
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: hasExplicitCoords ? 17 : 14,
          zoomControl: false,
          attributionControl: true,
        });

        // Capa de mosaicos inicial (Google Maps Callejero por defecto)
        updateTileLayer(map, mapType);

        // Control de zoom en la esquina superior derecha
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Marcador con pin temático de Delicias del Valle
        const marker = L.marker([initialLat, initialLng], {
          icon: createPinIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          setInputMapsUrl(`https://www.google.com/maps?q=${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`);
          setSearchStatus(`Pin ajustado: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
        });

        // Clic en cualquier parte del mapa para reposicionar el pin
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setMarkerPosition(lat, lng);
          setSearchStatus(`Pin colocado: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Invalidate size inmediato
        map.invalidateSize();

        // Si hay una dirección escrita y no había coordenadas fijas, geocodificarla automáticamente
        if (!hasExplicitCoords && direccion.trim()) {
          geocodeAddress(direccion);
        }
      }
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, direccion, puntoReferencia, mapsUrl, geocodeAddress, mapType, updateTileLayer, setMarkerPosition]);

  // Observador de Redimensionamiento (Garantiza que las teselas de Google Maps carguen siempre en el modal)
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    observer.observe(mapContainerRef.current);

    // Varios ticks de invalidación para asegurar el cálculo post-animación CSS del modal
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
    const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 650);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  // Cambiar entre modos de Google Maps
  const handleToggleMapType = (type: MapLayerType) => {
    setMapType(type);
    if (mapInstanceRef.current) {
      updateTileLayer(mapInstanceRef.current, type);
      mapInstanceRef.current.invalidateSize();
    }
  };

  // Manejar submit del buscador
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchBox.trim();
    if (!q) return;

    // Detectar si pegaron una URL de Google Maps o Waze
    const isUrl = q.startsWith('http://') || q.startsWith('https://');
    if (isUrl) {
      setInputMapsUrl(q);
      const extracted = extractCoordsFromText(q);
      if (extracted) {
        setMarkerPosition(extracted.lat, extracted.lng, 17);
        setSearchStatus(`Coordenadas extraídas del enlace: ${extracted.lat.toFixed(5)}, ${extracted.lng.toFixed(5)}`);
        if (!inputDireccion) {
          setInputDireccion(`Ubicación GPS (${extracted.lat.toFixed(5)}, ${extracted.lng.toFixed(5)})`);
        }
        return;
      }
    }

    // Geocodificar dirección o lugar
    geocodeAddress(q);
    if (!inputDireccion) {
      setInputDireccion(q);
    }
  };

  // Añadir un tag rápido
  const handleAddQuickTag = (tag: string) => {
    const current = inputDireccion.trim() || searchBox.trim();
    if (!current.toLowerCase().includes(tag.toLowerCase())) {
      const updated = current ? `${current}, ${tag}` : tag;
      setInputDireccion(updated);
      setSearchBox(updated);
      geocodeAddress(updated);
    }
  };

  // Geolocalización del navegador
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setGeoLocating(true);
    setSearchStatus('Obteniendo tu ubicación actual por GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarkerPosition(lat, lng, 17);
        const label = `Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        if (!inputDireccion) setInputDireccion(label);
        setSearchBox(label);
        setSearchStatus('Ubicación actual GPS fijada con éxito.');
      },
      (err) => {
        setGeoLocating(false);
        alert(`No se pudo obtener la ubicación GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Copiar enlace al portapapeles
  const handleCopyLink = () => {
    const url = inputMapsUrl || `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // URLs oficiales para Google Maps y Waze
  const googleMapsSearchUrl =
    inputMapsUrl || `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
  const wazeSearchUrl = `https://waze.com/ul?ll=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}&navigate=yes`;

  // Guardar y aplicar ubicación
  const handleApply = () => {
    const finalDir = inputDireccion.trim() || searchBox.trim();
    if (!finalDir) {
      alert('Por favor escribe una dirección exacta o selecciona un punto en el mapa.');
      return;
    }

    const finalMapsUrl =
      inputMapsUrl.trim() ||
      `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;

    onSave({
      direccion: finalDir,
      punto_referencia: inputPuntoRef.trim(),
      mapsUrl: finalMapsUrl,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista Previa y Corrección de Ubicación con Google Maps"
      subtitle="Mapa interactivo oficial en tiempo real: arrastra el pin 🎂 o haz clic en cualquier calle para ubicar la entrega."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Banner Informativo Superior */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-crema/60 border border-trigo-200 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-frambuesa-100 text-frambuesa-700 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-chocolate-900 block">
                {clienteNombre ? `Cliente: ${clienteNombre}` : 'Destino del Envío a Domicilio'}
              </span>
              <span className="text-chocolate-600 text-[11px]">
                {zonaNombre ? `Tarifa por Zona: ${zonaNombre}` : 'Haz clic o arrastra el pin para fijar la entrega'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={geoLocating}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title="Obtener coordenadas GPS de este dispositivo"
            >
              <Compass className={`w-3.5 h-3.5 text-emerald-600 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Obteniendo GPS...' : '📍 Mi Ubicación GPS'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda de Direcciones o Enlaces */}
        <form onSubmit={handleSearchSubmit} className="space-y-1.5">
          <label className="block text-xs font-bold text-chocolate-800">
            🔍 Buscar calle, negocio, sector o pegar enlace de Google Maps / Coordenadas:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ej: 'C. Max Henriquez Ureña 108, Santo Domingo', 'Hodelpa zona colonial', o '18.486, -69.931'"
                value={searchBox}
                onChange={(e) => setSearchBox(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white text-xs text-chocolate-900 font-medium"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold shadow-sm transition shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Search className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Buscando...' : 'Ubicar en Mapa'}</span>
            </button>
          </div>

          {/* Sugerencias encontradas para elegir */}
          {searchSuggestions.length > 0 && (
            <div className="p-2 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-amber-800 block">
                Lugares sugeridos (haz clic para centrar en el mapa):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {searchSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMarkerPosition(sug.lat, sug.lng, 17);
                      setSearchStatus(`Ubicación seleccionada: ${sug.name}`);
                      setSearchSuggestions([]);
                    }}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-amber-100 text-chocolate-800 border border-amber-300 text-[11px] font-medium transition cursor-pointer text-left truncate max-w-full"
                  >
                    📍 {sug.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Chips de Sectores Frecuentes en RD */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-chocolate-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Sugerencias RD:
          </span>
          {RD_QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddQuickTag(tag)}
              className="px-2 py-0.5 rounded-lg bg-crema hover:bg-amber-100 text-chocolate-800 border border-trigo-200 text-[10px] font-semibold transition shadow-2xs cursor-pointer active:scale-95"
            >
              +{tag}
            </button>
          ))}
        </div>

        {/* VISOR INTERACTIVO CON MOTOR OFICIAL DE GOOGLE MAPS */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-trigo-300 shadow-md bg-stone-100">
          {/* Selector de Modo Google Maps (Callejero, Satélite HD, Terreno, OSM) */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-stone-200 text-[11px] font-bold max-w-[calc(100%-80px)] overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleToggleMapType('google-callejero')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 ${
                mapType === 'google-callejero'
                  ? 'bg-chocolate-700 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Google Maps Estándar / Callejero"
            >
              <Navigation className="w-3 h-3" />
              <span>Google Callejero</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleMapType('google-satelite')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 ${
                mapType === 'google-satelite'
                  ? 'bg-chocolate-700 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Google Maps Satélite con calles y nombres oficiales"
            >
              <Layers className="w-3 h-3" />
              <span>Google Satélite HD</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleMapType('google-terreno')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 ${
                mapType === 'google-terreno'
                  ? 'bg-chocolate-700 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              title="Google Maps Relieve y Terreno"
            >
              <Mountain className="w-3 h-3" />
              <span>Terreno</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleMapType('osm')}
              className={`px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shrink-0 ${
                mapType === 'osm'
                  ? 'bg-stone-700 text-white shadow-2xs'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
              title="Mapa alternativo OpenStreetMap"
            >
              <Globe className="w-3 h-3" />
              <span className="hidden md:inline">OSM</span>
            </button>
          </div>

          {/* Botón Flotante de Centrar / Recargar Pin */}
          <div className="absolute top-3 right-14 z-[400] bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-stone-200">
            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([coords.lat, coords.lng], 16, { animate: true });
                  mapInstanceRef.current.invalidateSize();
                }
              }}
              className="p-1.5 text-stone-700 hover:text-chocolate-800 hover:bg-stone-100 rounded-lg cursor-pointer flex items-center gap-1 text-[10px] font-bold active:scale-95"
              title="Centrar mapa en el pin 🎂"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Centrar Pin</span>
            </button>
          </div>

          {/* Contenedor del Mapa con soporte de altura fija responsiva */}
          <div
            ref={mapContainerRef}
            className="w-full h-80 sm:h-[400px] z-0"
            style={{ minHeight: '320px' }}
          />

          {/* Barra Inferior del Visor: Coordenadas y Enlaces Directos */}
          <div className="bg-slate-900 text-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-slate-400 text-[11px] truncate">
                Pin fijado en:{' '}
                <strong className="text-white font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </strong>
                {searchStatus && (
                  <span className="text-amber-400 font-normal ml-2">({searchStatus})</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={googleMapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 underline"
                title="Abrir este punto exacto en la app oficial de Google Maps"
              >
                <span>↗️ Abrir en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={wazeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                title="Probar ruta de entrega en Waze"
              >
                <span>🚙 Probar en Waze</span>
              </a>
            </div>
          </div>
        </div>

        {/* Guía Visual Rápida de Interacción */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <b>Tip:</b> Puedes <b>arrastrar el pin 🎂</b> o hacer <b>clic en cualquier calle</b> para reubicar la entrega exactamente donde vive el cliente.
          </span>
        </div>

        {/* CAMPOS DE EDICIÓN Y CORRECCIÓN DE DIRECCIÓN */}
        <div className="bg-white p-4 rounded-2xl border border-trigo-300 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-trigo-100 pb-2">
            <span className="font-bold text-chocolate-900 uppercase tracking-wider text-[11px]">
              ✏️ Dirección Validada para la Cotización & Repartidor
            </span>
            <span className="text-[10px] text-gray-400">
              Estos campos se guardan en la cotización y van directo al chofer
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Dirección Exacta de Entrega *
              </label>
              <input
                type="text"
                placeholder="Calle, Número, Edificio, Apto, Sector..."
                value={inputDireccion}
                onChange={(e) => {
                  setInputDireccion(e.target.value);
                  setSearchBox(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-medium text-chocolate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Punto de Referencia (Color de casa, verja, frente a...) *
              </label>
              <input
                type="text"
                placeholder="Ej: Portón negro, frente al parque, timbre blanco..."
                value={inputPuntoRef}
                onChange={(e) => setInputPuntoRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-medium text-chocolate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-chocolate-700 mb-1">
              Enlace de Google Maps / Coordenadas GPS del Pin
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://www.google.com/maps?q=..."
                value={inputMapsUrl}
                onChange={(e) => setInputMapsUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white text-xs font-mono text-chocolate-800"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl border border-trigo-300 hover:bg-crema text-chocolate-700 font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Copiar enlace directo de Google Maps"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-trigo-200">
          <div className="flex items-center gap-1.5 text-xs text-chocolate-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Al confirmar, la ubicación corregida y el enlace de Maps se aplicarán a la cotización.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-trigo-300 hover:bg-gray-100 text-chocolate-700 font-bold text-xs transition cursor-pointer active:scale-95"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-warm transition transform hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar y Aplicar Ubicación</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
