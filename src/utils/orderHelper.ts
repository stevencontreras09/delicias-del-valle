import { Pedido } from '../types';

/**
 * Número de días considerados para la ventana activa de entregados (7 días / semana actual).
 */
export const DIAS_LIMPIEZA_SEMANAL = 7;

/**
 * Determina si un pedido entregado pertenece a la semana actual (últimos 7 días).
 * IMPORTANTE: Los pedidos pendientes ('confirmado', 'en_produccion', 'listo') SIEMPRE retornan true,
 * ya que nunca deben ocultarse de las pantallas operativas de cocina ni del taller.
 */
export const isPedidoSemanaActual = (pedido: {
  estado: string;
  fecha_entregado?: string;
  fecha_entrega?: string;
  updated_at?: string;
  fecha_pedido?: string;
}): boolean => {
  if (pedido.estado !== 'entregado') return true;

  const dateStr =
    pedido.fecha_entregado || pedido.fecha_entrega || pedido.updated_at || pedido.fecha_pedido;
  if (!dateStr) return true;

  const orderDate = new Date(dateStr.length === 10 ? `${dateStr}T23:59:59` : dateStr);
  if (isNaN(orderDate.getTime())) return true;

  const now = new Date();
  const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays <= DIAS_LIMPIEZA_SEMANAL;
};

/**
 * Filtra los pedidos para la vista activa de pantalla aplicando la regla de limpieza semanal:
 * - Mantiene todos los pedidos activos ('confirmado', 'en_produccion', 'listo').
 * - En entregados, muestra únicamente los de la semana actual si `mostrarHistorico` es false.
 * - Si `mostrarHistorico` es true, muestra todos los pedidos históricos.
 */
export const filtrarPedidosPorLimpiezaSemanal = (
  pedidos: Pedido[],
  mostrarHistorico: boolean = false
): Pedido[] => {
  if (mostrarHistorico) return pedidos;
  return pedidos.filter((p) => isPedidoSemanaActual(p));
};

/**
 * Cuenta cuántos pedidos entregados han sido limpiados/archivados de la pantalla activa por superar los 7 días.
 */
export const contarEntregadosHistoricos = (pedidos: Pedido[]): number => {
  return pedidos.filter((p) => p.estado === 'entregado' && !isPedidoSemanaActual(p)).length;
};
