// Tipos de datos para el sistema gastronómico "Delicias del Valle"

export type UnidadBase = 'g' | 'ml' | 'ud';

export interface Insumo {
  id: number;
  nombre: string;
  categoria: string;
  unidad_compra: string;
  precio_compra: number;
  presentacion_empaque: number; // en unidad_base
  unidad_base: UnidadBase;
  factor_conversion: number; // igual a presentacion_empaque
  costo_unitario_base: number; // precio_compra / presentacion_empaque
  stock_actual: number; // en unidad_base
  stock_minimo: number; // en unidad_base
  activo: boolean;
  tipo_costo?: 'fijo' | 'variable'; // Fijo (materia prima base) o Variable (empaque, decoración, etc.)
}

export type MermaMotivo = 'caducidad' | 'quemado' | 'derrame' | 'error_pesado' | 'calidad' | 'otro';

export interface Merma {
  id: number;
  insumo_id: number;
  insumo_nombre: string;
  cantidad: number; // en unidad_base
  unidad_base: UnidadBase;
  motivo: MermaMotivo;
  costo_perdido: number;
  fecha: string;
  notas: string;
}

export type TipoIngrediente = 'fijo' | 'variable';

export interface RecetaIngrediente {
  id?: number;
  receta_id?: number;
  insumo_id: number;
  insumo_nombre?: string;
  cantidad: number; // cantidad en unidad_base para el rendimiento base
  tipo: TipoIngrediente; // 'fijo' (base/masa) o 'variable' (relleno, cobertura, decoración, empaque específico)
  unidad_base?: UnidadBase;
  precio_compra?: number;
  presentacion_empaque?: number;
  costo_unitario_base?: number;
  costo_calculado?: number; // (cantidad * precio_compra) / presentacion_empaque
}

export type CategoriaReceta = 
  | 'Tortas'
  | 'Brownies'
  | 'Cupcakes'
  | 'Galletas'
  | 'Alfajores'
  | 'Panes y Salados'
  | 'Postres'
  | 'Tres Leches'
  | 'Tortas y Pasteles'
  | 'Cupcakes y Muffins'
  | 'Galletas y Alfajores'
  | 'Brownies y Blondies'
  | 'Tres Leches y Postres Fríos'
  | 'Panes y Masas Saladas'
  | 'Cheesecakes y Tartas'
  | 'Rellenos y Coberturas'
  | string;

export interface Receta {
  id: number;
  nombre: string;
  categoria: CategoriaReceta;
  descripcion?: string;
  rendimiento_base: number; // por ejemplo 1
  rendimiento_unidad: string; // ej: "1 LB (16-20 porciones)", "12 unidades", "1 molde 24cm"
  tiempo_preparacion_min: number;
  tiempo_horneado_min: number;
  temperatura_horno_c?: number;
  // Porcentajes de recargo sobre Materia Prima Directa (MPD)
  materiales_indirectos_pct: number; // default 10%
  costos_operativos_pct: number; // default 15% (energía, gas, agua)
  reposicion_equipos_pct: number; // default 10%
  mano_obra_pct: number; // default 30%
  margen_beneficio_pct: number; // default 50% (margen comercial sobre venta)
  ingredientes: RecetaIngrediente[];
  instrucciones?: string[];
  activa: boolean;
  nombre_base?: string;
  es_variante_de?: number;
  orden_variante?: number;
}

// Estructura calculada en tiempo real
export interface RecetaCostosCalculados {
  costo_ingredientes_fijos: number;
  costo_ingredientes_variables: number; // Suma total de todos los variables
  costo_variables_aplicados?: number; // Suma de solo los variables seleccionados/activos
  costo_variables_excluidos?: number; // Suma de los variables desmarcados
  costo_directo_materia_prima: number;
  costo_merma: number; // 3% de merma técnica de producción
  costo_materiales_indirectos: number;
  costo_operativo: number;
  costo_reposicion_equipos: number;
  costo_mano_obra: number;
  costo_total_produccion: number; // CTP = MPD + Indirectos + Operativos + Reposición + Mano Obra
  precio_sugerido_markup: number;
  precio_sugerido_margen_venta: number;
  precio_sugerido_venta?: number;
  ganancia_estimada: number;
}

export interface CotizacionExtra {
  id: string;
  nombre: string;
  precio: number;
}

export interface CotizacionItem {
  id: string;
  receta_id?: number;
  receta_nombre: string;
  tamano_porciones: string;
  masa_base: string;
  relleno: string;
  decoracion: string;
  dedicatoria?: string;
  extras: CotizacionExtra[];
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  factor_receta: number; // escala respecto al rendimiento base (ej: 0.5, 1, 1.5, 2)
}

export type EstadoCotizacion = 'pendiente' | 'enviada' | 'aprobada' | 'rechazada' | 'convertida';

export interface Cotizacion {
  id: number;
  codigo: string; // 'COT-2026-001'
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  fecha_emision: string;
  fecha_evento?: string;
  validez_dias: number; // default 5
  items: CotizacionItem[];
  subtotal: number;
  descuento: number;
  costo_envio: number;
  total: number;
  notas?: string;
  estado: EstadoCotizacion;
  created_at: string;
}

export type TipoEntrega = 'recogida_local' | 'domicilio';
export type EstadoPedido = 'confirmado' | 'en_produccion' | 'listo' | 'entregado' | 'cancelado';
export type MetodoPago = 'transferencia' | 'efectivo' | 'tarjeta' | 'sinpe_zelle';
export type TipoPago = 'anticipo_50' | 'saldo_50' | 'pago_completo' | 'abono';

export interface PagoRegistro {
  id: string;
  pedido_id: number;
  fecha: string;
  monto: number;
  metodo: MetodoPago;
  referencia: string;
  tipo_pago: TipoPago;
}

export interface PedidoItem {
  id: string;
  receta_id?: number;
  receta_nombre: string;
  tamano_porciones: string;
  masa_base: string;
  relleno: string;
  decoracion: string;
  dedicatoria?: string;
  extras_texto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  factor_receta: number;
}

export interface Pedido {
  id: number;
  cotizacion_id?: number;
  numero_factura: string; // 'FAC-2026-001' o 'PED-001'
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  fecha_pedido: string;
  fecha_entrega: string;
  hora_entrega: string;
  tipo_entrega: TipoEntrega;
  direccion_entrega?: string;
  items: PedidoItem[];
  subtotal: number;
  costo_envio: number;
  total: number;
  anticipo_pagado: number;
  saldo_pendiente: number;
  pagos: PagoRegistro[];
  estado: EstadoPedido;
  inventario_descontado: boolean;
  notas_cocina?: string;
  checklist_completado?: { [key: string]: boolean };
  created_at: string;
}

export interface KitchenTimerState {
  id: string;
  title: string;
  initialSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
  orderNumber?: string;
}

// ==========================================
// USUARIOS & AUTENTICACIÓN (RBAC)
// ==========================================
export type UserRole = 'admin' | 'coadmin' | 'pastelero' | 'cajero' | 'operador';

export interface Usuario {
  id: number;
  username: string; // ej: "Steven9909"
  password?: string; // ej: "@Manzana0104"
  nombre_completo: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  activo: boolean;
  avatar_url?: string;
  ultimo_acceso?: string;
  created_at: string;
}
