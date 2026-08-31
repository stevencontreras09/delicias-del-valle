import React, { useState } from 'react';
import { Receta, CategoriaReceta, RecetaIngrediente, Insumo } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import {
  Plus,
  Trash2,
  DollarSign,
  Info,
} from 'lucide-react';

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumos: Insumo[];
  initialReceta?: Receta | null;
  onSave: (receta: Omit<Receta, 'id'>) => void;
}

const CATEGORIAS_RECETA: CategoriaReceta[] = [
  'Tortas y Pasteles',
  'Cupcakes y Muffins',
  'Galletas y Alfajores',
  'Brownies y Blondies',
  'Tres Leches y Postres Fríos',
  'Panes y Masas Saladas',
  'Cheesecakes y Tartas',
  'Rellenos y Coberturas',
];

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  onClose,
  insumos,
  initialReceta,
  onSave,
}) => {
  const [nombre, setNombre] = useState(initialReceta?.nombre || '');
  const [categoria, setCategoria] = useState<CategoriaReceta>(
    initialReceta?.categoria || 'Tortas y Pasteles'
  );
  const [rendimientoBase, setRendimientoBase] = useState<number | ''>(
    initialReceta?.rendimiento_base || 1
  );
  const [rendimientoUnidad, setRendimientoUnidad] = useState(
    initialReceta?.rendimiento_unidad || '1 Libra (16-20 porciones)'
  );
  const [tiempoPrep, setTiempoPrep] = useState<number | ''>(
    initialReceta?.tiempo_preparacion_min || 30
  );
  const [tiempoHorneado, setTiempoHorneado] = useState<number | ''>(
    initialReceta?.tiempo_horneado_min || 45
  );
  const [tempHorno, setTempHorno] = useState<number | ''>(
    initialReceta?.temperatura_horno_c || 180
  );

  // Porcentajes en cascada configurables
  const [indirectosPct, setIndirectosPct] = useState<number | ''>(
    initialReceta?.materiales_indirectos_pct ?? 10
  );
  const [operativosPct, setOperativosPct] = useState<number | ''>(
    initialReceta?.costos_operativos_pct ?? 15
  );
  const [reposicionPct, setReposicionPct] = useState<number | ''>(
    initialReceta?.reposicion_equipos_pct ?? 10
  );
  const [manoObraPct, setManoObraPct] = useState<number | ''>(
    initialReceta?.mano_obra_pct ?? 30
  );
  const [margenBeneficioPct, setMargenBeneficioPct] = useState<number | ''>(
    initialReceta?.margen_beneficio_pct ?? 50
  );

  // Ingredientes
  const [ingredientes, setIngredientes] = useState<RecetaIngrediente[]>(
    initialReceta?.ingredientes || [
      { insumo_id: insumos[0]?.id || 1, cantidad: 500, tipo: 'fijo' },
    ]
  );

  // Instrucciones
  const [instrucciones, setInstrucciones] = useState<string[]>(
    initialReceta?.instrucciones || ['Precalentar el horno a 180°C y engrasar moldes.']
  );

  // Insumos Map para cálculo rápido
  const insumosMap = new Map<number, Insumo>();
  insumos.forEach((i) => insumosMap.set(i.id, i));

  // Cálculo en vivo del costo de materia prima
  const subtotalMateriaPrima = ingredientes.reduce((sum, item) => {
    const ins = insumosMap.get(item.insumo_id);
    if (!ins) return sum;
    return sum + item.cantidad * ins.costo_unitario_base;
  }, 0);

  const ind = typeof indirectosPct === 'number' ? indirectosPct / 100 : 0.1;
  const op = typeof operativosPct === 'number' ? operativosPct / 100 : 0.15;
  const rep = typeof reposicionPct === 'number' ? reposicionPct / 100 : 0.1;
  const mo = typeof manoObraPct === 'number' ? manoObraPct / 100 : 0.3;
  const margen = typeof margenBeneficioPct === 'number' ? margenBeneficioPct / 100 : 0.5;

  const costoTotalProduccion = subtotalMateriaPrima * (1 + ind + op + rep + mo);
  const precioSugerido =
    margen < 1 ? costoTotalProduccion / (1 - margen) : costoTotalProduccion * 2;

  const handleAddIngrediente = (tipo: 'fijo' | 'variable') => {
    setIngredientes([
      ...ingredientes,
      { insumo_id: insumos[0]?.id || 1, cantidad: 100, tipo },
    ]);
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const handleUpdateIngrediente = (
    index: number,
    field: keyof RecetaIngrediente,
    value: any
  ) => {
    const updated = [...ingredientes];
    updated[index] = { ...updated[index], [field]: value };
    setIngredientes(updated);
  };

  const handleAddInstruccion = () => {
    setInstrucciones([...instrucciones, '']);
  };

  const handleRemoveInstruccion = (index: number) => {
    setInstrucciones(instrucciones.filter((_, i) => i !== index));
  };

  const handleUpdateInstruccion = (index: number, text: string) => {
    const updated = [...instrucciones];
    updated[index] = text;
    setInstrucciones(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) return;
    if (ingredientes.length === 0) {
      alert('Debes agregar al menos un ingrediente a la receta.');
      return;
    }

    onSave({
      nombre: nombre.trim(),
      categoria,
      rendimiento_base: Number(rendimientoBase) || 1,
      rendimiento_unidad: rendimientoUnidad.trim(),
      tiempo_preparacion_min: Number(tiempoPrep) || 30,
      tiempo_horneado_min: Number(tiempoHorneado) || 45,
      temperatura_horno_c: Number(tempHorno) || 180,
      materiales_indirectos_pct: Number(indirectosPct) || 10,
      costos_operativos_pct: Number(operativosPct) || 15,
      reposicion_equipos_pct: Number(reposicionPct) || 10,
      mano_obra_pct: Number(manoObraPct) || 30,
      margen_beneficio_pct: Number(margenBeneficioPct) || 50,
      ingredientes: ingredientes.filter((i) => i.cantidad > 0),
      instrucciones: instrucciones.filter((inst) => inst.trim().length > 0),
      activa: true,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialReceta ? 'Editar Escandallo / Receta' : 'Nueva Receta BOM'}
      subtitle="Definición de ingredientes fijos, variables y porcentajes en cascada"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos Básicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Nombre de la Receta *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Torta Artesanal de Chocolate Supremo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Categoría *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaReceta)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs bg-white"
            >
              {CATEGORIAS_RECETA.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Rendimiento Base (Número) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={rendimientoBase}
              onChange={(e) =>
                setRendimientoBase(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Unidad de Rendimiento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 1 Libra (16 porciones), 12 Cupcakes..."
              value={rendimientoUnidad}
              onChange={(e) => setRendimientoUnidad(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Tiempos (Prep / Horno / Temp)
            </label>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="number"
                placeholder="Prep min"
                value={tiempoPrep}
                onChange={(e) =>
                  setTiempoPrep(e.target.value === '' ? '' : parseInt(e.target.value))
                }
                className="px-2 py-2.5 rounded-xl border border-trigo-300 text-xs"
              />
              <input
                type="number"
                placeholder="Horno min"
                value={tiempoHorneado}
                onChange={(e) =>
                  setTiempoHorneado(e.target.value === '' ? '' : parseInt(e.target.value))
                }
                className="px-2 py-2.5 rounded-xl border border-trigo-300 text-xs"
              />
              <input
                type="number"
                placeholder="°C"
                value={tempHorno}
                onChange={(e) =>
                  setTempHorno(e.target.value === '' ? '' : parseInt(e.target.value))
                }
                className="px-2 py-2.5 rounded-xl border border-trigo-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Porcentajes en Cascada */}
        <div className="bg-crema/60 p-4 rounded-2xl border border-trigo-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-chocolate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-trigo-600" />
              <span>Factores Porcentuales en Cascada (% sobre Materia Prima)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Indirectos %</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={indirectosPct}
                onChange={(e) =>
                  setIndirectosPct(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-trigo-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-medium">Operativos %</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={operativosPct}
                onChange={(e) =>
                  setOperativosPct(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-trigo-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-medium">Reposición %</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={reposicionPct}
                onChange={(e) =>
                  setReposicionPct(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-trigo-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-medium">Mano Obra %</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={manoObraPct}
                onChange={(e) =>
                  setManoObraPct(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-trigo-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-emerald-800 font-bold mb-1">Margen Venta %</label>
              <input
                type="number"
                step="1"
                min="1"
                max="99"
                value={margenBeneficioPct}
                onChange={(e) =>
                  setMargenBeneficioPct(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Lista de Ingredientes (Fijos y Variables) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-chocolate-800 uppercase tracking-wider">
              Ingredientes del Escandallo ({ingredientes.length})
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddIngrediente('fijo')}
                className="px-3 py-1.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ingrediente Fijo</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddIngrediente('variable')}
                className="px-3 py-1.5 rounded-xl bg-trigo-600 hover:bg-trigo-700 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ingrediente Variable</span>
              </button>
            </div>
          </div>

          <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-crema text-chocolate-800 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Insumo / Materia Prima</th>
                  <th className="py-2.5 px-3 text-center">Cantidad en Receta</th>
                  <th className="py-2.5 px-3 text-right">Costo Calculado</th>
                  <th className="py-2.5 px-3 text-center">Quitar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100 bg-white">
                {ingredientes.map((item, index) => {
                  const ins = insumosMap.get(item.insumo_id);
                  const costoItem = ins ? item.cantidad * ins.costo_unitario_base : 0;

                  return (
                    <tr key={index} className="hover:bg-crema/20">
                      <td className="py-2 px-3">
                        <select
                          value={item.tipo}
                          onChange={(e) =>
                            handleUpdateIngrediente(index, 'tipo', e.target.value as 'fijo' | 'variable')
                          }
                          className="px-2 py-1 rounded-lg border border-trigo-200 text-xs font-bold bg-white"
                        >
                          <option value="fijo">Fijo (Masa)</option>
                          <option value="variable">Variable (Relleno/Empaque)</option>
                        </select>
                      </td>

                      <td className="py-2 px-3">
                        <select
                          value={item.insumo_id}
                          onChange={(e) =>
                            handleUpdateIngrediente(index, 'insumo_id', parseInt(e.target.value))
                          }
                          className="w-full px-2 py-1 rounded-lg border border-trigo-200 text-xs bg-white"
                        >
                          {insumos.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nombre} ({i.unidad_compra} - ${i.costo_unitario_base.toFixed(4)}/{i.unidad_base})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            value={item.cantidad}
                            onChange={(e) =>
                              handleUpdateIngrediente(
                                index,
                                'cantidad',
                                e.target.value === '' ? 0 : parseFloat(e.target.value)
                              )
                            }
                            className="w-20 px-2 py-1 rounded-lg border border-trigo-300 text-center text-xs font-bold"
                          />
                          <span className="text-gray-500 font-bold text-[11px]">
                            {ins?.unidad_base || 'g'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right font-extrabold text-chocolate-900">
                        {formatCurrency(costoItem)}
                      </td>

                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngrediente(index)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen Financiero en Tiempo Real */}
        <div className="bg-canvas p-4 rounded-2xl border border-trigo-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-gray-500 block">Materia Prima Directa:</span>
            <span className="text-sm font-bold text-chocolate-800">
              {formatCurrency(subtotalMateriaPrima)}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Costo Total Producción:</span>
            <span className="text-sm font-bold text-frambuesa-600">
              {formatCurrency(costoTotalProduccion)}
            </span>
          </div>

          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 font-bold block">
              Precio Sugerido Venta ({margenBeneficioPct}% Margen):
            </span>
            <span className="text-base font-extrabold text-emerald-700">
              {formatCurrency(precioSugerido)}
            </span>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider">
              Pasos de Elaboración en Cocina ({instrucciones.length})
            </label>
            <button
              type="button"
              onClick={handleAddInstruccion}
              className="text-xs text-frambuesa-600 hover:text-frambuesa-700 font-bold"
            >
              + Agregar Paso
            </button>
          </div>

          <div className="space-y-2">
            {instrucciones.map((inst, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-bold text-xs text-chocolate-500 w-5">{i + 1}.</span>
                <input
                  type="text"
                  placeholder="Instrucción de taller..."
                  value={inst}
                  onChange={(e) => handleUpdateInstruccion(i, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-trigo-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveInstruccion(i)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de Envío */}
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-xs shadow-frambuesa-glow transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>{initialReceta ? 'Guardar Cambios' : 'Crear Receta BOM'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
