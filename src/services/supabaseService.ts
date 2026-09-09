import { getSupabaseClient } from '../utils/supabaseClient';
import { Insumo, Merma, Receta, Cotizacion, Pedido, Usuario, Cliente, FormatoPresentacion, ZonaDelivery } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  counts?: {
    insumos: number;
    recetas: number;
    cotizaciones: number;
    pedidos: number;
    mermas: number;
  };
}

/**
 * Prueba la conexión con el servidor Supabase
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; insumosCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { connected: false, message: 'Credenciales de Supabase no configuradas.' };
  }

  try {
    const { data, count, error } = await client
      .from('insumos')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      return { connected: false, message: `Error de Supabase: ${error.message}` };
    }

    return {
      connected: true,
      message: `Conexión exitosa. Se encontraron ${count ?? data?.length ?? 0} insumos en la base de datos.`,
      insumosCount: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return { connected: false, message: `Error de conexión: ${err.message || err}` };
  }
}

/**
 * Descarga todo el dataset desde Supabase a la aplicación web
 */
export async function fetchAllFromSupabase(): Promise<{
  success: boolean;
  error?: string;
  data?: {
    insumos: Insumo[];
    recetas: Receta[];
    cotizaciones: Cotizacion[];
    pedidos: Pedido[];
    mermas: Merma[];
    usuarios?: Usuario[];
    zonasDelivery?: ZonaDelivery[];
  };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    // 1. Fetch Insumos
    const { data: insumosDb, error: insumosErr } = await client
      .from('insumos')
      .select('*')
      .order('id', { ascending: true });

    if (insumosErr) throw new Error(`Error cargando insumos: ${insumosErr.message}`);

    // 2. Fetch Recetas con sus ingredientes
    const { data: recetasDb, error: recetasErr } = await client
      .from('recetas')
      .select('*, receta_ingredientes(*)')
      .order('id', { ascending: true });

    if (recetasErr) throw new Error(`Error cargando recetas: ${recetasErr.message}`);

    // 3. Fetch Cotizaciones con sus items
    const { data: cotizacionesDb, error: cotErr } = await client
      .from('cotizaciones')
      .select('*, cotizacion_items(*)')
      .order('id', { ascending: true });

    if (cotErr) throw new Error(`Error cargando cotizaciones: ${cotErr.message}`);

    // 4. Fetch Pedidos con items y pagos
    const { data: pedidosDb, error: pedErr } = await client
      .from('pedidos')
      .select('*, pedido_items(*), pagos(*)')
      .order('id', { ascending: true });

    if (pedErr) throw new Error(`Error cargando pedidos: ${pedErr.message}`);

    // 5. Fetch Mermas
    const { data: mermasDb, error: mermasErr } = await client
      .from('mermas')
      .select('*')
      .order('id', { ascending: true });

    if (mermasErr) throw new Error(`Error cargando mermas: ${mermasErr.message}`);

    // 6. Fetch Zonas de Delivery
    let zonasDelivery: ZonaDelivery[] = [];
    try {
      const { data: zonasDb } = await client
        .from('zonas_delivery')
        .select('*')
        .order('id', { ascending: true });

      if (zonasDb && Array.isArray(zonasDb)) {
        zonasDelivery = zonasDb.map((z: any) => ({
          id: Number(z.id),
          nombre: z.nombre,
          tarifa: Number(z.tarifa || 0),
          tiempo_estimado_min: z.tiempo_estimado_min ? Number(z.tiempo_estimado_min) : undefined,
          activo: z.activo ?? true,
          created_at: z.created_at,
        }));
      }
    } catch (e) {
      console.warn('Tabla zonas_delivery no disponible en Supabase:', e);
    }

    // Transformar a tipos de la aplicación
    const insumos: Insumo[] = (insumosDb || []).map((i: any) => ({
      id: Number(i.id),
      nombre: i.nombre,
      categoria: i.categoria,
      unidad_compra: i.unidad_compra,
      precio_compra: Number(i.precio_compra),
      presentacion_empaque: Number(i.presentacion_empaque),
      unidad_base: i.unidad_base,
      factor_conversion: Number(i.factor_conversion),
      costo_unitario_base: Number(i.costo_unitario_base),
      stock_actual: Number(i.stock_actual),
      stock_minimo: Number(i.stock_minimo),
      activo: Boolean(i.activo),
    }));

    const recetas: Receta[] = (recetasDb || []).map((r: any) => {
      let formatosPermitidos: FormatoPresentacion[] = ['libra', 'porcion', 'mini'];
      if (Array.isArray(r.formatos_permitidos) && r.formatos_permitidos.length > 0) {
        formatosPermitidos = r.formatos_permitidos;
      } else if (typeof r.descripcion === 'string' && r.descripcion.includes('<!--formatos:')) {
        try {
          const match = r.descripcion.match(/<!--formatos:(.*?)-->/);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              formatosPermitidos = parsed;
            }
          }
        } catch {}
      }

      const cleanDesc = typeof r.descripcion === 'string'
        ? r.descripcion.replace(/<!--formatos:.*?-->/g, '').trim()
        : '';

      return {
        id: Number(r.id),
        nombre: r.nombre,
        categoria: r.categoria,
        descripcion: cleanDesc,
        rendimiento_base: Number(r.rendimiento_base),
        rendimiento_unidad: r.rendimiento_unidad,
        tiempo_preparacion_min: Number(r.tiempo_preparacion_min),
        tiempo_horneado_min: Number(r.tiempo_horneado_min),
        temperatura_horno_c: Number(r.temperatura_horno_c) || 180,
        materiales_indirectos_pct: Number(r.materiales_indirectos_pct ?? 10),
        costos_operativos_pct: Number(r.costos_operativos_pct ?? 15),
        reposicion_equipos_pct: Number(r.reposicion_equipos_pct ?? 10),
        mano_obra_pct: Number(r.mano_obra_pct ?? 30),
        margen_beneficio_pct: Number(r.margen_beneficio_pct ?? 50),
        formatos_permitidos: formatosPermitidos,
        activa: Boolean(r.activa),
        nombre_base: r.nombre_base || undefined,
        es_variante_de: r.es_variante_de ? Number(r.es_variante_de) : undefined,
        orden_variante: r.orden_variante !== undefined ? Number(r.orden_variante) : undefined,
        created_at: r.created_at || r.updated_at || undefined,
        updated_at: r.updated_at || undefined,
        instrucciones: Array.isArray(r.instrucciones) ? r.instrucciones : [],
        ingredientes: (r.receta_ingredientes || []).map((ing: any) => ({
          insumo_id: Number(ing.insumo_id),
          cantidad: Number(ing.cantidad),
          tipo: ing.tipo,
        })),
      };
    });

    const cotizaciones: Cotizacion[] = (cotizacionesDb || []).map((c: any) => ({
      id: Number(c.id),
      codigo: c.codigo,
      cliente_nombre: c.cliente_nombre,
      cliente_telefono: c.cliente_telefono,
      fecha_emision: c.fecha_emision,
      fecha_evento: c.fecha_evento || undefined,
      validez_dias: Number(c.validez_dias),
      subtotal: Number(c.subtotal),
      descuento: Number(c.descuento || 0),
      costo_envio: Number(c.costo_envio || 0),
      total: Number(c.total),
      notas: c.notas || '',
      estado: c.estado,
      tipo_despacho: (c.tipo_despacho as any) || (Number(c.costo_delivery || c.costo_envio || 0) > 0 ? 'delivery' : 'retiro'),
      zona_delivery_id: c.zona_delivery_id ? Number(c.zona_delivery_id) : undefined,
      costo_delivery: Number(c.costo_delivery ?? c.costo_envio ?? 0),
      direccion_entrega: c.direccion_entrega || '',
      punto_referencia: c.punto_referencia || '',
      repartidor_nombre: c.repartidor_nombre || '',
      repartidor_telefono: c.repartidor_telefono || '',
      direccion_confirmada: Boolean(c.direccion_confirmada),
      metodo_pago: c.metodo_pago || 'transferencia',
      pago_delivery: c.pago_delivery || (c.cobro_delivery_al_recibir ? 'efectivo_aparte' : 'completo'),
      cobro_delivery_al_recibir: Boolean(c.cobro_delivery_al_recibir || c.pago_delivery === 'efectivo_aparte'),
      cobro_contra_entrega: Boolean(c.cobro_contra_entrega),
      created_at: c.created_at || new Date().toISOString(),
      items: (c.cotizacion_items || []).map((item: any) => ({
        id: `item-cot-${item.id}`,
        receta_id: item.receta_id ? Number(item.receta_id) : undefined,
        receta_nombre: item.receta_nombre,
        tamano_porciones: item.tamano_porciones,
        masa_base: item.masa_base,
        relleno: item.relleno,
        decoracion: item.decoracion,
        dedicatoria: item.dedicatoria || '',
        extras: Array.isArray(item.extras)
          ? item.extras.filter((e: any) => e.id !== 'variables_receta')
          : [],
        variables_receta: item.variables_receta || (
          Array.isArray(item.extras)
            ? item.extras.find((e: any) => e.id === 'variables_receta')?.nombre?.replace(/^Variables:\s*/, '').split(', ')
            : undefined
        ),
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.subtotal),
        factor_receta: Number(item.factor_receta || 1),
      })),
    }));

    const pedidos: Pedido[] = (pedidosDb || []).map((p: any) => ({
      id: Number(p.id),
      cotizacion_id: p.cotizacion_id ? Number(p.cotizacion_id) : undefined,
      numero_factura: p.numero_factura,
      cliente_nombre: p.cliente_nombre,
      cliente_telefono: p.cliente_telefono,
      fecha_pedido: p.fecha_pedido,
      fecha_entrega: p.fecha_entrega,
      hora_entrega: p.hora_entrega || '14:00',
      tipo_entrega: p.tipo_entrega,
      direccion_entrega: p.direccion_entrega || '',
      subtotal: Number(p.subtotal),
      costo_envio: Number(p.costo_envio || 0),
      total: Number(p.total),
      anticipo_pagado: Number(p.anticipo_pagado || 0),
      saldo_pendiente: Number(p.saldo_pendiente || 0),
      estado: p.estado,
      checklist_completado: p.checklist_completado || {},
      inventario_descontado: Boolean(p.inventario_descontado),
      tipo_despacho: (p.tipo_despacho as any) || (p.tipo_entrega === 'domicilio' ? 'delivery' : 'retiro'),
      zona_delivery_id: p.zona_delivery_id ? Number(p.zona_delivery_id) : undefined,
      costo_delivery: Number(p.costo_delivery ?? p.costo_envio ?? 0),
      punto_referencia: p.punto_referencia || '',
      repartidor_nombre: p.repartidor_nombre || '',
      repartidor_telefono: p.repartidor_telefono || '',
      cobro_delivery_al_recibir: Boolean(p.cobro_delivery_al_recibir),
      created_at: p.created_at || new Date().toISOString(),
      items: (p.pedido_items || []).map((item: any) => ({
        id: `item-ped-${item.id}`,
        receta_id: item.receta_id ? Number(item.receta_id) : undefined,
        receta_nombre: item.receta_nombre,
        tamano_porciones: item.tamano_porciones,
        masa_base: item.masa_base,
        relleno: item.relleno,
        decoracion: item.decoracion,
        dedicatoria: item.dedicatoria || '',
        extras_texto: item.extras_texto || '',
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.subtotal),
        factor_receta: Number(item.factor_receta || 1),
      })),
      pagos: (p.pagos || []).map((pago: any) => ({
        id: `pago-${pago.id}`,
        pedido_id: Number(pago.pedido_id),
        monto: Number(pago.monto),
        metodo: pago.metodo,
        referencia: pago.referencia || '',
        tipo_pago: pago.tipo_pago,
        fecha: pago.fecha,
      })),
    }));

    const mermas: Merma[] = (mermasDb || []).map((m: any) => ({
      id: Number(m.id),
      insumo_id: Number(m.insumo_id),
      insumo_nombre: m.insumo_nombre,
      cantidad: Number(m.cantidad),
      unidad_base: m.unidad_base,
      motivo: m.motivo,
      costo_perdido: Number(m.costo_perdido),
      fecha: m.fecha,
      notas: m.notas || '',
    }));

    // 6. Fetch Usuarios Seguros (sin columna password)
    let usuarios: Usuario[] = [];
    try {
      // Intentar primero con la vista segura usuarios_seguros
      let { data: usuariosDb, error: userErr } = await client
        .from('usuarios_seguros')
        .select('*')
        .order('id', { ascending: true });

      // Si aún no se ha creado la vista, fallback a usuarios excluyendo la columna password
      if (userErr) {
        const fallbackRes = await client
          .from('usuarios')
          .select('id, username, nombre_completo, email, telefono, rol, activo, avatar_url, ultimo_acceso, created_at')
          .order('id', { ascending: true });
        usuariosDb = fallbackRes.data;
        userErr = fallbackRes.error;
      }

      if (!userErr && usuariosDb) {
        usuarios = usuariosDb.map((u: any) => ({
          id: Number(u.id),
          username: u.username,
          nombre_completo: u.nombre_completo,
          email: u.email || '',
          telefono: u.telefono || '',
          rol: u.rol,
          activo: Boolean(u.activo),
          avatar_url: u.avatar_url || '',
          ultimo_acceso: u.ultimo_acceso || undefined,
          created_at: u.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Continuar sin interrumpir la carga de otros datos
    }

    return {
      success: true,
      data: {
        insumos,
        recetas,
        cotizaciones,
        pedidos,
        mermas,
        usuarios,
        zonasDelivery,
      },
    };
  } catch (err: any) {
    console.error('Error sincronizando con Supabase:', err);
    return { success: false, error: err.message || 'Error desconocido al conectar con Supabase' };
  }
}

/**
 * Sube o actualiza un insumo en Supabase
 */
export async function syncInsumoToSupabase(insumo: Insumo): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('insumos').upsert({
      id: insumo.id,
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      unidad_compra: insumo.unidad_compra,
      precio_compra: insumo.precio_compra,
      presentacion_empaque: insumo.presentacion_empaque,
      unidad_base: insumo.unidad_base,
      factor_conversion: insumo.factor_conversion,
      costo_unitario_base: insumo.costo_unitario_base,
      stock_actual: insumo.stock_actual,
      stock_minimo: insumo.stock_minimo,
      activo: insumo.activo,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Sube o actualiza una receta en Supabase con sus ingredientes
 */
export async function syncRecetaToSupabase(receta: Receta): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Cliente de Supabase no configurado' };

  try {
    const formatos = receta.formatos_permitidos && receta.formatos_permitidos.length > 0
      ? receta.formatos_permitidos
      : ['libra', 'porcion', 'mini'];

    const cleanDesc = (receta.descripcion || '').replace(/<!--formatos:.*?-->/g, '').trim();

    const baseRow: any = {
      id: receta.id,
      nombre: receta.nombre,
      categoria: receta.categoria,
      descripcion: cleanDesc,
      rendimiento_base: receta.rendimiento_base,
      rendimiento_unidad: receta.rendimiento_unidad,
      tiempo_preparacion_min: receta.tiempo_preparacion_min,
      tiempo_horneado_min: receta.tiempo_horneado_min,
      temperatura_horno_c: receta.temperatura_horno_c,
      materiales_indirectos_pct: receta.materiales_indirectos_pct,
      costos_operativos_pct: receta.costos_operativos_pct,
      reposicion_equipos_pct: receta.reposicion_equipos_pct,
      mano_obra_pct: receta.mano_obra_pct,
      margen_beneficio_pct: receta.margen_beneficio_pct,
      activa: receta.activa,
      instrucciones: receta.instrucciones,
      updated_at: new Date().toISOString(),
    };

    // 1. Intentar upsert con la columna formatos_permitidos
    let { data: recDb, error: recErr } = await client.from('recetas').upsert({
      ...baseRow,
      formatos_permitidos: formatos,
    }).select().single();

    // 2. Si la columna aún no existe en Supabase (error PGRST204), fallback guardando metadata en descripcion
    if (recErr && (recErr.code === 'PGRST204' || recErr.message?.includes('formatos_permitidos'))) {
      console.warn('Columna formatos_permitidos no detectada en Supabase. Aplicando metadato de compatibilidad.');
      const descConMeta = `${cleanDesc}\n<!--formatos:${JSON.stringify(formatos)}-->`.trim();
      const retry = await client.from('recetas').upsert({
        ...baseRow,
        descripcion: descConMeta,
      }).select().single();
      recDb = retry.data;
      recErr = retry.error;
    }

    if (recErr) {
      console.error('Error al guardar receta en Supabase:', recErr);
      return { success: false, error: recErr.message };
    }

    // Eliminar ingredientes antiguos e insertar los actuales
    await client.from('receta_ingredientes').delete().eq('receta_id', recDb.id);

    if (receta.ingredientes.length > 0) {
      const ingRows = receta.ingredientes.map(ing => ({
        receta_id: recDb.id,
        insumo_id: ing.insumo_id,
        cantidad: ing.cantidad,
        tipo: ing.tipo,
      }));
      const { error: ingErr } = await client.from('receta_ingredientes').insert(ingRows);
      if (ingErr) console.warn('Advertencia guardando receta_ingredientes:', ingErr.message);
    }

    return { success: true, data: recDb };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error inesperado al sincronizar receta' };
  }
}

/**
 * Sube un nuevo pedido y descuenta inventario en Supabase
 */
export async function syncPedidoToSupabase(pedido: Pedido): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data: pedDb, error: pedErr } = await client.from('pedidos').upsert({
      id: pedido.id,
      cotizacion_id: pedido.cotizacion_id || null,
      cliente_id: pedido.cliente_id || null,
      numero_factura: pedido.numero_factura,
      cliente_nombre: pedido.cliente_nombre,
      cliente_telefono: pedido.cliente_telefono,
      fecha_pedido: pedido.fecha_pedido,
      fecha_entrega: pedido.fecha_entrega,
      hora_entrega: pedido.hora_entrega,
      tipo_entrega: pedido.tipo_entrega,
      direccion_entrega: pedido.direccion_entrega || '',
      subtotal: pedido.subtotal,
      costo_envio: pedido.costo_envio,
      total: pedido.total,
      anticipo_pagado: pedido.anticipo_pagado,
      saldo_pendiente: pedido.saldo_pendiente,
      estado: pedido.estado,
      checklist_completado: pedido.checklist_completado,
      inventario_descontado: pedido.inventario_descontado,
      tipo_despacho: pedido.tipo_despacho || (pedido.tipo_entrega === 'domicilio' ? 'delivery' : 'retiro'),
      zona_delivery_id: pedido.zona_delivery_id || null,
      costo_delivery: pedido.costo_delivery ?? pedido.costo_envio ?? 0,
      punto_referencia: pedido.punto_referencia || '',
      repartidor_nombre: pedido.repartidor_nombre || '',
      repartidor_telefono: pedido.repartidor_telefono || '',
      cobro_delivery_al_recibir: Boolean(pedido.cobro_delivery_al_recibir),
      updated_at: new Date().toISOString(),
    }).select().single();

    if (pedErr) return false;

    // Eliminar e insertar items
    await client.from('pedido_items').delete().eq('pedido_id', pedDb.id);
    if (pedido.items.length > 0) {
      const itemRows = pedido.items.map(item => ({
        pedido_id: pedDb.id,
        receta_id: item.receta_id || null,
        receta_nombre: item.receta_nombre,
        tamano_porciones: item.tamano_porciones,
        masa_base: item.masa_base,
        relleno: item.relleno,
        decoracion: item.decoracion,
        dedicatoria: item.dedicatoria || '',
        extras_texto: item.extras_texto || '',
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        factor_receta: item.factor_receta || 1,
      }));
      await client.from('pedido_items').insert(itemRows);
    }

    // Pagos con conciliación bancaria
    await client.from('pagos').delete().eq('pedido_id', pedDb.id);
    if (pedido.pagos && pedido.pagos.length > 0) {
      const pagoRows = pedido.pagos.map(p => ({
        pedido_id: pedDb.id,
        monto: p.monto,
        metodo: p.metodo,
        referencia: p.referencia || p.numero_referencia || '',
        numero_referencia: p.numero_referencia || p.referencia || '',
        banco: p.banco || null,
        comprobante_url: p.comprobante_url || null,
        estado_conciliacion: p.estado_conciliacion || 'confirmado',
        tipo_pago: p.tipo_pago,
        fecha: p.fecha || new Date().toISOString(),
      }));
      await client.from('pagos').insert(pagoRows);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sube o actualiza una cotización en Supabase con sus items, capturando errores de RLS o constraints
 */
export async function syncCotizacionToSupabase(
  cotizacion: Cotizacion
): Promise<{ success: boolean; data?: Cotizacion; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase no está configurado.' };

  try {
    const payload: any = {
      id: cotizacion.id,
      codigo: cotizacion.codigo,
      cliente_nombre: cotizacion.cliente_nombre,
      cliente_telefono: cotizacion.cliente_telefono,
      fecha_emision: cotizacion.fecha_emision,
      validez_dias: cotizacion.validez_dias,
      subtotal: cotizacion.subtotal,
      descuento: cotizacion.descuento || 0,
      costo_envio: cotizacion.costo_envio || 0,
      total: cotizacion.total,
      notas: cotizacion.notas || '',
      estado: cotizacion.estado,
      updated_at: new Date().toISOString(),
    };

    if (cotizacion.cliente_id) payload.cliente_id = cotizacion.cliente_id;
    if (cotizacion.fecha_evento) payload.fecha_evento = cotizacion.fecha_evento;
    if (cotizacion.cliente_email) payload.cliente_email = cotizacion.cliente_email;
    if (cotizacion.tipo_despacho) payload.tipo_despacho = cotizacion.tipo_despacho;
    if (cotizacion.zona_delivery_id !== undefined) payload.zona_delivery_id = cotizacion.zona_delivery_id;
    if (cotizacion.costo_delivery !== undefined) payload.costo_delivery = cotizacion.costo_delivery;
    if (cotizacion.direccion_entrega) payload.direccion_entrega = cotizacion.direccion_entrega;
    if (cotizacion.punto_referencia) payload.punto_referencia = cotizacion.punto_referencia;
    if (cotizacion.repartidor_nombre) payload.repartidor_nombre = cotizacion.repartidor_nombre;
    if (cotizacion.repartidor_telefono) payload.repartidor_telefono = cotizacion.repartidor_telefono;
    if (cotizacion.direccion_confirmada !== undefined) payload.direccion_confirmada = cotizacion.direccion_confirmada;
    if (cotizacion.metodo_pago) payload.metodo_pago = cotizacion.metodo_pago;
    if (cotizacion.pago_delivery) payload.pago_delivery = cotizacion.pago_delivery;
    if (cotizacion.cobro_delivery_al_recibir !== undefined) payload.cobro_delivery_al_recibir = cotizacion.cobro_delivery_al_recibir;
    if (cotizacion.cobro_contra_entrega !== undefined) payload.cobro_contra_entrega = cotizacion.cobro_contra_entrega;

    let { data: cotDb, error: cotErr } = await client.from('cotizaciones').upsert(payload).select().single();

    // Si falla porque alguna columna opcional no existe aún en la tabla de Supabase
    if (cotErr && (cotErr.message?.includes('cliente_email') || cotErr.message?.includes('metodo_pago') || cotErr.message?.includes('pago_delivery') || cotErr.message?.includes('direccion_confirmada') || cotErr.message?.includes('cobro_contra_entrega') || cotErr.code === 'PGRST204')) {
      delete payload.cliente_email;
      delete payload.metodo_pago;
      delete payload.pago_delivery;
      delete payload.direccion_confirmada;
      delete payload.cobro_delivery_al_recibir;
      delete payload.cobro_contra_entrega;
      const retry = await client.from('cotizaciones').upsert(payload).select().single();
      cotDb = retry.data;
      cotErr = retry.error;
    }

    if (cotErr) {
      console.error('Error en INSERT/UPSERT cotizaciones en Supabase:', cotErr);
      return { success: false, error: cotErr.message };
    }

    // Eliminar e insertar items de la cotización
    await client.from('cotizacion_items').delete().eq('cotizacion_id', cotDb.id);
    if (cotizacion.items && cotizacion.items.length > 0) {
      const itemRows = cotizacion.items.map(item => ({
        cotizacion_id: cotDb.id,
        receta_id: item.receta_id || null,
        receta_nombre: item.receta_nombre,
        tamano_porciones: item.tamano_porciones || '1 LB (16-20 porciones)',
        masa_base: item.masa_base || 'Tradicional',
        relleno: item.relleno || 'Sin relleno',
        decoracion: item.decoracion || 'Estándar',
        dedicatoria: item.dedicatoria || '',
        extras: [
          ...(Array.isArray(item.extras) ? item.extras.filter((e: any) => e.id !== 'variables_receta') : []),
          ...(item.variables_receta && item.variables_receta.length > 0
            ? [{ id: 'variables_receta', nombre: `Variables: ${item.variables_receta.join(', ')}`, precio: 0 }]
            : [])
        ],
        cantidad: item.cantidad || 1,
        precio_unitario: item.precio_unitario || 0,
        subtotal: item.subtotal || 0,
        factor_receta: item.factor_receta || 1,
      }));

      const { error: itemsErr } = await client.from('cotizacion_items').insert(itemRows);
      if (itemsErr) {
        console.error('Error al insertar cotizacion_items en Supabase:', itemsErr);
        return { success: false, error: itemsErr.message };
      }
    }

    return { success: true, data: { ...cotizacion, id: cotDb.id } };
  } catch (err: any) {
    console.error('Excepción en syncCotizacionToSupabase:', err);
    return { success: false, error: err?.message || 'Error de conexión con Supabase' };
  }
}

/**
 * Elimina una cotización en Supabase
 */
export async function deleteCotizacionFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    await client.from('cotizacion_items').delete().eq('cotizacion_id', id);
    const { error } = await client.from('cotizaciones').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Elimina un pedido en Supabase
 */
export async function deletePedidoFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    await client.from('pagos').delete().eq('pedido_id', id);
    await client.from('pedido_items').delete().eq('pedido_id', id);
    const { error } = await client.from('pedidos').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Elimina una receta en Supabase
 */
export async function deleteRecetaFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    await client.from('receta_ingredientes').delete().eq('receta_id', id);
    const { error } = await client.from('recetas').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Elimina un insumo en Supabase
 */
export async function deleteInsumoFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('insumos').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Registra una merma en Supabase
 */
export async function syncMermaToSupabase(merma: Merma): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('mermas').upsert({
      id: merma.id,
      insumo_id: merma.insumo_id,
      cantidad: merma.cantidad,
      motivo: merma.motivo,
      costo_perdido: merma.costo_perdido,
      fecha: merma.fecha,
      notas: merma.notas,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Autentica un usuario mediante función segura PL/pgSQL en PostgreSQL
 * Valida el hash bcrypt en el servidor y retorna el perfil sin exponer contraseñas
 */
export async function autenticarUsuarioEnSupabase(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: Usuario }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase no está configurado.' };
  }

  try {
    const { data, error } = await client.rpc('autenticar_usuario', {
      p_username: username.trim(),
      p_password: password.trim(),
    });

    if (error) {
      return { success: false, message: `Error de autenticación: ${error.message}` };
    }

    if (data && typeof data === 'object') {
      if (data.success && data.user) {
        const u = data.user;
        const parsedUser: Usuario = {
          id: Number(u.id),
          username: u.username,
          nombre_completo: u.nombre_completo,
          email: u.email || '',
          telefono: u.telefono || '',
          rol: u.rol,
          activo: Boolean(u.activo),
          avatar_url: u.avatar_url || '',
          ultimo_acceso: u.ultimo_acceso || new Date().toISOString(),
          created_at: u.created_at || new Date().toISOString(),
        };
        return { success: true, message: data.message || 'Autenticación exitosa', user: parsedUser };
      }
      return { success: false, message: data.message || 'Credenciales inválidas.' };
    }

    return { success: false, message: 'Respuesta inválida del servidor.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error de conexión con el servidor.' };
  }
}

/**
 * Sube o actualiza un usuario en Supabase de forma segura
 * Cifra la contraseña con bcrypt en el servidor mediante la función RPC 'guardar_usuario_seguro'
 */
export async function syncUsuarioToSupabase(usuario: Usuario): Promise<{ success: boolean; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase no está configurado o conectado.' };

  try {
    // Intentar primero con la función RPC segura (con cifrado bcrypt en Postgres)
    const { data, error } = await client.rpc('guardar_usuario_seguro', {
      p_id: usuario.id,
      p_username: usuario.username.trim(),
      p_password: usuario.password ? usuario.password.trim() : '',
      p_nombre_completo: usuario.nombre_completo.trim(),
      p_email: (usuario.email || '').trim(),
      p_telefono: (usuario.telefono || '').trim(),
      p_rol: usuario.rol,
      p_activo: usuario.activo,
      p_avatar_url: usuario.avatar_url || null,
    });

    if (error) {
      console.error('Error en RPC guardar_usuario_seguro:', error);
      return { success: false, message: error.message };
    }

    if (data && typeof data === 'object') {
      if (data.success) {
        return { success: true, message: data.message };
      } else {
        console.warn('guardar_usuario_seguro devolvió error:', data.message);
        return {
          success: false,
          message: data.message || 'El servidor rechazó el guardado del usuario.',
        };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error conectando con Supabase para guardar usuario:', err);
    return { success: false, message: err?.message || 'Error de conexión con Supabase.' };
  }
}

/**
 * Cambia la contraseña de un usuario en Supabase mediante hash bcrypt seguro
 */
export async function cambiarPasswordEnSupabase(id: number, newPassword: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data, error } = await client.rpc('cambiar_password_usuario', {
      p_id: id,
      p_new_password: newPassword.trim(),
    });

    return !error && Boolean(data?.success);
  } catch {
    return false;
  }
}

/**
 * Elimina un usuario en Supabase de forma segura
 */
export async function deleteUsuarioFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Intentar con la función segura que protege al Admin Maestro
    const { data, error } = await client.rpc('eliminar_usuario_seguro', { p_id: id });
    if (!error && data?.success) {
      return true;
    }

    // Fallback si la función aún no existe
    const { error: delErr } = await client.from('usuarios').delete().eq('id', id);
    return !delErr;
  } catch {
    return false;
  }
}

// ==============================================================================
// MINI CRM: CLIENTES FRECUENTES
// ==============================================================================

/**
 * Obtiene todos los clientes desde Supabase
 */
export async function fetchClientesFromSupabase(): Promise<Cliente[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (error || !data) return [];
    return data.map((c: any) => ({
      ...c,
      total_pedidos: c.total_pedidos ?? c.total_pedidos_historico ?? 0,
      total_pedidos_historico: c.total_pedidos_historico ?? c.total_pedidos ?? 0,
      cumpleanos_familiar: c.cumpleanos_familiar || (c.fecha_cumpleanos ? String(c.fecha_cumpleanos) : ''),
    })) as Cliente[];
  } catch {
    return [];
  }
}

