import React, { useState, useMemo } from 'react';
import { Pedido, Insumo, Receta } from '../../types';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import {
  CalendarDays,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  Clock,
  Package,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface CriticalStockProjectionProps {
  pedidos: Pedido[];
  insumos: Insumo[];
  insumosMap: Map<number, Insumo>;
  recetas: Receta[];
}

export const CriticalStockProjection: React.FC<CriticalStockProjectionProps> = ({
  pedidos,
  insumos,
  insumosMap,
  recetas,
}) => {
  const [filterMode, setFilterMode] = useState<'todos' | 'deficit'>('deficit');

  // Rango de fechas: Próximos 7 días
  const { todayStr, nextWeekStr, pedidosSemana } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const todayIso = today.toISOString().split('T')[0];
    const nextWeekIso = nextWeek.toISOString().split('T')[0];

    // Pedidos activos para entregar en los próximos 7 días
    const filtered = pedidos.filter((p) => {
      if (p.estado === 'cancelado' || p.estado === 'entregado') return false;
      const entrega = p.fecha_entrega;
      return entrega >= todayIso && entrega <= nextWeekIso;
    });

    return {
      todayStr: todayIso,
      nextWeekStr: nextWeekIso,
      pedidosSemana: filtered,
    };
  }, [pedidos]);

  // Cálculo de consumo proyectado por insumo
  const proyeccionInsumos = useMemo(() => {
    const mapaConsumo = new Map<
      number,
      {
        insumoId: number;
        insumoNombre: string;
        unidad: string;
        requerido: number;
        stockActual: number;
        costoUnitario: number;
        pedidosAfectados: number;
      }
    >();

    pedidosSemana.forEach((pedido) => {
      pedido.items.forEach((item) => {
        if (!item.receta_id) return;
        const receta = recetas.find((r) => r.id === item.receta_id);
        if (!receta) return;

        const factor = (item.factor_receta || 1) * item.cantidad;
        receta.ingredientes.forEach((ing) => {
          const insumo = insumosMap.get(ing.insumo_id);
          const cantidad = ing.cantidad * factor;

          const existing = mapaConsumo.get(ing.insumo_id);
          if (existing) {
            existing.requerido += cantidad;
            existing.pedidosAfectados += 1;
          } else {
            mapaConsumo.set(ing.insumo_id, {
              insumoId: ing.insumo_id,
              insumoNombre: insumo ? insumo.nombre : (ing.insumo_nombre || 'Insumo'),
              unidad: insumo ? insumo.unidad_base : (ing.unidad_base || 'g'),
              requerido: cantidad,
              stockActual: insumo ? insumo.stock_actual : 0,
              costoUnitario: insumo ? insumo.costo_unitario_base : 0,
              pedidosAfectados: 1,
            });
          }
        });
      });
    });

    return Array.from(mapaConsumo.values()).map((item) => {
      const deficit = Math.max(0, item.requerido - item.stockActual);
      const isDeficit = deficit > 0;
      const costoCompraSugerida = deficit * item.costoUnitario;

      return {
        ...item,
        deficit,
        isDeficit,
        costoCompraSugerida,
        coberturaPct: item.requerido > 0 ? Math.min(100, Math.round((item.stockActual / item.requerido) * 100)) : 100,
      };
    });
  }, [pedidosSemana, recetas, insumosMap]);

  // Insumos con déficit
  const itemsConDeficit = proyeccionInsumos.filter((i) => i.isDeficit);
  const costoTotalFaltante = itemsConDeficit.reduce((acc, i) => acc + i.costoCompraSugerida, 0);

  const displayedItems = filterMode === 'deficit' ? itemsConDeficit : proyeccionInsumos;

  return (
    <div className="space-y-6">
      {/* Resumen Superior / KPIs de Proyección */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-trigo-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-chocolate-500 uppercase tracking-wider block">
              Horizonte de Pedidos
            </span>
            <span className="text-xl font-black text-chocolate-900">
              {pedidosSemana.length} Pedidos
            </span>
            <span className="text-[11px] text-chocolate-500 block">Próximos 7 días calendario</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-trigo-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-chocolate-500 uppercase tracking-wider block">
              Insumos Comprometidos
            </span>
            <span className="text-xl font-black text-chocolate-900">
              {proyeccionInsumos.length} Insumos
            </span>
            <span className="text-[11px] text-chocolate-500 block">Para producir las tandas</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider block">
              Con Déficit Crítico
            </span>
            <span className="text-xl font-black text-red-700">
              {itemsConDeficit.length} Insumos
            </span>
            <span className="text-[11px] text-red-500 block">Faltan para cumplir entregas</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-trigo-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-chocolate-500 uppercase tracking-wider block">
              Inversión de Reposición
            </span>
            <span className="text-xl font-black text-emerald-700">
              {formatCurrency(costoTotalFaltante)}
            </span>
            <span className="text-[11px] text-chocolate-500 block">Costo estimado de compras</span>
          </div>
        </div>
      </div>

      {/* Alerta si hay déficits críticos */}
      {itemsConDeficit.length > 0 && (
        <div className="p-4 bg-red-50/90 border-2 border-red-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm text-red-900">
                ¡Alerta de Producción! {itemsConDeficit.length} insumos no alcanzan para los pedidos de esta semana
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Debes abastecer estos insumos antes de iniciar la producción para evitar retrasos en las fechas de entrega.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Lista de Insumos Proyectados */}
      <div className="bg-white rounded-3xl border border-trigo-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-trigo-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-chocolate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-frambuesa-600" />
              <span>Balance Predictivo de Materia Prima a 7 Días</span>
            </h3>
            <p className="text-xs text-chocolate-500">
              Proyección generada a partir de los pedidos agendados del {todayStr} al {nextWeekStr}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-chocolate-500" />
            <div className="inline-flex rounded-xl border border-trigo-200 p-0.5 bg-canvas text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('deficit')}
                className={'px-3 py-1.5 rounded-lg transition-all ' + (
                  filterMode === 'deficit'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-chocolate-600 hover:text-chocolate-900'
                )}
              >
                Solo Déficit ({itemsConDeficit.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('todos')}
                className={'px-3 py-1.5 rounded-lg transition-all ' + (
                  filterMode === 'todos'
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'text-chocolate-600 hover:text-chocolate-900'
                )}
              >
                Ver Todos ({proyeccionInsumos.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tabla o Lista de Insumos */}
        {displayedItems.length === 0 ? (
          <div className="p-12 text-center text-chocolate-500 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-chocolate-900">¡Inventario Suficiente!</h4>
            <p className="text-xs max-w-md mx-auto text-chocolate-600">
              {filterMode === 'deficit'
                ? 'No hay insumos con déficit proyectado para los pedidos de los próximos 7 días. El stock actual cubre toda la producción requerida.'
                : 'No hay pedidos confirmados o en producción registrados para los próximos 7 días.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-trigo-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-crema/60 text-chocolate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Insumo Requerido</th>
                  <th className="px-4 py-3.5 text-right">Requerido (7d)</th>
                  <th className="px-4 py-3.5 text-right">Stock Actual</th>
                  <th className="px-4 py-3.5 text-center">Cobertura</th>
                  <th className="px-4 py-3.5 text-right">Balance / Déficit</th>
                  <th className="px-5 py-3.5 text-right">Costo Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100 font-medium text-chocolate-800">
                {displayedItems.map((item) => {
                  return (
                    <tr
                      key={item.insumoId}
                      className={'hover:bg-crema/30 transition-colors ' + (
                        item.isDeficit ? 'bg-red-50/40' : ''
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (
                              item.isDeficit ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                            )}
                          />
                          <div>
                            <span className="font-bold text-chocolate-900 block text-xs sm:text-sm">
                              {item.insumoNombre}
                            </span>
                            <span className="text-[10px] text-chocolate-500">
                              Presente en {item.pedidosAfectados} pedido(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-chocolate-800">
                        {formatUnit(item.requerido, item.unidad)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        <span className={item.stockActual === 0 ? 'text-red-600' : 'text-chocolate-800'}>
                          {formatUnit(item.stockActual, item.unidad)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={'h-full rounded-full ' + (
                                item.coberturaPct >= 100
                                  ? 'bg-emerald-500'
                                  : item.coberturaPct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              )}
                              style={{ width: item.coberturaPct + '%' }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold">
                            {item.coberturaPct}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-extrabold">
                        {item.isDeficit ? (
                          <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-lg border border-red-200">
                            - {formatUnit(item.deficit, item.unidad)}
                          </span>
                        ) : (
                          <span className="text-emerald-700">Cubierto</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono">
                        {item.isDeficit ? (
                          <span className="font-black text-red-700 text-xs sm:text-sm">
                            {formatCurrency(item.costoCompraSugerida)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">RD$ 0.00</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
