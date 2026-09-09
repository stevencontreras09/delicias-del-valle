import React, { useState } from 'react';
import { Pedido, EstadoPedido, MetodoPago, TipoPago, BancoRD } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate, formatDisplayTamano } from '../../utils/formatters';
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
  Truck,
  Send,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { generarPdfPedido } from '../../utils/pdfGenerator';
import { generarMensajePedidoWhatsApp } from '../../utils/whatsappShare';
import { PaymentRecordModal } from './PaymentRecordModal';
import { getGoogleMapsUrl, getWazeUrl, generateDriverWhatsAppMessage } from '../../utils/deliveryHelper';
import { CakeCareCard } from '../delivery/CakeCareCard';

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
  const { zonasDelivery } = useApp();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showCareCard, setShowCareCard] = useState(false);

  if (!pedido) return null;

  const isDelivery = pedido.tipo_despacho === 'delivery' || pedido.tipo_entrega === 'domicilio';
  const zonaAsignada = zonasDelivery.find((z) => z.id === pedido.zona_delivery_id);
  const mapsUrl = getGoogleMapsUrl(pedido.direccion_entrega || '', pedido.punto_referencia);
  const wazeUrl = getWazeUrl(pedido.direccion_entrega || '');
  const driverWaUrl = generateDriverWhatsAppMessage(pedido.repartidor_telefono || '', pedido, {
    nombre: pedido.cliente_nombre,
    telefono: pedido.cliente_telefono,
  });

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

        {/* Datos del Cliente y Contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-trigo-200 text-xs">
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
        </div>

        {/* Módulo de Logística, Despacho y Cuidados */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-trigo-200 space-y-3.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-trigo-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-xl ${
                  isDelivery ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                }`}
              >
                {isDelivery ? <Truck className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-chocolate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{isDelivery ? '🛵 Envío a Domicilio (Delivery)' : '🏬 Retiro en Taller (Local)'}</span>
                  <Badge variant={isDelivery ? 'frambuesa' : 'info'} size="sm">
                    {isDelivery ? 'DESPACHO EXTERNO' : 'PICKUP LOCAL'}
                  </Badge>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isDelivery
                    ? 'Ruta de entrega, chofer y protocolo de climatización'
                    : 'El cliente recogerá personalmente el producto en las instalaciones del taller'}
                </p>
              </div>
            </div>

            {/* Botón de Guía de Cuidados del Pastel */}
            <button
              type="button"
              onClick={() => setShowCareCard(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition shadow-xs active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Etiqueta & Cuidados</span>
            </button>
          </div>

          {isDelivery ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Dirección y Referencia */}
                <div className="bg-canvas/60 p-3 rounded-xl border border-trigo-200 space-y-1">
                  <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block">
                    Dirección Exacta:
                  </span>
                  <p className="font-bold text-chocolate-900 text-xs">
                    {pedido.direccion_entrega || 'No especificada'}
                  </p>
                  {pedido.punto_referencia && (
                    <p className="text-[11px] text-amber-900 font-medium pt-1 border-t border-trigo-200/60">
                      📌 <span className="font-semibold">Ref:</span> {pedido.punto_referencia}
                    </p>
                  )}
                </div>

                {/* Zona y Flete */}
                <div className="bg-canvas/60 p-3 rounded-xl border border-trigo-200 space-y-1">
                  <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block">
                    Zona & Tarifa de Flete:
                  </span>
                  <p className="font-bold text-chocolate-900 text-xs">
                    {zonaAsignada ? zonaAsignada.nombre : 'Zona Estándar'}
                  </p>
                  <p className="text-xs font-extrabold text-frambuesa-600">
                    Flete: {formatCurrency(pedido.costo_delivery || 0)}
                  </p>
                  <span className="inline-block text-[10px] text-stone-500">
                    {pedido.cobro_delivery_al_recibir
                      ? '⚠️ Chofer debe cobrar flete al entregar'
                      : '✓ Flete ya cubierto en la factura'}
                  </span>
                </div>

                {/* Chofer / Repartidor */}
                <div className="bg-canvas/60 p-3 rounded-xl border border-trigo-200 space-y-1">
                  <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider block">
                    Chofer / Repartidor:
                  </span>
                  <p className="font-bold text-chocolate-900 text-xs">
                    {pedido.repartidor_nombre || 'No asignado aún'}
                  </p>
                  {pedido.repartidor_telefono ? (
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {pedido.repartidor_telefono}
                    </p>
                  ) : (
                    <span className="text-[10px] text-stone-400 italic">Sin teléfono registrado</span>
                  )}
                </div>
              </div>

              {/* Botones de Acción de Navegación y WhatsApp */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-trigo-300 hover:bg-amber-50 text-stone-800 text-xs font-bold transition shadow-2xs"
                >
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Navegar con Google Maps</span>
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-trigo-300 hover:bg-amber-50 text-stone-800 text-xs font-bold transition shadow-2xs"
                >
                  <Navigation className="w-4 h-4 text-sky-600" />
                  <span>Navegar con Waze</span>
                </a>

                <a
                  href={driverWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-emerald-glow"
                >
                  <Send className="w-4 h-4" />
                  <span>Despachar a Chofer vía WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-canvas/50 p-3 rounded-xl border border-trigo-200 text-xs text-stone-600">
              <p>
                📍 <strong>Punto de Retiro:</strong> Taller Central Delicias del Valle. El pedido debe ser
                entregado en mano al cliente o persona autorizada con la factura correspondiente.
              </p>
            </div>
          )}
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
                      {formatDisplayTamano(item.tamano_porciones)} • Masa: {item.masa_base} • Relleno: {item.relleno}
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

      {/* Modal Guía y Etiqueta de Cuidados */}
      {showCareCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
          <div className="relative max-w-sm w-full">
            <CakeCareCard
              pedidoId={pedido.numero_factura}
              clienteNombre={pedido.cliente_nombre}
              nombrePastel={pedido.items.map((i) => i.receta_nombre).join(', ') || 'Pastel Artesanal'}
              fechaEntrega={formatDate(pedido.fecha_entrega)}
              onClose={() => setShowCareCard(false)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};
