import { Insumo, Receta, RecetaIngrediente, RecetaCostosCalculados, NivelDecoracion } from '../types';

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

/** Tarifa base por defecto para Mano de Obra Directa (MOD) en RD$ / hora (RD$ 5.00 / minuto) */
export const TARIFA_HORA_MOD_DEFAULT = 300;
export const TARIFA_HORA_TALLER_DEFAULT = 300; // Alias de compatibilidad

/** Costo fijo prorrateado de gas GLP / energía por tanda de horneado estándar en RD$ */
export const COSTO_HORNO_FIJO_DEFAULT = 35; // RD$ 35 por tanda/horneada

/** Merma técnica gastronómica estándar en repostería (3%) para insumos en tazón, mangas y nivelado */
export const MERMA_TECNICA_INSUMOS_PCT = 0.03;

/** Minutos extras de mano de obra según el nivel de decoración artesanal */
export const MINUTOS_NIVEL_DECORACION: Record<NivelDecoracion, number> = {
  basica: 0,
  intermedia: 30,
  avanzada: 60,
  personalizada: 0,
};

export interface CosteoPasteleriaLoteResult {
  cantidad: number;
  tiempoBasePrepMin: number;
  minutosDecoracionExtra: number;
  tiempoActivoTotalMin: number;
  nivelDecoracion: NivelDecoracion;
  tarifaHoraMOD: number;
  tarifaMinutoMOD: number;
  costoMateriaPrimaLote: number;
  costoManoObraLote: number;
  requiereHorno: boolean;
  costoHornoLote: number;
  costoTotalProduccionLote: number;
  costoMateriaPrimaUnitario: number;
  costoManoObraUnitario: number;
  costoHornoUnitario: number;
  costoElaboracionUnitario: number;
  costoTotalUnitario: number;
  margenBeneficioPct: number;
  precioSugeridoUnitario: number;
  precioSugeridoLote: number;
  gananciaEstimadaUnitario: number;
  gananciaEstimadaLote: number;
  margenRealPct: number;
}

export interface ParametrosCosteoPasteleria {
  costoInsumosBase: number;
  costoPersonalizaciones?: number;
  costoEmpaque?: number;
  tiempoBasePrepMin?: number;
  nivelDecoracion?: NivelDecoracion;
  minutosDecoracionManual?: number;
  requiereHorno?: boolean;
  costoFijoHorno?: number;
  tarifaHoraMOD?: number;
  cantidad?: number;
  margenBeneficioPct?: number;
}

/**
 * Costeo Profesional de Repostería por Lote:
 * 1. MPD: Insumos base + personalizaciones + empaque, con 3% de merma técnica gastronómica.
 * 2. MOD: Solo tiempo activo humano (preparación de tazón + decoración) a RD$ 5.00/min.
 * 3. CIF: Consumo de horno/gas fijo por tanda prorrateado entre la cantidad del lote (evita RD$ 35 * 24 en cupcakes).
 * 4. Precio Sugerido: Fórmula estricta de Margen sobre Venta: CTP / (1 - Margen).
 */
export function calcularCosteoPasteleriaLote(params: ParametrosCosteoPasteleria): CosteoPasteleriaLoteResult {
  const {
    costoInsumosBase = 0,
    costoPersonalizaciones = 0,
    costoEmpaque = 0,
    tiempoBasePrepMin = 30,
    nivelDecoracion = 'basica',
    minutosDecoracionManual = 0,
    requiereHorno = true,
    costoFijoHorno = COSTO_HORNO_FIJO_DEFAULT,
    tarifaHoraMOD = TARIFA_HORA_MOD_DEFAULT,
    cantidad = 1,
    margenBeneficioPct = 50,
  } = params;

  // 1. Protección estricta de división por cero
  const cant = Math.max(1, cantidad || 1);

  // 2. Materia Prima Directa (MPD) con 3% de merma técnica gastronómica
  const insumosBrutosUnitario = (costoInsumosBase || 0) + (costoPersonalizaciones || 0) + (costoEmpaque || 0);
  const costoMateriaPrimaUnitario = Number((insumosBrutosUnitario * (1 + MERMA_TECNICA_INSUMOS_PCT)).toFixed(2));
  const costoMateriaPrimaLote = Number((costoMateriaPrimaUnitario * cant).toFixed(2));

  // 3. Mano de Obra Directa (MOD) - Solo tiempo activo humano del lote
  const minutosDeco = nivelDecoracion === 'personalizada'
    ? Math.max(0, minutosDecoracionManual || 0)
    : (MINUTOS_NIVEL_DECORACION[nivelDecoracion] ?? 0);

  const tiempoActivoTotalMin = Math.round((tiempoBasePrepMin || 30) + minutosDeco);
  const tarifaMinutoMOD = (tarifaHoraMOD || TARIFA_HORA_MOD_DEFAULT) / 60;
  const costoManoObraLote = Number((tiempoActivoTotalMin * tarifaMinutoMOD).toFixed(2));
  const costoManoObraUnitario = Number((costoManoObraLote / cant).toFixed(2));

  // 4. Costos Indirectos de Fabricación (CIF - Horno y Gas GLP)
  // Se aplica por tanda/lote horneado, NO multiplicado ciegamente por la cantidad
  const costoHornoLote = requiereHorno ? Number(costoFijoHorno.toFixed(2)) : 0;
  const costoHornoUnitario = Number((costoHornoLote / cant).toFixed(2));

  // 5. Costo de Elaboración (MOD + CIF) y Costo Total de Producción (CTP)
  const costoElaboracionUnitario = Number((costoManoObraUnitario + costoHornoUnitario).toFixed(2));
  const costoTotalUnitario = Number((costoMateriaPrimaUnitario + costoManoObraUnitario + costoHornoUnitario).toFixed(2));
  const costoTotalProduccionLote = Number((costoTotalUnitario * cant).toFixed(2));

  // 6. Fórmula profesional de Margen sobre Venta: Precio = CTP / (1 - Margen)
  const margenValido = Math.min(95, Math.max(0, margenBeneficioPct || 50));
  const divisor = Math.max(0.05, 1 - (margenValido / 100));
  const precioSugeridoUnitario = Number((costoTotalUnitario / divisor).toFixed(2));
  const precioSugeridoLote = Number((precioSugeridoUnitario * cant).toFixed(2));

  const gananciaEstimadaUnitario = Number((precioSugeridoUnitario - costoTotalUnitario).toFixed(2));
  const gananciaEstimadaLote = Number((gananciaEstimadaUnitario * cant).toFixed(2));
  const margenRealPct = precioSugeridoUnitario > 0
    ? Math.round((gananciaEstimadaUnitario / precioSugeridoUnitario) * 100)
    : 0;

  return {
    cantidad: cant,
    tiempoBasePrepMin,
    minutosDecoracionExtra: minutosDeco,
    tiempoActivoTotalMin,
    nivelDecoracion,
    tarifaHoraMOD,
    tarifaMinutoMOD,
    costoMateriaPrimaLote,
    costoManoObraLote,
    requiereHorno,
    costoHornoLote,
    costoTotalProduccionLote,
    costoMateriaPrimaUnitario,
    costoManoObraUnitario,
    costoHornoUnitario,
    costoElaboracionUnitario,
    costoTotalUnitario,
    margenBeneficioPct: margenValido,
    precioSugeridoUnitario,
    precioSugeridoLote,
    gananciaEstimadaUnitario,
    gananciaEstimadaLote,
    margenRealPct,
  };
}

