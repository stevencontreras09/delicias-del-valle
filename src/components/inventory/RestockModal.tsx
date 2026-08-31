import React, { useState } from 'react';
import { Insumo } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import { PackagePlus } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
  onRestock: (id: number, cantidadComprada: number, nuevoPrecio?: number) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  insumo,
  onRestock,
}) => {
  const [cantidadEmpaques, setCantidadEmpaques] = useState<number | ''>(1);
  const [precioActualizado, setPrecioActualizado] = useState<number | ''>('');

  if (!insumo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cant = Number(cantidadEmpaques);
    if (!cant || cant <= 0) return;

    const nPrecio = precioActualizado !== '' ? Number(precioActualizado) : undefined;
    onRestock(insumo.id, cant, nPrecio);
    onClose();
  };

  const cantNum = typeof cantidadEmpaques === 'number' ? cantidadEmpaques : 0;
  const totalBaseAdded = cantNum * insumo.presentacion_empaque;
  const nuevoStockTotal = insumo.stock_actual + totalBaseAdded;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reabastecer Insumo"
      subtitle={`Ingreso de stock para: ${insumo.nombre}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-crema p-4 rounded-2xl border border-trigo-200 space-y-1 text-xs text-chocolate-700">
          <p>
            <span className="font-bold">Presentación habitual:</span> 1 {insumo.unidad_compra} (
            {formatUnit(insumo.presentacion_empaque, insumo.unidad_base)})
          </p>
          <p>
            <span className="font-bold">Stock actual:</span>{' '}
            {formatUnit(insumo.stock_actual, insumo.unidad_base)}
          </p>
          <p>
            <span className="font-bold">Último precio de compra:</span>{' '}
            {formatCurrency(insumo.precio_compra)}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Cantidad de Empaques Comprados ({insumo.unidad_compra}) *
          </label>
          <input
            type="number"
            step="1"
            min="1"
            required
            value={cantidadEmpaques}
            onChange={(e) => setCantidadEmpaques(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Nuevo Precio de Compra por Empaque ($) (Opcional si cambió)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={insumo.precio_compra.toString()}
            value={precioActualizado}
            onChange={(e) => setPrecioActualizado(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Si el precio varió, se recalculará automáticamente el costo base por {insumo.unidad_base}.
          </p>
        </div>

        <div className="bg-[#F0FDF4] p-3.5 rounded-2xl border border-green-200 text-xs text-green-900 space-y-1">
          <p className="font-bold">Resultado de esta recarga:</p>
          <p>+ {formatUnit(totalBaseAdded, insumo.unidad_base)} que ingresarán al almacén.</p>
          <p className="font-bold text-green-800">
            Nuevo stock proyectado: {formatUnit(nuevoStockTotal, insumo.unidad_base)}
          </p>
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-warm transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Confirmar Ingreso</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
