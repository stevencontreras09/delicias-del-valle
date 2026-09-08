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
  variablesActivas: boolean | Set<number> | number[] = false
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

export interface FormatoOpcion {
  label: string;
  factor: number;
  descripcion: string;
}

/**
 * Obtiene el número total de porciones para las que rinde la receta base.
 */
export function getRecipePortionsCount(receta: Receta): number {
  if (typeof receta.rendimiento_base === 'number' && receta.rendimiento_base > 1) {
    return Math.round(receta.rendimiento_base);
  }
  if (receta.rendimiento_unidad) {
    const match = receta.rendimiento_unidad.match(/(\d+)\s*(?:-|a|\/)?\s*(\d+)?\s*porci/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed > 0) return parsed;
    }
  }
  if (receta.rendimiento_base && receta.rendimiento_base > 0) {
    return Math.round(receta.rendimiento_base);
  }
  return 12;
}

/**
 * Genera dinámicamente las opciones de porciones predeterminadas
 * calculadas exactamente con base en el rendimiento configurado de la receta.
 */
export function getPorcionOpciones(basePorciones: number, unidadTexto?: string): FormatoOpcion[] {
  const total = Math.max(1, Math.round(basePorciones));

  if (total === 1) {
    return [
      { label: '1 Porción', factor: 1.0, descripcion: 'Porción individual base completa' },
      { label: 'Pack x 2', factor: 2.0, descripcion: 'Doble porción (2 unidades)' },
      { label: 'Pack x 4', factor: 4.0, descripcion: 'Pack familiar pequeño (4 unidades)' },
      { label: 'Pack x 6', factor: 6.0, descripcion: 'Pack reunión (6 unidades)' },
    ];
  }

  if (total <= 4) {
    const list: FormatoOpcion[] = [];
    for (let i = 1; i <= total; i++) {
      const factor = Number((i / total).toFixed(4));
      list.push({
        label: i === 1 ? '1 Porción' : `Pack x ${i}`,
        factor,
        descripcion: i === total ? `Lote completo (${total} porciones)` : `${i} de ${total} porciones de la receta`,
      });
    }
    while (list.length < 4) {
      const mult = list.length === 2 ? total * 2 : total * 3;
      list.push({
        label: `Pack x ${mult}`,
        factor: Number((mult / total).toFixed(4)),
        descripcion: `${mult} porciones (${mult / total}x lote)`,
      });
    }
    return list;
  }

  // Para recetas de 5 o más porciones
  // 1. Porción individual (1 / total)
  const f1 = Number((1 / total).toFixed(4));
  const opc1: FormatoOpcion = {
    label: '1 Porción',
    factor: f1,
    descripcion: `Rebanada / Porción individual (1 de ${total})`,
  };

  // 2. Cuarto de Lote (~25% de la receta)
  let count2 = Math.max(2, Math.round(total * 0.25));
  if (count2 >= total) count2 = Math.max(2, total - 2);
  const f2 = Number((count2 / total).toFixed(4));
  const opc2: FormatoOpcion = {
    label: `Pack x ${count2}`,
    factor: f2,
    descripcion: `Cuarto de lote (${count2} de ${total} porciones)`,
  };

  // 3. Medio Lote (~50% de la receta)
  let count3 = Math.max(count2 + 1, Math.round(total * 0.5));
  if (count3 >= total) count3 = total - 1;
  const f3 = Number((count3 / total).toFixed(4));
  const opc3: FormatoOpcion = {
    label: `Pack x ${count3}`,
    factor: f3,
    descripcion: `Medio lote (${count3} de ${total} porciones)`,
  };

  // 4. Lote Completo (100% de la receta)
  const opc4: FormatoOpcion = {
    label: `Lote x ${total}`,
    factor: 1.0,
    descripcion: `Lote completo (${total} ${unidadTexto || 'porciones'})`,
  };

  return [opc1, opc2, opc3, opc4];
}
