import { Insumo, Receta, RecetaIngrediente, RecetaCostosCalculados } from '../types';

/**
 * Calcula el costo unitario base de un insumo ($/g, $/ml, $/ud)
 */
export function calcularCostoUnitarioBase(precioCompra: number, presentacionEmpaque: number): number {
  if (!presentacionEmpaque || presentacionEmpaque <= 0) return 0;
  return precioCompra / presentacionEmpaque;
}

/**
 * Calcula el costo exacto de un ingrediente en la receta según la fórmula:
 * Costo = (Cantidad en receta * Precio de compra) / Presentación del empaque
 */
export function calcularCostoIngrediente(
  cantidad: number,
  insumo: Insumo | undefined
): number {
  if (!insumo || !cantidad || cantidad <= 0) return 0;
  return (cantidad * insumo.precio_compra) / insumo.presentacion_empaque;
}

/**
 * Calcula el desglose completo de costos de una receta (BOM) con porcentajes en cascada
 */
export function calcularCostosReceta(
  receta: Receta,
  insumosMap: Map<number, Insumo>,
  factorEscalado: number = 1
): RecetaCostosCalculados {
  let costoFijos = 0;
  let costoVariables = 0;

  for (const ing of receta.ingredientes) {
    const insumo = insumosMap.get(ing.insumo_id);
    const cantidadEscalada = ing.cantidad * factorEscalado;
    const costo = calcularCostoIngrediente(cantidadEscalada, insumo);

    if (ing.tipo === 'fijo') {
      costoFijos += costo;
    } else {
      costoVariables += costo;
    }
  }

  const mpd = costoFijos + costoVariables; // Materia Prima Directa

  const indirectosPct = receta.materiales_indirectos_pct ?? 10;
  const operativosPct = receta.costos_operativos_pct ?? 15;
  const reposicionPct = receta.reposicion_equipos_pct ?? 10;
  const manoObraPct = receta.mano_obra_pct ?? 30;
  const margenPct = receta.margen_beneficio_pct ?? 50;

  const costoMaterialesIndirectos = mpd * (indirectosPct / 100);
  const costoOperativo = mpd * (operativosPct / 100);
  const costoReposicionEquipos = mpd * (reposicionPct / 100);
  const costoManoObra = mpd * (manoObraPct / 100);

  // Costo Total de Producción (CTP)
  const costoTotalProduccion = 
    mpd + 
    costoMaterialesIndirectos + 
    costoOperativo + 
    costoReposicionEquipos + 
    costoManoObra;

  // Precio Sugerido basado en margen sobre venta (Margen estándar comercial)
  // Precio = Costo / (1 - Margen%)
  const divisor = Math.max(0.01, 1 - (margenPct / 100));
  const precioSugeridoMargenVenta = costoTotalProduccion / divisor;

  // Precio Sugerido basado en markup sobre costo
  // Precio = Costo * (1 + Margen%)
  const precioSugeridoMarkup = costoTotalProduccion * (1 + (margenPct / 100));

  const gananciaEstimada = precioSugeridoMargenVenta - costoTotalProduccion;

  return {
    costo_ingredientes_fijos: costoFijos,
    costo_ingredientes_variables: costoVariables,
    costo_directo_materia_prima: mpd,
    costo_materiales_indirectos: costoMaterialesIndirectos,
    costo_operativo: costoOperativo,
    costo_reposicion_equipos: costoReposicionEquipos,
    costo_mano_obra: costoManoObra,
    costo_total_produccion: costoTotalProduccion,
    precio_sugerido_markup: precioSugeridoMarkup,
    precio_sugerido_margen_venta: precioSugeridoMargenVenta,
    ganancia_estimada: gananciaEstimada,
  };
}

/**
 * Enriquece la lista de ingredientes de una receta con nombres, precios y costos calculados
 */
export function enriquecerIngredientes(
  ingredientes: RecetaIngrediente[],
  insumosMap: Map<number, Insumo>,
  factorEscalado: number = 1
): (RecetaIngrediente & {
  insumo_nombre: string;
  unidad_base: string;
  precio_compra: number;
  presentacion_empaque: number;
  costo_unitario_base: number;
  costo_calculado: number;
  cantidad_escalada: number;
})[] {
  return ingredientes.map(ing => {
    const insumo = insumosMap.get(ing.insumo_id);
    const cantidadEscalada = ing.cantidad * factorEscalado;
    const costo = calcularCostoIngrediente(cantidadEscalada, insumo);

    return {
      ...ing,
      insumo_nombre: insumo ? insumo.nombre : `Insumo #${ing.insumo_id}`,
      unidad_base: insumo ? insumo.unidad_base : 'g',
      precio_compra: insumo ? insumo.precio_compra : 0,
      presentacion_empaque: insumo ? insumo.presentacion_empaque : 1,
      costo_unitario_base: insumo ? insumo.costo_unitario_base : 0,
      costo_calculado: costo,
      cantidad_escalada: cantidadEscalada,
    };
  });
}
