import { Pedido, Cotizacion } from '../types';
import { formatCurrency, formatDate } from './formatters';

/**
 * Normaliza números telefónicos para WhatsApp en República Dominicana / Internacional.
 * Si tiene 10 dígitos y empieza con 809, 829 o 849, antepone el código de país "1".
 */
export function sanitizeDominicanPhone(phone: string): string {
  if (!phone) return '';
  // Remover todo excepto dígitos
  let cleaned = phone.replace(/\D/g, '');

  // Si tiene 10 dígitos (ej. 8095551234, 829..., 849...)
  if (cleaned.length === 10) {
    if (cleaned.startsWith('809') || cleaned.startsWith('829') || cleaned.startsWith('849')) {
      cleaned = '1' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Genera el enlace wa.me para enviar la comanda / confirmación de pedido al cliente
 */
export function generateOrderWhatsAppUrl(pedido: Pedido): string {
  const phone = sanitizeDominicanPhone(pedido.cliente_telefono);

  const lines: string[] = [];
  lines.push(`¡Hola *${pedido.cliente_nombre.trim()}*! 👋 Te saludamos de *Delicias del Valle* 🍰✨`);
  lines.push('');
  lines.push('Te compartimos el detalle y comprobante de tu pedido:');
  lines.push(`📄 *Factura:* ${pedido.numero_factura}`);
  lines.push(`📅 *Fecha de Entrega:* ${formatDate(pedido.fecha_entrega)} a las ${pedido.hora_entrega || '12:00 PM'}`);
  lines.push(`📍 *Modalidad:* ${pedido.tipo_entrega === 'domicilio' ? '🛵 A Domicilio' : '🏪 Retiro en Taller'}`);

  if (pedido.direccion_entrega) {
    lines.push(`🏠 *Dirección:* ${pedido.direccion_entrega}`);
  }

  lines.push('');
  lines.push('🎂 *Detalle de Productos:*');
  pedido.items.forEach((item) => {
    lines.push(`• *${item.cantidad}x ${item.receta_nombre}* (${item.tamano_porciones})`);
    if (item.masa_base && !item.masa_base.toLowerCase().startsWith('ningun')) {
      lines.push(`   - Masa: ${item.masa_base}`);
    }
    if (item.relleno && !item.relleno.toLowerCase().startsWith('ningun')) {
      lines.push(`   - Relleno: ${item.relleno}`);
    }
    if (item.decoracion && !item.decoracion.toLowerCase().startsWith('ningun')) {
      lines.push(`   - Cobertura: ${item.decoracion}`);
    }
    if (item.dedicatoria) {
      lines.push(`   - Dedicatoria: "${item.dedicatoria}"`);
    }
    if (item.extras_texto) {
      lines.push(`   - Adicionales: ${item.extras_texto}`);
    }
  });

  lines.push('');
  lines.push('💵 *Resumen Financiero (50% / 50%):*');
  lines.push(`• *Total:* ${formatCurrency(pedido.total)}`);
  lines.push(`• *Anticipo Recibido:* ${formatCurrency(pedido.anticipo_pagado)}`);
  lines.push(`• *Saldo Contra Entrega:* *${formatCurrency(pedido.saldo_pendiente)}*`);

  lines.push('');
  lines.push('🏦 *Cuentas Bancarias Disponibles:*');
  lines.push('• Banco Popular: *812-345678-9* (Cta. Corriente)');
  lines.push('• Banreservas: *960-123456-7* (Cta. Ahorros)');
  lines.push('• Banco BHD: *023-456789-0* (Cta. Corriente)');
  lines.push('Titular: Delicias del Valle SRL • RNC: 131-99887-1');

  lines.push('');
  lines.push('¡Muchas gracias por permitirnos endulzar tu ocasión especial! 💕');

  const fullMessage = lines.join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
}

/**
 * Genera el enlace wa.me para enviar una cotización formal al cliente
 */
export function generateQuoteWhatsAppUrl(cotizacion: Cotizacion): string {
  const phone = sanitizeDominicanPhone(cotizacion.cliente_telefono);

  const lines: string[] = [];
  lines.push(`¡Hola *${cotizacion.cliente_nombre.trim()}*! 👋 Te saludamos de *Delicias del Valle* 🍰`);
  lines.push('');
  lines.push('Te enviamos la cotización solicitada para tu evento:');
  lines.push(`📄 *Cotización N°:* ${cotizacion.codigo}`);
  if (cotizacion.fecha_evento) {
    lines.push(`📅 *Fecha de Evento:* ${formatDate(cotizacion.fecha_evento)}`);
  }
  lines.push(`⏳ *Validez:* ${cotizacion.validez_dias || 5} días naturales`);

  lines.push('');
  lines.push('🎂 *Productos Cotizados:*');
  cotizacion.items.forEach((item) => {
    lines.push(`• *${item.cantidad}x ${item.receta_nombre}* (${item.tamano_porciones}) - ${formatCurrency(item.subtotal)}`);
    if (item.masa_base && !item.masa_base.toLowerCase().startsWith('ningun')) {
      lines.push(`   - Masa: ${item.masa_base}`);
    }
    if (item.relleno && !item.relleno.toLowerCase().startsWith('ningun')) {
      lines.push(`   - Relleno: ${item.relleno}`);
    }
    if (item.decoracion && !item.decoracion.toLowerCase().startsWith('ningun')) {
      lines.push(`   - Cobertura: ${item.decoracion}`);
    }
    if (item.dedicatoria) {
      lines.push(`   - Dedicatoria: "${item.dedicatoria}"`);
    }
  });

  lines.push('');
  lines.push(`💰 *Total Cotizado:* *${formatCurrency(cotizacion.total)}*`);
  lines.push(`• Reserva con el 50% de anticipo (${formatCurrency(cotizacion.total * 0.5)}) y salda el 50% restante al recibir.`);

  lines.push('');
  lines.push('¿Deseas que confirmemos tu pedido y apartemos la fecha en taller? ¡Escríbenos por aquí! 👩‍🍳');

  const fullMessage = lines.join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(fullMessage)}`;
}
