import { Insumo, Receta, RecetaIngrediente, RecetaCostosCalculados } from '../types';

/**
 * Redondea cualquier precio hacia arriba al número superior que termine en 0 (múltiplo de 10)
 * Ej: 1,234.20 -> 1,240 | 851 -> 860 | 95 -> 100 | 1,200 -> 1,200
 */
export function redondearPrecioHaciaArribaCero(valor: number): number {
  if (!valor || valor <= 0) return 0;
  return Math.ceil(valor / 10) * 10;
}

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
 * Calcula el desglose completo de costos de una receta (BOM) con porcentajes en cascada,
 * incluyendo el 3% de merma técnica operativa y precios sugeridos redondeados hacia arriba a 0.
 */
export function calcularCostosReceta(
  receta: Receta,
  insumosMap: Map<number, Insumo>,
  factorEscalado: number = 1,
  variablesActivas: boolean | Set<number> | number[] = true
): RecetaCostosCalculados {
  let costoFijos = 0;
  let costoVariablesTotal = 0;
  let costoVariablesAplicados = 0;

  // Analizar selector de variables activas
  const isSet = variablesActivas instanceof Set;
  const isArray = Array.isArray(variablesActivas);
  const activeSet = isSet
    ? (variablesActivas as Set<number>)
    : isArray
    ? new Set(variablesActivas as number[])
    : null;

  const allDisabled = variablesActivas === false;
  const allEnabled = variablesActivas === true;

  for (const ing of receta.ingredientes) {
    const insumo = insumosMap.get(ing.insumo_id);
    const cantidadEscalada = ing.cantidad * factorEscalado;
    const costo = calcularCostoIngrediente(cantidadEscalada, insumo);

    if (ing.tipo === 'fijo') {
      costoFijos += costo;
    } else {
      costoVariablesTotal += costo;

      const estaAplicada =
        !allDisabled && (allEnabled || (activeSet !== null && activeSet.has(ing.insumo_id)));

      if (estaAplicada) {
        costoVariablesAplicados += costo;
      }
    }
  }

  const costoVariablesExcluidos = Math.max(0, costoVariablesTotal - costoVariablesAplicados);

  // Materia Prima Directa computada con fijos + variables seleccionados
  const mpd = costoFijos + costoVariablesAplicados;

  // 3% de Merma Técnica / Desperdicio Operativo de Cocina
  const costoMerma = mpd * 0.03;

  const indirectosPct = receta.materiales_indirectos_pct ?? 10;
  const operativosPct = receta.costos_operativos_pct ?? 15;
  const reposicionPct = receta.reposicion_equipos_pct ?? 10;
  const manoObraPct = receta.mano_obra_pct ?? 30;
  const margenPct = receta.margen_beneficio_pct ?? 50;

  const costoMaterialesIndirectos = mpd * (indirectosPct / 100);
  const costoOperativo = mpd * (operativosPct / 100);
  const costoReposicionEquipos = mpd * (reposicionPct / 100);
  const costoManoObra = mpd * (manoObraPct / 100);

  // Costo Total de Producción (CTP) incluyendo el 3% de merma
  const costoTotalProduccion = 
    mpd + 
    costoMerma +
    costoMaterialesIndirectos + 
    costoOperativo + 
    costoReposicionEquipos + 
    costoManoObra;

  // Precio Sugerido basado en margen sobre venta (Margen estándar comercial)
  // Precio = Costo / (1 - Margen%)
  const divisor = Math.max(0.01, 1 - (margenPct / 100));
  const precioSugeridoMargenVentaRaw = costoTotalProduccion / divisor;
  const precioSugeridoMargenVenta = redondearPrecioHaciaArribaCero(precioSugeridoMargenVentaRaw);

  // Precio Sugerido basado en markup sobre costo
  // Precio = Costo * (1 + Margen%)
  const precioSugeridoMarkupRaw = costoTotalProduccion * (1 + (margenPct / 100));
  const precioSugeridoMarkup = redondearPrecioHaciaArribaCero(precioSugeridoMarkupRaw);

  const gananciaEstimada = precioSugeridoMargenVenta - costoTotalProduccion;

  return {
    costo_ingredientes_fijos: costoFijos,
    costo_ingredientes_variables: costoVariablesTotal,
    costo_variables_aplicados: costoVariablesAplicados,
    costo_variables_excluidos: costoVariablesExcluidos,
    costo_directo_materia_prima: mpd,
    costo_merma: costoMerma,
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
