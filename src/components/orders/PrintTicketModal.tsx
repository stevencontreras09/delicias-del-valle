import React, { useState } from 'react';
import { Pedido } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Printer, Receipt } from 'lucide-react';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  pedido,
}) => {
  const [ticketWidth, setTicketWidth] = useState<'58mm' | '80mm'>('80mm');

  if (!pedido) return null;

  const handlePrint = () => {
    window.print();
  };

  const is58 = ticketWidth === '58mm';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comanda y Ticket Térmico POS"
      subtitle="Impresión optimizada para tickets de caja y comanda de cocina"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Selector de Ancho Térmico y Botón de Imprimir */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-crema rounded-2xl border border-trigo-200">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-chocolate-600" />
            <span className="text-xs font-bold text-chocolate-800">Formato de Rollo:</span>
            <div className="inline-flex rounded-xl border border-trigo-300 p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setTicketWidth('58mm')}
                className={'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ' + (
                  ticketWidth === '58mm'
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 hover:bg-crema'
                )}
              >
                58 mm (Pequeño)
              </button>
              <button
                type="button"
                onClick={() => setTicketWidth('80mm')}
                className={'px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ' + (
                  ticketWidth === '80mm'
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 hover:bg-crema'
                )}
              >
                80 mm (Estándar POS)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold shadow-warm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>

        {/* Vista Previa del Ticket Térmico */}
        <div className="overflow-x-auto p-4 bg-slate-100 rounded-2xl flex justify-center border border-slate-200">
          <div
            id="thermal-ticket-container"
            className={'bg-white p-4 shadow-md font-mono text-black ' + (
              is58 ? 'w-[58mm] text-[11px]' : 'w-[80mm] text-[12px]'
            )}
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              lineHeight: 1.25,
            }}
          >
            {/* Encabezado */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <div className="text-sm sm:text-base font-black tracking-tighter">
                DELICIAS DEL VALLE
              </div>
              <div className="text-[10px]">Pastelería & Panadería Artesanal</div>
              <div className="text-[10px]">Tel: +1 (809) 555-0101</div>
              <div className="text-[9px] text-gray-600">República Dominicana</div>
            </div>

            {/* Metadatos del Pedido */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
              <div className="font-bold flex justify-between">
                <span>DOC: {pedido.numero_factura}</span>
                <span className="uppercase">{pedido.estado}</span>
              </div>
              <div>Fecha Emisión: {formatDate(pedido.fecha_pedido)}</div>
              <div className="font-bold bg-gray-100 p-0.5 mt-1">
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
                    <div>• Porciones: {item.tamano_porciones}</div>
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

            {/* Resumen Financiero (50/50) */}
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
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-end pt-2 border-t border-trigo-200">
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
