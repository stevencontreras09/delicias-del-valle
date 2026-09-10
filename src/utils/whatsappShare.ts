import { Cotizacion, Pedido } from '../types';
import { formatCurrency, formatDate, formatDisplayTamano } from './formatters';

/**
 * Normaliza números telefónicos para WhatsApp en República Dominicana / Internacional.
 */
function sanitizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && (cleaned.startsWith('809') || cleaned.startsWith('829') || cleaned.startsWith('849'))) {
    cleaned = '1' + cleaned;
  }
  return cleaned;
}

/**
 * Genera un mensaje formateado y enlace de WhatsApp para enviar cotizaciones
 */
export function generarMensajeCotizacionWhatsApp(cotizacion: Cotizacion): { mensaje: string; url: string } {
  let texto = `🧁 *DELICIAS DEL VALLE - PASTELERÍA ARTESANAL* 🍰\n`;
  texto += `_Tradición, Calidad y Amor en Cada Detalle_\n`;
  texto += `📞 *Tel/WhatsApp:* +1 (849) 522-9264\n\n`;
  texto += `¡Hola, *${cotizacion.cliente_nombre}*! Es un gusto saludarte. Aquí tienes el detalle de tu cotización personalizada:\n\n`;
  texto += `📋 *Cotización N°:* ${cotizacion.codigo}\n`;
  texto += `📅 *Fecha:* ${formatDate(cotizacion.fecha_emision)}\n`;
  if (cotizacion.fecha_evento) {
    texto += `🎉 *Fecha de tu Evento:* ${formatDate(cotizacion.fecha_evento)}\n`;
  }
  texto += `⏳ *Validez:* ${cotizacion.validez_dias} días hábiles\n\n`;

  // Logística y Entrega
  const esDelivery = cotizacion.tipo_despacho === 'delivery' || Boolean(cotizacion.direccion_entrega);
  if (esDelivery) {
    texto += `🛵 *LOGÍSTICA DE ENTREGA:*\n`;
    texto += `• *Modalidad:* Envío a Domicilio\n`;
    texto += `• *Dirección:* ${cotizacion.direccion_entrega || 'Por acordar'}\n`;
    if (cotizacion.punto_referencia) {
      texto += `• *Punto de Referencia:* ${cotizacion.punto_referencia}\n`;
    }
    if (cotizacion.maps_url) {
      texto += `• *Ubicación Google Maps:* ${cotizacion.maps_url}\n`;
    }
    if (cotizacion.repartidor_nombre) {
      const telRep = cotizacion.repartidor_telefono ? ` (Tel: ${cotizacion.repartidor_telefono})` : '';
      texto += `• *Repartidor:* ${cotizacion.repartidor_nombre}${telRep}\n`;
    }
    texto += `⚠️ _Favor confirmar si la dirección y referencia son 100% exactas._\n\n`;
  } else {
    texto += `🏬 *MODALIDAD:* Retiro en Taller Gastronómico\n\n`;
  }

  texto += `✨ *DETALLE DEL PEDIDO:* ✨\n`;
  cotizacion.items.forEach((item, index) => {
    texto += `\n*${index + 1}. ${item.receta_nombre}*\n`;
    texto += `   • Tamaño / Porciones: ${formatDisplayTamano(item.tamano_porciones)}\n`;
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
      texto += `   • Extras: ${item.extras.map((e) => `${e.nombre}${e.cantidad && e.cantidad > 1 ? ` (x${e.cantidad})` : ''} (${formatCurrency(e.precio * (e.cantidad || 1))})`).join(', ')}\n`;
    }
    texto += `   • Cantidad: ${item.cantidad} | Subtotal: *${formatCurrency(item.subtotal)}*\n`;
  });

  texto += `\n--------------------------------\n`;
  texto += `💵 *Subtotal:* ${formatCurrency(cotizacion.subtotal)}\n`;
  if (cotizacion.descuento > 0) {
    texto += `🏷️ *Descuento:* -${formatCurrency(cotizacion.descuento)}\n`;
  }

  const esDeliveryAparte = cotizacion.tipo_despacho === 'delivery' && (
    cotizacion.pago_delivery === 'efectivo_aparte' || Boolean(cotizacion.cobro_delivery_al_recibir)
  );
  const costoDelivery = Number(cotizacion.costo_delivery || cotizacion.costo_envio || 0);

  if (costoDelivery > 0) {
    if (esDeliveryAparte) {
      texto += `🛵 *Delivery:* ${formatCurrency(costoDelivery)} (_Se paga en efectivo al chofer al recibir_)\n`;
    } else {
      texto += `🛵 *Delivery / Flete:* ${formatCurrency(costoDelivery)} (_Incluido en el pedido_)\n`;
    }
  }

  const metodoPagoNom = cotizacion.metodo_pago === 'efectivo'
    ? 'Efectivo'
    : cotizacion.metodo_pago === 'tarjeta'
    ? 'Tarjeta'
    : 'Transferencia Bancaria';

  const esContraEntrega = Boolean(cotizacion.cobro_contra_entrega);

  if (esDeliveryAparte) {
    const totalProd = Math.max(0, cotizacion.subtotal - (cotizacion.descuento || 0));
    texto += `🎂 *TOTAL PRODUCTOS:* *${formatCurrency(totalProd)}*\n`;
    texto += `--------------------------------\n\n`;
    texto += `💳 *CONDICIONES DE PAGO (${metodoPagoNom.toUpperCase()}):*\n`;
    if (esContraEntrega) {
      texto += `• *Modalidad:* 🛵 100% Contra Entrega (Pedido Pequeño)\n`;
      texto += `• *Anticipo previo requerido:* RD$ 0.00 (_Sin anticipo previo_)\n`;
      texto += `• *Saldo productos al recibir:* ${formatCurrency(totalProd)}\n`;
      texto += `• *Flete Delivery:* ${formatCurrency(costoDelivery)} (_Se entrega en efectivo aparte al chofer_)\n`;
      texto += `• *Total a entregar al chofer:* *${formatCurrency(totalProd + costoDelivery)}*\n\n`;
    } else {
      texto += `• *Anticipo del 50%:* ${formatCurrency(totalProd * 0.5)} (para agendar)\n`;
      texto += `• *Saldo al entregar (50%):* ${formatCurrency(totalProd * 0.5)}\n`;
      texto += `• *Flete Delivery:* ${formatCurrency(costoDelivery)} (_Se entrega en efectivo al repartidor_)\n\n`;
    }
  } else {
    texto += `🎂 *TOTAL A PAGAR:* *${formatCurrency(cotizacion.total)}*\n`;
    texto += `--------------------------------\n\n`;
    texto += `💳 *CONDICIONES DE PAGO (${metodoPagoNom.toUpperCase()}):*\n`;
    if (esContraEntrega) {
      texto += `• *Modalidad:* 🛵 100% Contra Entrega (Pedido Pequeño)\n`;
      texto += `• *Anticipo previo requerido:* RD$ 0.00 (_Sin anticipo previo_)\n`;
      texto += `• *Total a pagar al recibir:* *${formatCurrency(cotizacion.total)}* contra entrega\n\n`;
    } else {
      texto += `• *Anticipo del 50%:* ${formatCurrency(cotizacion.total * 0.5)} (para agendar)\n`;
      texto += `• *Saldo restante (50%):* ${formatCurrency(cotizacion.total * 0.5)} contra entrega\n\n`;
    }
  }

  if (cotizacion.notas) {
    texto += `📝 *Nota especial:* ${cotizacion.notas}\n\n`;
  }

  texto += `Si deseas confirmar tu pedido o tienes alguna duda, respóndenos a este mensaje. ¡Será un honor endulzar tu momento especial! 🍓❤️`;

  const fullMessage = texto;
  const phoneClean = sanitizePhone(cotizacion.cliente_telefono);
  const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(fullMessage)}`;

  return { mensaje: fullMessage, url };
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
    texto += `${index + 1}. *${item.receta_nombre}* (${formatDisplayTamano(item.tamano_porciones)}) x${item.cantidad} = ${formatCurrency(item.subtotal)}\n`;
  });

  texto += `\n💰 *Total:* ${formatCurrency(pedido.total)}\n`;
  texto += `✅ *Anticipo Pagado (50%):* ${formatCurrency(pedido.anticipo_pagado)}\n`;
  texto += `⏳ *Saldo Pendiente:* *${formatCurrency(pedido.saldo_pendiente)}*\n\n`;
  texto += `¡Muchas gracias por tu confianza! Estamos preparando todo con el mayor amor y dedicación. ❤️👩‍🍳`;

  const fullMessage = texto;
  const phoneClean = sanitizePhone(pedido.cliente_telefono);
  const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(fullMessage)}`;

  return { mensaje: fullMessage, url };
}
