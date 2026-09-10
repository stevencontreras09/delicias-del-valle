import React, { useState, useEffect } from 'react';
import { Pedido } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate, formatDisplayTamano } from '../../utils/formatters';
import { Printer, Receipt, FileText, Sparkles } from 'lucide-react';

export type PrintFormat = '80mm' | '58mm' | 'hoja';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
}

const STORAGE_KEY = 'delicias_preferred_print_format';

/**
 * Genera el documento HTML puro para impresión aislada en iframe con cero distorsión
 */
function buildPrintHtml(pedido: Pedido, format: PrintFormat): string {
  const isHoja = format === 'hoja';
  const is58 = format === '58mm';

  if (isHoja) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Hoja de Producción - ${pedido.numero_factura}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #fff;
      margin: 0;
      padding: 0;
      font-size: 11.5px;
      line-height: 1.35;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #5D4037;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #5D4037;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      color: #8D6E63;
      margin-top: 1px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-number {
      font-size: 16px;
      font-weight: 900;
      color: #9E2A2B;
      font-family: monospace;
    }
    .doc-type {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      background: #FDF4E0;
      color: #5D4037;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 2px;
      border: 1px solid #C5A076;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .info-box {
      border: 1px solid #D7CCC8;
      border-radius: 6px;
      padding: 8px 10px;
      background: #FAFAFA;
    }
    .box-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #5D4037;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #EFEBE9;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .info-label {
      color: #6D4C41;
      font-weight: 600;
    }
    .info-val {
      font-weight: 700;
      color: #111;
      text-align: right;
    }
    .highlight-delivery {
      background: #FFF3E0;
      border: 1px solid #FFE0B2;
      padding: 3px 6px;
      border-radius: 4px;
      font-weight: 800;
      color: #E65100;
      margin-top: 4px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 11px;
    }
    table.items-table th {
      background: #5D4037;
      color: #fff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9px;
      padding: 6px 8px;
      border: 1px solid #5D4037;
      text-align: left;
    }
    table.items-table th.num {
      text-align: right;
    }
    table.items-table td {
      padding: 6px 8px;
      border: 1px solid #D7CCC8;
      vertical-align: top;
    }
    table.items-table td.num {
      text-align: right;
      font-weight: 700;
    }
    table.items-table tr:nth-child(even) td {
      background: #FCFBF9;
    }
    .item-title {
      font-weight: 800;
      font-size: 11.5px;
      color: #111;
    }
    .specs-list {
      font-size: 10px;
      color: #4E342E;
      margin-top: 3px;
      line-height: 1.3;
    }
    .dedicatoria-box {
      background: #FFF9C4;
      border: 1px solid #FFF59D;
      padding: 3px 6px;
      border-radius: 4px;
      font-style: italic;
      font-weight: 700;
      color: #795548;
      margin-top: 4px;
      font-size: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .notes-box {
      border: 1px solid #D7CCC8;
      border-radius: 6px;
      padding: 8px 10px;
      background: #FAFAFA;
    }
    .totales-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .totales-table td {
      padding: 3px 6px;
    }
    .totales-table td.val {
      text-align: right;
      font-weight: 700;
    }
    .total-row td {
      font-size: 13px;
      font-weight: 900;
      border-top: 1.5px solid #5D4037;
      padding-top: 5px;
      color: #5D4037;
    }
    .saldo-box {
      background: #FFEBEE;
      border: 1.5px solid #EF9A9A;
      color: #B71C1C;
      font-weight: 900;
      font-size: 13px;
      padding: 5px 8px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 18px;
      padding-top: 10px;
    }
    .sig-box {
      border-top: 1px dashed #8D6E63;
      text-align: center;
      padding-top: 4px;
      font-size: 9px;
      font-weight: 700;
      color: #5D4037;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 14px;
      border-top: 1px solid #E0E0E0;
      padding-top: 6px;
      text-align: center;
      font-size: 9px;
      color: #757575;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">DELICIAS DEL VALLE</div>
      <div class="brand-sub">Pastelería & Panadería Artesanal • Tel: +1 (849) 522-9264 • Jarabacoa, Rep. Dom.</div>
    </div>
    <div class="doc-badge">
      <div class="doc-number">${pedido.numero_factura}</div>
      <div class="doc-type">HOJA DE PRODUCCIÓN & DESPACHO</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-box">
      <div class="box-title">Datos del Cliente & Despacho</div>
      <div class="info-row"><span class="info-label">Cliente:</span><span class="info-val">${pedido.cliente_nombre}</span></div>
      <div class="info-row"><span class="info-label">Teléfono:</span><span class="info-val">${pedido.cliente_telefono}</span></div>
      <div class="info-row"><span class="info-label">Modalidad:</span><span class="info-val">${pedido.tipo_entrega === 'domicilio' ? '🛵 Envío a Domicilio' : '🏪 Retiro en Taller'}</span></div>
      ${pedido.direccion_entrega ? `<div class="info-row"><span class="info-label">Dirección:</span><span class="info-val">${pedido.direccion_entrega}</span></div>` : ''}
    </div>

    <div class="info-box">
      <div class="box-title">Programación de Taller</div>
      <div class="info-row"><span class="info-label">Fecha de Emisión:</span><span class="info-val">${formatDate(pedido.fecha_pedido)}</span></div>
      <div class="info-row"><span class="info-label">Estado Actual:</span><span class="info-val" style="text-transform:uppercase;">${pedido.estado}</span></div>
      <div class="highlight-delivery">
        📅 ENTREGA PROGRAMADA: ${pedido.fecha_entrega} — ${pedido.hora_entrega}
      </div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35px;">Cant</th>
        <th>Producto & Receta</th>
        <th style="width: 130px;">Tamaño / Porciones</th>
        <th>Especificaciones de Taller (Masa, Relleno, Extras)</th>
        <th class="num" style="width: 80px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${pedido.items
        .map(
          (item) => `
        <tr>
          <td style="font-weight: 800; font-size: 13px; text-align: center;">${item.cantidad}x</td>
          <td>
            <div class="item-title">${item.receta_nombre}</div>
            ${item.dedicatoria ? `<div class="dedicatoria-box">✍️ Dedicatoria: "${item.dedicatoria}"</div>` : ''}
          </td>
          <td>${formatDisplayTamano(item.tamano_porciones)}</td>
          <td>
            <div class="specs-list">
              ${item.masa_base ? `<div>• <strong>Masa:</strong> ${item.masa_base}</div>` : ''}
              ${item.relleno ? `<div>• <strong>Relleno:</strong> ${item.relleno}</div>` : ''}
              ${item.decoracion ? `<div>• <strong>Cobertura:</strong> ${item.decoracion}</div>` : ''}
              ${item.extras_texto ? `<div>• <strong>Extras:</strong> ${item.extras_texto}</div>` : ''}
            </div>
          </td>
          <td class="num">${formatCurrency(item.subtotal)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="summary-grid">
    <div class="notes-box">
      <div class="box-title">Notas de Producción & Observaciones</div>
      <div style="font-size: 10.5px; color: #333; min-height: 45px;">
        ${pedido.notas_cocina ? `<p style="margin: 0; font-style: italic;">${pedido.notas_cocina}</p>` : '<span style="color: #999;">Sin notas especiales de producción.</span>'}
      </div>
      ${
        pedido.pagos && pedido.pagos.length > 0
          ? `
        <div style="margin-top: 6px; border-top: 1px dashed #D7CCC8; padding-top: 4px; font-size: 9.5px;">
          <strong>Historial de Pagos Conciliados:</strong>
          ${pedido.pagos.map((p) => `<div>• ${formatDate(p.fecha)}: ${formatCurrency(p.monto)} (${p.banco || p.metodo})</div>`).join('')}
        </div>
      `
          : ''
      }
    </div>

    <div class="notes-box" style="background: #FFF;">
      <div class="box-title">Resumen Financiero</div>
      <table class="totales-table">
        <tr>
          <td>Subtotal Productos:</td>
          <td class="val">${formatCurrency(pedido.subtotal)}</td>
        </tr>
        ${
          pedido.costo_envio > 0
            ? `
          <tr>
            <td>Flete / Envío Domicilio:</td>
            <td class="val">${formatCurrency(pedido.costo_envio)}</td>
          </tr>
        `
            : ''
        }
        <tr class="total-row">
          <td>TOTAL DEL PEDIDO:</td>
          <td class="val">${formatCurrency(pedido.total)}</td>
        </tr>
        <tr>
          <td style="color: #2E7D32; font-weight: 700;">Anticipo Pagado:</td>
          <td class="val" style="color: #2E7D32;">${formatCurrency(pedido.anticipo_pagado)}</td>
        </tr>
      </table>

      <div class="saldo-box">
        <span>SALDO PENDIENTE:</span>
        <span>${formatCurrency(pedido.saldo_pendiente)}</span>
      </div>
    </div>
  </div>

  <div class="signatures-grid">
    <div class="sig-box">Pastelero / Taller</div>
    <div class="sig-box">Control de Calidad</div>
    <div class="sig-box">Recibido Conforme (Cliente)</div>
  </div>

  <div class="footer">
    Cuentas Bancarias: Banco Popular: 812-345678-9 | Banreservas: 960-123456-7 | BHD: 023-456789-0<br>
    <strong>¡Gracias por preferir a Delicias del Valle!</strong>
  </div>
</body>
</html>`;
  }

  // Formato Térmico POS (80mm o 58mm)
  const bodyWidth = is58 ? '54mm' : '74mm';
  const fontSize = is58 ? '10px' : '11.5px';
  const headerSize = is58 ? '13px' : '15px';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket - ${pedido.numero_factura}</title>
  <style>
    @page {
      size: ${is58 ? '58mm auto' : '80mm auto'};
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      width: ${bodyWidth};
      margin: 0 auto;
      padding: ${is58 ? '1.5mm 1.5mm' : '2mm 3mm'};
      background: #fff;
      color: #000;
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.25;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .border-b-dashed { border-bottom: 1px dashed #000; }
    .border-b-dotted { border-bottom: 1px dotted #555; }
    .py-1 { padding-top: 3px; padding-bottom: 3px; }
    .py-2 { padding-top: 5px; padding-bottom: 5px; }
    .flex { display: flex; justify-content: space-between; }
    .header-title { font-size: ${headerSize}; font-weight: 900; letter-spacing: -0.5px; }
    .sub-head { font-size: 9px; }
    .highlight-box { background: #E0E0E0; padding: 2px 4px; font-weight: bold; margin: 3px 0; }
    .saldo-box { background: #D6D6D6; padding: 3px 5px; font-weight: bold; font-size: 12px; margin-top: 3px; }
    .item-specs { font-size: ${is58 ? '9px' : '10px'}; padding-left: 6px; }
    .dedicatoria { font-style: italic; font-weight: bold; margin-top: 2px; }
  </style>
</head>
<body>
  <!-- ENCABEZADO -->
  <div class="text-center border-b-dashed py-1">
    <div class="header-title">DELICIAS DEL VALLE</div>
    <div class="sub-head">Pastelería & Panadería Artesanal</div>
    <div class="sub-head">Tel: +1 (849) 522-9264</div>
    <div class="sub-head" style="font-size: 8px;">Jarabacoa, República Dominicana</div>
  </div>

  <!-- METADATOS -->
  <div class="border-b-dashed py-1">
    <div class="flex font-bold">
      <span>DOC: ${pedido.numero_factura}</span>
      <span style="text-transform: uppercase;">${pedido.estado}</span>
    </div>
    <div>Fecha Emisión: ${formatDate(pedido.fecha_pedido)}</div>
    <div class="highlight-box">
      ENTREGA: ${pedido.fecha_entrega} ${pedido.hora_entrega}
    </div>
    <div>Tipo: ${pedido.tipo_entrega === 'domicilio' ? '🛵 A DOMICILIO' : '🏪 RETIRO EN TALLER'}</div>
    <div class="font-bold" style="margin-top: 2px;">CLIENTE: ${pedido.cliente_nombre}</div>
    <div>Tel: ${pedido.cliente_telefono}</div>
    ${pedido.direccion_entrega ? `<div>Dir: ${pedido.direccion_entrega}</div>` : ''}
  </div>

  <!-- PRODUCTOS -->
  <div class="border-b-dashed py-1">
    <div class="flex font-bold border-b-dotted" style="padding-bottom: 2px; margin-bottom: 4px;">
      <span>CANT / DESCRIPCION</span>
      <span>SUBTOTAL</span>
    </div>

    ${pedido.items
      .map(
        (item) => `
      <div style="margin-bottom: 5px;">
        <div class="flex font-bold">
          <span>${item.cantidad}x ${item.receta_nombre}</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
        <div class="item-specs">
          <div>• Porciones: ${formatDisplayTamano(item.tamano_porciones)}</div>
          ${item.masa_base ? `<div>• Masa: ${item.masa_base}</div>` : ''}
          ${item.relleno ? `<div>• Relleno: ${item.relleno}</div>` : ''}
          ${item.decoracion ? `<div>• Cobertura: ${item.decoracion}</div>` : ''}
          ${item.extras_texto ? `<div>• Extras: ${item.extras_texto}</div>` : ''}
          ${item.dedicatoria ? `<div class="dedicatoria">Dedicatoria: "${item.dedicatoria}"</div>` : ''}
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  <!-- TOTALES -->
  <div class="border-b-dashed py-1">
    <div class="flex">
      <span>Subtotal:</span>
      <span>${formatCurrency(pedido.subtotal)}</span>
    </div>
    ${
      pedido.costo_envio > 0
        ? `
      <div class="flex">
        <span>Envío Domicilio:</span>
        <span>${formatCurrency(pedido.costo_envio)}</span>
      </div>
    `
        : ''
    }
    <div class="flex font-bold" style="border-top: 1px dotted #000; padding-top: 3px; font-size: ${is58 ? '11px' : '13px'};">
      <span>TOTAL:</span>
      <span>${formatCurrency(pedido.total)}</span>
    </div>
    <div class="flex font-bold" style="color: #000;">
      <span>ANTICIPO RECIBIDO:</span>
      <span>${formatCurrency(pedido.anticipo_pagado)}</span>
    </div>
    <div class="saldo-box flex">
      <span>SALDO PENDIENTE:</span>
      <span>${formatCurrency(pedido.saldo_pendiente)}</span>
    </div>
  </div>

  ${
    pedido.pagos && pedido.pagos.length > 0
      ? `
    <div class="border-b-dashed py-1" style="font-size: 9px;">
      <div class="font-bold">HISTORIAL DE PAGOS:</div>
      ${pedido.pagos
        .map(
          (p) => `
        <div class="flex">
          <span>${formatDate(p.fecha)} (${p.banco || p.metodo})</span>
          <span>${formatCurrency(p.monto)}</span>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : ''
  }

  ${
    pedido.notas_cocina
      ? `
    <div class="border-b-dashed py-1" style="font-size: 9.5px;">
      <div class="font-bold">NOTA DE TALLER:</div>
      <div style="font-style: italic;">${pedido.notas_cocina}</div>
    </div>
  `
      : ''
  }

  <div class="text-center py-1" style="font-size: 9px;">
    <div class="font-bold">¡GRACIAS POR SU PREFERENCIA!</div>
    <div style="margin-top: 3px;">Cuentas de Transferencia:</div>
    <div>Popular: 812-345678-9</div>
    <div>Banreservas: 960-123456-7</div>
    <div>BHD: 023-456789-0</div>
    <div class="font-bold" style="margin-top: 4px; letter-spacing: 1px;">* * * DELICIAS DEL VALLE * * *</div>
  </div>
</body>
</html>`;
}

/**
 * Imprime el documento a través de un iframe invisible desacoplado del DOM de React
 * eliminando toda interferencia y distorsión de modales o estilos globales.
 */
export function executePrint(pedido: Pedido, format: PrintFormat) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) {
    window.print();
    return;
  }

  const html = buildPrintHtml(pedido, format);
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Error al imprimir mediante iframe, fallback a window.print()', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 250);
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  pedido,
}) => {
  // Auto-detección inteligente del dispositivo y recuperación de preferencia
  const [printFormat, setPrintFormat] = useState<PrintFormat>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as PrintFormat | null;
      if (saved && (saved === '80mm' || saved === '58mm' || saved === 'hoja')) {
        return saved;
      }
      const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
      return isMobile ? '80mm' : 'hoja';
    }
    return 'hoja';
  });

  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setAutoDetected(true);
      }
    }
  }, []);

  if (!pedido) return null;

  const handleSelectFormat = (format: PrintFormat) => {
    setPrintFormat(format);
    setAutoDetected(false);
    try {
      localStorage.setItem(STORAGE_KEY, format);
    } catch {
      // Ignorar errores en navegadores con storage restringido
    }
  };

  const handlePrint = () => {
    executePrint(pedido, printFormat);
  };

  const isHoja = printFormat === 'hoja';
  const is58 = printFormat === '58mm';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Impresión de Comanda & Ticket"
      subtitle="Optimizado para impresoras térmicas de taller y papel de hoja convencional sin distorsión"
      maxWidth={isHoja ? '3xl' : 'md'}
    >
      <div className="space-y-4">
        {/* Selector de Formato & Botón Principal de Impresión */}
        <div className="p-3.5 bg-crema rounded-2xl border border-trigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-chocolate-800 uppercase tracking-wider">
                Dispositivo / Papel:
              </span>
              {autoDetected && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto-detectado para este equipo
                </span>
              )}
            </div>

            {/* Selector de 3 Opciones */}
            <div className="inline-flex rounded-xl border border-trigo-300 p-1 bg-white shadow-xs">
              <button
                type="button"
                onClick={() => handleSelectFormat('80mm')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  printFormat === '80mm'
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 hover:bg-crema'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80 mm (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFormat('58mm')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  printFormat === '58mm'
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 hover:bg-crema'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>58 mm (Rollo)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFormat('hoja')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  printFormat === 'hoja'
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 hover:bg-crema'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Papel Hoja (Carta / A4)</span>
              </button>
            </div>
          </div>

          {/* Botón de Impresión con Cero Distorsión */}
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-black shadow-warm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>
              Imprimir en {isHoja ? 'Papel Carta' : `Rollo ${printFormat}`}
            </span>
          </button>
        </div>

        {/* CONTENEDOR DE VISTA PREVIA SEGÚN EL FORMATO SELECCIONADO */}
        <div className="overflow-x-auto p-4 bg-slate-100 rounded-2xl flex justify-center border border-slate-200 max-h-[60vh] overflow-y-auto">
          {isHoja ? (
            /* VISTA PREVIA: PAPEL HOJA (CARTA / A4) */
            <div
              className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 w-full max-w-[650px] text-slate-800 text-xs space-y-4"
              style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
            >
              {/* Membrete */}
              <div className="flex justify-between items-start border-b-2 border-chocolate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-chocolate-800 tracking-tight">
                    DELICIAS DEL VALLE
                  </h3>
                  <p className="text-[10px] text-chocolate-600 font-semibold">
                    Pastelería & Panadería Artesanal • Tel: +1 (849) 522-9264 • Jarabacoa, Rep. Dom.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-black text-frambuesa-600">
                    {pedido.numero_factura}
                  </span>
                  <div className="text-[9px] font-bold uppercase bg-amber-50 text-chocolate-800 px-2 py-0.5 rounded border border-amber-200 mt-1">
                    HOJA DE PRODUCCIÓN & DESPACHO
                  </div>
                </div>
              </div>

              {/* Grid Cliente y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[9.5px] font-black uppercase tracking-wider text-chocolate-700 border-b border-slate-200 pb-1">
                    Cliente & Despacho
                  </div>
                  <div><strong>Nombre:</strong> {pedido.cliente_nombre}</div>
                  <div><strong>Teléfono:</strong> {pedido.cliente_telefono}</div>
                  <div><strong>Modalidad:</strong> {pedido.tipo_entrega === 'domicilio' ? '🛵 Envío a Domicilio' : '🏪 Retiro en Taller'}</div>
                  {pedido.direccion_entrega && (
                    <div className="text-slate-600"><strong>Dirección:</strong> {pedido.direccion_entrega}</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[9.5px] font-black uppercase tracking-wider text-chocolate-700 border-b border-slate-200 pb-1">
                    Programación de Taller
                  </div>
                  <div><strong>Emisión:</strong> {formatDate(pedido.fecha_pedido)}</div>
                  <div><strong>Estado:</strong> <span className="uppercase font-bold">{pedido.estado}</span></div>
                  <div className="p-1.5 bg-amber-100/70 border border-amber-300 rounded-lg text-amber-900 font-black text-[11px] mt-1.5">
                    📅 ENTREGA: {pedido.fecha_entrega} — {pedido.hora_entrega}
                  </div>
                </div>
              </div>

              {/* Tabla de Productos de la Receta */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-chocolate-800 text-white text-[10px] uppercase font-black">
                    <tr>
                      <th className="p-2 text-center w-12">Cant</th>
                      <th className="p-2">Producto & Receta</th>
                      <th className="p-2 w-32">Tamaño</th>
                      <th className="p-2">Especificaciones de Taller</th>
                      <th className="p-2 text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pedido.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2 font-black text-center text-sm">{item.cantidad}x</td>
                        <td className="p-2">
                          <div className="font-bold text-slate-900">{item.receta_nombre}</div>
                          {item.dedicatoria && (
                            <div className="text-[10px] italic font-semibold text-amber-900 bg-amber-50 p-1 rounded mt-1 border border-amber-200">
                              ✍️ Dedicatoria: "{item.dedicatoria}"
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-slate-700">{formatDisplayTamano(item.tamano_porciones)}</td>
                        <td className="p-2 text-[10.5px] text-slate-600 space-y-0.5">
                          {item.masa_base && <div>• <strong>Masa:</strong> {item.masa_base}</div>}
                          {item.relleno && <div>• <strong>Relleno:</strong> {item.relleno}</div>}
                          {item.decoracion && <div>• <strong>Cobertura:</strong> {item.decoracion}</div>}
                          {item.extras_texto && <div>• <strong>Extras:</strong> {item.extras_texto}</div>}
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales y Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[9.5px] font-black uppercase text-chocolate-700 border-b border-slate-200 pb-1 mb-1">
                    Notas de Taller / Cocina
                  </div>
                  <p className="italic text-slate-600 text-[11px]">
                    {pedido.notas_cocina || 'Sin observaciones adicionales.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-bold">{formatCurrency(pedido.subtotal)}</span>
                  </div>
                  {pedido.costo_envio > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Flete / Envío:</span>
                      <span className="font-bold">{formatCurrency(pedido.costo_envio)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 text-chocolate-800">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(pedido.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold text-[11px]">
                    <span>Anticipo Pagado:</span>
                    <span>{formatCurrency(pedido.anticipo_pagado)}</span>
                  </div>
                  <div className="flex justify-between text-rose-800 font-black bg-rose-50 p-1.5 rounded-lg border border-rose-200 mt-1">
                    <span>SALDO PENDIENTE:</span>
                    <span>{formatCurrency(pedido.saldo_pendiente)}</span>
                  </div>
                </div>
              </div>

              {/* Firmas de Control de Calidad */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-center text-[9px] font-bold text-slate-500 uppercase">
                <div className="border-t border-dashed border-slate-400 pt-1">Pastelero Taller</div>
                <div className="border-t border-dashed border-slate-400 pt-1">Control de Calidad</div>
                <div className="border-t border-dashed border-slate-400 pt-1">Recibido Conforme</div>
              </div>
            </div>
          ) : (
            /* VISTA PREVIA: COMANDA TÉRMICA POS (80MM / 58MM) */
            <div
              id="thermal-ticket-container"
              className={`bg-white p-4 shadow-md font-mono text-black border border-slate-300 ${
                is58 ? 'w-[58mm] text-[10.5px]' : 'w-[80mm] text-[11.5px]'
              }`}
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                lineHeight: 1.25,
              }}
            >
              {/* Encabezado */}
              <div className="text-center pb-2 border-b border-dashed border-black">
                <div className="text-sm font-black tracking-tighter uppercase">
                  DELICIAS DEL VALLE
                </div>
                <div className="text-[10px]">Pastelería & Panadería Artesanal</div>
                <div className="text-[10px]">Tel: +1 (849) 522-9264</div>
                <div className="text-[9px] text-gray-600">Jarabacoa, Rep. Dominicana</div>
              </div>

              {/* Metadatos del Pedido */}
              <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
                <div className="font-bold flex justify-between">
                  <span>DOC: {pedido.numero_factura}</span>
                  <span className="uppercase">{pedido.estado}</span>
                </div>
                <div>Fecha Emisión: {formatDate(pedido.fecha_pedido)}</div>
                <div className="font-bold bg-gray-200 p-0.5 mt-1">
                  ENTREGA: {pedido.fecha_entrega} {pedido.hora_entrega}
                </div>
                <div>Tipo: {pedido.tipo_entrega === 'domicilio' ? '🛵 A DOMICILIO' : '🏪 RETIRO EN TALLER'}</div>
                <div className="pt-1 font-bold">CLIENTE: {pedido.cliente_nombre}</div>
                <div>Tel: {pedido.cliente_telefono}</div>
                {pedido.direccion_entrega && (
                  <div className="text-[10px]">Dir: {pedido.direccion_entrega}</div>
                )}
              </div>

              {/* Desglose de Productos */}
              <div className="py-2 border-b border-dashed border-black space-y-2">
                <div className="font-bold flex justify-between text-[11px] pb-1 border-b border-dotted border-gray-400">
                  <span>CANT / DESCRIPCION</span>
                  <span>SUBTOTAL</span>
                </div>

                {pedido.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between font-bold">
                      <span>
                        {item.cantidad}x {item.receta_nombre}
                      </span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                    <div className="text-[10px] pl-2 text-gray-800">
                      <div>• Porciones: {formatDisplayTamano(item.tamano_porciones)}</div>
                      {item.masa_base && <div>• Masa: {item.masa_base}</div>}
                      {item.relleno && <div>• Relleno: {item.relleno}</div>}
                      {item.decoracion && <div>• Cobertura: {item.decoracion}</div>}
                      {item.extras_texto && <div>• Extras: {item.extras_texto}</div>}
                      {item.dedicatoria && (
                        <div className="italic font-bold text-black mt-0.5">
                          Dedicatoria: "{item.dedicatoria}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen Financiero */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(pedido.subtotal)}</span>
                </div>
                {pedido.costo_envio > 0 && (
                  <div className="flex justify-between">
                    <span>Envío Domicilio:</span>
                    <span>{formatCurrency(pedido.costo_envio)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-dotted border-black">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(pedido.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>ANTICIPO RECIBIDO:</span>
                  <span>{formatCurrency(pedido.anticipo_pagado)}</span>
                </div>
                <div className="flex justify-between text-black font-black bg-gray-200 p-1 mt-1 text-sm">
                  <span>SALDO PENDIENTE:</span>
                  <span>{formatCurrency(pedido.saldo_pendiente)}</span>
                </div>
              </div>

              {/* Pagos Conciliados Registrados */}
              {pedido.pagos && pedido.pagos.length > 0 && (
                <div className="py-1.5 border-b border-dashed border-black text-[10px]">
                  <div className="font-bold mb-0.5">HISTORIAL DE PAGOS:</div>
                  {pedido.pagos.map((p, pIdx) => (
                    <div key={pIdx} className="flex justify-between text-gray-700">
                      <span>
                        {formatDate(p.fecha)} ({p.banco || p.metodo})
                      </span>
                      <span>{formatCurrency(p.monto)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notas de Taller / Cocina */}
              {pedido.notas_cocina && (
                <div className="py-1.5 border-b border-dashed border-black text-[10px]">
                  <span className="font-bold block">NOTA DE TALLER:</span>
                  <p className="italic">{pedido.notas_cocina}</p>
                </div>
              )}

              {/* Pie de Ticket y Cuentas Bancarias */}
              <div className="text-center pt-2 space-y-1 text-[9px]">
                <div className="font-bold">¡GRACIAS POR SU PREFERENCIA!</div>
                <div>Cuentas para transferencias:</div>
                <div>Banco Popular: 812-345678-9</div>
                <div>Banreservas: 960-123456-7</div>
                <div>BHD: 023-456789-0</div>
                <div className="tracking-widest font-black pt-1 text-[10px]">
                  * * * DELICIAS DEL VALLE * * *
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-between items-center pt-2 border-t border-trigo-200">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Formato activo: <strong>{isHoja ? 'Papel Hoja Estándar' : `Comanda Térmica ${printFormat}`}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-trigo-300 text-chocolate-700 hover:bg-gray-50 text-xs font-bold transition-colors"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </Modal>
  );
};
