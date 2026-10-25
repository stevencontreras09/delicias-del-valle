import React, { useState, useMemo } from 'react';
import { CotizacionItem, PedidoItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  calcularRequerimientosMateriales,
  generarListaComprasWhatsApp,
  formatCantidadUnidadBase,
  formatSugerenciaCompra,
  RequerimientoInsumo,
} from '../../utils/inventoryCalculations';
import { formatCurrency } from '../../utils/formatters';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  MessageCircle,
  Search,
  Filter,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface QuoteMaterialsBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
  items: (CotizacionItem | PedidoItem)[];
  codigoReferencia?: string;
  clienteNombre?: string;
  tipoDocumento?: 'cotizacion' | 'pedido';
}

export const QuoteMaterialsBreakdown: React.FC<QuoteMaterialsBreakdownProps> = ({
  isOpen,
  onClose,
  items,
  codigoReferencia,
  clienteNombre,
  tipoDocumento = 'cotizacion',
}) => {
  const { insumos, recetas } = useApp();

  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'faltantes' | 'cubiertos'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [copiado, setCopiado] = useState(false);

  // Motor de cálculo memoizado
  const resumen = useMemo(() => {
    return calcularRequerimientosMateriales(items, insumos, recetas);
  }, [items, insumos, recetas]);

  // Lista de categorías únicas presentes
  const categorias = useMemo(() => {
    const setCat = new Set<string>();
    resumen.items.forEach((item) => {
      if (item.categoria) setCat.add(item.categoria);
    });
    return Array.from(setCat).sort();
  }, [resumen]);

  // Filtrado de la tabla
  const itemsFiltrados = useMemo(() => {
    return resumen.items.filter((item) => {
      // Filtro de estado
      if (filtroEstado === 'faltantes' && item.faltante <= 0) return false;
      if (filtroEstado === 'cubiertos' && item.faltante > 0) return false;

      // Filtro por categoría
      if (categoriaSeleccionada !== 'todas' && item.categoria !== categoriaSeleccionada) return false;

      // Filtro de búsqueda por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = item.nombre.toLowerCase().includes(query);
        const coincideCategoria = item.categoria.toLowerCase().includes(query);
        const coincideReceta = item.recetas_origen.some((r) => r.toLowerCase().includes(query));
        if (!coincideNombre && !coincideCategoria && !coincideReceta) return false;
      }

      return true;
    });
  }, [resumen, filtroEstado, categoriaSeleccionada, busqueda]);

  // Manejador de copia de lista para WhatsApp
  const handleCopiarWhatsApp = async () => {
    const texto = generarListaComprasWhatsApp(resumen, {
      titulo: tipoDocumento === 'pedido' ? 'Pedido' : 'Cotización',
      codigo: codigoReferencia,
      cliente: clienteNombre,
    });

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  // URL directa para abrir WhatsApp Web / App
  const waUrl = useMemo(() => {
    const texto = generarListaComprasWhatsApp(resumen, {
      titulo: tipoDocumento === 'pedido' ? 'Pedido' : 'Cotización',
      codigo: codigoReferencia,
      cliente: clienteNombre,
    });
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }, [resumen, codigoReferencia, clienteNombre, tipoDocumento]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Explosión de Materiales y Verificación de Stock"
      subtitle={`${tipoDocumento === 'pedido' ? 'Pedido' : 'Cotización'} ${codigoReferencia || ''} • ${clienteNombre || 'Cliente'}`}
      maxWidth="5xl"
    >
      <div className="space-y-5 text-xs">
        {/* Panel Superior de Métricas (KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-canvas p-3.5 rounded-2xl border border-trigo-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500">Total Insumos</span>
              <Boxes className="w-4 h-4 text-chocolate-600" />
            </div>
            <p className="text-xl font-black text-chocolate-900 mt-1">{resumen.totalInsumos}</p>
            <span className="text-[10px] text-gray-500">Ingredientes & empaques</span>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-800">En Almacén</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-700 mt-1">{resumen.itemsCubiertos}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Stock 100% suficiente</span>
          </div>

          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-800">Por Comprar</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-black text-rose-700 mt-1">{resumen.itemsFaltantes}</p>
            <span className="text-[10px] text-rose-700 font-medium">
              {resumen.itemsAgotados} agotados • {resumen.itemsAlerta} parciales
            </span>
          </div>

          <div className="bg-crema p-3.5 rounded-2xl border border-trigo-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-chocolate-800">Presupuesto Compras</span>
              <DollarSign className="w-4 h-4 text-frambuesa-600" />
            </div>
            <p className="text-xl font-black text-frambuesa-600 font-mono mt-1">
              {formatCurrency(resumen.presupuestoFaltanteTotalRD)}
            </p>
            <span className="text-[10px] text-chocolate-700 font-medium">Costo estimado faltante</span>
          </div>
        </div>

        {/* Barra de Cobertura de Almacén */}
        <div className="bg-white p-3 rounded-2xl border border-trigo-200 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-chocolate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-chocolate-600" />
              <span>Cobertura de Almacén para esta Orden:</span>
            </span>
            <span
              className={`font-black font-mono ${
                resumen.coberturaGlobalPct >= 100
                  ? 'text-emerald-600'
                  : resumen.coberturaGlobalPct >= 60
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {resumen.coberturaGlobalPct}% Cubierto
            </span>
          </div>

          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                resumen.coberturaGlobalPct >= 100
                  ? 'bg-emerald-500'
                  : resumen.coberturaGlobalPct >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, resumen.coberturaGlobalPct))}%` }}
            />
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas p-3 rounded-2xl border border-trigo-200">
          {/* Pills de Estado */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                filtroEstado === 'todos'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'bg-white text-chocolate-700 border border-trigo-300 hover:bg-gray-50'
              }`}
            >
              Todos ({resumen.totalInsumos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('faltantes')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                filtroEstado === 'faltantes'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Solo Faltantes ({resumen.itemsFaltantes})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('cubiertos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 ${
                filtroEstado === 'cubiertos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>En Stock ({resumen.itemsCubiertos})</span>
            </button>
          </div>

          {/* Filtros secundarios: Búsqueda y Categoría */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {categorias.length > 0 && (
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-trigo-300 bg-white font-medium text-xs text-chocolate-800"
              >
                <option value="todas">Todas las Categorías</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar insumo o receta..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-trigo-300 bg-white text-xs text-chocolate-900 focus:ring-2 focus:ring-frambuesa-400"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de Insumos y Cruce de Stock */}
        <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-chocolate-700 text-white font-bold uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Insumo / Categoría</th>
                  <th className="py-2.5 px-3 text-right">Requerido</th>
                  <th className="py-2.5 px-3 text-right">En Almacén</th>
                  <th className="py-2.5 px-3 text-center">Estado / Faltante</th>
                  <th className="py-2.5 px-3 text-right">Presupuesto Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {itemsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                      No se encontraron insumos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  itemsFiltrados.map((item) => {
                    const isFaltante = item.faltante > 0;
                    return (
                      <tr
                        key={item.insumo_id}
                        className={`transition-colors hover:bg-crema/20 ${
                          item.estado === 'agotado'
                            ? 'bg-rose-50/40'
                            : item.estado === 'alerta'
                            ? 'bg-amber-50/40'
                            : ''
                        }`}
                      >
                        {/* Nombre & Origen */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-chocolate-900">{item.nombre}</div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                              {item.categoria}
                            </span>
                            {item.recetas_origen.length > 0 && (
                              <span
                                className="text-[10px] text-chocolate-600 truncate max-w-[200px]"
                                title={item.recetas_origen.join(' • ')}
                              >
                                Usado en: {item.recetas_origen[0]}
                                {item.recetas_origen.length > 1 && ` (+${item.recetas_origen.length - 1})`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cantidad Requerida */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-chocolate-800">
                          {formatCantidadUnidadBase(item.cantidad_requerida, item.unidad_base)}
                        </td>

                        {/* Stock en Almacén */}
                        <td className="py-2.5 px-3 text-right font-mono text-chocolate-800">
                          <span
                            className={
                              item.stock_actual <= 0
                                ? 'text-rose-600 font-bold'
                                : item.stock_actual < item.cantidad_requerida
                                ? 'text-amber-600 font-bold'
                                : 'text-emerald-700 font-bold'
                            }
                          >
                            {formatCantidadUnidadBase(item.stock_actual, item.unidad_base)}
                          </span>
                        </td>

                        {/* Estado / Faltante */}
                        <td className="py-2.5 px-3 text-center">
                          {item.estado === 'disponible' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Cubierto (+{formatCantidadUnidadBase(item.diferencia, item.unidad_base)})</span>
                            </span>
                          ) : item.estado === 'agotado' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10.5px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Agotado (0 en stock)</span>
                              </span>
                              <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                                {formatSugerenciaCompra(item)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10.5px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Stock Parcial</span>
                              </span>
                              <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                                {formatSugerenciaCompra(item)}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Costo Estimado en RD$ */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {item.costo_faltante_rd > 0 ? (
                            <div>
                              <span className="font-extrabold text-frambuesa-600">
                                {formatCurrency(item.costo_faltante_rd)}
                              </span>
                              <span className="text-[9.5px] text-gray-400 block">
                                ~{formatCurrency(item.costo_unitario_base)}/{item.unidad_base}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="pt-3 border-t border-trigo-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-chocolate-700">
            {resumen.itemsFaltantes > 0 ? (
              <span className="flex items-center gap-1.5 font-medium text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  Se requiere un presupuesto estimado de <b>{formatCurrency(resumen.presupuestoFaltanteTotalRD)}</b> para comprar los {resumen.itemsFaltantes} insumos faltantes antes de producir.
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>¡Excelente! Tienes el 100% de los insumos y empaques en almacén para hornear este pedido.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiarWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-trigo-300 hover:bg-gray-50 text-chocolate-800 font-bold transition shadow-sm cursor-pointer"
              title="Copiar lista de compras con casillas de verificación para compras"
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">¡Lista Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-chocolate-600" />
                  <span>Copiar Lista de Compras</span>
                </>
              )}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
              title="Abrir WhatsApp con la lista de compras formateada"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar a WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
