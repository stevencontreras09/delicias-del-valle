import React, { useState, useEffect } from 'react';
import { Insumo, UnidadBase } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import { calcularCostoUnitarioBase } from '../../utils/calculations';
import { Scale, Calculator, ArrowRight, Sparkles } from 'lucide-react';

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

type MedidaCompra = 'lb' | 'kg' | 'oz' | 'g' | 'oz_liq' | 'l' | 'gal' | 'ml' | 'ud';

interface MedidaInfo {
  label: string;
  unidadBase: UnidadBase;
  factorABase: number; // Factor por 1 unidad de esta medida
  ejemplo: string;
}

const MEDIDAS_COMPRA_MAP: Record<MedidaCompra, MedidaInfo> = {
  lb: { label: 'Libras (lb)', unidadBase: 'g', factorABase: 453.592, ejemplo: '1 lb = 453.59 g' },
  kg: { label: 'Kilogramos (kg)', unidadBase: 'g', factorABase: 1000, ejemplo: '1 kg = 1,000 g' },
  oz: { label: 'Onzas sólidas (oz)', unidadBase: 'g', factorABase: 28.3495, ejemplo: '1 oz = 28.35 g' },
  g: { label: 'Gramos (g)', unidadBase: 'g', factorABase: 1, ejemplo: '1 g = 1 g' },
  oz_liq: { label: 'Onzas Líquidas (fl oz)', unidadBase: 'ml', factorABase: 29.5735, ejemplo: '1 fl oz = 29.57 ml' },
  l: { label: 'Litros (L)', unidadBase: 'ml', factorABase: 1000, ejemplo: '1 L = 1,000 ml' },
  gal: { label: 'Galones (gal)', unidadBase: 'ml', factorABase: 3785.41, ejemplo: '1 gal = 3,785.4 ml' },
  ml: { label: 'Mililitros (ml)', unidadBase: 'ml', factorABase: 1, ejemplo: '1 ml = 1 ml' },
  ud: { label: 'Unidades / Piezas (ud)', unidadBase: 'ud', factorABase: 1, ejemplo: '1 ud = 1 ud' },
};

