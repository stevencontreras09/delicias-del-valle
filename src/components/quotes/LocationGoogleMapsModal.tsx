import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { MapLocationPicker } from '../maps/MapLocationPicker';
import {
  MapPin,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Compass,
} from 'lucide-react';
import { DELICIAS_WORKSHOP_COORDS } from '../../utils/routeOptimizer';

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

// Extraer coordenadas de un enlace o texto si existen
const extractCoordsFromText = (text: string): { lat: number; lng: number } | null => {
  if (!text) return null;
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const qMatch = text.match(/(?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  const numMatch = text.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
  if (numMatch) return { lat: parseFloat(numMatch[1]), lng: parseFloat(numMatch[2]) };

  return null;
};

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
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DELICIAS_WORKSHOP_COORDS.lat,
    lng: DELICIAS_WORKSHOP_COORDS.lng,
  });
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputDireccion(direccion || '');
      setInputPuntoRef(puntoReferencia || '');
      setInputMapsUrl(mapsUrl || '');

      const parsed = extractCoordsFromText(mapsUrl || direccion);
      if (parsed) {
        setCoords(parsed);
      } else {
        setCoords({
          lat: DELICIAS_WORKSHOP_COORDS.lat,
          lng: DELICIAS_WORKSHOP_COORDS.lng,
        });
      }
    }
  }, [isOpen, direccion, puntoReferencia, mapsUrl]);

  const handleCopyLink = () => {
    const url = inputMapsUrl || `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApply = () => {
    const finalDir = inputDireccion.trim();
    if (!finalDir) {
      alert('Por favor escribe una dirección exacta o selecciona un punto en el mapa de Google.');
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

  const googleMapsSearchUrl =
    inputMapsUrl || `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ubicación de Entrega con Google Maps"
      subtitle="Buscador oficial de lugares de Google Places y mapa con marcador arrastrable 🎂 en tiempo real."
      maxWidth="3xl"
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
                {zonaNombre ? `Tarifa por Zona: ${zonaNombre}` : 'Usa el buscador de Google o arrastra el pin'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 text-[11px] font-bold transition shadow-2xs"
            >
              <span>Abrir en Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* MAPA OFICIAL DE GOOGLE MAPS API CON GOOGLE PLACES AUTOCOMPLETE */}
        <div className="rounded-2xl overflow-hidden border-2 border-trigo-300 shadow-sm bg-white p-3">
          <MapLocationPicker
            latitude={coords.lat}
            longitude={coords.lng}
            address={inputDireccion}
            puntoReferencia={inputPuntoRef}
            onChangeLocation={(loc) => {
              if (loc.latitude && loc.longitude) {
                setCoords({ lat: loc.latitude, lng: loc.longitude });
              }
              if (loc.address) {
                setInputDireccion(loc.address);
              }
              if (loc.mapsUrl) {
                setInputMapsUrl(loc.mapsUrl);
              }
            }}
          />
        </div>

        {/* CAMPOS DE DIRECCIÓN Y REFERENCIA */}
        <div className="bg-white p-4 rounded-2xl border border-trigo-300 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-trigo-100 pb-2">
            <span className="font-bold text-chocolate-900 uppercase tracking-wider text-[11px]">
              ✏️ Dirección Validada para el Pedido y Repartidor
            </span>
            <span className="text-[10px] text-gray-400">
              Se guarda en la orden para optimización de ruta
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Dirección Exacta de Entrega *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Calle, Número, Edificio, Apto, Sector..."
                  value={inputDireccion}
                  onChange={(e) => setInputDireccion(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-medium text-chocolate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Punto de Referencia (Color de casa, verja, frente a...) *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ej: Portón negro, frente al parque, timbre blanco..."
                  value={inputPuntoRef}
                  onChange={(e) => setInputPuntoRef(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-medium text-chocolate-900 text-xs"
                />
              </div>
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
                onChange={(e) => {
                  setInputMapsUrl(e.target.value);
                  const parsed = extractCoordsFromText(e.target.value);
                  if (parsed) setCoords(parsed);
                }}
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
            <span>Al confirmar, la ubicación de Google Maps se aplicará al pedido.</span>
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
