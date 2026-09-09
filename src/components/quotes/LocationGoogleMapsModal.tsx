import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { getGoogleMapsUrl, getWazeUrl } from '../../utils/deliveryHelper';

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

// Chips rápidos de municipios y sectores frecuentes en República Dominicana
const RD_QUICK_TAGS = [
  'Jarabacoa',
  'La Vega',
  'Santo Domingo',
  'Santiago',
  'Constanza',
  'Bonao',
  'Naco',
  'Piantini',
  'Bella Vista',
  'Gazcue',
];

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
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' callejero, 'k' satélite
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Inicializar estado al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setInputDireccion(direccion || '');
      setInputPuntoRef(puntoReferencia || '');
      setInputMapsUrl(mapsUrl || '');
      setSearchBox(direccion || '');
      setZoomLevel(16);
      setIsIframeLoading(true);
      setCopiedLink(false);
      setDetectedCoords(null);

      // Si mapsUrl viene con coordenadas lat,lng extraerlas
      if (mapsUrl) {
        const coordsMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                            mapsUrl.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                            mapsUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          setDetectedCoords({
            lat: parseFloat(coordsMatch[1]),
            lng: parseFloat(coordsMatch[2]),
          });
        }
      }
    }
  }, [isOpen, direccion, puntoReferencia, mapsUrl]);

  // Construir la consulta de búsqueda para Google Maps
  const effectiveQuery = useMemo(() => {
    // 1. Si hay coordenadas detectadas
    if (detectedCoords) {
      return `${detectedCoords.lat},${detectedCoords.lng}`;
    }

    // 2. Si el usuario escribió en la barra de búsqueda rápida
    const baseText = inputDireccion.trim() || searchBox.trim();
    if (!baseText) {
      return 'República Dominicana';
    }

    const parts: string[] = [baseText];
    if (inputPuntoRef.trim()) {
      parts.push(`(${inputPuntoRef.trim()})`);
    }

    // Asegurar contexto de República Dominicana si no se ha especificado
    const lower = baseText.toLowerCase();
    if (!lower.includes('dominic') && !lower.includes('rep.')) {
      parts.push('República Dominicana');
    }

    return parts.join(', ');
  }, [detectedCoords, inputDireccion, inputPuntoRef, searchBox]);

  // URL del iframe embebido sin requerir API key
  const embedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      effectiveQuery
    )}&t=${mapType}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;
  }, [effectiveQuery, mapType, zoomLevel]);

  // URL de navegación oficial para Google Maps
  const officialMapsUrl = useMemo(() => {
    if (inputMapsUrl && (inputMapsUrl.startsWith('http://') || inputMapsUrl.startsWith('https://'))) {
      return inputMapsUrl;
    }
    return getGoogleMapsUrl(inputDireccion || searchBox, inputPuntoRef);
  }, [inputMapsUrl, inputDireccion, searchBox, inputPuntoRef]);

  // URL de navegación para Waze
  const officialWazeUrl = useMemo(() => {
    return getWazeUrl(inputDireccion || searchBox);
  }, [inputDireccion, searchBox]);

  // Manejar pegado o búsqueda de enlaces/direcciones
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchBox.trim();
    if (!query) return;

    // Detectar si el texto pegado es una URL de Google Maps o Waze
    const isUrl = query.startsWith('http://') || query.startsWith('https://');
    if (isUrl) {
      setInputMapsUrl(query);

      // Extraer coordenadas si vienen en la URL
      const coordsMatch = query.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                          query.match(/query=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                          query.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);

      if (coordsMatch) {
        const lat = parseFloat(coordsMatch[1]);
        const lng = parseFloat(coordsMatch[2]);
        setDetectedCoords({ lat, lng });
        if (!inputDireccion) {
          setInputDireccion(`Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        }
      } else {
        // Enlace corto o estándar
        setDetectedCoords(null);
      }
    } else {
      // Es una dirección en texto
      setInputDireccion(query);
      setDetectedCoords(null);
    }
    setIsIframeLoading(true);
  };

  // Añadir un sector o ciudad rápido a la dirección
  const handleAddQuickTag = (tag: string) => {
    if (!inputDireccion.toLowerCase().includes(tag.toLowerCase())) {
      const nuevaDir = inputDireccion.trim()
        ? `${inputDireccion.trim()}, ${tag}`
        : tag;
      setInputDireccion(nuevaDir);
      setSearchBox(nuevaDir);
      setDetectedCoords(null);
      setIsIframeLoading(true);
    }
  };

  // Obtener geolocalización actual del navegador
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDetectedCoords({ lat, lng });
        const gpsLabel = `Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        setInputDireccion(gpsLabel);
        setSearchBox(gpsLabel);
        setInputMapsUrl(`https://www.google.com/maps?q=${lat},${lng}`);
        setIsIframeLoading(true);
      },
      (err) => {
        setGeoLocating(false);
        alert(`No se pudo obtener la ubicación actual: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Copiar enlace al portapapeles
  const handleCopyLink = () => {
    navigator.clipboard.writeText(officialMapsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Guardar y aplicar la ubicación
  const handleApply = () => {
    const finalDir = inputDireccion.trim() || searchBox.trim();
    if (!finalDir) {
      alert('Por favor especifica una dirección exacta o busca un punto en el mapa.');
      return;
    }

    onSave({
      direccion: finalDir,
      punto_referencia: inputPuntoRef.trim(),
      mapsUrl: inputMapsUrl.trim() || officialMapsUrl,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista Previa y Corrección de Ubicación con Google Maps"
      subtitle="Visualiza el mapa en tiempo real, verifica el punto de entrega y ajusta la dirección o referencia para el chofer."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Banner Informativo del Cliente / Zona */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-crema/60 border border-trigo-200 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-frambuesa-100 text-frambuesa-700 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-chocolate-900 block">
                {clienteNombre ? `Cliente: ${clienteNombre}` : 'Destino del Envío'}
              </span>
              <span className="text-chocolate-600 text-[11px]">
                {zonaNombre ? `Tarifa por Zona: ${zonaNombre}` : 'Ubicación de entrega a domicilio'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={geoLocating}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Obtener coordenadas GPS de este dispositivo"
            >
              <Compass className={`w-3.5 h-3.5 text-emerald-600 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Obteniendo GPS...' : '📍 Mi Ubicación GPS'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Rápida / Pegado de Enlace Google Maps */}
        <form onSubmit={handleSearchSubmit} className="space-y-1.5">
          <label className="block text-xs font-bold text-chocolate-800">
            🔍 Motor de Búsqueda en Google Maps / Pegar Enlace GPS o Coordenadas:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Escribe una calle, sector, negocio o pega enlace https://maps.app.goo.gl/... o '19.123, -70.567'"
                value={searchBox}
                onChange={(e) => setSearchBox(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white text-xs text-chocolate-900 font-medium"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold shadow-sm transition shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Centrar Mapa</span>
            </button>
          </div>
        </form>

        {/* Chips de Sectores y Municipios Frecuentes en RD */}
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
              className="px-2 py-0.5 rounded-lg bg-crema hover:bg-amber-100 text-chocolate-800 border border-trigo-200 text-[10px] font-semibold transition shadow-2xs cursor-pointer"
            >
              +{tag}
            </button>
          ))}
        </div>

        {/* VISOR EMBEBIDO INTERACTIVO DE GOOGLE MAPS */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-trigo-300 shadow-md bg-stone-100">
          {/* Controles Flotantes Superiores en el Mapa */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-stone-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMapType('m')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                mapType === 'm'
                  ? 'bg-chocolate-700 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Callejero</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType('k')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                mapType === 'k'
                  ? 'bg-chocolate-700 text-white shadow-2xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Satélite</span>
            </button>
          </div>

          {/* Botones de Zoom y Refrescar */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-md border border-stone-200">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(20, prev + 1))}
              className="w-7 h-7 flex items-center justify-center font-bold text-chocolate-800 hover:bg-stone-100 rounded-lg text-sm cursor-pointer"
              title="Acercar Zoom"
            >
              +
            </button>
            <span className="text-[10px] font-mono text-gray-500 px-1 font-bold">
              z{zoomLevel}
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(10, prev - 1))}
              className="w-7 h-7 flex items-center justify-center font-bold text-chocolate-800 hover:bg-stone-100 rounded-lg text-sm cursor-pointer"
              title="Alejar Zoom"
            >
              -
            </button>
            <div className="w-[1px] h-4 bg-gray-300 mx-0.5" />
            <button
              type="button"
              onClick={() => setIsIframeLoading(true)}
              className="p-1.5 text-stone-600 hover:text-chocolate-800 hover:bg-stone-100 rounded-lg cursor-pointer"
              title="Recargar vista de mapa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Iframe Embebido de Google Maps */}
          <div className="relative w-full h-72 sm:h-96">
            {isIframeLoading && (
              <div className="absolute inset-0 bg-stone-100/90 flex flex-col items-center justify-center gap-2 text-chocolate-600 z-5">
                <div className="w-7 h-7 border-3 border-frambuesa-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Cargando motor de Google Maps...</span>
              </div>
            )}
            <iframe
              title="Google Maps Location Preview"
              src={embedUrl}
              onLoad={() => setIsIframeLoading(false)}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Barra Inferior del Visor: Indicador de Consulta Activa */}
          <div className="bg-slate-900 text-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-slate-400 text-[11px] truncate">
                Mostrando en mapa:{' '}
                <strong className="text-white font-medium">{effectiveQuery}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={officialMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 underline"
                title="Abrir en pestaña completa de Google Maps para explorar con Street View"
              >
                <span>↗️ Abrir en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={officialWazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                title="Probar ruta en Waze"
              >
                <span>🚙 Probar en Waze</span>
              </a>
            </div>
          </div>
        </div>

        {/* CAMPOS DE EDICIÓN Y CORRECCIÓN DE DIRECCIÓN */}
        <div className="bg-white p-4 rounded-2xl border border-trigo-300 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-trigo-100 pb-2">
            <span className="font-bold text-chocolate-900 uppercase tracking-wider text-[11px]">
              ✏️ Corrección de Datos para la Cotización
            </span>
            <span className="text-[10px] text-gray-400">
              Estos campos se guardarán en la cotización y se enviarán al repartidor
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
                  setDetectedCoords(null);
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
              Enlace de Google Maps / Coordenadas GPS <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://maps.app.goo.gl/... o coordenadas 19.123, -70.567"
                value={inputMapsUrl}
                onChange={(e) => setInputMapsUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white text-xs font-mono text-chocolate-800"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl border border-trigo-300 hover:bg-crema text-chocolate-700 font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                title="Copiar enlace para compartir al cliente o chofer"
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
            <span>Al confirmar, la ubicación corregida se aplicará a la cotización.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-trigo-300 hover:bg-gray-100 text-chocolate-700 font-bold text-xs transition cursor-pointer"
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
