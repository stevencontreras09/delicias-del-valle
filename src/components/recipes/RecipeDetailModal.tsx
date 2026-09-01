import React, { useState } from 'react';
import { Receta, Insumo } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import {
  calcularCostosReceta,
  enriquecerIngredientes,
} from '../../utils/calculations';
import {
  Clock,
  Flame,
  Scale,
  ChefHat,
  Sparkles,
  PieChart,
  Package,
} from 'lucide-react';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receta: Receta | null;
  insumosMap: Map<number, Insumo>;
  onEdit?: (receta: Receta) => void;
}

type FormatoPresentacion = 'libra' | 'porcion' | 'mini';

interface FormatoOpcion {
  label: string;
  factor: number;
  descripcion: string;
}

const FORMATOS_CONFIG: Record<FormatoPresentacion, FormatoOpcion[]> = {
  libra: [
    { label: '½ LB', factor: 0.5, descripcion: 'Familiar pequeño (8-10 personas)' },
    { label: '1 LB', factor: 1.0, descripcion: 'Estándar artesanal (16-20 personas)' },
    { label: '2 LB', factor: 2.0, descripcion: 'Celebración grande (30-40 personas)' },
    { label: '3 LB', factor: 3.0, descripcion: 'Eventos / Bodas (50+ personas)' },
  ],
  porcion: [
    { label: '1 Porción', factor: 0.0833, descripcion: 'Rebanada / Porción individual servida' },
    { label: 'Pack x 4', factor: 0.3333, descripcion: 'Caja degustación 4 porciones' },
    { label: 'Pack x 6', factor: 0.5, descripcion: 'Caja familiar 6 porciones' },
    { label: 'Bandeja x 12', factor: 1.0, descripcion: 'Bandeja completa 12 porciones' },
  ],
  mini: [
    { label: 'Caja x 12 Mini', factor: 0.4, descripcion: 'Bocaditos / Mini postres mesa dulce' },
    { label: 'Caja x 24 Mini', factor: 0.75, descripcion: 'Surtido para reuniones y café' },
    { label: 'Caja x 50 Mini', factor: 1.5, descripcion: 'Bocados para eventos y cócteles' },
    { label: 'Caja x 100 Mini', factor: 3.0, descripcion: 'Banquete masivo para recepciones' },
  ],
};

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  onClose,
  receta,
  insumosMap,
}) => {
  const [formatoActivo, setFormatoActivo] = useState<FormatoPresentacion>('libra');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>('1 LB');
  const [customMiniCount, setCustomMiniCount] = useState<number>(12);
  const [isEditingMiniCustom, setIsEditingMiniCustom] = useState<boolean>(false);

  if (!receta) return null;

  const costBreakdown = calcularCostosReceta(receta, insumosMap, multiplier);
  const ingredientesEnriquecidos = enriquecerIngredientes(
    receta.ingredientes,
    insumosMap,
    multiplier
  );

  const fijos = ingredientesEnriquecidos.filter((i) => i.tipo === 'fijo');
  const variables = ingredientesEnriquecidos.filter((i) => i.tipo === 'variable');

  const handleSelectFormato = (formato: FormatoPresentacion, opcion: FormatoOpcion) => {
    setFormatoActivo(formato);
    setMultiplier(opcion.factor);
    setSelectedPresetLabel(opcion.label);
    setIsEditingMiniCustom(false);
  };

  const handleCustomMiniChange = (count: number) => {
    const validCount = Math.max(1, count);
    setCustomMiniCount(validCount);
    setIsEditingMiniCustom(true);
    // Factor exacto por unidad mini: 0.35 factor / 12 = ~0.02917x de la receta estándar
    const factor = Number((validCount * (0.35 / 12)).toFixed(4));
    setMultiplier(factor);
    setSelectedPresetLabel(`${validCount} Mini Bocaditos`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receta.nombre}
      subtitle={`Categoría: ${receta.categoria} • Rendimiento Base: ${receta.rendimiento_base} ${receta.rendimiento_unidad}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* SELECTOR DE PRESENTACIÓN DIVIDIDO EN: LIBRA, PORCIÓN Y MINI              */}
        {/* ========================================================================= */}
        <div className="bg-white p-4 rounded-3xl border-2 border-trigo-300 shadow-warm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-trigo-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-frambuesa-600" />
              <span className="font-bold text-chocolate-800 text-sm">
                División de Receta por Presentación:
              </span>
            </div>

            {/* Pestañas de Formato (Libra, Porción, Mini) */}
            <div className="flex items-center gap-1 bg-canvas p-1 rounded-2xl border border-trigo-200">
              <button
                type="button"
                onClick={() => handleSelectFormato('libra', FORMATOS_CONFIG.libra[1])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatoActivo === 'libra'
                    ? 'bg-frambuesa-500 text-white shadow-sm'
                    : 'text-chocolate-700 hover:bg-crema'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Libra</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFormato('porcion', FORMATOS_CONFIG.porcion[0])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatoActivo === 'porcion'
                    ? 'bg-frambuesa-500 text-white shadow-sm'
                    : 'text-chocolate-700 hover:bg-crema'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Porción</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFormato('mini', FORMATOS_CONFIG.mini[0])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatoActivo === 'mini'
                    ? 'bg-frambuesa-500 text-white shadow-sm'
                    : 'text-chocolate-700 hover:bg-crema'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Mini (Bocaditos)</span>
              </button>
            </div>
          </div>

          {/* Opciones Específicas del Formato Seleccionado */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORMATOS_CONFIG[formatoActivo].map((opc) => {
              const isSelected = selectedPresetLabel === opc.label;
              return (
                <button
                  key={opc.label}
                  type="button"
                  onClick={() => handleSelectFormato(formatoActivo, opc)}
                  className={`p-2.5 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-chocolate-700 text-white border-chocolate-800 shadow-md transform scale-[1.02]'
                      : 'bg-crema/40 text-chocolate-800 border-trigo-200 hover:bg-crema'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">{opc.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-trigo-200 text-chocolate-700'
                    }`}>
                      {opc.factor}x
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ${
                    isSelected ? 'text-trigo-200' : 'text-gray-500'
                  }`}>
                    {opc.descripcion}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selector de Cantidad Exacta Personalizada de Minis */}
          {formatoActivo === 'mini' && (
            <div className="mt-2.5 p-3.5 rounded-2xl bg-canvas border border-trigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-frambuesa-100 flex items-center justify-center text-frambuesa-600 flex-shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-chocolate-900 block">
                    ¿Deseas una cantidad exacta personalizada?
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Escribe cualquier cantidad y los gramos e ingredientes se adaptarán en tiempo real.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center bg-white rounded-xl border border-trigo-300 shadow-sm p-1">
                  <button
                    type="button"
                    onClick={() => handleCustomMiniChange(Math.max(1, customMiniCount - 1))}
                    className="w-8 h-8 flex items-center justify-center text-chocolate-700 hover:bg-crema active:scale-95 rounded-lg font-bold text-base transition-all"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={customMiniCount}
                    onChange={(e) => handleCustomMiniChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center font-extrabold text-chocolate-900 focus:outline-none text-sm py-1 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleCustomMiniChange(customMiniCount + 1)}
                    className="w-8 h-8 flex items-center justify-center text-chocolate-700 hover:bg-crema active:scale-95 rounded-lg font-bold text-base transition-all"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-bold text-chocolate-700">minis</span>

                <div className="hidden sm:flex items-center gap-1 ml-1.5">
                  {[12, 24, 30, 36, 50, 75, 100].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleCustomMiniChange(n)}
                      className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${
                        customMiniCount === n && isEditingMiniCustom
                          ? 'bg-frambuesa-500 text-white border-frambuesa-600 shadow-sm'
                          : 'bg-white text-chocolate-700 border-trigo-200 hover:bg-crema'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tiempos de Taller y Datos Técnicos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-canvas p-3 rounded-2xl border border-trigo-200 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-chocolate-600" />
            <div>
              <span className="text-gray-500 block text-[11px]">Prep. Activa:</span>
              <span className="font-bold text-chocolate-800">
                {receta.tiempo_preparacion_min} minutos
              </span>
            </div>
          </div>

          <div className="bg-canvas p-3 rounded-2xl border border-trigo-200 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-frambuesa-500" />
            <div>
              <span className="text-gray-500 block text-[11px]">Horneado:</span>
              <span className="font-bold text-chocolate-800">
                {receta.tiempo_horneado_min} min @ {receta.temperatura_horno_c}°C
              </span>
            </div>
          </div>

          <div className="bg-canvas p-3 rounded-2xl border border-trigo-200 flex items-center gap-2.5">
            <ChefHat className="w-4 h-4 text-trigo-600" />
            <div>
              <span className="text-gray-500 block text-[11px]">Presentación Actual:</span>
              <span className="font-bold text-chocolate-800">
                {selectedPresetLabel} ({multiplier}x base)
              </span>
            </div>
          </div>

          <div className="bg-canvas p-3 rounded-2xl border border-trigo-200 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-gray-500 block text-[11px]">Margen de Venta:</span>
              <span className="font-bold text-emerald-700">
                {receta.margen_beneficio_pct}% Margen
              </span>
            </div>
          </div>
        </div>

        {/* TABLA BOM: Escandallo Desglosado de Ingredientes */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-chocolate-800 uppercase tracking-wider">
            1. Desglose de Materia Prima Directa (BOM Escalado {multiplier}x)
          </h3>

          {/* Ingredientes Fijos (Base / Masa) */}
          <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-chocolate-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
              <span>Ingredientes Fijos (Masa Base / Estructura) — {fijos.length} ingredientes</span>
              <span className="text-trigo-200">
                Subtotal Fijos: {formatCurrency(costBreakdown.costo_ingredientes_fijos)}
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-crema/60 text-chocolate-800 font-semibold border-b border-trigo-200">
                <tr>
                  <th className="py-2.5 px-4">Ingrediente</th>
                  <th className="py-2.5 px-4 text-center">Cantidad Escalada</th>
                  <th className="py-2.5 px-4 text-right">Costo Unitario</th>
                  <th className="py-2.5 px-4 text-right">Costo en Receta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100 bg-white">
                {fijos.map((ing, idx) => (
                  <tr key={idx} className="hover:bg-crema/20">
                    <td className="py-2.5 px-4 font-bold text-chocolate-900">
                      {ing.insumo_nombre}
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-chocolate-800">
                      {formatUnit(ing.cantidad_escalada, ing.unidad_base)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-500">
                      {formatCurrency(ing.costo_unitario_base)} / {ing.unidad_base}
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-chocolate-900">
                      {formatCurrency(ing.costo_calculado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ingredientes Variables (Relleno, Cobertura, Empaque) */}
          {variables.length > 0 && (
            <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-trigo-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                <span>Ingredientes Variables (Relleno, Cobertura, Empaque) — {variables.length} items</span>
                <span className="text-white">
                  Subtotal Variables: {formatCurrency(costBreakdown.costo_ingredientes_variables)}
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-crema/60 text-chocolate-800 font-semibold border-b border-trigo-200">
                  <tr>
                    <th className="py-2.5 px-4">Ingrediente / Empaque</th>
                    <th className="py-2.5 px-4 text-center">Cantidad Escalada</th>
                    <th className="py-2.5 px-4 text-right">Costo Unitario</th>
                    <th className="py-2.5 px-4 text-right">Costo en Receta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trigo-100 bg-white">
                  {variables.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-crema/20">
                      <td className="py-2.5 px-4 font-bold text-chocolate-900">
                        {ing.insumo_nombre}
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-chocolate-800">
                        {formatUnit(ing.cantidad_escalada, ing.unidad_base)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-500">
                        {formatCurrency(ing.costo_unitario_base)} / {ing.unidad_base}
                      </td>
                      <td className="py-2.5 px-4 text-right font-extrabold text-chocolate-900">
                        {formatCurrency(ing.costo_calculado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cascada Integral de Costos & Precios Sugeridos con 3% Merma y Redondeo a 0 */}
        <div className="bg-canvas p-5 rounded-2xl border border-trigo-200 space-y-4">
          <h3 className="text-sm font-bold text-chocolate-800 uppercase tracking-wider">
            2. Cascada de Costos de Producción & Margen de Ganancia
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Columna Izquierda: Desglose en Cascada */}
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-trigo-200">
                <span className="text-gray-600 font-medium">Materia Prima Directa (Fijos + Variables):</span>
                <span className="font-bold text-chocolate-800">
                  {formatCurrency(costBreakdown.costo_directo_materia_prima)}
                </span>
              </div>

              {/* 3% de Merma Técnica */}
              <div className="flex justify-between py-1 border-b border-trigo-200 bg-amber-50/50 px-2 rounded-lg">
                <span className="text-amber-900 font-semibold flex items-center gap-1">
                  <span>+ Merma Técnica / Desperdicio Operativo (3%):</span>
                </span>
                <span className="font-bold text-amber-800">
                  {formatCurrency(costBreakdown.costo_merma)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-trigo-200">
                <span className="text-gray-600">
                  + Materiales Indirectos ({receta.materiales_indirectos_pct}%):
                </span>
                <span className="font-semibold text-chocolate-700">
                  {formatCurrency(costBreakdown.costo_materiales_indirectos)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-trigo-200">
                <span className="text-gray-600">
                  + Costos Operativos (Luz, Gas, Renta) ({receta.costos_operativos_pct}%):
                </span>
                <span className="font-semibold text-chocolate-700">
                  {formatCurrency(costBreakdown.costo_operativo)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-trigo-200">
                <span className="text-gray-600">
                  + Reposición de Equipos / Desgaste ({receta.reposicion_equipos_pct}%):
                </span>
                <span className="font-semibold text-chocolate-700">
                  {formatCurrency(costBreakdown.costo_reposicion_equipos)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-trigo-200">
                <span className="text-gray-600">
                  + Mano de Obra Artesanal ({receta.mano_obra_pct}%):
                </span>
                <span className="font-semibold text-chocolate-700">
                  {formatCurrency(costBreakdown.costo_mano_obra)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-t-2 border-chocolate-700 text-sm font-extrabold text-chocolate-900">
                <span>COSTO TOTAL DE PRODUCCIÓN (CTP):</span>
                <span className="text-frambuesa-600">
                  {formatCurrency(costBreakdown.costo_total_produccion)}
                </span>
              </div>
            </div>

            {/* Columna Derecha: Precios Sugeridos Redondeados a 0 hacia arriba */}
            <div className="bg-white p-4 rounded-2xl border border-trigo-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-chocolate-800 uppercase block">
                    Precio Sugerido ({selectedPresetLabel}):
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Redondeado a 0
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  Precio con margen de beneficio del {receta.margen_beneficio_pct}% calculado y redondeado hacia arriba para venta comercial.
                </p>

                <div className="space-y-2">
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        Precio Sugerido de Venta:
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Ganancia neta: {formatCurrency(costBreakdown.ganancia_estimada)}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700">
                      {formatCurrency(costBreakdown.precio_sugerido_margen_venta)}
                    </span>
                  </div>

                  <div className="bg-canvas p-3 rounded-xl border border-trigo-200 flex items-center justify-between">
                    <span className="text-xs text-chocolate-700 font-semibold">
                      Costo Total de Elaboración:
                    </span>
                    <span className="text-sm font-bold text-chocolate-900">
                      {formatCurrency(costBreakdown.costo_total_produccion)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-trigo-200">
                <p className="text-[11px] text-gray-500 italic">
                  💡 Tip: Puedes alternar en un clic entre <b>Libra</b>, <b>Porción</b> y <b>Mini</b> para cotizar eventos, mesas de postres o porciones individuales.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones de Preparación */}
        {receta.instrucciones && receta.instrucciones.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-trigo-200 space-y-3">
            <h3 className="text-sm font-bold text-chocolate-800 uppercase tracking-wider">
              3. Pasos Maestros de Elaboración en Taller
            </h3>
            <ol className="space-y-2 text-xs text-chocolate-800 list-decimal list-inside leading-relaxed">
              {receta.instrucciones.map((inst, idx) => (
                <li key={idx} className="p-2 rounded-xl hover:bg-canvas transition-colors">
                  {inst}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Modal>
  );
};