export interface CostoElaboracionDesglose {
  tiempoPreparacionMin: number;
  tiempoHorneadoMin: number;
  tiempoTotalMin: number;
  costoManoObraPreparacion: number;
  costoOperativoHorno: number;
  costoElaboracionDecorado: number;
  costoElaboracionTotal: number;
  tarifaHoraTaller: number;
}

/**
 * Mantenido por retrocompatibilidad con componentes existentes.
 */
export function calcularCostoElaboracionProducto(
  receta: Receta | undefined,
  factorEscalado: number = 1,
  costoDecoracion: number = 0,
  tarifaHoraTaller: number = TARIFA_HORA_TALLER_DEFAULT
): CostoElaboracionDesglose {
  if (!receta) {
    return {
      tiempoPreparacionMin: 0,
      tiempoHorneadoMin: 0,
      tiempoTotalMin: 0,
      costoManoObraPreparacion: 0,
      costoOperativoHorno: 0,
      costoElaboracionDecorado: costoDecoracion,
      costoElaboracionTotal: costoDecoracion,
      tarifaHoraTaller,
    };
  }

  const factorTiempoPrep = factorEscalado < 1 ? Math.max(0.6, factorEscalado) : Math.min(2.5, factorEscalado);
  const tiempoPrep = Math.round((receta.tiempo_preparacion_min || 45) * factorTiempoPrep);
  const tiempoHorno = Math.round(receta.tiempo_horneado_min || 40);
  const tiempoTotal = tiempoPrep + tiempoHorno;

  const tarifaMinuto = (tarifaHoraTaller || TARIFA_HORA_TALLER_DEFAULT) / 60;
  const costoManoObraPrep = Number((tiempoPrep * tarifaMinuto).toFixed(2));
  const costoOperativoHorno = receta.tiempo_horneado_min && receta.tiempo_horneado_min > 0 ? COSTO_HORNO_FIJO_DEFAULT : 0;
  const costoDeco = Number((costoDecoracion || 0).toFixed(2));
  const costoTotal = Number((costoManoObraPrep + costoOperativoHorno + costoDeco).toFixed(2));

  return {
    tiempoPreparacionMin: tiempoPrep,
    tiempoHorneadoMin: tiempoHorno,
    tiempoTotalMin: tiempoTotal,
    costoManoObraPreparacion: costoManoObraPrep,
    costoOperativoHorno,
    costoElaboracionDecorado: costoDeco,
    costoElaboracionTotal: costoTotal,
    tarifaHoraTaller,
  };
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
  const gananciaEstimadaRaw = precioSugeridoMargenVentaRaw - costoTotalProduccion;

  const tiempoTotalMin = Math.round(((receta.tiempo_preparacion_min || 45) * factorEscalado) + (receta.tiempo_horneado_min || 40));
  const costoElaboracionTiempo = Number((costoManoObra + costoOperativo).toFixed(2));

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
    precio_sugerido_markup_raw: precioSugeridoMarkupRaw,
    precio_sugerido_margen_venta: precioSugeridoMargenVenta,
    precio_sugerido_margen_venta_raw: precioSugeridoMargenVentaRaw,
    precio_sugerido_venta: precioSugeridoMargenVenta,
    ganancia_estimada: gananciaEstimada,
    ganancia_estimada_raw: gananciaEstimadaRaw,
    costo_elaboracion_tiempo: costoElaboracionTiempo,
    tiempo_total_min: tiempoTotalMin,
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