/**
 * Guarda o actualiza un cliente en Supabase
 */
export async function syncClienteToSupabase(cliente: Cliente): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload: any = {
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email || null,
      direccion: cliente.direccion || null,
      alergias_preferencias: cliente.alergias_preferencias || null,
      cumpleanos_familiar: cliente.cumpleanos_familiar || null,
      fecha_cumpleanos: cliente.fecha_cumpleanos || null,
      total_pedidos: cliente.total_pedidos || cliente.total_pedidos_historico || 0,
      total_pedidos_historico: cliente.total_pedidos_historico || cliente.total_pedidos || 0,
      ultimo_pedido: cliente.ultimo_pedido || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('clientes').upsert(payload);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Elimina un cliente de Supabase
 */
export async function deleteClienteFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('clientes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Ejecuta la función PL/pgSQL atómica cancelar_pedido_con_inventario en Supabase
 */
export async function cancelarPedidoConInventarioRpc(
  pedidoId: number,
  accion: 'reintegrar' | 'merma',
  motivoDetalle?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Sin conexión a Supabase' };

  try {
    const { data, error } = await client.rpc('cancelar_pedido_con_inventario', {
      p_pedido_id: pedidoId,
      p_accion: accion,
      p_usuario_id: null,
      p_motivo_detalle: motivoDetalle || 'Cancelación de pedido por cliente',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: !!data?.success, data };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/**
 * Sube o actualiza una zona de delivery en Supabase
 */
export async function syncZonaDeliveryToSupabase(zona: ZonaDelivery): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('zonas_delivery').upsert({
      id: zona.id,
      nombre: zona.nombre,
      tarifa: zona.tarifa,
      tiempo_estimado_min: zona.tiempo_estimado_min,
      activo: zona.activo,
    });

    if (error) {
      console.warn('No se pudo guardar la zona de delivery en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error sincronizando zona de delivery:', err);
    return false;
  }
}

/**
 * Elimina una zona de delivery en Supabase
 */
export async function deleteZonaDeliveryFromSupabase(id: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('zonas_delivery').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}


