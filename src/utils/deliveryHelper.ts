import { Pedido, ZonaDelivery } from '../types';

/**
 * Genera el enlace directo a Google Maps para navegación
 */
export const getGoogleMapsUrl = (direccion: string, referencia?: string, explicitMapsUrl?: string): string => {
  if (explicitMapsUrl && (explicitMapsUrl.startsWith('http://') || explicitMapsUrl.startsWith('https://'))) {
    return explicitMapsUrl;
  }
  if (!direccion) return 'https://www.google.com/maps';
  const query = `${direccion}${referencia ? ` (${referencia})` : ''}, República Dominicana`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

/**
 * Genera el enlace directo a Waze para navegación GPS en tiempo real
 */
export const getWazeUrl = (direccion: string): string => {
  if (!direccion) return 'https://waze.com';
  const query = `${direccion}, República Dominicana`;
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
};

/**
 * Genera el enlace wa.me para despachar los datos completos de entrega al chofer / repartidor
 */
export const generateDriverWhatsAppMessage = (
  repartidorTelefono: string,
  pedido: Pedido | any,
  cliente?: { nombre: string; telefono?: string }
): string => {
  const phoneClean = (repartidorTelefono || pedido.repartidor_telefono || '').replace(/\D/g, '');
  const clienteNombre = cliente?.nombre || pedido.cliente_nombre || 'Cliente';
  const clienteTelefono = cliente?.telefono || pedido.cliente_telefono || 'No especificado';

  const saldoPendienteNum = Number(pedido.saldo_pendiente ?? pedido.total_saldo_pendiente ?? 0);
  const fleteNum = Number(pedido.costo_delivery ?? pedido.costo_envio ?? 0);
  const totalCobrarNum = saldoPendienteNum + (pedido.cobro_delivery_al_recibir ? fleteNum : 0);

  const saldoPendiente = saldoPendienteNum.toLocaleString('es-DO', { minimumFractionDigits: 2 });
  const flete = fleteNum.toLocaleString('es-DO', { minimumFractionDigits: 2 });
  const totalCobrar = totalCobrarNum.toLocaleString('es-DO', { minimumFractionDigits: 2 });
  
  const mapsUrl = getGoogleMapsUrl(pedido.direccion_entrega || '', pedido.punto_referencia, pedido.maps_url);
  const wazeUrl = getWazeUrl(pedido.direccion_entrega || '');

  const lines = [
    `🛵 *NUEVO DESPACHO — DELICIAS DEL VALLE* 🎂`,
    ``,
    `📦 *Pedido #:* ${pedido.numero_factura || pedido.id}`,
    `👤 *Cliente:* ${clienteNombre}`,
    `📞 *Teléfono Cliente:* ${clienteTelefono}`,
    `⏰ *Hora programada:* ${pedido.fecha_entrega || 'Hoy'} a las ${pedido.hora_entrega || 'Inmediata'}`,
    ``,
    `📍 *DIRECCIÓN DE ENTREGA:*`,
    `${pedido.direccion_entrega || 'No especificada'}`,
    pedido.punto_referencia ? `📌 *Punto de Referencia:* ${pedido.punto_referencia}` : '',
    ``,
    `💵 *COBRO EN DESTINO:*`,
    `• Saldo pastel: RD$ ${saldoPendiente}`,
    `• Tarifa flete: RD$ ${flete}${pedido.cobro_delivery_al_recibir ? ' (Cobrar en efectivo)' : ' (Ya prepagado / incluido)'}`,
    `• *TOTAL A COBRAR AL CLIENTE: RD$ ${totalCobrar}*`,
    ``,
    `🗺️ *ENLACES DE NAVEGACIÓN GPS:*`,
    `📍 Google Maps: ${mapsUrl}`,
    `🚙 Waze: ${wazeUrl}`,
    ``,
    `⚠️ *MANEJO DEL PRODUCTO:* Llevar en suelo plano del vehículo con A/C encendido. No inclinar la caja ni colocar sobre asientos inclinados.`
  ].filter(Boolean);

  const fullText = lines.join('\n');
  return phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(fullText)}`
    : `https://wa.me/?text=${encodeURIComponent(fullText)}`;
};

/**
 * Genera el enlace wa.me para que el chofer notifique al cliente que va en camino con su pedido
 */
