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
  Edit2,
  ChefHat,
  Sparkles,
} from 'lucide-react';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receta: Receta | null;
  insumosMap: Map<number, Insumo>;
  onEdit?: (receta: Receta) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  onClose,
  receta,
  insumosMap,
  onEdit,
}) => {
  const [multiplier, setMultiplier] = useState<number>(1);

  if (!receta) return null;

  const costBreakdown = calcularCostosReceta(receta, insumosMap, multiplier);
  const ingredientesEnriquecidos = enriquecerIngredientes(
    receta.ingredientes,
    insumosMap,
    multiplier
  );

  const fijos = ingredientesEnriquecidos.filter((i) => i.tipo === 'fijo');
  const variables = ingredientesEnriquecidos.filter((i) => i.tipo === 'variable');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receta.nombre}
      subtitle={`Categoría: ${receta.categoria} • Rendimiento Base: ${receta.rendimiento_base} ${receta.rendimiento_unidad}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Barra Superior: Escalador Interactivo de Recetas */}
        <div className="bg-crema p-4 rounded-2xl border border-trigo-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-chocolate-800">
            <Scale className="w-4 h-4 text-trigo-600" />
            <span className="font-bold">Escalar Receta en Vivo:</span>
            <span className="text-gray-500 font-medium">
              (Multiplica todas las cantidades de ingredientes y costos en tiempo real)
            </span>
          </div>

          {/* Botones de Escala Rápida */}
          <div className="flex items-center gap-1.5">
            {[0.5, 1, 2, 3, 5, 10].map((factor) => (
              <button
                key={factor}
                onClick={() => setMultiplier(factor)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  multiplier === factor
                    ? 'bg-chocolate-700 text-white shadow-md'
                    : 'bg-white text-chocolate-700 hover:bg-white/80 border border-trigo-200'
                }`}
              >
                {factor}x
              </button>
            ))}
          </div>
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
              <span className="text-gray-500 block text-[11px]">Rendimiento Actual:</span>
              <span className="font-bold text-chocolate-800">
                {receta.rendimiento_base * multiplier} {receta.rendimiento_unidad}
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
            1. Desglose de Materia Prima Directa (BOM)
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

        {/* Cascada Integral de Costos & Precios Sugeridos */}
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

            {/* Columna Derecha: Precios Sugeridos y Rentabilidad */}
            <div className="bg-white p-4 rounded-2xl border border-trigo-200 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-chocolate-800 uppercase block mb-1">
                  Estrategia de Precios Sugeridos:
                </span>
                <p className="text-[11px] text-gray-500 mb-3">
                  Precio de venta sobre el costo total con un margen de beneficio del {receta.margen_beneficio_pct}%.
                </p>

                <div className="space-y-2">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        Precio Sugerido Venta ({receta.margen_beneficio_pct}% Margen):
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Ganancia neta: {formatCurrency(costBreakdown.ganancia_estimada)}
                      </span>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-700">
                      {formatCurrency(costBreakdown.precio_sugerido_margen_venta)}
                    </span>
                  </div>

                  <div className="bg-canvas p-3 rounded-xl border border-trigo-200 flex items-center justify-between">
                    <span className="text-xs text-chocolate-700 font-semibold">
                      Costo Unitario por {receta.rendimiento_unidad}:
                    </span>
                    <span className="text-sm font-bold text-chocolate-900">
                      {formatCurrency(costBreakdown.costo_total_produccion / (receta.rendimiento_base || 1))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-trigo-100 text-[11px] text-gray-500 italic">
                Fórmula de Precio = Costo Total / (1 - Margen%)
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones de Taller */}
        {receta.instrucciones && receta.instrucciones.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-trigo-200 space-y-2 text-xs">
            <h3 className="text-xs font-bold text-chocolate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-chocolate-600" />
              <span>Instrucciones de Elaboración en Cocina</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-chocolate-700 leading-relaxed pt-1">
              {receta.instrucciones.map((instruccion, i) => (
                <li key={i} className="pl-1">
                  {instruccion}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-trigo-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-700 hover:bg-gray-50 text-xs font-bold transition-colors"
          >
            Cerrar
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(receta);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold transition-all shadow-warm"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar Receta & Porcentajes</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
