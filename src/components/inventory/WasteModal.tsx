import React, { useState } from 'react';
import { Insumo, MermaMotivo } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import { AlertOctagon } from 'lucide-react';

interface WasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
  onSaveMerma: (merma: {
    insumo_id: number;
    insumo_nombre: string;
    cantidad: number;
    unidad_base: 'g' | 'ml' | 'ud';
    motivo: MermaMotivo;
    fecha: string;
    notas: string;
  }) => void;
}

const MOTIVOS: { id: MermaMotivo; label: string }[] = [
  { id: 'caducidad', label: 'Caducidad / Vencimiento' },
  { id: 'quemado', label: 'Quemado / Sobre-cocción' },
  { id: 'derrame', label: 'Derrame / Accidente en mesa' },
  { id: 'error_pesado', label: 'Error de pesado / Mezcla fallida' },
  { id: 'calidad', label: 'Defecto de calidad de proveedor' },
  { id: 'otro', label: 'Otro motivo' },
];

export const WasteModal: React.FC<WasteModalProps> = ({
  isOpen,
  onClose,
  insumo,
  onSaveMerma,
}) => {
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState<MermaMotivo>('caducidad');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  if (!insumo) return null;

  const cantNum = typeof cantidad === 'number' ? cantidad : 0;
  const costoPerdido = cantNum * insumo.costo_unitario_base;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantNum || cantNum <= 0) return;

    onSaveMerma({
      insumo_id: insumo.id,
      insumo_nombre: insumo.nombre,
      cantidad: cantNum,
      unidad_base: insumo.unidad_base,
      motivo,
      fecha,
      notas: notas.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Merma / Desperdicio"
      subtitle={`Se descontará automáticamente del stock de: ${insumo.nombre}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-frambuesa-50/60 p-3.5 rounded-2xl border border-frambuesa-200 text-xs text-frambuesa-950 space-y-1">
          <p>
            <span className="font-bold">Stock disponible:</span>{' '}
            {formatUnit(insumo.stock_actual, insumo.unidad_base)}
          </p>
          <p>
            <span className="font-bold">Costo base:</span> {formatCurrency(insumo.costo_unitario_base)} /{' '}
            {insumo.unidad_base}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Cantidad a Descontar ({insumo.unidad_base}) *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            max={insumo.stock_actual}
            required
            placeholder={`Ej. 100 ${insumo.unidad_base}`}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Motivo de la Merma *
          </label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MermaMotivo)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm bg-white"
          >
            {MOTIVOS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Fecha del Suceso
          </label>
          <input
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Detalles / Observaciones
          </label>
          <textarea
            rows={2}
            placeholder="Explicación breve de lo ocurrido en taller..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
          />
        </div>

        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
          <span className="font-semibold">Pérdida monetaria calculada:</span>
          <span className="font-extrabold text-sm text-frambuesa-700">
            {formatCurrency(costoPerdido)}
          </span>
        </div>

        <div className="pt-3 border-t border-trigo-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold text-sm shadow-warm transition-all"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Registrar Merma</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