export const generateClientDeliveryNotificationUrl = (pedido: Pedido): string => {
  const phoneClean = (pedido.cliente_telefono || '').replace(/\D/g, '');
  const clienteNombre = pedido.cliente_nombre || 'Estimado/a cliente';
  const factura = pedido.numero_factura || `Orden #${pedido.id}`;

  const saldoPendienteNum = Number(pedido.saldo_pendiente ?? 0);
  const fleteNum = Number(pedido.costo_delivery ?? pedido.costo_envio ?? 0);
  const totalCobrarNum = saldoPendienteNum + (pedido.cobro_delivery_al_recibir ? fleteNum : 0);

  let mensajeCobro = '';
  if (totalCobrarNum > 0) {
    mensajeCobro = `\n💵 *Monto a pagar al recibir:* RD$ ${totalCobrarNum.toLocaleString('es-DO', { minimumFractionDigits: 2 })} en efectivo.`;
  } else {
    mensajeCobro = `\n✅ *Tu pedido se encuentra pagado al 100%.*`;
  }

  const lines = [
    `🛵 *¡HOLA ${clienteNombre.toUpperCase()}!* 🎂`,
    `Te saluda tu repartidor de *Delicias del Valle*.`,
    ``,
    `Estoy *en camino* con tu pedido (*${factura}*).`,
    `📍 Dirección: ${pedido.direccion_entrega || 'Dirección acordada'}`,
    mensajeCobro,
    ``,
    `Estaré llegando en breve. Por favor estar atento/a para recibir tu pastel artesanal bien frío y seguro. ¡Gracias! ✨`
  ];

  const fullText = lines.join('\n');
  return phoneClean
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(fullText)}`
    : `https://wa.me/?text=${encodeURIComponent(fullText)}`;
};

export interface ParsedWhatsAppAddress {
  direccion: string;
  punto_referencia: string;
  mapsUrl?: string;
  detectedZoneId?: number;
  confidenceNotes: string[];
}

/**
 * Analiza de forma inteligente un texto o mensaje copiado de WhatsApp que contiene una dirección
 * y extrae la calle/número/sector, el punto de referencia y el enlace GPS si viene incluido.
 */
export function parseWhatsAppAddress(
  rawText: string,
  zonas: ZonaDelivery[] = []
): ParsedWhatsAppAddress {
  const notes: string[] = [];
  if (!rawText || !rawText.trim()) {
    return { direccion: '', punto_referencia: '', confidenceNotes: [] };
  }

  let text = rawText.trim();

  // 1. Detectar enlaces a Google Maps o Waze
  let detectedMapsUrl: string | undefined;
  const urlRegex = /(https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps|maps\.google\.com|waze\.com)\S+)/i;
  const urlMatch = text.match(urlRegex);
  if (urlMatch) {
    detectedMapsUrl = urlMatch[1];
    notes.push('Enlace GPS detectado y extraído');
    // Remover el link del texto para limpiar la dirección
    text = text.replace(urlMatch[0], '').trim();
  }

  // 2. Extraer punto de referencia si viene explícito
  let referencia = '';
  const refPatterns = [
    /(?:punto de referencia|referencia|ref|cerca de|frente a|frente al|al lado de|al lado del|diagonal a|detrás de|detras de)[\s:]+([^,\n.;]+)/i,
    /(?:casa de color|portón|puerta|pared)[\s:]+([^,\n.;]+)/i,
  ];

  for (const pat of refPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      referencia = match[1].trim();
      notes.push('Punto de referencia detectado');
      break;
    }
  }

  // 3. Limpiar encabezados comunes de WhatsApp ("Hola", "Mi dirección es:", "Ubicación:")
  let direccion = text
    .replace(/^(?:hola|buenas tardes|buenos dias|saludos|por favor|aqui esta mi direccion|esta es la direccion|mi direccion es|direccion|ubicacion)[\s:,.-]+/i, '')
    .replace(/(?:gracias|muchas gracias|quedo atenta|quedo atento)[\s!.]*$/i, '')
    .trim();

  // Si se detectó referencia dentro de la dirección, mantenerla legible o separarla limpiamente
  if (referencia && direccion.toLowerCase().includes(referencia.toLowerCase())) {
    direccion = direccion
      .replace(new RegExp(`(?:punto de referencia|referencia|ref|cerca de|frente a|al lado de)[\\s:]+${referencia.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), '')
      .replace(/,\s*,/g, ',')
      .trim();
  }

  // Si quedó vacía la dirección pero había enlace GPS
  if (!direccion && detectedMapsUrl) {
    direccion = 'Ubicación compartida por GPS';
  }

  // 4. Detección automática de Zona según palabras clave
  let detectedZoneId: number | undefined;
  const textLower = rawText.toLowerCase();

  for (const z of zonas) {
    const zName = z.nombre.toLowerCase();
    // Comparación directa de zona o número de zona
    if (textLower.includes(zName)) {
      detectedZoneId = z.id;
      notes.push(`Zona coincidente: ${z.nombre}`);
      break;
    }
    // Patrones por número de zona (ej: "zona 1", "zona 2", etc.)
    const zMatch = zName.match(/zona\s*(\d+)/i);
    if (zMatch && textLower.includes(`zona ${zMatch[1]}`)) {
      detectedZoneId = z.id;
      notes.push(`Zona coincidente: ${z.nombre}`);
      break;
    }
  }

  return {
    direccion,
    punto_referencia: referencia,
    mapsUrl: detectedMapsUrl,
    detectedZoneId,
    confidenceNotes: notes,
  };
}
