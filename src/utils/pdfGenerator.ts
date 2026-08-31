import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Cotizacion, Pedido } from '../types';
import { formatCurrency, formatDate } from './formatters';

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

  // Encabezado superior con barra frambuesa
  doc.setFillColor(...frambuesaColor);
  doc.rect(0, 0, 210, 8, 'F');

  // Membrete
  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DELICIAS DEL VALLE', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...trigoColor);
  doc.text('Pastelería y Panadería Artesanal', 14, 28);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Taller Gastronómico Artesanal', 14, 34);
  doc.text('Tel / WhatsApp: +1 (809) 555-0142 | Instagram: @deliciasdelvalle', 14, 39);

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

  // Datos del Cliente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...chocolateColor);
  doc.text('INFORMACIÓN DEL CLIENTE', 14, 53);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${cotizacion.cliente_nombre}`, 14, 59);
  doc.text(`Teléfono: ${cotizacion.cliente_telefono}`, 14, 64);
  if (cotizacion.cliente_email) {
    doc.text(`Email: ${cotizacion.cliente_email}`, 14, 69);
  }
  if (cotizacion.fecha_evento) {
    doc.text(`Fecha del Evento: ${formatDate(cotizacion.fecha_evento)}`, 120, 59);
  }

  // Tabla de Productos / Items
  const tableData = cotizacion.items.map((item, index) => {
    let descripcion = `${item.receta_nombre}\n• Tamaño: ${item.tamano_porciones}`;
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

  const startY = cotizacion.cliente_email ? 74 : 70;

  doc.autoTable({
    startY: startY,
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

  if (cotizacion.costo_envio > 0) {
    doc.text('Domicilio / Envío:', rightX, finalY + offset);
    doc.text(formatCurrency(cotizacion.costo_envio), 196, finalY + offset, { align: 'right' });
    offset += 6;
  }

  // Total Destacado
  doc.setFillColor(...frambuesaColor);
  doc.roundedRect(rightX - 3, finalY + offset - 4, 64, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('TOTAL:', rightX, finalY + offset + 2.5);
  doc.text(formatCurrency(cotizacion.total), 194, finalY + offset + 2.5, { align: 'right' });

  // Esquema de Pago (Lado Izquierdo)
  doc.setFillColor(...cremaColor);
  doc.roundedRect(14, finalY - 2, 105, 30, 2, 2, 'F');
  doc.setDrawColor(...trigoColor);
  doc.roundedRect(14, finalY - 2, 105, 30, 2, 2, 'D');

  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ESQUEMA DE PAGO Y CONDICIONES:', 18, finalY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`• Anticipo del 50%: ${formatCurrency(cotizacion.total * 0.5)} (para confirmar)`, 18, finalY + 11);
  doc.text(`• Saldo contra entrega (50%): ${formatCurrency(cotizacion.total * 0.5)}`, 18, finalY + 17);
  doc.text('• Pedidos personalizados requieren mínimo 48h de anticipación.', 18, finalY + 23);

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

  // Membrete
  doc.setTextColor(...chocolateColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DELICIAS DEL VALLE', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...trigoColor);
  doc.text('Pastelería y Panadería Artesanal - Comprobante de Pedido', 14, 28);

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
  doc.text(`Tipo Entrega: ${pedido.tipo_entrega === 'domicilio' ? 'Domicilio' : 'Recogida en Taller'}`, 120, 64);

  // Tabla
  const tableData = pedido.items.map((item, index) => [
    (index + 1).toString(),
    `${item.receta_nombre} (${item.tamano_porciones})${item.dedicatoria ? `\nDedicatoria: "${item.dedicatoria}"` : ''}`,
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
