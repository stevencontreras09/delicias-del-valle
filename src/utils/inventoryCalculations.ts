import { CotizacionItem, PedidoItem, Insumo, Receta, UnidadBase } from '../types';
import { formatCurrency } from './formatters';

export type EstadoStockInsumo = 'disponible' | 'alerta' | 'agotado';

export interface RequerimientoInsumo {
  insumo_id: number;
  nombre: string;
  categoria: string;
  unidad_base: UnidadBase;
  unidad_compra: string;
  presentacion_empaque: number;
  precio_compra: number;
  costo_unitario_base: number;
  cantidad_requerida: number; // en unidad_base
  stock_actual: number; // en unidad_base
  diferencia: number; // stock_actual - cantidad_requerida
  faltante: number; // Math.max(0, cantidad_requerida - stock_actual)
  faltante_unidades_compra: number; // faltante / presentacion_empaque
  costo_faltante_rd: number; // faltante * costo_unitario_base
  estado: EstadoStockInsumo;
  recetas_origen: string[];
}

export interface ResumenExplosionMateriales {
  items: RequerimientoInsumo[];
  totalInsumos: number;
  itemsCubiertos: number;
  itemsFaltantes: number;
  itemsAgotados: number;
  itemsAlerta: number;
  presupuestoFaltanteTotalRD: number;
  coberturaGlobalPct: number;
}

/**
 * Formatea una cantidad según su unidad base gastronómica (g -> kg, ml -> L, ud -> uds)
 */
