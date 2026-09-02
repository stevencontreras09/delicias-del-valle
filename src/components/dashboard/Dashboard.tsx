import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  Clock,
  ChefHat,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatUnit, formatDate } from '../../utils/formatters';
import { calcularCostosReceta } from '../../utils/calculations';
import { Badge } from '../ui/Badge';

export const Dashboard: React.FC = () => {
  const { insumos, insumosMap, recetas, pedidos, setActiveTab } = useApp();

  // Métricas financieras
  const totalVentas = pedidos.list
    .filter((p) => p.estado !== 'cancelado')
    .reduce((sum, p) => sum + p.total, 0);

  const totalAnticipos = pedidos.list
    .filter((p) => p.estado !== 'cancelado')
    .reduce((sum, p) => sum + p.anticipo_pagado, 0);

  const totalSaldoPendiente = pedidos.list
    .filter((p) => p.estado !== 'cancelado')
    .reduce((sum, p) => sum + p.saldo_pendiente, 0);

  // Insumos críticos
  const lowStockInsumos = insumos.filter((i) => i.activo && i.stock_actual <= i.stock_minimo);

  // Pedidos activos
  const pedidosActivos = pedidos.list.filter(
    (p) => p.estado === 'confirmado' || p.estado === 'en_produccion' || p.estado === 'listo'
  );

  // Margen promedio de recetas
  const margenes = recetas.map((r) => {
    const calc = calcularCostosReceta(r, insumosMap);
    return {
      receta: r,
      costo: calc.costo_total_produccion,
      precioSugerido: calc.precio_sugerido_margen_venta,
      ganancia: calc.ganancia_estimada,
      margenPct: r.margen_beneficio_pct,
    };
  });

  const margenPromedio =
    margenes.length > 0
      ? margenes.reduce((acc, m) => acc + m.margenPct, 0) / margenes.length
      : 50;

  // Top recetas más rentables
  const topRecetas = [...margenes]
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Bienvenida con Estilo Artesanal */}
      <div className="relative overflow-hidden bg-gradient-to-r from-chocolate-800 via-chocolate-700 to-chocolate-900 rounded-3xl p-6 sm:p-8 text-white shadow-warm-lg">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-frambuesa-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 bg-trigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-frambuesa-500/30 text-frambuesa-200 text-xs font-semibold backdrop-blur-sm border border-frambuesa-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panel de Control Gastronómico</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight text-crema">
              ¡Bienvenido a Delicias del Valle!
            </h1>
            <p className="text-sm text-trigo-200 max-w-2xl leading-relaxed">
              Gestión inteligente de escandallos (BOM), inventario en tiempo real con descuento automático, cotizaciones instantáneas y modo cocina para el equipo de producción.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('quotes')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-sm shadow-frambuesa-glow transition-all transform hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Nueva Cotización</span>
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-crema border border-trigo-400/40 font-bold text-sm backdrop-blur-sm transition-all"
            >
              <ChefHat className="w-4 h-4 text-trigo-300" />
              <span>Abrir Modo Cocina</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white rounded-3xl p-6 border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-chocolate-500 uppercase tracking-wider">
              Ventas Totales
            </span>
            <div className="p-3 bg-crema rounded-2xl text-chocolate-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-chocolate-800 mt-3">
            {formatCurrency(totalVentas)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-chocolate-500">
            <span>Anticipos: {formatCurrency(totalAnticipos)}</span>
            <span className="text-frambuesa-600 font-semibold">
              Por cobrar: {formatCurrency(totalSaldoPendiente)}
            </span>
          </div>
        </div>

        {/* KPI 2: Margen Promedio */}
        <div className="bg-white rounded-3xl p-6 border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-chocolate-500 uppercase tracking-wider">
              Margen Promedio BOM
            </span>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-chocolate-800 mt-3">
            {margenPromedio.toFixed(0)}%
          </p>
          <p className="mt-2 text-xs text-emerald-600 font-medium">
            53 recetas con cascada de costos calculada
          </p>
        </div>

        {/* KPI 3: Pedidos en Cola */}
        <div className="bg-white rounded-3xl p-6 border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-chocolate-500 uppercase tracking-wider">
              Pedidos en Producción
            </span>
            <div className="p-3 bg-frambuesa-50 rounded-2xl text-frambuesa-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-chocolate-800 mt-3">
            {pedidosActivos.length}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-amber-600 font-medium">
              {pedidos.list.filter((p) => p.estado === 'confirmado').length} Confirmados
            </span>
            <span>•</span>
            <span className="text-blue-600 font-medium">
              {pedidos.list.filter((p) => p.estado === 'en_produccion').length} En Horno
            </span>
          </div>
        </div>

        {/* KPI 4: Insumos en Alerta */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white rounded-3xl p-6 border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-chocolate-500 uppercase tracking-wider">
              Alertas de Stock Bajo
            </span>
            <div
              className={`p-3 rounded-2xl ${
                lowStockInsumos.length > 0
                  ? 'bg-frambuesa-100 text-frambuesa-700 animate-pulse'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold mt-3 ${
              lowStockInsumos.length > 0 ? 'text-frambuesa-600' : 'text-chocolate-800'
            }`}
          >
            {lowStockInsumos.length} Insumos
          </p>
          <p className="mt-2 text-xs text-chocolate-500 group-hover:text-frambuesa-600 transition-colors flex items-center gap-1 font-medium">
            <span>Ver insumos y balance a 7 días</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>
      </div>

      {/* Alerta Destacada de Stock Bajo si existen insumos críticos */}
      {lowStockInsumos.length > 0 && (
        <div className="bg-frambuesa-50/70 border-2 border-frambuesa-300/80 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-frambuesa-500 text-white rounded-2xl mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-frambuesa-900">
                  ¡Atención en Despensa! {lowStockInsumos.length} insumos por debajo del stock mínimo
                </h3>
                <p className="text-xs text-frambuesa-800 mt-1">
                  Reabastece a tiempo para evitar interrupciones en la producción de pedidos activos.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2.5 bg-frambuesa-600 hover:bg-frambuesa-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
            >
              Reabastecer Insumos
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-frambuesa-200">
            {lowStockInsumos.slice(0, 6).map((insumo) => (
              <div
                key={insumo.id}
                className="bg-white p-3 rounded-2xl border border-frambuesa-200 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-chocolate-800 truncate">{insumo.nombre}</p>
                  <p className="text-gray-500 text-[11px]">
                    Mínimo: {formatUnit(insumo.stock_minimo, insumo.unidad_base)}
                  </p>
                </div>
                <Badge variant="frambuesa" size="sm" dot>
                  {formatUnit(insumo.stock_actual, insumo.unidad_base)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección Doble: Pedidos en Producción vs Top Rentabilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Pedidos Activos (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-trigo-200 shadow-warm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-trigo-100">
            <div>
              <h2 className="text-lg font-bold text-chocolate-700 font-serif">
                Pipeline de Pedidos Activos
              </h2>
              <p className="text-xs text-chocolate-400">
                Seguimiento de pedidos confirmados y en cocina
              </p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-frambuesa-600 hover:text-frambuesa-700 flex items-center gap-1"
            >
              <span>Ver todos ({pedidos.list.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-trigo-100 flex-1 mt-2">
            {pedidosActivos.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-chocolate-600">
                  ¡Todo al día en el taller!
                </p>
                <p className="text-xs text-chocolate-400 mt-1">
                  No hay pedidos pendientes en producción.
                </p>
              </div>
            ) : (
              pedidosActivos.slice(0, 5).map((pedido) => {
                let badgeVariant: 'warning' | 'info' | 'success' | 'frambuesa' = 'warning';
                let estadoTexto = 'Confirmado';

                if (pedido.estado === 'en_produccion') {
                  badgeVariant = 'info';
                  estadoTexto = 'En Producción (Horno/Mesa)';
                } else if (pedido.estado === 'listo') {
                  badgeVariant = 'success';
                  estadoTexto = 'Listo para Entrega';
                }

                return (
                  <div
                    key={pedido.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-crema/20 rounded-2xl px-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-chocolate-800 text-sm">
                          {pedido.numero_factura}
                        </span>
                        <Badge variant={badgeVariant} size="sm">
                          {estadoTexto}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-chocolate-700">
                        {pedido.cliente_nombre}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Entrega: {formatDate(pedido.fecha_entrega)} a las {pedido.hora_entrega}
                      </p>
                      <p className="text-xs text-chocolate-600 font-medium">
                        {pedido.items.map((i) => `${i.receta_nombre} (x${i.cantidad})`).join(', ')}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1">
                      <span className="text-sm font-extrabold text-chocolate-800">
                        {formatCurrency(pedido.total)}
                      </span>
                      {pedido.saldo_pendiente > 0 ? (
                        <span className="text-[11px] font-semibold text-frambuesa-600">
                          Saldo: {formatCurrency(pedido.saldo_pendiente)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600">
                          Pagado 100%
                        </span>
                      )}
                      <button
                        onClick={() => setActiveTab('kitchen')}
                        className="mt-1 px-3 py-1 rounded-xl bg-crema text-chocolate-700 hover:bg-trigo-200 text-xs font-semibold transition-colors"
                      >
                        Abrir en Cocina
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Top Recetas Más Rentables (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-trigo-200 shadow-warm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-trigo-100">
            <div>
              <h2 className="text-lg font-bold text-chocolate-700 font-serif">
                Recetas Más Rentables
              </h2>
              <p className="text-xs text-chocolate-400">
                Top productos con mayor margen y retorno
              </p>
            </div>
            <button
              onClick={() => setActiveTab('recipes')}
              className="text-xs font-bold text-frambuesa-600 hover:text-frambuesa-700 flex items-center gap-1"
            >
              <span>Ver todas (53)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-trigo-100 flex-1 mt-2">
            {topRecetas.map((item, idx) => (
              <div key={item.receta.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-crema text-chocolate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-chocolate-800 truncate">
                      {item.receta.nombre}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Costo: {formatCurrency(item.costo)} • Rinde: {item.receta.rendimiento_unidad}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-emerald-700">
                    +{formatCurrency(item.ganancia)}
                  </p>
                  <Badge variant="trigo" size="sm">
                    {item.margenPct}% margen
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-trigo-100 bg-canvas p-4 rounded-2xl">
            <p className="text-xs text-chocolate-600 leading-relaxed font-medium">
              💡 <span className="font-bold">Consejo de Costos:</span> Todas las recetas incluyen cálculo automático en cascada de indirectos (10%), operativos (15%), reposición de equipos (10%) y mano de obra (30%).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
