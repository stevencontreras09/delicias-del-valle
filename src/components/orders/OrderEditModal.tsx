import React, { useState, useEffect, useMemo } from 'react';
import { Pedido, PedidoItem, TipoDespacho } from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatDisplayTamano } from '../../utils/formatters';
import { calcularCostosReceta } from '../../utils/calculations';
import { LocationGoogleMapsModal } from '../quotes/LocationGoogleMapsModal';
import {
  User,
  Calendar,
  Truck,
  Store,
  MapPin,
  Plus,
  Trash2,
  AlertTriangle,
  Lock,
  Save,
  Navigation,
  Package,
  MessageSquare,
} from 'lucide-react';

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  isOpen,
  onClose,
  pedido,
}) => {
  const { recetas, insumosMap, zonasDelivery, pedidos } = useApp();

  // Estados del formulario
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [tipoDespacho, setTipoDespacho] = useState<TipoDespacho>('retiro');
  const [zonaDeliveryId, setZonaDeliveryId] = useState<number | null>(null);
  const [costoDelivery, setCostoDelivery] = useState<number>(0);
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [puntoReferencia, setPuntoReferencia] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [repartidorNombre, setRepartidorNombre] = useState('');
  const [repartidorTelefono, setRepartidorTelefono] = useState('');
  const [cobroDeliveryAlRecibir, setCobroDeliveryAlRecibir] = useState(false);
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [notasCocina, setNotasCocina] = useState('');

  // UI States
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRecetaId, setSelectedRecetaId] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializar al abrir
  useEffect(() => {
    if (pedido) {
      setClienteNombre(pedido.cliente_nombre || '');
      setClienteTelefono(pedido.cliente_telefono || '');
      setClienteEmail(pedido.cliente_email || '');
      setFechaEntrega(pedido.fecha_entrega || '');
      setHoraEntrega(pedido.hora_entrega || '');
      const despacho: TipoDespacho =
        pedido.tipo_despacho ||
        (pedido.tipo_entrega === 'domicilio' ? 'delivery' : 'retiro');
      setTipoDespacho(despacho);
      setZonaDeliveryId(pedido.zona_delivery_id ?? null);
      setCostoDelivery(pedido.costo_delivery ?? pedido.costo_envio ?? 0);
      setDireccionEntrega(pedido.direccion_entrega || '');
      setPuntoReferencia(pedido.punto_referencia || '');
      setMapsUrl(pedido.maps_url || '');
      setRepartidorNombre(pedido.repartidor_nombre || '');
      setRepartidorTelefono(pedido.repartidor_telefono || '');
      setCobroDeliveryAlRecibir(pedido.cobro_delivery_al_recibir ?? false);
      setItems(pedido.items ? JSON.parse(JSON.stringify(pedido.items)) : []);
      setNotasCocina(pedido.notas_cocina || '');
      setErrorMsg(null);
    }
  }, [pedido, isOpen]);

  // Cálculos financieros
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  }, [items]);

  const fleteAplicado = tipoDespacho === 'delivery' ? Number(costoDelivery) || 0 : 0;
  const nuevoTotal = subtotal + fleteAplicado;
  const anticipoPagado = pedido?.anticipo_pagado || 0;
  const nuevoSaldoPendiente = Math.max(0, nuevoTotal - anticipoPagado);

  if (!pedido) return null;

  const isConfirmed = pedido.estado === 'confirmado';

  // Manejadores de Items
  const handleQuantityChange = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newQty = Math.max(1, item.cantidad + delta);
        return {
          ...item,
          cantidad: newQty,
          subtotal: newQty * item.precio_unitario,
        };
      })
    );
  };

  const handlePriceChange = (itemId: string, newPrice: number) => {
    const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          precio_unitario: validPrice,
          subtotal: item.cantidad * validPrice,
        };
      })
    );
  };

  const handleDedicatoriaChange = (itemId: string, text: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, dedicatoria: text } : item))
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (items.length <= 1) {
      setErrorMsg('El pedido debe tener al menos un producto.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddReceta = () => {
    if (!selectedRecetaId) return;
    const receta = recetas.find((r) => r.id === Number(selectedRecetaId));
    if (!receta) return;

    const costBreakdown = calcularCostosReceta(receta, insumosMap, 1, false);
    const precioBase = costBreakdown.precio_sugerido_venta || costBreakdown.precio_sugerido_markup || 0;

    const newItem: PedidoItem = {
      id: `item-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receta_id: receta.id,
      receta_nombre: receta.nombre,
      tamano_porciones: receta.rendimiento_unidad || '1 LB (16-20 porciones)',
      masa_base: 'Vainilla Dominicana Tradicional',
      relleno: 'Dulce de Leche Artesanal',
      decoracion: 'Suspiro Dominicano Tradicional',
      dedicatoria: '',
      cantidad: 1,
      precio_unitario: precioBase,
      subtotal: precioBase,
      factor_receta: 1,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedRecetaId('');
    setErrorMsg(null);
  };

  const handleZonaChange = (zonaIdStr: string) => {
    if (!zonaIdStr) {
      setZonaDeliveryId(null);
      return;
    }
    const zId = Number(zonaIdStr);
    setZonaDeliveryId(zId);
    const zona = zonasDelivery.find((z) => z.id === zId);
    if (zona) {
      setCostoDelivery(zona.tarifa);
    }
  };

  const handleSave = () => {
    setErrorMsg(null);

    if (!isConfirmed) {
      setErrorMsg('No se puede editar: el pedido ya pasó la fase de confirmación.');
      return;
    }

    if (!clienteNombre.trim()) {
      setErrorMsg('El nombre del cliente es obligatorio.');
      return;
    }

    if (!clienteTelefono.trim()) {
      setErrorMsg('El teléfono del cliente es obligatorio.');
      return;
    }

    if (!fechaEntrega) {
      setErrorMsg('La fecha de entrega es obligatoria.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Debe haber al menos un producto en el pedido.');
      return;
    }

    if (tipoDespacho === 'delivery' && !direccionEntrega.trim()) {
      setErrorMsg('Para entrega a domicilio se requiere ingresar la dirección.');
      return;
    }

    const updatedData: Partial<Pedido> = {
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      cliente_email: clienteEmail.trim() || undefined,
      fecha_entrega: fechaEntrega,
      hora_entrega: horaEntrega,
      tipo_entrega: tipoDespacho === 'delivery' ? 'domicilio' : 'recogida_local',
      tipo_despacho: tipoDespacho,
      zona_delivery_id: tipoDespacho === 'delivery' ? zonaDeliveryId : null,
      costo_delivery: fleteAplicado,
      costo_envio: fleteAplicado,
      direccion_entrega: tipoDespacho === 'delivery' ? direccionEntrega.trim() : '',
      punto_referencia: tipoDespacho === 'delivery' ? puntoReferencia.trim() : '',
      maps_url: tipoDespacho === 'delivery' ? mapsUrl.trim() : '',
      repartidor_nombre: tipoDespacho === 'delivery' ? repartidorNombre.trim() : '',
      repartidor_telefono: tipoDespacho === 'delivery' ? repartidorTelefono.trim() : '',
      cobro_delivery_al_recibir: tipoDespacho === 'delivery' ? cobroDeliveryAlRecibir : false,
      items,
      subtotal,
      total: nuevoTotal,
      saldo_pendiente: nuevoSaldoPendiente,
      notas_cocina: notasCocina.trim() || undefined,
    };

    pedidos.updatePedido(pedido.id, updatedData);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Editar Pedido ${pedido.numero_factura}`}
        subtitle="Modificación permitida exclusivamente en pedidos confirmados antes de ingresar a producción"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Bloqueo si no está en confirmado */}
          {!isConfirmed ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-rose-900">
                  Edición Bloqueada: Pedido en estado "{pedido.estado.toUpperCase()}"
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Por integridad del flujo de cocina y mermas operativas, los pedidos que ya han
                  ingresado a <b>Producción</b>, están <b>Listos</b> o fueron <b>Entregados</b> no
                  pueden ser modificados. Solo los pedidos en estado <b>Confirmado</b> pueden editarse
                  antes de iniciar la preparación.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Entendido, Cerrar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Alerta de Error si la hay */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sección 1: Datos del Cliente */}
              <div className="bg-canvas/50 p-4 sm:p-5 rounded-2xl border border-trigo-200 space-y-4">
                <h4 className="text-xs font-extrabold text-chocolate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-chocolate-600" />
                  1. Información del Cliente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      placeholder="Ej. Carmen Rodríguez"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      placeholder="Ej. +1 849 522-9264"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Programación de Entrega */}
              <div className="bg-canvas/50 p-4 sm:p-5 rounded-2xl border border-trigo-200 space-y-4">
                <h4 className="text-xs font-extrabold text-chocolate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-chocolate-600" />
                  2. Fecha & Hora de Entrega
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                      Fecha de Entrega *
                    </label>
                    <input
                      type="date"
                      value={fechaEntrega}
                      onChange={(e) => setFechaEntrega(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                      Hora de Entrega / Retiro
                    </label>
                    <input
                      type="text"
                      value={horaEntrega}
                      onChange={(e) => setHoraEntrega(e.target.value)}
                      placeholder="Ej. 03:30 PM"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Logística & Modalidad de Despacho */}
              <div className="bg-canvas/50 p-4 sm:p-5 rounded-2xl border border-trigo-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-chocolate-900 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-chocolate-600" />
                    3. Logística & Despacho
                  </h4>

                  {/* Selector Retiro vs Delivery */}
                  <div className="flex items-center bg-white border border-trigo-300 rounded-xl p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setTipoDespacho('retiro')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        tipoDespacho === 'retiro'
                          ? 'bg-chocolate-700 text-white shadow-xs'
                          : 'text-chocolate-700 hover:bg-stone-100'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      Retiro en Taller
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDespacho('delivery')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        tipoDespacho === 'delivery'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-chocolate-700 hover:bg-stone-100'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Envío a Domicilio
                    </button>
                  </div>
                </div>

                {tipoDespacho === 'delivery' && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3.5 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Zona de Delivery
                        </label>
                        <select
                          value={zonaDeliveryId ?? ''}
                          onChange={(e) => handleZonaChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          <option value="">Seleccionar zona de cobertura...</option>
                          {zonasDelivery.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.nombre} ({formatCurrency(z.tarifa)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Costo de Envío / Flete (DOP)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={costoDelivery}
                          onChange={(e) => setCostoDelivery(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-amber-950">
                          Dirección de Entrega *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowMapModal(true)}
                          className="text-[11px] text-frambuesa-600 hover:text-frambuesa-700 font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs hover:bg-amber-50 transition"
                        >
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Ver / Corregir en Mapa Satélite</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={direccionEntrega}
                        onChange={(e) => setDireccionEntrega(e.target.value)}
                        placeholder="Calle, número de casa, sector, municipio..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Punto de Referencia
                        </label>
                        <input
                          type="text"
                          value={puntoReferencia}
                          onChange={(e) => setPuntoReferencia(e.target.value)}
                          placeholder="Frente a la farmacia, portón blanco..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Enlace de Ubicación (Google Maps)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={mapsUrl}
                            onChange={(e) => setMapsUrl(e.target.value)}
                            placeholder="https://maps.google.com/?q=..."
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                          <Navigation className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-200">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Repartidor Asignado (Opcional)
                        </label>
                        <input
                          type="text"
                          value={repartidorNombre}
                          onChange={(e) => setRepartidorNombre(e.target.value)}
                          placeholder="Nombre del chofer / mensajero"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                          Teléfono del Repartidor
                        </label>
                        <input
                          type="text"
                          value={repartidorTelefono}
                          onChange={(e) => setRepartidorTelefono(e.target.value)}
                          placeholder="Ej. +1 829 555-0123"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={cobroDeliveryAlRecibir}
                          onChange={(e) => setCobroDeliveryAlRecibir(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <span className="text-xs text-amber-950 font-semibold">
                          Cobro del delivery al recibir (cliente paga el envío al repartidor)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 4: Items / Productos de la Orden */}
              <div className="bg-canvas/50 p-4 sm:p-5 rounded-2xl border border-trigo-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-chocolate-900 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-chocolate-600" />
                    4. Productos & Pasteles ({items.length})
                  </h4>
                  <span className="text-[11px] text-chocolate-500 font-medium">
                    El inventario de materias primas se recalculará automáticamente al guardar
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white p-3.5 rounded-xl border border-trigo-200 space-y-2.5 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-trigo-100 pb-2">
                        <div>
                          <span className="text-xs font-black text-chocolate-900 block">
                            {item.receta_nombre}
                          </span>
                          <span className="text-[11px] text-chocolate-600">
                            Tamaño / Formato: <b>{formatDisplayTamano(item.tamano_porciones)}</b>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-chocolate-900">
                            Subtotal: {formatCurrency(item.subtotal)}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Eliminar este producto"
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        {/* Control de Cantidad */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Cantidad
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-sm flex items-center justify-center transition"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-extrabold text-chocolate-900 text-xs">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-sm flex items-center justify-center transition"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Precio Unitario */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Precio Unitario (DOP)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.precio_unitario}
                            onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-canvas/30 font-semibold text-chocolate-900"
                          />
                        </div>

                        {/* Dedicatoria */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                            Dedicatoria en Pastel
                          </label>
                          <input
                            type="text"
                            value={item.dedicatoria || ''}
                            onChange={(e) => handleDedicatoriaChange(item.id, e.target.value)}
                            placeholder="Ej. Feliz Cumpleaños Sofía"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-canvas/30"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agregar Nuevo Producto */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <select
                    value={selectedRecetaId}
                    onChange={(e) => setSelectedRecetaId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl border border-trigo-300 bg-white text-chocolate-900 focus:ring-2 focus:ring-frambuesa-400"
                  >
                    <option value="">Seleccionar receta para agregar a la orden...</option>
                    {recetas
                      .filter((r) => r.activa)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} ({r.categoria})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddReceta}
                    disabled={!selectedRecetaId}
                    className="px-4 py-2 bg-frambuesa-500 hover:bg-frambuesa-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Producto</span>
                  </button>
                </div>
              </div>

              {/* Sección 5: Notas de Cocina */}
              <div className="bg-canvas/50 p-4 sm:p-5 rounded-2xl border border-trigo-200 space-y-2">
                <h4 className="text-xs font-extrabold text-chocolate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-chocolate-600" />
                  5. Notas para Cocina & Decoración
                </h4>
                <textarea
                  rows={2}
                  value={notasCocina}
                  onChange={(e) => setNotasCocina(e.target.value)}
                  placeholder="Instrucciones especiales para el pastelero o decorador (alergias, colores, empaque especial...)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 bg-white"
                />
              </div>

              {/* Resumen Financiero Recalculado */}
              <div className="bg-crema p-4 sm:p-5 rounded-2xl border border-trigo-300 space-y-2 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-chocolate-600 block">Subtotal Productos:</span>
                    <b className="text-chocolate-900 text-sm">{formatCurrency(subtotal)}</b>
                  </div>
                  {tipoDespacho === 'delivery' && (
                    <div>
                      <span className="text-chocolate-600 block">Flete / Envío:</span>
                      <b className="text-amber-900 text-sm">{formatCurrency(fleteAplicado)}</b>
                    </div>
                  )}
                  <div>
                    <span className="text-chocolate-600 block">Nuevo Total Orden:</span>
                    <b className="text-chocolate-950 text-base font-black">{formatCurrency(nuevoTotal)}</b>
                  </div>
                  <div>
                    <span className="text-chocolate-600 block">Anticipo Pagado:</span>
                    <b className="text-emerald-700 text-sm font-bold">{formatCurrency(anticipoPagado)}</b>
                  </div>
                  <div>
                    <span className="text-chocolate-600 block">Nuevo Saldo Pendiente:</span>
                    <b className={`text-base font-black ${nuevoSaldoPendiente > 0 ? 'text-frambuesa-600' : 'text-emerald-600'}`}>
                      {formatCurrency(nuevoSaldoPendiente)}
                    </b>
                  </div>
                </div>

                {nuevoTotal < anticipoPagado && (
                  <p className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                    Nota: El nuevo total ({formatCurrency(nuevoTotal)}) es menor al anticipo previamente abonado ({formatCurrency(anticipoPagado)}). Habrá un saldo a favor de {formatCurrency(anticipoPagado - nuevoTotal)} para el cliente.
                  </p>
                )}
              </div>

              {/* Footer de Acciones */}
              <div className="pt-2 border-t border-trigo-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-trigo-300 hover:bg-stone-100 text-chocolate-700 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-extrabold transition shadow-frambuesa-glow flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios del Pedido</span>
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Ubicaciones en Google Maps / Satélite */}
      {showMapModal && (
        <LocationGoogleMapsModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          direccion={direccionEntrega}
          puntoReferencia={puntoReferencia}
          mapsUrl={mapsUrl}
          zonaNombre={zonasDelivery.find((z) => z.id === zonaDeliveryId)?.nombre}
          clienteNombre={clienteNombre}
          onSave={(data) => {
            setDireccionEntrega(data.direccion);
            setPuntoReferencia(data.punto_referencia);
            if (data.mapsUrl) setMapsUrl(data.mapsUrl);
            setShowMapModal(false);
          }}
        />
      )}
    </>
  );
};