export function formatCantidadUnidadBase(cantidad: number, unidad: UnidadBase | string): string {
  if (isNaN(cantidad)) return `0 ${unidad}`;
  const cantRedondeada = Math.round(cantidad * 100) / 100;

  if (unidad === 'g') {
    if (cantRedondeada >= 1000) {
      const kg = cantRedondeada / 1000;
      return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg (${cantRedondeada.toLocaleString('es-DO')} g)`;
    }
    return `${cantRedondeada % 1 === 0 ? cantRedondeada : cantRedondeada.toFixed(1)} g`;
  }

  if (unidad === 'ml') {
    if (cantRedondeada >= 1000) {
      const l = cantRedondeada / 1000;
      return `${l % 1 === 0 ? l : l.toFixed(2)} L (${cantRedondeada.toLocaleString('es-DO')} ml)`;
    }
    return `${cantRedondeada % 1 === 0 ? cantRedondeada : cantRedondeada.toFixed(1)} ml`;
  }

  return `${cantRedondeada % 1 === 0 ? cantRedondeada : cantRedondeada.toFixed(1)} ${unidad}${cantRedondeada > 1 && unidad === 'ud' ? 's' : ''}`;
}

/**
 * Formatea la sugerencia de compra en unidades comerciales (ej. "2.5 lb", "3 cajas", "500 g")
 */
export function formatSugerenciaCompra(item: RequerimientoInsumo): string {
  if (item.faltante <= 0) return 'Cubierto en almacén';

  if (item.presentacion_empaque > 1 && item.unidad_compra && item.unidad_compra !== item.unidad_base) {
    const unidadesComerciales = item.faltante / item.presentacion_empaque;
    const paquetesAprox = Math.ceil(unidadesComerciales);
    const formattedNum = unidadesComerciales % 1 === 0 ? unidadesComerciales : unidadesComerciales.toFixed(2);

    return `Faltan ${formattedNum} ${item.unidad_compra} (~${paquetesAprox} ${item.unidad_compra} comercial${paquetesAprox > 1 ? 'es' : ''})`;
  }

  return `Faltan ${formatCantidadUnidadBase(item.faltante, item.unidad_base)}`;
}

/**
 * Motor de Explosión de Materiales (BOM) y cruce contra inventario
 */
export function calcularRequerimientosMateriales(
  items: (CotizacionItem | PedidoItem)[],
  catalogoInsumos: Insumo[],
  catalogoRecetas: Receta[]
): ResumenExplosionMateriales {
  const insumosMap = new Map<number, Insumo>();
  const insumosByName = new Map<string, Insumo>();
  catalogoInsumos.forEach((ins) => {
    insumosMap.set(ins.id, ins);
    insumosByName.set(ins.nombre.trim().toLowerCase(), ins);
  });

  const recetasMap = new Map<number, Receta>();
  catalogoRecetas.forEach((rec) => {
    recetasMap.set(rec.id, rec);
  });

  // Mapa de acumulación: insumo_id -> { cantidad: number, origenes: Set<string> }
  const requerimientos = new Map<number, { cantidad: number; origenes: Set<string> }>();

  const addRequirement = (insumoId: number, cantidad: number, origen: string) => {
    if (!insumoId || cantidad <= 0) return;
    const actual = requerimientos.get(insumoId) || { cantidad: 0, origenes: new Set<string>() };
    actual.cantidad += cantidad;
    if (origen) actual.origenes.add(origen);
    requerimientos.set(insumoId, actual);
  };

  // Recorrer cada ítem de la cotización o pedido
  items.forEach((item) => {
    const itemCant = Math.max(1, item.cantidad || 1);
    const factor = Math.max(0.01, item.factor_receta || 1);
    const nombreItem = item.receta_nombre || 'Producto sin nombre';

    // 1. Caso: Ítem extra independiente de la orden (sin receta base)
    const isStandaloneExtra = (item as any).es_extra || (!item.receta_id && item.tamano_porciones?.toLowerCase().includes('extra'));
    if (isStandaloneExtra || !item.receta_id) {
      const insumoMatch = insumosByName.get(nombreItem.trim().toLowerCase());
      if (insumoMatch) {
        addRequirement(insumoMatch.id, itemCant, `Extra: ${nombreItem}`);
      }
      return;
    }

    // 2. Caso: Producto con receta base
    const receta = recetasMap.get(item.receta_id) || catalogoRecetas.find((r) => r.nombre.trim().toLowerCase() === nombreItem.trim().toLowerCase());
    if (receta && Array.isArray(receta.ingredientes)) {
      const escalaLote = factor * itemCant;
      const selectedVars: number[] | undefined = (item as any).variables_seleccionadas;

      receta.ingredientes.forEach((ing) => {
        // Si el ingrediente es variable, solo se suma si fue explícitamente seleccionado
        if (ing.tipo === 'variable') {
          if (selectedVars && selectedVars.length > 0) {
            if (!selectedVars.includes(ing.insumo_id)) {
              return;
            }
          }
        }

        const cantTotal = ing.cantidad * escalaLote;
        addRequirement(ing.insumo_id, cantTotal, `${nombreItem} (x${itemCant})`);
      });
    }

    // 3. Caso: Extras asignados al producto
    if (Array.isArray((item as any).extras) && (item as any).extras.length > 0) {
      (item as any).extras.forEach((extra: any) => {
        const extraMatch = insumosByName.get(extra.nombre?.trim().toLowerCase());
        if (extraMatch) {
          const cantExtra = (extra.cantidad || 1) * itemCant;
          addRequirement(extraMatch.id, cantExtra, `${nombreItem} (Extra: ${extra.nombre})`);
        }
      });
    }
  });

  // Cruzar requerimientos consolidados contra el stock de almacén
  const resultadoItems: RequerimientoInsumo[] = [];
  let presupuestoFaltanteTotalRD = 0;
  let itemsCubiertos = 0;
  let itemsFaltantes = 0;
  let itemsAgotados = 0;
  let itemsAlerta = 0;

  requerimientos.forEach((req, insumoId) => {
    const insumo = insumosMap.get(insumoId);
    if (!insumo) return;

    const cantReq = Number(req.cantidad.toFixed(2));
    const stockActual = Number((insumo.stock_actual || 0).toFixed(2));
    const diferencia = Number((stockActual - cantReq).toFixed(2));
    const faltante = Math.max(0, Number((cantReq - stockActual).toFixed(2)));

    const costoUnitarioBase = insumo.costo_unitario_base || (insumo.presentacion_empaque > 0 ? insumo.precio_compra / insumo.presentacion_empaque : 0);
    const costoFaltanteRD = Number((faltante * costoUnitarioBase).toFixed(2));
    const faltanteUnidadesCompra = insumo.presentacion_empaque > 0 ? Number((faltante / insumo.presentacion_empaque).toFixed(2)) : faltante;

    let estado: EstadoStockInsumo = 'disponible';
    if (diferencia >= 0) {
      estado = 'disponible';
      itemsCubiertos++;
    } else if (stockActual <= 0) {
      estado = 'agotado';
      itemsFaltantes++;
      itemsAgotados++;
    } else {
      estado = 'alerta';
      itemsFaltantes++;
      itemsAlerta++;
    }

    presupuestoFaltanteTotalRD += costoFaltanteRD;

    resultadoItems.push({
      insumo_id: insumo.id,
      nombre: insumo.nombre,
      categoria: insumo.categoria || 'General',
      unidad_base: insumo.unidad_base,
      unidad_compra: insumo.unidad_compra || insumo.unidad_base,
      presentacion_empaque: insumo.presentacion_empaque || 1,
      precio_compra: insumo.precio_compra || 0,
      costo_unitario_base: costoUnitarioBase,
      cantidad_requerida: cantReq,
      stock_actual: stockActual,
      diferencia,
      faltante,
      faltante_unidades_compra: faltanteUnidadesCompra,
      costo_faltante_rd: costoFaltanteRD,
      estado,
      recetas_origen: Array.from(req.origenes),
    });
  });

  // Ordenar: primero los agotados, luego en alerta, luego disponibles; y por mayor costo faltante
  resultadoItems.sort((a, b) => {
    const pesoEstado = { agotado: 3, alerta: 2, disponible: 1 };
    if (pesoEstado[a.estado] !== pesoEstado[b.estado]) {
      return pesoEstado[b.estado] - pesoEstado[a.estado];
    }
    return b.costo_faltante_rd - a.costo_faltante_rd;
  });

  const totalInsumos = resultadoItems.length;
  const coberturaGlobalPct = totalInsumos > 0 ? Math.round((itemsCubiertos / totalInsumos) * 100) : 100;

  return {
    items: resultadoItems,
    totalInsumos,
    itemsCubiertos,
    itemsFaltantes,
    itemsAgotados,
    itemsAlerta,
    presupuestoFaltanteTotalRD: Number(presupuestoFaltanteTotalRD.toFixed(2)),
    coberturaGlobalPct,
  };
}

/**
 * Genera una lista de compras limpia y formateada para WhatsApp
 */
export function generarListaComprasWhatsApp(
  resumen: ResumenExplosionMateriales,
  metadata: { titulo?: string; codigo?: string; cliente?: string }
): string {
  const faltantes = resumen.items.filter((item) => item.faltante > 0);

  let texto = `🍰 *DELICIAS DEL VALLE - LISTA DE COMPRAS* 🛒\n`;
  if (metadata.codigo || metadata.cliente) {
    texto += `📋 *Referencia:* ${metadata.codigo || ''} ${metadata.cliente ? `(${metadata.cliente})` : ''}\n`;
  }
  texto += `🗓️ *Fecha:* ${new Date().toLocaleDateString('es-DO')}\n`;
  texto += `----------------------------------------\n\n`;

  if (faltantes.length === 0) {
    texto += `✅ *¡Todo el inventario está cubierto en taller!* No se requieren compras para esta orden.\n`;
    return texto;
  }

  texto += `⚠️ *INSUMOS FALTANTES POR COMPRAR (${faltantes.length}):*\n\n`;

  faltantes.forEach((item, index) => {
    let cantTexto = '';
    if (item.presentacion_empaque > 1 && item.unidad_compra && item.unidad_compra !== item.unidad_base) {
      const paquetes = Math.ceil(item.faltante / item.presentacion_empaque);
      const exacto = (item.faltante / item.presentacion_empaque).toFixed(1);
      cantTexto = `${exacto} ${item.unidad_compra} (~${paquetes} ${item.unidad_compra})`;
    } else {
      cantTexto = formatCantidadUnidadBase(item.faltante, item.unidad_base);
    }

    texto += `[ ] *${item.nombre}*\n`;
    texto += `    • Faltan: *${cantTexto}*\n`;
    texto += `    • Costo estimado: ~${formatCurrency(item.costo_faltante_rd)}\n\n`;
  });

  texto += `----------------------------------------\n`;
  texto += `💰 *PRESUPUESTO TOTAL ESTIMADO:* *${formatCurrency(resumen.presupuestoFaltanteTotalRD)}*\n`;
  texto += `_Verificar precios actuales en supermercado o suplidor._`;

  return texto;
}
