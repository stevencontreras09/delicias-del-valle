import React from 'react';
import { Merma } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit, formatDate } from '../../utils/formatters';
import { Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface WasteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mermas: Merma[];
}

export const WasteHistoryModal: React.FC<WasteHistoryModalProps> = ({
  isOpen,
  onClose,
  mermas,
}) => {
  const totalPerdidas = mermas.reduce((acc, m) => acc + m.costo_perdido, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Mermas y Desperdicios"
      subtitle={`Total acumulado de pérdidas registradas: ${formatCurrency(totalPerdidas)}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {mermas.length === 0 ? (
          <div className="text-center py-8 text-chocolate-400 text-sm">
            <Trash2 className="w-10 h-10 mx-auto mb-2 opacity-50 text-trigo-400" />
            No hay mermas registradas en el sistema.
          </div>
        ) : (
          <div className="overflow-x-auto border border-trigo-200 rounded-2xl">
            <table className="w-full text-left text-xs text-panadero">
              <thead className="bg-crema text-chocolate-800 font-bold uppercase tracking-wider border-b border-trigo-200">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Insumo</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4 text-right">Pérdida ($)</th>
                  <th className="py-3 px-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {mermas.map((m) => (
                  <tr key={m.id} className="hover:bg-crema/20">
                    <td className="py-3 px-4 whitespace-nowrap text-chocolate-600 font-medium">
                      {formatDate(m.fecha)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-chocolate-900">
                      {m.insumo_nombre}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {formatUnit(m.cantidad, m.unidad_base)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="warning" size="sm">
                        {m.motivo}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-frambuesa-600 whitespace-nowrap">
                      {formatCurrency(m.costo_perdido)}
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                      {m.notas || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
