import React, { useState } from 'react';
import { Cotizacion, TipoEntrega, TipoDespacho } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileText,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  ShoppingBag,
  Sparkles,
  Truck,
  Store,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { generarPdfCotizacion } from '../../utils/pdfGenerator';
import { generarMensajeCotizacionWhatsApp } from '../../utils/whatsappShare';

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: Cotizacion | null;
  onConvertToOrder: (
    cotizacionId: number,
    anticipo: number,
    fechaEntrega: string,
    horaEntrega: string,
    tipoEntrega: TipoEntrega,
    direccion?: string,
    despachoData?: {
      tipo_despacho?: TipoDespacho;
      zona_delivery_id?: number | null;
      costo_delivery?: number;
      punto_referencia?: string;
      repartidor_nombre?: string;
      repartidor_telefono?: string;
      cobro_delivery_al_recibir?: boolean;
    }
  ) => void;
  onEdit?: (cotizacion: Cotizacion) => void;
}

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  isOpen,
  onClose,
  cotizacion,
  onConvertToOrder,
  onEdit,
}) => {
  const { zonasDelivery, usuarios } = useApp();
  const deliveryUsers = (usuarios || []).filter((u) => u.rol === 'delivery' && u.activo);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [anticipoMonto, setAnticipoMonto] = useState<number | ''>('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('14:00');
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('recogida_local');
  const [tipoDespacho, setTipoDespacho] = useState<TipoDespacho>('retiro');
  const [zonaDeliveryId, setZonaDeliveryId] = useState<number | ''>('');
  const [direccion, setDireccion] = useState('');
  const [puntoReferencia, setPuntoReferencia] = useState('');
  const [repartidorNombre, setRepartidorNombre] = useState('');
  const [repartidorTelefono, setRepartidorTelefono] = useState('');
  const [cobroDeliveryAlRecibir, setCobroDeliveryAlRecibir] = useState(false);

  if (!cotizacion) return null;

  const handleOpenConvert = () => {
    setAnticipoMonto(Math.round((cotizacion.total * 0.5) * 100) / 100);
    setFechaEntrega(cotizacion.fecha_evento || new Date().toISOString().split('T')[0]);
    setHoraEntrega('14:00');
    const isDelivery = cotizacion.tipo_despacho === 'delivery' || Number(cotizacion.costo_delivery || cotizacion.costo_envio || 0) > 0;
    setTipoEntrega(isDelivery ? 'domicilio' : 'recogida_local');
    setTipoDespacho(isDelivery ? 'delivery' : 'retiro');
    setZonaDeliveryId(cotizacion.zona_delivery_id || '');
    setDireccion(cotizacion.direccion_entrega || '');
    setPuntoReferencia(cotizacion.punto_referencia || '');
    setRepartidorNombre(cotizacion.repartidor_nombre || '');
    setRepartidorTelefono(cotizacion.repartidor_telefono || '');
    setCobroDeliveryAlRecibir(false);
    setShowConvertDialog(true);
  };

  const handleConfirmOrder = () => {
    const anticipo = typeof anticipoMonto === 'number' ? anticipoMonto : 0;
    if (tipoDespacho === 'delivery') {
      if (!direccion.trim()) {
        alert('Para entrega a domicilio, la Dirección de Entrega es obligatoria.');
        return;
      }
      if (!puntoReferencia.trim()) {
        alert('Para entrega a domicilio, el Punto de Referencia es obligatorio.');
        return;
      }
    }
    onConvertToOrder(
      cotizacion.id,
      anticipo,
      fechaEntrega,
      horaEntrega,
      tipoDespacho === 'delivery' ? 'domicilio' : 'recogida_local',
      direccion.trim(),
      {
        tipo_despacho: tipoDespacho,
        zona_delivery_id: tipoDespacho === 'delivery' && zonaDeliveryId ? Number(zonaDeliveryId) : null,
        costo_delivery: tipoDespacho === 'delivery' ? (cotizacion.costo_delivery || cotizacion.costo_envio || 0) : 0,
        punto_referencia: tipoDespacho === 'delivery' ? puntoReferencia.trim() : undefined,
        repartidor_nombre: repartidorNombre.trim() || undefined,
        repartidor_telefono: repartidorTelefono.trim() || undefined,
        cobro_delivery_al_recibir: cobroDeliveryAlRecibir,
      }
    );
    setShowConvertDialog(false);
    onClose();
  };

  const { url: waUrl } = generarMensajeCotizacionWhatsApp(cotizacion);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cotización ${cotizacion.codigo}`}
      subtitle={`Emitida el ${formatDate(cotizacion.fecha_emision)} • Validez: ${cotizacion.validez_dias} días`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Banner de Estado */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-crema p-4 rounded-2xl border border-trigo-200">
          <div className="flex items-center gap-3">
            <Badge
              variant={
                cotizacion.estado === 'convertida'
                  ? 'frambuesa'
                  : cotizacion.estado === 'aprobada'
                  ? 'success'
                  : cotizacion.estado === 'enviada'
                  ? 'info'
                  : 'warning'
              }
              size="md"
            >
              {cotizacion.estado.toUpperCase()}
            </Badge>

            <span className="text-xs text-chocolate-700 font-semibold">
              Total: <b className="text-sm font-extrabold text-frambuesa-600">{formatCurrency(cotizacion.total)}</b>
            </span>
          </div>

          {/* Acciones Principales */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generarPdfCotizacion(cotizacion)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-trigo-300 hover:bg-gray-50 text-chocolate-700 text-xs font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-chocolate-600" />
              <span>Exportar PDF</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </a>

            {cotizacion.estado !== 'convertida' && (
              <button
                onClick={handleOpenConvert}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-black shadow-frambuesa-glow transition-all transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>Convertir a Pedido (1 Clic)</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Intermedio de Confirmación de Pedido con Anticipo 50/50 */}
        {showConvertDialog && (
          <div className="bg-white p-5 rounded-3xl border-2 border-frambuesa-400 shadow-warm-xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trigo-200 pb-3">
              <h3 className="text-sm font-bold text-chocolate-800 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-frambuesa-500" />
                <span>Confirmar Pedido y Descontar Inventario</span>
              </h3>
              <Badge variant="frambuesa" size="sm">
                Anticipo 50% + Saldo 50%
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-chocolate-700 mb-1">
                  Anticipo Recibido ($) * (50% Sugerido)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={cotizacion.total}
                  required
                  value={anticipoMonto}
                  onChange={(e) =>
                    setAnticipoMonto(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs font-bold text-chocolate-900"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Saldo pendiente contra entrega:{' '}
                  <b className="text-frambuesa-600">
                    {formatCurrency(
                      cotizacion.total - (typeof anticipoMonto === 'number' ? anticipoMonto : 0)
                    )}
                  </b>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-chocolate-700 mb-1">
                  Fecha de Entrega *
                </label>
                <input
                  type="date"
                  required
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-chocolate-700 mb-1">
                  Hora de Entrega *
                </label>
                <input
                  type="time"
                  required
                  value={horaEntrega}
                  onChange={(e) => setHoraEntrega(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-chocolate-700 mb-1.5">
                  Modalidad de Despacho
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-crema/80 rounded-2xl border border-trigo-300">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoDespacho('retiro');
                      setTipoEntrega('recogida_local');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                      tipoDespacho === 'retiro'
                        ? 'bg-chocolate-700 text-white shadow-sm'
                        : 'text-chocolate-700 hover:bg-white'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>🏬 Retiro en Taller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoDespacho('delivery');
                      setTipoEntrega('domicilio');
                      if (!zonaDeliveryId && zonasDelivery.length > 0) {
                        const first = zonasDelivery.find(z => z.activo) || zonasDelivery[0];
                        if (first) setZonaDeliveryId(first.id);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                      tipoDespacho === 'delivery'
                        ? 'bg-frambuesa-500 text-white shadow-sm'
                        : 'text-chocolate-700 hover:bg-white'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>🛵 Envío a Domicilio</span>
                  </button>
                </div>
              </div>

              {tipoDespacho === 'delivery' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Zona de Envío Asignada
                    </label>
                    <select
                      value={zonaDeliveryId}
                      onChange={(e) => setZonaDeliveryId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs bg-white font-medium"
                    >
                      <option value="">-- Seleccionar zona --</option>
                      {zonasDelivery.filter(z => z.activo).map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre} — {formatCurrency(z.tarifa)} ({z.tiempo_estimado_min || 45} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Dirección de Entrega *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Calle, Número, Apto, Sector..."
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Punto de Referencia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Frente a..., portón..., color..."
                      value={puntoReferencia}
                      onChange={(e) => setPuntoReferencia(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
                    />
                  </div>

                  {deliveryUsers.length > 0 && (
                    <div className="sm:col-span-2 flex items-center gap-1.5 flex-wrap pb-1 border-b border-trigo-200/80">
                      <span className="text-[10px] font-bold text-chocolate-700">Repartidores en equipo:</span>
                      {deliveryUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setRepartidorNombre(u.nombre_completo);
                            if (u.telefono) setRepartidorTelefono(u.telefono);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-stone-700 border border-trigo-300 text-[10px] font-semibold transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>🛵 {u.nombre_completo}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Chofer / Mensajero <span className="text-gray-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      list="choferes-registrados-modal-list"
                      placeholder="Nombre del repartidor"
                      value={repartidorNombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRepartidorNombre(val);
                        const matched = deliveryUsers.find(
                          (u) =>
                            u.nombre_completo.toLowerCase() === val.toLowerCase() ||
                            u.username.toLowerCase() === val.toLowerCase()
                        );
                        if (matched && matched.telefono) {
                          setRepartidorTelefono(matched.telefono);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
                    />
                    <datalist id="choferes-registrados-modal-list">
                      {deliveryUsers.map((u) => (
                        <option key={u.id} value={u.nombre_completo}>
                          {u.telefono ? `Tel: ${u.telefono}` : `@${u.username}`}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Teléfono del Chofer
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej: 809-555-0101"
                      value={repartidorTelefono}
                      onChange={(e) => setRepartidorTelefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-chocolate-800 cursor-pointer bg-amber-50/70 p-2 rounded-xl border border-amber-200/70">
                      <input
                        type="checkbox"
                        checked={cobroDeliveryAlRecibir}
                        onChange={(e) => setCobroDeliveryAlRecibir(e.target.checked)}
                        className="w-4 h-4 rounded text-frambuesa-600 focus:ring-frambuesa-400"
                      />
                      <span>El chofer debe cobrar la tarifa de delivery en efectivo al cliente en el destino</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[#F0FDF4] p-3 rounded-2xl border border-green-200 text-xs text-green-950 flex items-center justify-between">
              <span className="font-medium">
                ⚡ Al confirmar, el sistema descontará automáticamente las cantidades exactas de harina, mantequilla, chocolates y demás ingredientes del almacén.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConvertDialog(false)}
                className="px-4 py-2 rounded-xl border border-trigo-300 text-xs font-semibold text-chocolate-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-warm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Pedido & Facturar</span>
              </button>
            </div>
          </div>
        )}

        {/* Información del Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-canvas p-4 rounded-2xl border border-trigo-200 text-xs">
          <div>
            <span className="text-gray-500 font-medium block">Cliente:</span>
            <span className="font-bold text-chocolate-900 text-sm flex items-center gap-1.5 mt-0.5">
              <User className="w-4 h-4 text-trigo-600" />
              {cotizacion.cliente_nombre}
            </span>
          </div>

          <div>
            <span className="text-gray-500 font-medium block">Contacto:</span>
            <span className="font-semibold text-chocolate-800 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              {cotizacion.cliente_telefono}
            </span>
          </div>

          {cotizacion.fecha_evento && (
            <div>
              <span className="text-gray-500 font-medium block">Fecha del Evento:</span>
              <span className="font-semibold text-chocolate-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-frambuesa-500" />
                {formatDate(cotizacion.fecha_evento)}
              </span>
            </div>
          )}
        </div>

        {/* Tabla de Items */}
        <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-chocolate-700 text-white font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Descripción del Producto</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Precio Unitario</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trigo-100 bg-white">
              {cotizacion.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-crema/20">
                  <td className="py-3 px-4">
                    <p className="font-bold text-chocolate-900 text-sm">{item.receta_nombre}</p>
                    <p className="text-xs text-chocolate-600 font-medium mt-0.5">
                      {item.tamano_porciones}
                      {item.masa_base && !item.masa_base.toLowerCase().startsWith('ningun') && ` • Masa: ${item.masa_base}`}
                      {item.relleno && !item.relleno.toLowerCase().startsWith('ningun') && ` • Relleno: ${item.relleno}`}
                    </p>
                    {item.decoracion && !item.decoracion.toLowerCase().startsWith('ningun') && (
                      <p className="text-xs text-gray-500">Decoración: {item.decoracion}</p>
                    )}
                    {item.variables_receta && item.variables_receta.length > 0 && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        🎨 Variables de receta: {item.variables_receta.join(', ')}
                      </p>
                    )}
                    {item.dedicatoria && (
                      <p className="text-xs text-frambuesa-700 font-semibold italic mt-0.5">
                        Dedicatoria: "{item.dedicatoria}"
                      </p>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-[11px] text-trigo-700 font-semibold mt-1">
                        + Extras: {item.extras.map((e) => `${e.nombre} (${formatCurrency(e.precio)})`).join(', ')}
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

        {/* Resumen de Pago 50/50 y Totales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-crema/70 p-4 rounded-2xl border border-trigo-200 text-xs space-y-1.5">
            <span className="font-bold text-chocolate-800 uppercase block mb-1">
              Esquema de Pago 50/50:
            </span>
            <p className="text-chocolate-700">
              • <b>50% de anticipo al confirmar:</b> {formatCurrency(cotizacion.total * 0.5)}
            </p>
            <p className="text-chocolate-700">
              • <b>50% saldo contra entrega:</b> {formatCurrency(cotizacion.total * 0.5)}
            </p>
            {cotizacion.notas && (
              <p className="text-gray-500 italic pt-2 border-t border-trigo-200">
                Nota: {cotizacion.notas}
              </p>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-trigo-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Subtotal:</span>
              <span className="font-bold text-chocolate-800">
                {formatCurrency(cotizacion.subtotal)}
              </span>
            </div>
            {cotizacion.descuento > 0 && (
              <div className="flex justify-between text-frambuesa-600">
                <span>Descuento:</span>
                <span>-{formatCurrency(cotizacion.descuento)}</span>
              </div>
            )}
            {cotizacion.costo_envio > 0 && (
              <div className="flex justify-between text-chocolate-700">
                <span>Domicilio / Envío:</span>
                <span>{formatCurrency(cotizacion.costo_envio)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-chocolate-700 font-extrabold text-sm text-chocolate-900">
              <span>TOTAL:</span>
              <span className="text-xl text-frambuesa-600">
                {formatCurrency(cotizacion.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-trigo-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-700 hover:bg-gray-50 text-xs font-bold transition-colors"
          >
            Cerrar
          </button>

          {onEdit && cotizacion.estado !== 'convertida' && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(cotizacion);
              }}
              className="px-4 py-2.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white text-xs font-bold transition-colors"
            >
              Editar Cotización
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
