import React, { useState, useEffect } from 'react';
import { Insumo, UnidadBase } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import { calcularCostoUnitarioBase } from '../../utils/calculations';

interface InsumoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (insumo: Omit<Insumo, 'id' | 'costo_unitario_base' | 'factor_conversion'>) => void;
  initialInsumo?: Insumo | null;
}

const CATEGORIAS = [
  'Harinas y Féculas',
  'Azúcares y Endulzantes',
  'Lácteos y Grasas',
  'Chocolates y Cacaos',
  'Huevos',
  'Frutas y Mermeladas',
  'Frutos Secos y Semillas',
  'Leudantes y Químicos',
  'Esencias y Colorantes',
  'Empaques y Desechables',
];

export const InsumoFormModal: React.FC<InsumoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInsumo,
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [unidadCompra, setUnidadCompra] = useState('Bolsa 1 kg');
  const [precioCompra, setPrecioCompra] = useState<number | ''>(0);
  const [presentacionEmpaque, setPresentacionEmpaque] = useState<number | ''>(1000);
  const [unidadBase, setUnidadBase] = useState<UnidadBase>('g');
  const [stockActual, setStockActual] = useState<number | ''>(0);
  const [stockMinimo, setStockMinimo] = useState<number | ''>(0);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (initialInsumo) {
      setNombre(initialInsumo.nombre);
      setCategoria(initialInsumo.categoria);
      setUnidadCompra(initialInsumo.unidad_compra);
      setPrecioCompra(initialInsumo.precio_compra);
      setPresentacionEmpaque(initialInsumo.presentacion_empaque);
      setUnidadBase(initialInsumo.unidad_base);
      setStockActual(initialInsumo.stock_actual);
      setStockMinimo(initialInsumo.stock_minimo);
      setActivo(initialInsumo.activo);
    } else {
      setNombre('');
      setCategoria(CATEGORIAS[0]);
      setUnidadCompra('Bolsa 1 kg');
      setPrecioCompra('');
      setPresentacionEmpaque(1000);
      setUnidadBase('g');
      setStockActual('');
      setStockMinimo('');
      setActivo(true);
    }
  }, [initialInsumo, isOpen]);

  const pCompraNum = typeof precioCompra === 'number' ? precioCompra : 0;
  const presNum = typeof presentacionEmpaque === 'number' && presentacionEmpaque > 0 ? presentacionEmpaque : 1;
  const costoCalculado = calcularCostoUnitarioBase(pCompraNum, presNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      nombre: nombre.trim(),
      categoria,
      unidad_compra: unidadCompra.trim(),
      precio_compra: Number(precioCompra) || 0,
      presentacion_empaque: Number(presentacionEmpaque) || 1,
      unidad_base: unidadBase,
      stock_actual: Number(stockActual) || 0,
      stock_minimo: Number(stockMinimo) || 0,
      activo,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialInsumo ? 'Editar Insumo' : 'Nuevo Insumo / Materia Prima'}
      subtitle="Los costos unitarios base ($/g, $/ml, $/ud) se recalculan automáticamente"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Nombre del Insumo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Harina de Almendras Extra Fina"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm bg-white"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Unidad Base de Uso (BOM) *
            </label>
            <select
              value={unidadBase}
              onChange={(e) => setUnidadBase(e.target.value as UnidadBase)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm bg-white"
            >
              <option value="g">Gramos (g) - Para sólidos y harinas</option>
              <option value="ml">Mililitros (ml) - Para líquidos y esencias</option>
              <option value="ud">Unidades (ud) - Para huevos, empaques, bases</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Unidad de Compra (Empaque)
            </label>
            <input
              type="text"
              placeholder="Ej. Saco 50 kg, Garrafa 5 L, Panal 30 ud"
              value={unidadCompra}
              onChange={(e) => setUnidadCompra(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Precio de Compra ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Presentación en {unidadBase.toUpperCase()} (Factor Conversión) *
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              placeholder="Ej. 50000 para saco 50kg, 1000 para 1kg"
              value={presentacionEmpaque}
              onChange={(e) => setPresentacionEmpaque(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
          </div>

          {/* Tarjeta de cálculo automático del costo unitario */}
          <div className="bg-crema p-3.5 rounded-2xl border border-trigo-200 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-chocolate-600 uppercase">
              Costo Unitario Base Calculado:
            </span>
            <span className="text-lg font-extrabold text-frambuesa-600">
              {formatCurrency(costoCalculado)} / {unidadBase}
            </span>
            <span className="text-[10px] text-chocolate-500">
              ({pCompraNum} ÷ {presNum} {unidadBase})
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Stock Actual ({unidadBase})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Stock Mínimo de Alerta ({unidadBase})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-trigo-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-sm shadow-warm transition-all"
          >
            {initialInsumo ? 'Guardar Cambios' : 'Crear Insumo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
