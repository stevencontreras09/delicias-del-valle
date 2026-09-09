import React, { useState } from 'react';
import { ShieldAlert, Snowflake, Car, AlertTriangle, Heart, Printer, X, Check } from 'lucide-react';

interface CakeCareCardProps {
  pedidoId: string | number;
  nombrePastel?: string;
  clienteNombre?: string;
  fechaEntrega?: string;
  onClose?: () => void;
}

export const CakeCareCard: React.FC<CakeCareCardProps> = ({
  pedidoId,
  nombrePastel = 'Pastel Artesanal',
  clienteNombre,
  fechaEntrega,
  onClose,
}) => {
  const [deseaImprimir, setDeseaImprimir] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="cake-care-card-container"
      className="bg-white p-5 sm:p-6 rounded-3xl shadow-xl max-w-sm mx-auto border border-amber-200 print:border-none print:shadow-none print:p-2 print:m-0 print:w-full print:max-w-none text-stone-800 animate-fade-in"
    >
      {/* Encabezado con Identidad de Marca */}
      <div className="text-center pb-3 border-b-2 border-dashed border-amber-300">
        <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-amber-950 font-serif">
          Delicias del Valle
        </h2>
        <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-0.5">
          <Heart className="w-3.5 h-3.5 fill-rose-600" /> Guía de Cuidados del Pastel
        </p>
        <div className="mt-1.5 bg-amber-50/80 rounded-xl px-2.5 py-1 border border-amber-200/60 inline-block">
          <p className="text-[11px] text-stone-600 font-medium">
            Factura: <span className="font-mono font-bold text-amber-900">#{pedidoId}</span>
            {clienteNombre ? ` • ${clienteNombre}` : ''}
          </p>
          <p className="text-[10px] text-stone-500 font-semibold truncate max-w-[280px]">
            {nombrePastel} {fechaEntrega ? `• ${fechaEntrega}` : ''}
          </p>
        </div>
      </div>

      {/* Instrucciones Críticas Ilustradas */}
      <div className="py-3.5 space-y-3 text-xs">
        <div className="flex items-start gap-3 bg-stone-50/60 p-2 rounded-xl border border-stone-100 print:bg-transparent print:p-0 print:border-none">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5 print:bg-transparent">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-stone-900 block text-[12px]">1. Transporte Seguro en Vehículo</span>
            <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
              Colócalo siempre en el <strong>piso plano</strong> del auto (área copiloto). <em>Nunca en los asientos inclinados ni sobre las piernas</em>.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-stone-50/60 p-2 rounded-xl border border-stone-100 print:bg-transparent print:p-0 print:border-none">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 shrink-0 mt-0.5 print:bg-transparent">
            <Snowflake className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-stone-900 block text-[12px]">2. Climatización al Máximo</span>
            <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
              Enciende el <strong>aire acondicionado al máximo</strong> antes de subir el pastel para proteger el suspiro o crema del calor ambiental.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-stone-50/60 p-2 rounded-xl border border-stone-100 print:bg-transparent print:p-0 print:border-none">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5 print:bg-transparent">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-stone-900 block text-[12px]">3. Sujeción y Apoyo Firme</span>
            <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
              Toma la caja siempre <strong>por la base rígida</strong> con ambas manos. No la presiones por los lados ni la inclines al caminar.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-stone-50/60 p-2 rounded-xl border border-stone-100 print:bg-transparent print:p-0 print:border-none">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5 print:bg-transparent">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-stone-900 block text-[12px]">4. Temperatura Antes de Servir</span>
            <p className="text-[11px] text-stone-600 leading-snug mt-0.5">
              Mantener en refrigeración. Sacar a temperatura ambiente <strong>30 a 45 minutos antes</strong> de cantar cumpleaños para disfrutar la textura ideal.
            </p>
          </div>
        </div>
      </div>

      {/* Pie de tarjeta */}
      <div className="pt-2.5 border-t border-stone-200 text-center">
        <p className="text-[10px] font-semibold text-stone-500 italic">
          ¡Gracias por permitirnos endulzar tu momento especial! 🎉
        </p>
      </div>

      {/* Opciones y Controles en Pantalla (Ocultos al Imprimir) */}
      <div className="mt-4 pt-3 border-t border-amber-100 space-y-3 print:hidden">
        {/* Toggle opcional de imprimir label */}
        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer select-none bg-amber-50/70 p-2 rounded-xl border border-amber-200">
          <input
            type="checkbox"
            checked={deseaImprimir}
            onChange={(e) => setDeseaImprimir(e.target.checked)}
            className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 border-gray-300"
          />
          <span>Deseo imprimir etiqueta adhesiva / comanda para la caja</span>
        </label>

        <div className="flex items-center gap-2">
          {deseaImprimir ? (
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-warm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta</span>
            </button>
          ) : (
            <div className="flex-1 text-[11px] text-stone-500 text-center py-1">
              (Vista previa digital informativa)
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
