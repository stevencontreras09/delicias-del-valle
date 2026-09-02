import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Pedido, EstadoPedido } from '../../types';
import {
  Search,
  Plus,
  FileText,
  LayoutGrid,
  List,
  MessageCircle,
  Printer,
  XCircle,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { OrderDetailModal } from './OrderDetailModal';
import { PaymentRecordModal } from './PaymentRecordModal';
import { PrintTicketModal } from './PrintTicketModal';
import { OrderCancellationDialog } from './OrderCancellationDialog';
import { OrderDeleteDialog } from './OrderDeleteDialog';
import { generarPdfPedido } from '../../utils/pdfGenerator';
import { generateOrderWhatsAppUrl } from '../../utils/whatsappHelper';

const COLUMNAS_KANBAN: { id: EstadoPedido; label: string; badgeVariant: 'warning' | 'info' | 'success' | 'frambuesa' }[] = [
  { id: 'confirmado', label: '1. Confirmados', badgeVariant: 'warning' },
  { id: 'en_produccion', label: '2. En Producción', badgeVariant: 'info' },
  { id: 'listo', label: '3. Listos en Mostrador', badgeVariant: 'success' },
  { id: 'entregado', label: '4. Entregados', badgeVariant: 'frambuesa' },
];

export const OrderManager: React.FC = () => {
  const { pedidos, recetas, insumosMap, setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter] = useState<'all' | EstadoPedido>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modales
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [paymentPedido, setPaymentPedido] = useState<Pedido | null>(null);
  const [printTicketPedido, setPrintTicketPedido] = useState<Pedido | null>(null);
  const [cancelPedido, setCancelPedido] = useState<Pedido | null>(null);
  const [deletePedido, setDeletePedido] = useState<Pedido | null>(null);

  const filteredPedidos = useMemo(() => {
    return pedidos.list.filter((p) => {
      const matchesSearch =
        p.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cliente_telefono.includes(searchTerm) ||
        p.items.some((i) => i.receta_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || p.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pedidos.list, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Facturación & Control de Pedidos
            </h1>
            <span className="bg-crema text-chocolate-800 text-xs font-bold px-3 py-1 rounded-full border border-trigo-300">
              {pedidos.list.length} Pedidos
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Gestión de estados de producción, deducción inmediata de stock, anticipo 50/50 y recibos WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-trigo-300 rounded-2xl p-1 flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab('quotes')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold shadow-frambuesa-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear desde Cotizador</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-trigo-200 shadow-warm">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pedido por número de factura (FAC-...), cliente o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-trigo-200 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs text-panadero bg-canvas/40"
          />
        </div>
      </div>

      {/* VISTA KANBAN PIPELINE */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {COLUMNAS_KANBAN.map((col) => {
            const columnOrders = filteredPedidos.filter((p) => p.estado === col.id);

            return (
              <div
                key={col.id}
                className="bg-canvas/80 rounded-3xl border border-trigo-200 p-4 flex flex-col min-h-[500px]"
              >
                {/* Cabecera de Columna */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-trigo-200">
                  <div className="flex items-center gap-2">
                    <Badge variant={col.badgeVariant} size="sm">
                      {col.label}
                    </Badge>
                  </div>
                  <span className="text-xs font-extrabold text-chocolate-700 bg-white px-2 py-0.5 rounded-full border border-trigo-300">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Tarjetas de Pedidos en la Columna */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnOrders.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-400 italic">
                      Sin pedidos en este estado.
                    </div>
                  ) : (
                    columnOrders.map((pedido) => {
                      return (
                        <div
                          key={pedido.id}
                          className="bg-white rounded-2xl border border-trigo-200 p-4 shadow-sm hover:shadow-warm transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-chocolate-800 bg-crema px-2 py-0.5 rounded-md border border-trigo-200">
                              {pedido.numero_factura}
                            </span>
                            <span className="text-xs font-extrabold text-chocolate-900">
                              {formatCurrency(pedido.total)}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-chocolate-900 text-xs">
                              {pedido.cliente_nombre}
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              📅 {formatDate(pedido.fecha_entrega)} • ⏰ {pedido.hora_entrega}
                            </p>
                          </div>

                          <div className="space-y-1 bg-canvas/60 p-2 rounded-xl text-[11px] text-chocolate-700">
                            {pedido.items.map((item, i) => (
                              <p key={i} className="truncate font-medium">
                                • {item.receta_nombre} (x{item.cantidad})
                              </p>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-trigo-100">
                            {pedido.saldo_pendiente > 0 ? (
                              <span className="text-frambuesa-600 font-bold text-[11px]">
                                Saldo: {formatCurrency(pedido.saldo_pendiente)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold text-[11px]">
                                Pagado 100%
                              </span>
                            )}

                            <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                              Stock Descontado ✓
                            </span>
                          </div>

                          {/* Botones */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              onClick={() => setSelectedPedido(pedido)}
                              className="py-1.5 px-2 rounded-lg bg-chocolate-700 hover:bg-chocolate-800 text-white text-[11px] font-bold text-center transition-colors"
                            >
                              Ver / Gestionar
                            </button>

                            {pedido.saldo_pendiente > 0 ? (
                              <button
                                onClick={() => setPaymentPedido(pedido)}
                                className="py-1.5 px-2 rounded-lg bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-[11px] font-bold text-center transition-colors"
                              >
                                Cobrar Saldo
                              </button>
                            ) : (
                              <button
                                onClick={() => generarPdfPedido(pedido)}
                                className="py-1.5 px-2 rounded-lg bg-white border border-trigo-300 hover:bg-crema text-chocolate-700 text-[11px] font-bold text-center transition-colors"
                              >
                                Factura PDF
                              </button>
                            )}
                          </div>

                          {/* Acciones Rápidas: WhatsApp y Ticket Térmico */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-trigo-100">
                            <a
                              href={generateOrderWhatsAppUrl(pedido)}
                              target="_blank"
                              rel="noreferrer"
                              title="Enviar por WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center flex-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold ml-1">WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setPrintTicketPedido(pedido)}
                              title="Imprimir comanda / ticket térmico"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center flex-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold ml-1">Ticket POS</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletePedido(pedido)}
                              title="Eliminar pedido y devolver a inventario (Requiere Admin/Coadmin)"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA TABLA LISTADO */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-trigo-200 shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-panadero">
              <thead className="bg-crema text-chocolate-800 font-bold uppercase tracking-wider border-b border-trigo-200">
                <tr>
                  <th className="py-3.5 px-4">Factura / Fecha</th>
                  <th className="py-3.5 px-4">Cliente & Contacto</th>
                  <th className="py-3.5 px-4">Entrega</th>
                  <th className="py-3.5 px-4">Productos</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Anticipo</th>
                  <th className="py-3.5 px-4 text-right">Saldo</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {filteredPedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-crema/20">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-chocolate-900 block">{p.numero_factura}</span>
                      <span className="text-gray-400 text-[11px]">{formatDate(p.fecha_pedido)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-chocolate-900 block">{p.cliente_nombre}</span>
                      <span className="text-gray-500 text-[11px]">{p.cliente_telefono}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-chocolate-800 block">
                        {formatDate(p.fecha_entrega)}
                      </span>
                      <span className="text-gray-500 text-[11px]">{p.hora_entrega}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-chocolate-700">
                      {p.items.map((i) => `${i.receta_nombre} (x${i.cantidad})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-chocolate-900 whitespace-nowrap">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold whitespace-nowrap">
                      {formatCurrency(p.anticipo_pagado)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {p.saldo_pendiente > 0 ? (
                        <span className="font-extrabold text-frambuesa-600">
                          {formatCurrency(p.saldo_pendiente)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">¡Pagado!</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          p.estado === 'entregado'
                            ? 'frambuesa'
                            : p.estado === 'listo'
                            ? 'success'
                            : p.estado === 'en_produccion'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {p.estado.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedPedido(p)}
                          className="px-2.5 py-1 rounded-lg bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold text-xs"
                        >
                          Ver
                        </button>
                        <a
                          href={generateOrderWhatsAppUrl(p)}
                          target="_blank"
                          rel="noreferrer"
                          title="Enviar por WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setPrintTicketPedido(p)}
                          title="Ticket Térmico POS"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => generarPdfPedido(p)}
                          title="PDF Factura"
                          className="p-1.5 rounded-lg border border-trigo-300 hover:bg-crema text-chocolate-700"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePedido(p)}
                          title="Eliminar pedido y devolver a inventario (Requiere Admin/Coadmin)"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      {selectedPedido && (
        <OrderDetailModal
          isOpen={!!selectedPedido}
          onClose={() => setSelectedPedido(null)}
          pedido={selectedPedido}
          onChangeStatus={pedidos.cambiarEstadoPedido}
          onRequestPrintTicket={setPrintTicketPedido}
          onRequestCancel={setCancelPedido}
          onRequestDelete={setDeletePedido}
          onSavePayment={pedidos.registrarPago}
        />
      )}

      {paymentPedido && (
        <PaymentRecordModal
          isOpen={!!paymentPedido}
          onClose={() => setPaymentPedido(null)}
          pedido={paymentPedido}
          onSavePayment={pedidos.registrarPago}
        />
      )}

      {printTicketPedido && (
        <PrintTicketModal
          isOpen={!!printTicketPedido}
          onClose={() => setPrintTicketPedido(null)}
          pedido={printTicketPedido}
        />
      )}

      {cancelPedido && (
        <OrderCancellationDialog
          isOpen={!!cancelPedido}
          onClose={() => setCancelPedido(null)}
          pedido={cancelPedido}
          recetas={recetas}
          insumosMap={insumosMap}
          onConfirmCancellation={pedidos.cancelarPedidoConResolucion}
        />
      )}

      {deletePedido && (
        <OrderDeleteDialog
          isOpen={!!deletePedido}
          onClose={() => setDeletePedido(null)}
          pedido={deletePedido}
          recetas={recetas}
          insumosMap={insumosMap}
          onConfirmDelete={pedidos.eliminarPedido}
        />
      )}
    </div>
  );
};
