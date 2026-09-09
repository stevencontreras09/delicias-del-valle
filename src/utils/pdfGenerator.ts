import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Cotizacion, Pedido } from '../types';
import { formatCurrency, formatDate, formatDisplayTamano } from './formatters';
import { LOGO_DELICIAS_BASE64 } from './logoBase64';
import { ICON_DELIVERY_PNG, ICON_STORE_PNG } from './pdfIcons';

// Extensión para que TypeScript reconozca autoTable en jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Genera y descarga un PDF profesional de Cotización
 */
export function generarPdfCotizacion(cotizacion: Cotizacion): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colores de la marca
  const chocolateColor: [number, number, number] = [93, 64, 55]; // #5D4037
  const frambuesaColor: [number, number, number] = [233, 30, 99]; // #E91E63
  const trigoColor: [number, number, number] = [197, 160, 118]; // #C5A076
  const cremaColor: [number, number, number] = [253, 244, 224]; // #FDF4E0
  const verdeColor: [number, number, number] = [16, 122, 64]; // #107A40

  // Encabezado superior con barra frambuesa
  doc.setFillColor(...frambuesaColor);
  doc.rect(0, 0, 210, 8, 'F');

  // Membrete con Logo Oficial
  try {
    doc.addImage(LOGO_DELICIAS_BASE64, 'JPEG', 14, 12, 28, 28);
  } catch (err) {
    console.error('Error insertando logo en cotización:', err);
  }

  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('DELICIAS DEL VALLE', 46, 21);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...trigoColor);
  doc.text('Pastelería y Panadería Artesanal', 46, 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Tel / WhatsApp: +1 (849) 522-9264', 46, 33);
  doc.text('Instagram: @deliciasdelvalle', 46, 38);

  // Recuadro de Cotización (Lado derecho)
  doc.setFillColor(...cremaColor);
  doc.roundedRect(130, 14, 66, 28, 3, 3, 'F');
  doc.setDrawColor(...trigoColor);
  doc.roundedRect(130, 14, 66, 28, 3, 3, 'D');

  doc.setTextColor(...frambuesaColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('COTIZACIÓN', 135, 22);

  doc.setTextColor(...chocolateColor);
  doc.setFontSize(10);
  doc.text(`N° ${cotizacion.codigo}`, 135, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${formatDate(cotizacion.fecha_emision)}`, 135, 34);
  doc.text(`Validez: ${cotizacion.validez_dias} días`, 135, 39);

  // Separador dorado
  doc.setDrawColor(...trigoColor);
  doc.setLineWidth(0.5);
  doc.line(14, 46, 196, 46);

  // Datos del Cliente (Columna Izquierda)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...chocolateColor);
  doc.text('CLIENTE & CONTACTO', 14, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${cotizacion.cliente_nombre}`, 14, 57);
  doc.text(`Teléfono: ${cotizacion.cliente_telefono}`, 14, 62);
  if (cotizacion.cliente_email) {
    doc.text(`Email: ${cotizacion.cliente_email}`, 14, 67);
  }

  // Datos de Logística & Despacho (Columna Derecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...chocolateColor);
  doc.text('LOGÍSTICA & ENTREGA', 110, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  if (cotizacion.fecha_evento) {
    doc.text(`Fecha Evento: ${formatDate(cotizacion.fecha_evento)}`, 110, 57);
  }

  const esDelivery = cotizacion.tipo_despacho === 'delivery' || Boolean(cotizacion.direccion_entrega);
  let tableStartY = 74;

  if (esDelivery) {
    doc.text('Modalidad:', 110, 62);
    try {
      doc.addImage(ICON_DELIVERY_PNG, 'PNG', 127, 58.2, 4.5, 4.5);
    } catch (e) {
      console.error('Error insertando icono delivery:', e);
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...frambuesaColor);
    doc.text('Envío a Domicilio', 133, 62);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const dir = cotizacion.direccion_entrega || 'Dirección acordada';
    const dirCorta = dir.length > 44 ? dir.substring(0, 42) + '...' : dir;
    doc.text(`Dirección: ${dirCorta}`, 110, 67);
    if (cotizacion.punto_referencia) {
      const refCorta = cotizacion.punto_referencia.length > 44 ? cotizacion.punto_referencia.substring(0, 42) + '...' : cotizacion.punto_referencia;
      doc.text(`Ref: ${refCorta}`, 110, 72);
      tableStartY = 78;
    }
    if (cotizacion.repartidor_nombre) {
      const telRep = cotizacion.repartidor_telefono ? ` (${cotizacion.repartidor_telefono})` : '';
      const repY = cotizacion.punto_referencia ? 77 : 72;
      doc.text(`Repartidor: ${cotizacion.repartidor_nombre}${telRep}`, 110, repY);
      tableStartY = repY + 6;
    }
    // Nota de confirmación de dirección
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...frambuesaColor);
    doc.text('* Favor confirmar si la dirección y referencia son exactas.', 110, tableStartY);
    tableStartY += 5;
  } else {
    doc.text('Modalidad:', 110, 62);
    try {
      doc.addImage(ICON_STORE_PNG, 'PNG', 127, 58.2, 4.5, 4.5);
    } catch (e) {
      console.error('Error insertando icono taller:', e);
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...chocolateColor);
    doc.text('Retiro en Taller', 133, 62);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Ubicación: Taller Delicias del Valle`, 110, 67);
    tableStartY = 74;
  }

  if (cotizacion.cliente_email && tableStartY < 74) {
    tableStartY = 74;
  }

  // Tabla de Productos / Items (Solo tamaño, masa, relleno, decoración y extras sin variables internas)
  const tableData = cotizacion.items.map((item, index) => {
    let descripcion = `${item.receta_nombre}\n• Tamaño: ${formatDisplayTamano(item.tamano_porciones)}`;
    if (item.masa_base && !item.masa_base.toLowerCase().startsWith('ningun') && !item.masa_base.toLowerCase().startsWith('no aplica')) {
      descripcion += ` | Masa: ${item.masa_base}`;
    }
    if (item.relleno && !item.relleno.toLowerCase().startsWith('ningun') && !item.relleno.toLowerCase().startsWith('no aplica')) {
      descripcion += ` | Relleno: ${item.relleno}`;
    }
    if (item.decoracion && !item.decoracion.toLowerCase().startsWith('ningun') && !item.decoracion.toLowerCase().startsWith('no aplica')) {
      descripcion += `\n• Decoración: ${item.decoracion}`;
    }
    if (item.dedicatoria) descripcion += `\n• Dedicatoria: "${item.dedicatoria}"`;
    if (item.extras && item.extras.length > 0) {
      descripcion += `\n• Extras: ${item.extras.map(e => e.nombre).join(', ')}`;
    }

    return [
      (index + 1).toString(),
      descripcion,
      item.cantidad.toString(),
      formatCurrency(item.precio_unitario),
      formatCurrency(item.subtotal),
    ];
  });

  doc.autoTable({
    startY: tableStartY,
    head: [['#', 'Descripción y Especificaciones', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: chocolateColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [50, 50, 50],
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 105 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26 },
    },
    alternateRowStyles: {
      fillColor: [253, 251, 247],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Resumen de Totales (Lado Derecho)
  const rightX = 135;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  doc.text('Subtotal:', rightX, finalY);
  doc.text(formatCurrency(cotizacion.subtotal), 196, finalY, { align: 'right' });

  let offset = 6;
  if (cotizacion.descuento > 0) {
    doc.text('Descuento:', rightX, finalY + offset);
    doc.text(`-${formatCurrency(cotizacion.descuento)}`, 196, finalY + offset, { align: 'right' });
    offset += 6;
  }

  const esDeliveryAparte = cotizacion.tipo_despacho === 'delivery' && (
    cotizacion.pago_delivery === 'efectivo_aparte' || Boolean(cotizacion.cobro_delivery_al_recibir)
  );
  const costoDelivery = Number(cotizacion.costo_delivery || cotizacion.costo_envio || 0);

  if (costoDelivery > 0) {
    if (esDeliveryAparte) {
      doc.text('Delivery (efectivo a chofer):', rightX, finalY + offset);
      doc.text(formatCurrency(costoDelivery), 196, finalY + offset, { align: 'right' });
      offset += 6;
    } else {
      doc.text('Domicilio / Envío:', rightX, finalY + offset);
      doc.text(formatCurrency(costoDelivery), 196, finalY + offset, { align: 'right' });
      offset += 6;
    }
  }

  // Total Destacado
  doc.setFillColor(...frambuesaColor);
  doc.roundedRect(rightX - 3, finalY + offset - 4, 64, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  
  if (esDeliveryAparte) {
    const totalProd = Math.max(0, cotizacion.subtotal - (cotizacion.descuento || 0));
    doc.text('TOTAL PEDIDO:', rightX, finalY + offset + 2.5);
    doc.text(formatCurrency(totalProd), 194, finalY + offset + 2.5, { align: 'right' });
  } else {
    doc.text('TOTAL:', rightX, finalY + offset + 2.5);
    doc.text(formatCurrency(cotizacion.total), 194, finalY + offset + 2.5, { align: 'right' });
  }

  // Esquema de Pago (Lado Izquierdo)
  const metodoPagoNom = cotizacion.metodo_pago === 'efectivo'
    ? 'Efectivo'
    : cotizacion.metodo_pago === 'tarjeta'
    ? 'Tarjeta'
    : 'Transferencia Bancaria';

  const esContraEntrega = Boolean(cotizacion.cobro_contra_entrega);

  doc.setFillColor(...cremaColor);
  doc.roundedRect(14, finalY - 2, 105, 34, 2, 2, 'F');
  doc.setDrawColor(...trigoColor);
  doc.roundedRect(14, finalY - 2, 105, 34, 2, 2, 'D');

  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`CONDICIONES DE PAGO (${metodoPagoNom.toUpperCase()}):`, 18, finalY + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  if (esContraEntrega) {
    if (esDeliveryAparte) {
      const totalProd = Math.max(0, cotizacion.subtotal - (cotizacion.descuento || 0));
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...verdeColor);
      doc.text('• Modalidad: 100% Contra Entrega (Pedido Pequeño)', 18, finalY + 8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('• Anticipo previo requerido: RD$ 0.00 (Sin anticipo)', 18, finalY + 13.5);
      doc.text(`• Saldo productos al recibir: ${formatCurrency(totalProd)} por ${metodoPagoNom}`, 18, finalY + 18.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...frambuesaColor);
      doc.text(`• Delivery: ${formatCurrency(costoDelivery)} (En EFECTIVO APARTE al chofer)`, 18, finalY + 23.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('• Favor confirmar si la dirección y contacto son 100% correctos.', 18, finalY + 28.5);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...verdeColor);
      doc.text('• Modalidad: 100% Contra Entrega (Pedido Pequeño)', 18, finalY + 8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('• Anticipo previo requerido: RD$ 0.00 (Sin anticipo)', 18, finalY + 13.5);
      doc.text(`• Saldo total contra entrega: ${formatCurrency(cotizacion.total)} por ${metodoPagoNom}`, 18, finalY + 18.5);
      if (costoDelivery > 0) {
        doc.text(`• Delivery (${formatCurrency(costoDelivery)}) incluido en el total a pagar.`, 18, finalY + 23.5);
      } else {
        doc.text('• Retiro programado en taller con cobro al recibir.', 18, finalY + 23.5);
      }
      doc.text('• Pedidos personalizados requieren mínimo 48h de anticipación.', 18, finalY + 28.5);
    }
  } else if (esDeliveryAparte) {
    const totalProd = Math.max(0, cotizacion.subtotal - (cotizacion.descuento || 0));
    doc.text(`• Anticipo del 50% (Productos): ${formatCurrency(totalProd * 0.5)} por ${metodoPagoNom}`, 18, finalY + 9);
    doc.text(`• Saldo al entregar (50%): ${formatCurrency(totalProd * 0.5)}`, 18, finalY + 14.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...frambuesaColor);
    doc.text(`• Delivery: ${formatCurrency(costoDelivery)} (Se paga en EFECTIVO APARTE al repartidor)`, 18, finalY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('• Pedidos personalizados requieren mínimo 48h de anticipación.', 18, finalY + 25.5);
    doc.text('• Favor confirmar si la dirección y contacto son 100% correctos.', 18, finalY + 30);
  } else {
    doc.text(`• Anticipo del 50%: ${formatCurrency(cotizacion.total * 0.5)} (por ${metodoPagoNom})`, 18, finalY + 9.5);
    doc.text(`• Saldo contra entrega (50%): ${formatCurrency(cotizacion.total * 0.5)}`, 18, finalY + 15.5);
    if (costoDelivery > 0) {
      doc.text(`• Delivery (${formatCurrency(costoDelivery)}) incluido completo en el pedido.`, 18, finalY + 21);
      doc.text('• Pedidos personalizados requieren mínimo 48h de anticipación.', 18, finalY + 26.5);
    } else {
      doc.text('• Pedidos personalizados requieren mínimo 48h de anticipación.', 18, finalY + 21.5);
      doc.text('• Retiro programado en taller una vez confirmado.', 18, finalY + 26.5);
    }
  }

  // Notas Adicionales
  if (cotizacion.notas) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Nota: ${cotizacion.notas}`, 14, finalY + 36);
  }

  // Pie de Página
  doc.setFillColor(...chocolateColor);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('¡Gracias por elegir la repostería artesanal de Delicias del Valle! Elaborado con ingredientes 100% naturales.', 105, 293, { align: 'center' });

  // Guardar archivo
  doc.save(`Cotizacion_${cotizacion.codigo}_Delicias_del_Valle.pdf`);
}

