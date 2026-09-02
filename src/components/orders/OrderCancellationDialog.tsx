import React, { useState } from 'react';
import { Pedido, Receta, Insumo } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import { AlertTriangle, RotateCcw, Trash2, ShieldAlert, Check } from 'lucide-react';

interface OrderCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  recetas: Receta[];
  insumosMap: Map<number, Insumo>;
  onConfirmCancellation: (
    pedidoId: number,
    resolution: 'reintegrar_stock' | 'declarar_merma',
    notas?: string
  ) => void;
}

export const OrderCancellationDialog: React.FC<OrderCancellationDialogProps> = ({
  isOpen,
  onClose,
  pedido,
  recetas,
  insumosMap,
  onConfirmCancellation,
}) => {
  const [resolution, setResolution] = useState<'reintegrar_stock' | 'declarar_merma'>('reintegrar_stock');
  const [motivoDetalle, setMotivoDetalle] = useState('');

  if (!pedido) return null;

  // Calcular insumos involucrados en el pedido
  const insumosInvolucrados: {
    insumoId: number;
    nombre: string;
    cantidad: number;
    unidad: string;
    costoEstimado: number;
  }[] = [];

  let totalCostoPerdido = 0;

  pedido.items.forEach((item) => {
    if (!item.receta_id) return;
    const receta = recetas.find((r) => r.id === item.receta_id);
    if (!receta) return;

    const factor = (item.factor_receta || 1) * item.cantidad;
    receta.ingredientes.forEach((ing) => {
      const insumo = insumosMap.get(ing.insumo_id);
      const cant = ing.cantidad * factor;
      const costo = insumo ? cant * insumo.costo_unitario_base : 0;
      totalCostoPerdido += costo;

      const exist = insumosInvolucrados.find((x) => x.insumoId === ing.insumo_id);
      if (exist) {
        exist.cantidad += cant;
        exist.costoEstimado += costo;
      } else {
        insumosInvolucrados.push({
          insumoId: ing.insumo_id,
          nombre: insumo ? insumo.nombre : (ing.insumo_nombre || 'Insumo'),
          cantidad: cant,
          unidad: insumo ? insumo.unidad_base : (ing.unidad_base || 'g'),
          costoEstimado: costo,
        });
      }
    });
  });

  const handleConfirm = () => {
    onConfirmCancellation(pedido.id, resolution, motivoDetalle.trim() || undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancelación de Pedido con Inventario Descontado"
      subtitle={'Factura: ' + pedido.numero_factura + ' • Cliente: ' + pedido.cliente_nombre}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Alerta de inventario */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">
              Este pedido ya había descontado ingredientes del inventario de taller.
            </p>
            <p className="text-amber-800">
              Indica cómo deseas que el sistema proceda con los insumos asociados valorados en{' '}
              <strong className="text-amber-950 font-black">{formatCurrency(totalCostoPerdido)}</strong>.
            </p>
          </div>
        </div>

        {/* Resumen de Insumos Afectados */}
        <div className="bg-crema p-3.5 rounded-2xl border border-trigo-200 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-chocolate-800">
            <span>Insumos Comprometidos ({insumosInvolucrados.length}):</span>
            <span className="text-frambuesa-700 font-extrabold">
              Costo MPD: {formatCurrency(totalCostoPerdido)}
            </span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-none text-xs">
            {insumosInvolucrados.map((ins, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-trigo-200"
              >
                <span className="font-semibold text-chocolate-900 truncate mr-2">
                  {ins.nombre}
                </span>
                <div className="text-right flex-shrink-0 font-mono">
                  <span className="font-bold text-chocolate-700">
                    {formatUnit(ins.cantidad, ins.unidad)}
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    {formatCurrency(ins.costoEstimado)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selector de Acción */}
        <div className="space-y-2.5">
          <span className="block text-xs font-bold text-chocolate-800 uppercase tracking-wider">
            Selecciona la resolución operativa requerida:
          </span>

          {/* Opción 1: Reintegrar al inventario */}
          <div
            onClick={() => setResolution('reintegrar_stock')}
            className={'p-3.5 rounded-2xl border-2 cursor-pointer transition-all ' + (
              resolution === 'reintegrar_stock'
                ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                : 'bg-white border-trigo-200 hover:border-trigo-400'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={'p-2 rounded-xl ' + (
                  resolution === 'reintegrar_stock'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-chocolate-900">
                    1. Reintegrar Insumos al Inventario
                  </h4>
                  {resolution === 'reintegrar_stock' && (
                    <span className="px-2 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className="text-xs text-chocolate-600">
                  Las materias primas no se hornearon ni mezclaron. Se sumarán de vuelta al stock disponible en el almacén.
                </p>
              </div>
            </div>
          </div>

          {/* Opción 2: Declarar Merma Técnica */}
          <div
            onClick={() => setResolution('declarar_merma')}
            className={'p-3.5 rounded-2xl border-2 cursor-pointer transition-all ' + (
              resolution === 'declarar_merma'
                ? 'bg-red-50/70 border-red-500 shadow-sm'
                : 'bg-white border-trigo-200 hover:border-trigo-400'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={'p-2 rounded-xl ' + (
                  resolution === 'declarar_merma'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-chocolate-900">
                    2. Declarar Merma Técnica (Pérdida en Taller)
                  </h4>
                  {resolution === 'declarar_merma' && (
                    <span className="px-2 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className="text-xs text-chocolate-600">
                  Las masas o rellenos ya fueron preparados/horneados y no pueden recuperarse. Se registrarán como pérdida en el Libro de Mermas bajo el motivo "Cancelación de Cliente".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivo adicional / Notas */}
        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            Motivo o Notas de Cancelación (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. El cliente canceló por fuerza mayor 2 horas antes de la entrega"
            value={motivoDetalle}
            onChange={(e) => setMotivoDetalle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-trigo-300 text-xs text-chocolate-900 focus:outline-none focus:ring-2 focus:ring-frambuesa-400"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-3 border-t border-trigo-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
          >
            Volver sin Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={'flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-warm transition-all ' + (
              resolution === 'reintegrar_stock'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            <Check className="w-4 h-4" />
            <span>
              {resolution === 'reintegrar_stock'
                ? 'Cancelar y Devolver Insumos al Stock'
                : 'Cancelar y Registrar Pérdida en Mermas'}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
