import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Cotizacion, EstadoCotizacion } from '../../types';
import {
  Plus,
  Search,
  FileText,
  MessageCircle,
  Calendar,
  Phone,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { QuoteBuilderModal } from './QuoteBuilderModal';
import { QuoteDetailModal } from './QuoteDetailModal';
import { generarPdfCotizacion } from '../../utils/pdfGenerator';
import { generarMensajeCotizacionWhatsApp } from '../../utils/whatsappShare';

export const QuoteManager: React.FC = () => {
  const {
    cotizaciones,
    addCotizacion,
    updateCotizacion,
    deleteCotizacion,
    convertirCotizacionAPedido,
    recetas,
    insumosMap,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoCotizacion>('all');

  // Modales
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [editingCotizacion, setEditingCotizacion] = useState<Cotizacion | null>(null);

  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter((c) => {
      const matchesSearch =
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente_telefono.includes(searchTerm) ||
        c.items.some((i) => i.receta_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || c.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cotizaciones, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Generador de Cotizaciones
            </h1>
            <span className="bg-crema text-chocolate-800 text-xs font-bold px-3 py-1 rounded-full border border-trigo-300">
              {cotizaciones.length} Cotizaciones
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Personalización de pasteles, desglose automático, exportación a PDF, WhatsApp con emojis y conversión a pedido en 1 clic.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCotizacion(null);
            setIsBuilderOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold shadow-frambuesa-glow transition-all transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cotización</span>
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-trigo-200 shadow-warm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, código (COT-...) o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-trigo-200 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs text-panadero bg-canvas/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'bg-crema/60 text-chocolate-600 hover:bg-crema'
              }`}
            >
              Todas ({cotizaciones.length})
            </button>
            <button
              onClick={() => setStatusFilter('pendiente')}
              className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                statusFilter === 'pendiente'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Pendientes ({cotizaciones.filter((c) => c.estado === 'pendiente').length})
            </button>
            <button
              onClick={() => setStatusFilter('aprobada')}
              className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                statusFilter === 'aprobada'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Aprobadas ({cotizaciones.filter((c) => c.estado === 'aprobada').length})
            </button>
            <button
              onClick={() => setStatusFilter('convertida')}
              className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                statusFilter === 'convertida'
                  ? 'bg-frambuesa-600 text-white shadow-sm'
                  : 'bg-frambuesa-50 text-frambuesa-700 hover:bg-frambuesa-100 border border-frambuesa-200'
              }`}
            >
              Convertidas a Pedido ({cotizaciones.filter((c) => c.estado === 'convertida').length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cotizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCotizaciones.map((cot) => {
          const { url: waUrl } = generarMensajeCotizacionWhatsApp(cot);

          return (
            <div
              key={cot.id}
              className="bg-white rounded-3xl border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Encabezado */}
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-xs text-chocolate-800 bg-crema px-2.5 py-1 rounded-lg border border-trigo-300">
                    {cot.codigo}
                  </span>
                  <Badge
                    variant={
                      cot.estado === 'convertida'
                        ? 'frambuesa'
                        : cot.estado === 'aprobada'
                        ? 'success'
                        : cot.estado === 'enviada'
                        ? 'info'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {cot.estado.toUpperCase()}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-chocolate-900 group-hover:text-frambuesa-600 transition-colors mt-2">
                  {cot.cliente_nombre}
                </h3>

                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {cot.cliente_telefono}
                  </span>
                  {cot.fecha_evento && (
                    <span className="flex items-center gap-1 text-frambuesa-700 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      Evento: {formatDate(cot.fecha_evento)}
                    </span>
                  )}
                </div>

                {/* Items Preview */}
                <div className="mt-3 pt-3 border-t border-trigo-100 space-y-1 text-xs">
                  {cot.items.map((item, idx) => (
                    <div key={idx} className="text-chocolate-800 font-medium flex justify-between">
                      <span className="truncate pr-2">
                        • {item.receta_nombre} ({item.tamano_porciones})
                      </span>
                      <span className="font-bold flex-shrink-0">
                        x{item.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie de Tarjeta */}
              <div className="bg-crema/40 p-4 border-t border-trigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-chocolate-600 font-semibold">Total Cotizado:</span>
                  <span className="text-lg font-black text-frambuesa-600">
                    {formatCurrency(cot.total)}
                  </span>
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setSelectedCotizacion(cot)}
                    className="py-2 px-2 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>Ver</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => generarPdfCotizacion(cot)}
                    title="Exportar a PDF"
                    className="py-2 px-2 rounded-xl bg-white border border-trigo-300 hover:bg-crema text-chocolate-700 font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-chocolate-600" />
                    <span>PDF</span>
                  </button>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Enviar mensaje por WhatsApp"
                    className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Acciones Secundarias */}
                <div className="flex items-center justify-between pt-1 border-t border-trigo-200/60 text-xs">
                  <span className="text-[11px] text-gray-400">
                    Validez: {cot.validez_dias} días
                  </span>

                  <div className="flex items-center gap-1">
                    {cot.estado !== 'convertida' && (
                      <button
                        onClick={() => {
                          setEditingCotizacion(cot);
                          setIsBuilderOpen(true);
                        }}
                        title="Editar cotización"
                        className="p-1.5 rounded-lg text-chocolate-500 hover:text-chocolate-800 hover:bg-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(`¿Deseas eliminar la cotización ${cot.codigo}?`)) {
                          deleteCotizacion(cot.id);
                        }
                      }}
                      title="Eliminar cotización"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      {isBuilderOpen && (
        <QuoteBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingCotizacion(null);
          }}
          recetas={recetas}
          insumosMap={insumosMap}
          initialCotizacion={editingCotizacion}
          onSave={(data) => {
            if (editingCotizacion) {
              updateCotizacion(editingCotizacion.id, data);
            } else {
              addCotizacion(data);
            }
          }}
        />
      )}

      {selectedCotizacion && (
        <QuoteDetailModal
          isOpen={!!selectedCotizacion}
          onClose={() => setSelectedCotizacion(null)}
          cotizacion={selectedCotizacion}
          onConvertToOrder={(cotId, anticipo, fecha, hora, tipo, dir) => {
            convertirCotizacionAPedido(cotId, anticipo, fecha, hora, tipo, dir);
          }}
          onEdit={(c) => {
            setEditingCotizacion(c);
            setIsBuilderOpen(true);
          }}
        />
      )}
    </div>
  );
};