export const InsumoFormModal: React.FC<InsumoFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInsumo,
}) => {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [unidadCompra, setUnidadCompra] = useState('Funda 1 lb');
  
  // Conversor Automático de Medidas (lb, kg, oz líquidas, etc.)
  const [cantidadCompra, setCantidadCompra] = useState<number | ''>(1);
  const [medidaCompra, setMedidaCompra] = useState<MedidaCompra>('lb');

  const [precioCompra, setPrecioCompra] = useState<number | ''>(0);
  const [presentacionEmpaque, setPresentacionEmpaque] = useState<number | ''>(453.59);
  const [unidadBase, setUnidadBase] = useState<UnidadBase>('g');
  const [stockActual, setStockActual] = useState<number | ''>(0);
  const [stockMinimo, setStockMinimo] = useState<number | ''>(0);
  const [activo, setActivo] = useState(true);
  const [tipoCosto, setTipoCosto] = useState<'fijo' | 'variable'>('fijo');

  // Inicialización o reset
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
      setTipoCosto(initialInsumo.tipo_costo || (initialInsumo.categoria === 'Empaques y Desechables' ? 'variable' : 'fijo'));

      // Detectar medida si es posible
      if (initialInsumo.unidad_base === 'g') {
        if (Math.abs(initialInsumo.presentacion_empaque - 453.59) < 2) {
          setMedidaCompra('lb');
          setCantidadCompra(1);
        } else if (initialInsumo.presentacion_empaque === 1000) {
          setMedidaCompra('kg');
          setCantidadCompra(1);
        }
      } else if (initialInsumo.unidad_base === 'ml') {
        if (initialInsumo.presentacion_empaque === 1000) {
          setMedidaCompra('l');
          setCantidadCompra(1);
        } else if (Math.abs(initialInsumo.presentacion_empaque - 3785.4) < 10) {
          setMedidaCompra('gal');
          setCantidadCompra(1);
        }
      } else {
        setMedidaCompra('ud');
        setCantidadCompra(initialInsumo.presentacion_empaque || 1);
      }
    } else {
      setNombre('');
      setCategoria(CATEGORIAS[0]);
      setUnidadCompra('Funda 1 lb');
      setCantidadCompra(1);
      setMedidaCompra('lb');
      setPrecioCompra('');
      setPresentacionEmpaque(453.59);
      setUnidadBase('g');
      setStockActual('');
      setStockMinimo('');
      setActivo(true);
      setTipoCosto('fijo');
    }
  }, [initialInsumo, isOpen]);

  // Manejar cambio en el conversor automático de medida
  const handleMedidaChange = (nuevaMedida: MedidaCompra, nuevaCantidad: number | '') => {
    setMedidaCompra(nuevaMedida);
    setCantidadCompra(nuevaCantidad);

    const info = MEDIDAS_COMPRA_MAP[nuevaMedida];
    const cant = typeof nuevaCantidad === 'number' && nuevaCantidad > 0 ? nuevaCantidad : 1;
    setPresentacionEmpaque(Number((cant * info.factorABase).toFixed(2)));
    setUnidadBase(info.unidadBase);

    // Sugerir texto descriptivo si es un insumo nuevo
    if (!initialInsumo) {
      setUnidadCompra(`Presentación ${cant} ${nuevaMedida.replace('_', ' ')}`);
    }
  };

  const pCompraNum = typeof precioCompra === 'number' ? precioCompra : 0;
  const presNum = typeof presentacionEmpaque === 'number' && presentacionEmpaque > 0 ? presentacionEmpaque : 1;
  const costoCalculado = calcularCostoUnitarioBase(pCompraNum, presNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      nombre: nombre.trim(),
      categoria,
      unidad_compra: unidadCompra.trim() || `${cantidadCompra || 1} ${medidaCompra}`,
      precio_compra: Number(precioCompra) || 0,
      presentacion_empaque: Number(presentacionEmpaque) || 1,
      unidad_base: unidadBase,
      stock_actual: Number(stockActual) || 0,
      stock_minimo: Number(stockMinimo) || 0,
      activo,
      tipo_costo: tipoCosto,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialInsumo ? 'Editar Insumo' : 'Nuevo Insumo / Materia Prima'}
      subtitle="Conversión automática inteligente desde Libras (lb), Kilogramos (kg), Onzas Líquidas y Galones"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Nombre */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Nombre del Insumo / Materia Prima *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Harina de Trigo Todo Uso, Mantequilla President, Chocolate Belga 56%"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm font-semibold text-chocolate-900 bg-canvas/30"
            />
          </div>

          {/* Clasificación de Costo: Fijo vs Variable */}
          <div className="sm:col-span-2 bg-canvas/60 p-3 rounded-2xl border border-trigo-200">
            <label className="block font-bold text-chocolate-800 text-xs mb-2">
              Clasificación del Insumo (Costo Fijo vs Variable) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoCosto('fijo')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoCosto === 'fijo'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-400'
                    : 'bg-white border-trigo-200 text-chocolate-700 hover:bg-crema/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>📌 Producto Fijo</span>
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-semibold">Materia Prima Base</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Harina, azúcar, mantequilla, huevos, leche, chocolate base, levadura, etc.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTipoCosto('variable')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoCosto === 'variable'
                    ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm ring-1 ring-purple-400'
                    : 'bg-white border-trigo-200 text-chocolate-700 hover:bg-crema/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>🎨 Producto Variable</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-semibold">Empaque / Decoración</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Cajas, stickers, capacillos, platos, envases, cintas, etc.
                </p>
              </button>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs bg-white font-medium text-chocolate-900"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Precio de Compra en RD$ */}
          <div>
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Precio Total de Compra (RD$) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.00"
              value={precioCompra}
              onChange={(e) =>
                setPrecioCompra(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs font-bold text-chocolate-900 bg-white"
            />
          </div>

          {/* ========================================================================= */}
          {/* CONVERSOR AUTOMÁTICO DE MEDIDA (Libras, Kilos, Onzas Líquidas, Galón, etc.) */}
          {/* ========================================================================= */}
          <div className="sm:col-span-2 bg-crema/60 p-4 rounded-2xl border-2 border-trigo-300 space-y-3">
            <div className="flex items-center justify-between border-b border-trigo-200 pb-2">
              <span className="font-bold text-chocolate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-frambuesa-600" />
                <span>Conversor Automático de Presentación de Compra</span>
              </span>
              <span className="text-[11px] font-semibold text-chocolate-600">
                {MEDIDAS_COMPRA_MAP[medidaCompra].ejemplo}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cantidad de Compra */}
              <div>
                <label className="block font-bold text-chocolate-700 mb-1">
                  Cantidad Comprada
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="Ej. 1, 5, 25, 50"
                  value={cantidadCompra}
                  onChange={(e) =>
                    handleMedidaChange(
                      medidaCompra,
                      e.target.value === '' ? '' : parseFloat(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-bold text-chocolate-900"
                />
              </div>

              {/* Medida de Compra (Libras, Kilos, Onzas Líquidas, Galón, etc.) */}
              <div>
                <label className="block font-bold text-chocolate-700 mb-1">
                  Medida de Compra (lb, kg, oz líq, gal...) *
                </label>
                <select
                  value={medidaCompra}
                  onChange={(e) =>
                    handleMedidaChange(e.target.value as MedidaCompra, cantidadCompra)
                  }
                  className="w-full px-3 py-2 rounded-xl border-2 border-frambuesa-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-bold text-frambuesa-900"
                >
                  <optgroup label="Sólidos y Masas (Conversión a Gramos 'g')">
                    <option value="lb">Libras (lb) [1 lb = 453.6 g]</option>
                    <option value="kg">Kilogramos (kg) [1 kg = 1,000 g]</option>
                    <option value="oz">Onzas sólidas (oz) [1 oz = 28.35 g]</option>
                    <option value="g">Gramos directos (g)</option>
                  </optgroup>
                  <optgroup label="Líquidos y Esencias (Conversión a Mililitros 'ml')">
                    <option value="oz_liq">Onzas Líquidas (fl oz) [1 oz liq = 29.57 ml]</option>
                    <option value="l">Litros (L) [1 L = 1,000 ml]</option>
                    <option value="gal">Galón (gal) [1 gal = 3,785.4 ml]</option>
                    <option value="ml">Mililitros directos (ml)</option>
                  </optgroup>
                  <optgroup label="Piezas / Empaques (Conversión a Unidades 'ud')">
                    <option value="ud">Unidades / Piezas (ud)</option>
                  </optgroup>
                </select>
              </div>

              {/* Unidad de Compra (Etiqueta de Inventario) */}
              <div>
                <label className="block font-bold text-chocolate-700 mb-1">
                  Etiqueta / Descripción Empaque
                </label>
                <input
                  type="text"
                  placeholder="Ej. Saco 50 lb, Galón 3.78L"
                  value={unidadCompra}
                  onChange={(e) => setUnidadCompra(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white"
                />
              </div>
            </div>

            {/* Resumen de Conversión en Tiempo Real */}
            <div className="bg-white p-3 rounded-xl border border-trigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-chocolate-800">
                  Presentación Calculada:{' '}
                  <b className="text-frambuesa-600 font-extrabold">
                    {presentacionEmpaque} {unidadBase}
                  </b>
                  <span className="text-gray-500 ml-1">
                    ({cantidadCompra || 1} {medidaCompra} $\rightarrow$ {unidadBase})
                  </span>
                </span>
              </div>

              <div className="text-right font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Costo Unitario Base: {formatCurrency(costoCalculado)} / {unidadBase}
              </div>
            </div>
          </div>

          {/* Ajuste Fino Manual (Presentación en Unidad Base) */}
          <div>
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Contenido Exacto en {unidadBase.toUpperCase()} (Base BOM) *
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={presentacionEmpaque}
              onChange={(e) =>
                setPresentacionEmpaque(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white font-semibold text-chocolate-900"
            />
          </div>

          {/* Unidad Base */}
          <div>
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Unidad Base de Producción
            </label>
            <select
              value={unidadBase}
              onChange={(e) => setUnidadBase(e.target.value as UnidadBase)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white font-semibold text-chocolate-900"
            >
              <option value="g">Gramos (g) - Sólidos y harinas</option>
              <option value="ml">Mililitros (ml) - Líquidos y aceites</option>
              <option value="ud">Unidades (ud) - Huevos y empaques</option>
            </select>
          </div>

          {/* Stock Actual */}
          <div>
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Stock Inicial ({unidadBase})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={stockActual}
              onChange={(e) =>
                setStockActual(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white text-chocolate-900 font-semibold"
            />
          </div>

          {/* Stock Mínimo de Alerta */}
          <div>
            <label className="block font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Stock Mínimo de Alerta ({unidadBase})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={stockMinimo}
              onChange={(e) =>
                setStockMinimo(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white text-chocolate-900 font-semibold"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-trigo-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-xs shadow-warm transition-all transform hover:scale-105"
          >
            {initialInsumo ? 'Guardar Cambios' : 'Crear Insumo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
