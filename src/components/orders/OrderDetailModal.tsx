import React, { useState } from 'react';
import { Pedido, EstadoPedido, MetodoPago, TipoPago, BancoRD } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileText,
  MessageCircle,
  CreditCard,
  MapPin,
  Phone,
  User,
  Sparkles,
  Printer,
  XCircle,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { generarPdfPedido } from '../../utils/pdfGenerator';
import { generarMensajePedidoWhatsApp } from '../../utils/whatsappShare';
import { PaymentRecordModal } from './PaymentRecordModal';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  onChangeStatus: (pedidoId: number, nuevoEstado: EstadoPedido) => void;
  onRequestPrintTicket?: (pedido: Pedido) => void;
  onRequestCancel?: (pedido: Pedido) => void;
  onRequestDelete?: (pedido: Pedido) => void;
  onSavePayment: (
    pedidoId: number,
    monto: number,
    metodo: MetodoPago,
    referencia: string,
    tipoPago: TipoPago,
    banco?: BancoRD,
    comprobanteUrl?: string
  ) => void;
}

const ESTADOS_ORDEN: { id: EstadoPedido; label: string; desc: string }[] = [
  { id: 'confirmado', label: 'Confirmado', desc: 'Anticipo 50% recibido, inventario descontado' },
  { id: 'en_produccion', label: 'En Producción', desc: 'En mesa de amasado o en horno' },
  { id: 'listo', label: 'Listo en Mostrador', desc: 'Decorado, empacado y refrigerado' },
  { id: 'entregado', label: 'Entregado & Cobrado', desc: 'Completado con éxito' },
];

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  pedido,
  onChangeStatus,
  onRequestPrintTicket,
  onRequestCancel,
  onRequestDelete,
  onSavePayment,
}) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  if (!pedido) return null;

  const { url: waUrl } = generarMensajePedidoWhatsApp(pedido);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Orden / Factura ${pedido.numero_factura}`}
      subtitle={`Fecha de Pedido: ${formatDate(pedido.fecha_pedido)} • Entrega: ${formatDate(pedido.fecha_entrega)} a las ${pedido.hora_entrega}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Barra de Progreso de Estados de Producción */}
        <div className="bg-canvas p-4 rounded-2xl border border-trigo-200">
          <span className="text-xs font-bold text-chocolate-800 uppercase tracking-wider block mb-3">
            Flujo de Estado de Producción:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ESTADOS_ORDEN.map((est, index) => {
              const isCurrent = pedido.estado === est.id;
              const isPast =
                (pedido.estado === 'en_produccion' && est.id === 'confirmado') ||
                (pedido.estado === 'listo' && (est.id === 'confirmado' || est.id === 'en_produccion')) ||
                (pedido.estado === 'entregado');

              return (
                <button
                  key={est.id}
                  onClick={() => onChangeStatus(pedido.id, est.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isCurrent
                      ? 'bg-chocolate-700 text-white border-chocolate-800 shadow-md ring-2 ring-frambuesa-400'
                      : isPast
                      ? 'bg-crema/60 text-chocolate-800 border-trigo-300'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold opacity-75">PASO {index + 1}</span>
                    {isCurrent && <Sparkles className="w-3.5 h-3.5 text-frambuesa-300" />}
                  </div>
                  <p className="font-bold text-xs mt-0.5 leading-tight">{est.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Acciones de Facturación & WhatsApp */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-crema p-4 rounded-2xl border border-trigo-200">
          <div className="flex items-center gap-3">
            <span className="text-xs text-chocolate-800 font-semibold">
              Total Orden: <b className="text-sm font-extrabold text-chocolate-900">{formatCurrency(pedido.total)}</b>
            </span>
            <span className="text-xs text-chocolate-600">
              • Anticipo:{' '}
              <b className="text-emerald-700 font-bold">{formatCurrency(pedido.anticipo_pagado)}</b>
            </span>
            {pedido.saldo_pendiente > 0 ? (
              <Badge variant="frambuesa" size="md">
                Saldo: {formatCurrency(pedido.saldo_pendiente)}
              </Badge>
            ) : (
              <Badge variant="success" size="md">
                ¡PAGADO 100%!
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generarPdfPedido(pedido)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-trigo-300 hover:bg-gray-50 text-chocolate-700 text-xs font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-chocolate-600" />
              <span>Factura PDF</span>
            </button>

            {onRequestPrintTicket && (
              <button
                type="button"
                onClick={() => onRequestPrintTicket(pedido)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Ticket Térmico</span>
              </button>
            )}

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Recibo WhatsApp</span>
            </a>

            {pedido.saldo_pendiente > 0 && (
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-black shadow-frambuesa-glow transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Cobrar Saldo 50%</span>
              </button>
            )}

            {onRequestCancel && pedido.estado !== 'cancelado' && (
              <button
                type="button"
                onClick={() => {
                  onRequestCancel(pedido);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all border border-amber-200"
                title="Cancelar pedido y resolver inventario/mermas"
              >
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Cancelar</span>
              </button>
            )}

            {onRequestDelete && (
              <button
                type="button"
                onClick={() => {
                  onRequestDelete(pedido);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
                title="Eliminar pedido y devolver insumos al inventario (Requiere Admin/Coadmin)"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Eliminar Pedido</span>
              </button>
            )}
          </div>
        </div>

        {/* Datos de Entrega y Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-trigo-200 text-xs">
          <div>
            <span className="text-gray-500 font-medium block">Cliente:</span>
            <span className="font-bold text-chocolate-900 text-sm flex items-center gap-1.5 mt-0.5">
              <User className="w-4 h-4 text-trigo-600" />
              {pedido.cliente_nombre}
            </span>
          </div>

          <div>
            <span className="text-gray-500 font-medium block">Teléfono / WhatsApp:</span>
            <span className="font-semibold text-chocolate-800 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              {pedido.cliente_telefono}
            </span>
          </div>

          <div>
            <span className="text-gray-500 font-medium block">Tipo de Entrega:</span>
            <span className="font-bold text-chocolate-800 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-frambuesa-500" />
              {pedido.tipo_entrega === 'domicilio'
                ? `Domicilio: ${pedido.direccion_entrega || 'Dirección no especificada'}`
                : 'Recogida en Taller (Local)'}
            </span>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-chocolate-700 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Producto & Especificaciones</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Precio Unitario</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trigo-100 bg-white">
              {pedido.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-crema/20">
                  <td className="py-3 px-4">
                    <p className="font-bold text-chocolate-900 text-sm">{item.receta_nombre}</p>
                    <p className="text-xs text-chocolate-600 font-medium mt-0.5">
                      {item.tamano_porciones} • Masa: {item.masa_base} • Relleno: {item.relleno}
                    </p>
                    {item.decoracion && (
                      <p className="text-xs text-gray-500">Decoración: {item.decoracion}</p>
                    )}
                    {item.dedicatoria && (
                      <p className="text-xs text-frambuesa-700 font-semibold italic mt-0.5">
                        Dedicatoria: "{item.dedicatoria}"
                      </p>
                    )}
                    {item.extras_texto && (
                      <p className="text-[11px] text-trigo-700 font-semibold mt-1">
                        + Extras: {item.extras_texto}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-chocolate-800">
                    {item.cantidad}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 font-medium">
                    {formatCurrency(item.precio_unitario)}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-chocolate-900">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Historial de Pagos y Transacciones */}
        <div className="bg-canvas p-4 rounded-2xl border border-trigo-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-chocolate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-chocolate-600" />
              <span>Historial de Pagos & Transacciones ({pedido.pagos.length})</span>
            </h4>

            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                Inventario Descontado: Sí
              </span>
            </div>
          </div>

          {pedido.pagos.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No hay pagos registrados aún.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pedido.pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="bg-white p-3 rounded-xl border border-trigo-200 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm">
                      {pago.tipo_pago === 'anticipo_50'
                        ? 'Anticipo 50%'
                        : pago.tipo_pago === 'saldo_50'
                        ? 'Saldo 50%'
                        : pago.tipo_pago}
                    </Badge>
                    <span className="font-extrabold text-chocolate-900">
                      {formatCurrency(pago.monto)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px]">
                    Método: <b>{pago.metodo}</b>
                  </p>
                  <p className="text-gray-400 text-[10px]">
                    Ref: {pago.referencia || 'Sin referencia'}
                  </p>
                  <p className="text-gray-400 text-[10px]">Fecha: {formatDate(pago.fecha)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-trigo-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold shadow-warm transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>

      {isPaymentOpen && (
        <PaymentRecordModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          pedido={pedido}
          onSavePayment={onSavePayment}
        />
      )}
    </Modal>
  );
};
