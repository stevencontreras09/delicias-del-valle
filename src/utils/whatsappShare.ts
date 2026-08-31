import { Cotizacion, Pedido } from '../types';
import { formatCurrency, formatDate } from './formatters';

/**
 * Genera un mensaje formateado y enlace de WhatsApp para enviar cotizaciones
 */
export function generarMensajeCotizacionWhatsApp(cotizacion: Cotizacion): { mensaje: string; url: string } {
  let texto = `🧁 *DELICIAS DEL VALLE - PASTELERÍA ARTESANAL* 🍰\n`;
  texto += `_Tradición, Calidad y Amor en Cada Detalle_\n\n`;
  texto += `¡Hola, *${cotizacion.cliente_nombre}*! Es un gusto saludarte. Aquí tienes el detalle de tu cotización personalizada:\n\n`;
  texto += `📋 *Cotización N°:* ${cotizacion.codigo}\n`;
  texto += `📅 *Fecha:* ${formatDate(cotizacion.fecha_emision)}\n`;
  if (cotizacion.fecha_evento) {
    texto += `🎉 *Fecha de tu Evento:* ${formatDate(cotizacion.fecha_evento)}\n`;
  }
  texto += `⏳ *Validez:* ${cotizacion.validez_dias} días hábiles\n\n`;

  texto += `✨ *DETALLE DEL PEDIDO:* ✨\n`;
  cotizacion.items.forEach((item, index) => {
    texto += `\n*${index + 1}. ${item.receta_nombre}*\n`;
    texto += `   • Tamaño / Porciones: ${item.tamano_porciones}\n`;
    if (item.masa_base && !item.masa_base.toLowerCase().startsWith('ningun') && !item.masa_base.toLowerCase().startsWith('no aplica')) {
      texto += `   • Masa Base: ${item.masa_base}\n`;
    }
    if (item.relleno && !item.relleno.toLowerCase().startsWith('ningun') && !item.relleno.toLowerCase().startsWith('no aplica')) {
      texto += `   • Relleno: ${item.relleno}\n`;
    }
    if (item.decoracion && !item.decoracion.toLowerCase().startsWith('ningun') && !item.decoracion.toLowerCase().startsWith('no aplica')) {
      texto += `   • Decoración: ${item.decoracion}\n`;
    }
    if (item.dedicatoria) texto += `   • Dedicatoria: "${item.dedicatoria}"\n`;
    if (item.extras && item.extras.length > 0) {
      texto += `   • Extras: ${item.extras.map(e => `${e.nombre} (${formatCurrency(e.precio)})`).join(', ')}\n`;
    }
    texto += `   • Cantidad: ${item.cantidad} | Subtotal: *${formatCurrency(item.subtotal)}*\n`;
  });

  texto += `\n--------------------------------\n`;
  texto += `💵 *Subtotal:* ${formatCurrency(cotizacion.subtotal)}\n`;
  if (cotizacion.descuento > 0) {
    texto += `🏷️ *Descuento:* -${formatCurrency(cotizacion.descuento)}\n`;
  }
  if (cotizacion.costo_envio > 0) {
    texto += `🛵 *Domicilio / Entrega:* ${formatCurrency(cotizacion.costo_envio)}\n`;
  }
  texto += `🎂 *TOTAL A PAGAR:* *${formatCurrency(cotizacion.total)}*\n`;
  texto += `--------------------------------\n\n`;

  texto += `💳 *CONDICIONES DE PAGO:*\n`;
  texto += `• *50% de anticipo* para agendar y asegurar la fecha en producción.\n`;
  texto += `• *50% restante* contra entrega o recogida en el taller.\n\n`;

  if (cotizacion.notas) {
    texto += `📝 *Nota especial:* ${cotizacion.notas}\n\n`;
  }

  texto += `Si deseas confirmar tu pedido o tienes alguna duda, respóndenos a este mensaje. ¡Será un honor endulzar tu momento especial! 🍓❤️`;

  const phoneClean = cotizacion.cliente_telefono.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(texto)}`;

  return { mensaje: texto, url };
}

/**
 * Genera un mensaje formateado y enlace de WhatsApp para enviar confirmación / recibo de Pedido
 */
export function generarMensajePedidoWhatsApp(pedido: Pedido): { mensaje: string; url: string } {
  let texto = `🎂 *DELICIAS DEL VALLE - CONFIRMACIÓN DE PEDIDO* 🍰\n\n`;
  texto += `¡Hola, *${pedido.cliente_nombre}*! Tu pedido ha sido registrado con éxito.\n\n`;
  texto += `🧾 *Factura/Pedido N°:* ${pedido.numero_factura}\n`;
  texto += `📅 *Fecha de Entrega:* ${formatDate(pedido.fecha_entrega)} - *Hora:* ${pedido.hora_entrega}\n`;
  texto += `📍 *Tipo de Entrega:* ${pedido.tipo_entrega === 'domicilio' ? `Domicilio (${pedido.direccion_entrega || 'Dirección acordada'})` : 'Recogida en taller'}\n`;
  texto += `📊 *Estado Actual:* ${pedido.estado.toUpperCase()}\n\n`;

  texto += `✨ *RESUMEN:* ✨\n`;
  pedido.items.forEach((item, index) => {
    texto += `${index + 1}. *${item.receta_nombre}* (${item.tamano_porciones}) x${item.cantidad} = ${formatCurrency(item.subtotal)}\n`;
  });

  texto += `\n💰 *Total:* ${formatCurrency(pedido.total)}\n`;
  texto += `✅ *Anticipo Pagado (50%):* ${formatCurrency(pedido.anticipo_pagado)}\n`;
  texto += `⏳ *Saldo Pendiente:* *${formatCurrency(pedido.saldo_pendiente)}*\n\n`;
  texto += `¡Muchas gracias por tu confianza! Estamos preparando todo con el mayor amor y dedicación. ❤️👩‍🍳`;

  const phoneClean = pedido.cliente_telefono.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(texto)}`;

  return { mensaje: texto, url };
}