/**
 * Genera y descarga un PDF profesional de Factura / Recibo de Pedido
 */
export function generarPdfPedido(pedido: Pedido): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const chocolateColor: [number, number, number] = [93, 64, 55];
  const frambuesaColor: [number, number, number] = [233, 30, 99];
  const trigoColor: [number, number, number] = [197, 160, 118];
  const cremaColor: [number, number, number] = [253, 244, 224];

  // Barra superior
  doc.setFillColor(...chocolateColor);
  doc.rect(0, 0, 210, 8, 'F');

  // Membrete con Logo Oficial
  try {
    doc.addImage(LOGO_DELICIAS_BASE64, 'JPEG', 14, 12, 28, 28);
  } catch (err) {
    console.error('Error insertando logo en pedido:', err);
  }

  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('DELICIAS DEL VALLE', 46, 21);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...trigoColor);
  doc.text('Pastelería y Panadería Artesanal', 46, 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Tel / WhatsApp: +1 (849) 522-9264', 46, 33);
  doc.text('Instagram: @deliciasdelvalle', 46, 38);

  // Recuadro Factura
  doc.setFillColor(...cremaColor);
  doc.roundedRect(130, 14, 66, 28, 3, 3, 'F');
  doc.setDrawColor(...frambuesaColor);
  doc.roundedRect(130, 14, 66, 28, 3, 3, 'D');

  doc.setTextColor(...frambuesaColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ORDEN / FACTURA', 135, 22);

  doc.setTextColor(...chocolateColor);
  doc.setFontSize(10);
  doc.text(`N° ${pedido.numero_factura}`, 135, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha Pedido: ${formatDate(pedido.fecha_pedido)}`, 135, 34);
  doc.text(`Estado: ${pedido.estado.toUpperCase()}`, 135, 39);

  // Datos de Entrega
  doc.setDrawColor(...trigoColor);
  doc.line(14, 46, 196, 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...chocolateColor);
  doc.text('DETALLES DE CLIENTE Y ENTREGA', 14, 53);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${pedido.cliente_nombre}`, 14, 59);
  doc.text(`Teléfono: ${pedido.cliente_telefono}`, 14, 64);
  doc.text(`Fecha Entrega: ${formatDate(pedido.fecha_entrega)} - Hora: ${pedido.hora_entrega}`, 120, 59);
  doc.text('Tipo Entrega:', 120, 64);
  const esPedDelivery = pedido.tipo_entrega === 'domicilio' || pedido.tipo_despacho === 'delivery';
  try {
    doc.addImage(esPedDelivery ? ICON_DELIVERY_PNG : ICON_STORE_PNG, 'PNG', 140, 60.2, 4.5, 4.5);
  } catch (e) {
    console.error('Error insertando icono pedido:', e);
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(esPedDelivery ? frambuesaColor : chocolateColor));
  doc.text(esPedDelivery ? 'Envío a Domicilio' : 'Recogida en Taller', 146, 64);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  // Tabla
  const tableData = pedido.items.map((item, index) => [
    (index + 1).toString(),
    `${item.receta_nombre} (${formatDisplayTamano(item.tamano_porciones)})${item.dedicatoria ? `\nDedicatoria: "${item.dedicatoria}"` : ''}`,
    item.cantidad.toString(),
    formatCurrency(item.precio_unitario),
    formatCurrency(item.subtotal),
  ]);

  doc.autoTable({
    startY: 70,
    head: [['#', 'Producto / Detalles', 'Cant.', 'Precio Unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: chocolateColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [50, 50, 50],
      cellPadding: 3,
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Estado de Pagos
  doc.setFillColor(...cremaColor);
  doc.roundedRect(14, finalY, 110, 32, 2, 2, 'F');
  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('REGISTRO DE PAGOS Y SALDO:', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`• Total Pedido: ${formatCurrency(pedido.total)}`, 18, finalY + 13);
  doc.text(`• Anticipo Recibido: ${formatCurrency(pedido.anticipo_pagado)}`, 18, finalY + 19);

  doc.setFont('helvetica', 'bold');
  if (pedido.saldo_pendiente > 0) {
    doc.setTextColor(...frambuesaColor);
    doc.text(`• SALDO PENDIENTE: ${formatCurrency(pedido.saldo_pendiente)}`, 18, finalY + 26);
  } else {
    doc.setTextColor(34, 139, 34);
    doc.text('• ESTADO: ¡PAGADO TOTALMENTE!', 18, finalY + 26);
  }

  // Footer
  doc.setFillColor(...chocolateColor);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Delicias del Valle | Calidad Artesanal en Cada Bocado', 105, 293, { align: 'center' });

  doc.save(`Factura_${pedido.numero_factura}_Delicias_del_Valle.pdf`);
}
