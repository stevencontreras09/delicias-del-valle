import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pedido, PedidoItem } from '../../types';
import {
  ChefHat,
  Clock,
  Flame,
  CheckSquare,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Scale,
  Eye,
  EyeOff,
  Layers,
  Printer,
  ListOrdered,
  FileText,
  Check,
} from 'lucide-react';
import { formatCurrency, formatUnit, formatDisplayTamano } from '../../utils/formatters';
import { enriquecerIngredientes } from '../../utils/calculations';
import { playOvenTimerAlarm, playSuccessChime } from '../../utils/kitchenAudio';
import { useWakeLock } from '../../hooks/useWakeLock';
import { EstacionCocina } from '../../types';
import { PrintTicketModal } from '../orders/PrintTicketModal';

export const KitchenMode: React.FC = () => {
  const {
    pedidos,
    recetas,
    insumosMap,
    timers,
    addTimer,
    toggleTimer,
    resetTimer,
    toggleKitchenChecklist,
  } = useApp();

  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [showAllRecipesView, setShowAllRecipesView] = useState<boolean>(false);
  const [activeRecipeScale, setActiveRecipeScale] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [estacionFiltro, setEstacionFiltro] = useState<EstacionCocina>('todas');
  const [printTicketPedido, setPrintTicketPedido] = useState<Pedido | null>(null);

  // Screen Wake Lock API para mantener pantalla activa en taller
  const { isLocked, isSupported, requestWakeLock, releaseWakeLock } = useWakeLock(true);

  // Pedidos activos para producción en taller
  const activeOrders: Pedido[] = pedidos.list.filter(
    (p: Pedido) => p.estado === 'confirmado' || p.estado === 'en_produccion' || p.estado === 'listo'
  );

  // Seleccionar automáticamente el primer pedido si no hay uno seleccionado
  useEffect(() => {
    if (!selectedPedidoId && activeOrders.length > 0) {
      setSelectedPedidoId(activeOrders[0].id);
    }
  }, [activeOrders, selectedPedidoId]);

  // Al cambiar de pedido, reiniciar el selector al primer producto y escala a 1x
  useEffect(() => {
    setSelectedItemIndex(0);
    setActiveRecipeScale(1);
  }, [selectedPedidoId]);

  const currentPedido = activeOrders.find((p) => p.id === selectedPedidoId) || activeOrders[0];

  // Función robusta para vincular un producto de pedido con su receta en base de datos
  const findRecipeForItem = (item: PedidoItem) => {
    if (item.receta_id) {
      const byId = recetas.find((r) => r.id === item.receta_id);
      if (byId) return byId;
    }
    const byName = recetas.find(
      (r) => r.nombre.trim().toLowerCase() === item.receta_nombre.trim().toLowerCase()
    );
    if (byName) return byName;
    const byPartial = recetas.find(
      (r) =>
        item.receta_nombre.toLowerCase().includes(r.nombre.toLowerCase()) ||
        r.nombre.toLowerCase().includes(item.receta_nombre.toLowerCase())
    );
    return byPartial || null;
  };

  // Enriquecer y calcular ingredientes y checklists para TODOS los productos del pedido
  const allItemsData = (currentPedido?.items || []).map((item, idx) => {
    const receta = findRecipeForItem(item);
    const isSelected = idx === selectedItemIndex;
    const scale =
      (item.factor_receta || 1) *
      (item.cantidad || 1) *
      (isSelected ? activeRecipeScale : 1);

    const ingredientesEnriquecidos = receta
      ? enriquecerIngredientes(receta.ingredientes, insumosMap, scale)
      : [];

    const fijos = ingredientesEnriquecidos
      .filter((i) => i.tipo === 'fijo')
      .map((ing) => ({
        ...ing,
        checkKey: `${ing.insumo_id}_${currentPedido?.id}_item_${idx}_fijo`,
        fallbackKey: `${ing.insumo_id}_${currentPedido?.id}_fijo`,
      }));

    const variables = ingredientesEnriquecidos
      .filter((i) => i.tipo === 'variable')
      .map((ing) => ({
        ...ing,
        checkKey: `${ing.insumo_id}_${currentPedido?.id}_item_${idx}_var`,
        fallbackKey: `${ing.insumo_id}_${currentPedido?.id}_var`,
      }));

    const allItemIngs = [...fijos, ...variables];

    const isIngChecked = (checkKey: string, fallbackKey: string) => {
      if (currentPedido?.checklist_completado?.[checkKey]) return true;
      if (idx === 0 && currentPedido?.checklist_completado?.[fallbackKey]) return true;
      return false;
    };

    const checkedCount = allItemIngs.filter((i) =>
      isIngChecked(i.checkKey, i.fallbackKey)
    ).length;

    const pct =
      allItemIngs.length > 0 ? Math.round((checkedCount / allItemIngs.length) * 100) : 0;

    return {
      item,
      idx,
      receta,
      scale,
      ingredientes: ingredientesEnriquecidos,
      fijos,
      variables,
      allItemIngs,
      checkedCount,
      pct,
      isComplete: allItemIngs.length > 0 && checkedCount === allItemIngs.length,
      isIngChecked,
    };
  });

  // Métricas acumuladas del pedido completo
  const totalOrderIngs = allItemsData.reduce((acc, curr) => acc + curr.allItemIngs.length, 0);
  const totalOrderChecked = allItemsData.reduce((acc, curr) => acc + curr.checkedCount, 0);
  const orderGlobalPct = totalOrderIngs > 0 ? Math.round((totalOrderChecked / totalOrderIngs) * 100) : 0;

  // Producto activo para la vista enfocada
  const currentItemData = allItemsData[selectedItemIndex] || allItemsData[0];
  const currentItem = currentItemData?.item;
  const currentReceta = currentItemData?.receta;

  // Filtrado de ingredientes para la vista enfocada
  const focusedFijos = currentItemData ? currentItemData.fijos : [];
  const focusedVariables = currentItemData ? currentItemData.variables : [];
  const focusedAllIngs = currentItemData ? currentItemData.allItemIngs : [];

  // Reloj de temporizadores en segundo plano
  useEffect(() => {
    const interval = setInterval(() => {
      timers.forEach((timer) => {
        if (timer.isRunning && timer.remainingSeconds > 0) {
          timer.remainingSeconds -= 1;
          if (timer.remainingSeconds === 0) {
            timer.isRunning = false;
            timer.isFinished = true;
            if (soundEnabled) {
              playOvenTimerAlarm();
            }
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, soundEnabled]);

  const formatTimerSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Barra de Control Superior para Taller */}
      <div className="bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-frambuesa-600 text-white rounded-2xl shadow-lg">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MODO COCINA & PRODUCCIÓN
              </h1>
              <span className="bg-frambuesa-500/20 text-frambuesa-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-frambuesa-500/40 animate-pulse">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Gestión táctil de recetas completas, todos los productos del pedido, pesaje y hornos
            </p>
          </div>
        </div>

        {/* Controles de Pantalla Activa, Sonido y Nuevo Temporizador Rápido */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
          {/* Badge / Botón Screen Wake Lock */}
          <button
            onClick={() => (isLocked ? releaseWakeLock() : requestWakeLock())}
            disabled={!isSupported}
            title={
              isSupported
                ? isLocked
                  ? 'Pantalla bloqueada para mantenerse encendida. Toca para permitir suspensión.'
                  : 'Toca para mantener la pantalla siempre encendida sin apagarse en el taller.'
                : 'Screen Wake Lock API no soportada en este navegador'
            }
            className={`px-3.5 py-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              isLocked
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : isSupported
                ? 'bg-slate-700/80 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isLocked ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {isLocked ? (
              <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {isLocked ? 'Pantalla Activa' : isSupported ? 'Activar Pantalla' : 'Sin Wake Lock'}
            </span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all ${
              soundEnabled
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-slate-700 text-slate-400 border-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="hidden sm:inline">Alarma {soundEnabled ? 'Activada' : 'Silenciada'}</span>
          </button>

          <button
            onClick={() => {
              const defaultMins = currentReceta?.tiempo_horneado_min?.toString() || '30';
              const mins = prompt(
                `¿Minutos para el temporizador de horneado (${currentItem?.receta_nombre || 'Pastel'})?`,
                defaultMins
              );
              if (mins && parseInt(mins) > 0) {
                addTimer(
                  `Horneado ${currentItem?.receta_nombre || 'Tanda'} (${mins}m)`,
                  parseInt(mins) * 60,
                  currentPedido?.numero_factura
                );
              }
            }}
            className="px-4 py-3 rounded-2xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-black shadow-frambuesa-glow flex items-center gap-2 transition-all active:scale-95"
          >
            <Clock className="w-5 h-5" />
            <span>+ Nuevo Timer</span>
          </button>
        </div>
      </div>

      {/* Selector de Pedidos Activos en Carrusel Táctil */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
            Cola de Pedidos en Taller ({activeOrders.length}) — Toca para preparar:
          </span>
          {activeOrders.length > 0 && (
            <span className="text-[11px] text-trigo-400 font-bold hidden sm:inline">
              Progreso Global del Pedido Activo: {orderGlobalPct}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activeOrders.map((pedido) => {
            const isSelected = currentPedido?.id === pedido.id;
            let statusColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            if (pedido.estado === 'en_produccion') {
              statusColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30 animate-pulse';
            } else if (pedido.estado === 'listo') {
              statusColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            }

            return (
              <button
                key={pedido.id}
                onClick={() => {
                  setSelectedPedidoId(pedido.id);
                  setSelectedItemIndex(0);
                  setActiveRecipeScale(1);
                }}
                className={`p-4 rounded-3xl border-2 text-left transition-all relative ${
                  isSelected
                    ? 'bg-slate-800 text-white border-frambuesa-500 shadow-2xl ring-4 ring-frambuesa-500/30 scale-[1.02]'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-trigo-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
                      {pedido.numero_factura}
                    </span>
                    {pedido.items.length > 1 && (
                      <span className="text-[10px] font-bold bg-slate-700 text-trigo-200 px-2 py-0.5 rounded-full border border-slate-600">
                        {pedido.items.length} productos
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}
                  >
                    {pedido.estado}
                  </span>
                </div>

                <h3 className="font-black text-sm text-white truncate mt-1">
                  {pedido.cliente_nombre}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {pedido.items.map((i) => `${i.receta_nombre} (x${i.cantidad})`).join(', ')}
                </p>

                <div className="flex items-center justify-between text-xs text-trigo-300 font-bold mt-2 pt-2 border-t border-slate-700/60">
                  <span>📅 {pedido.hora_entrega} ({pedido.tipo_entrega === 'domicilio' ? '🛵 Domicilio' : '🏪 Taller'})</span>
                  <span className="text-white font-extrabold">{formatCurrency(pedido.total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {currentPedido ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Checklist de Pesaje & Recetas (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tarjeta Principal del Pedido Seleccionado */}
            <div className="bg-slate-800 rounded-3xl p-5 sm:p-7 border border-slate-700 shadow-xl space-y-5">
              {/* Encabezado del Pedido & Acciones Rápidas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-frambuesa-400 uppercase tracking-wider">
                      Preparando Ahora:
                    </span>
                    <span className="bg-slate-900 text-trigo-300 text-xs font-black px-2.5 py-0.5 rounded-lg border border-slate-700">
                      {currentPedido.numero_factura}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      • Entrega: {currentPedido.fecha_entrega} {currentPedido.hora_entrega}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {currentPedido.cliente_nombre}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-trigo-300 mt-0.5">
                    {currentPedido.items.length} {currentPedido.items.length === 1 ? 'Producto' : 'Productos'} en el pedido • Total: {formatCurrency(currentPedido.total)}
                  </p>
                </div>

                {/* Botones Gigantes de Avance de Estado & Botón de Impresión de Comanda */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintTicketPedido(currentPedido)}
                    className="px-4 py-3.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 border border-slate-600"
                    title="Imprimir comanda térmica u hoja de producción"
                  >
                    <Printer className="w-4 h-4 text-trigo-300" />
                    <span>Imprimir Comanda</span>
                  </button>

                  {currentPedido.estado === 'confirmado' && (
                    <button
                      onClick={() => {
                        pedidos.cambiarEstadoPedido(currentPedido.id, 'en_produccion');
                        playSuccessChime();
                      }}
                      className="px-5 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Flame className="w-5 h-5" />
                      <span>¡Avanzar a En Horno / Mesa!</span>
                    </button>
                  )}

                  {currentPedido.estado === 'en_produccion' && (
                    <button
                      onClick={() => {
                        pedidos.cambiarEstadoPedido(currentPedido.id, 'listo');
                        playSuccessChime();
                      }}
                      className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>¡Marcar Listo en Mostrador!</span>
                    </button>
                  )}

                  {currentPedido.estado === 'listo' && (
                    <button
                      onClick={() => {
                        pedidos.cambiarEstadoPedido(currentPedido.id, 'entregado');
                        playSuccessChime();
                      }}
                      className="px-5 py-3.5 rounded-2xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-black text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>¡Marcar Entregado!</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RESUMEN DETALLADO DE TODOS LOS PRODUCTOS DEL PEDIDO */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-trigo-400" />
                    <span className="text-xs font-black text-trigo-300 uppercase tracking-wider">
                      Desglose de Todos los Productos del Pedido ({currentPedido.items.length})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold">
                    Pesaje global: {totalOrderChecked} de {totalOrderIngs} ({orderGlobalPct}%)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {allItemsData.map((data, i) => {
                    const isSelected = selectedItemIndex === i;
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isSelected && !showAllRecipesView
                            ? 'bg-slate-800 border-frambuesa-500 ring-2 ring-frambuesa-500/20'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[11px] font-black text-trigo-300 flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-extrabold text-white text-sm truncate">
                              {data.item.cantidad}x {data.item.receta_nombre}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-800 border-slate-700 text-trigo-300 flex-shrink-0">
                            {formatDisplayTamano(data.item.tamano_porciones)}
                          </span>
                        </div>

                        {/* Especificaciones de Taller */}
                        <div className="mt-2 space-y-0.5 text-[11px] text-slate-300 pl-7">
                          {data.item.masa_base && (
                            <div>
                              <span className="text-slate-400 font-bold">Masa:</span>{' '}
                              <span className="text-white font-medium">{data.item.masa_base}</span>
                            </div>
                          )}
                          {data.item.relleno && (
                            <div>
                              <span className="text-slate-400 font-bold">Relleno:</span>{' '}
                              <span className="text-trigo-300 font-medium">{data.item.relleno}</span>
                            </div>
                          )}
                          {data.item.decoracion && (
                            <div>
                              <span className="text-slate-400 font-bold">Cobertura:</span>{' '}
                              <span className="text-frambuesa-300 font-medium">{data.item.decoracion}</span>
                            </div>
                          )}
                          {data.item.extras_texto && (
                            <div>
                              <span className="text-slate-400 font-bold">Extras:</span>{' '}
                              <span className="text-amber-300 font-medium">{data.item.extras_texto}</span>
                            </div>
                          )}
                        </div>

                        {data.item.dedicatoria && (
                          <div className="mt-2 pl-7">
                            <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-1.5 text-amber-200 text-[11px] font-serif italic">
                              ✍️ Dedicatoria: "{data.item.dedicatoria}"
                            </div>
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] pl-7">
                          <span className={data.receta ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-medium'}>
                            {data.receta ? <><Check className="w-3 h-3" /> Receta cargada ({data.allItemIngs.length} ing.)</> : '⚠️ Sin receta estándar'}
                          </span>
                          <span className="font-mono text-slate-400">
                            Pesados: {data.checkedCount}/{data.allItemIngs.length} ({data.pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SELECTOR TÁCTIL DE PRODUCTOS & CONMUTADOR DE MODO DE VISTA */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Recetas a Preparar:</span>
                    <span className="text-trigo-400 text-[11px]">
                      (Toca un producto para prepararlo o activa ver todas juntas)
                    </span>
                  </span>

                  {/* Botón Conmutador: Ver Todas las Recetas vs Enfocar Producto */}
                  <button
                    type="button"
                    onClick={() => setShowAllRecipesView(!showAllRecipesView)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                      showAllRecipesView
                        ? 'bg-frambuesa-600 text-white shadow-frambuesa-glow ring-2 ring-frambuesa-400/40'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                    }`}
                  >
                    {showAllRecipesView ? (
                      <>
                        <Layers className="w-4 h-4 text-white" />
                        <span>Viendo Todas las Recetas (Toca para enfocar 1 a 1)</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-trigo-400" />
                        <span>Ver Todas las Recetas Juntas</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pestañas Táctiles de Productos */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allItemsData.map((data, i) => {
                    const isSelected = selectedItemIndex === i && !showAllRecipesView;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedItemIndex(i);
                          setShowAllRecipesView(false);
                          setActiveRecipeScale(1);
                        }}
                        className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap border ${
                          isSelected
                            ? 'bg-frambuesa-600 text-white border-frambuesa-400 shadow-md ring-2 ring-frambuesa-400/30'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-lg bg-black/20 flex items-center justify-center font-mono text-[10px] font-black">
                          {i + 1}
                        </span>
                        <span>
                          {data.item.cantidad}x {data.item.receta_nombre}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                            data.isComplete
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-trigo-300'
                          }`}
                        >
                          {data.isComplete ? '✓ Listo' : `${data.pct}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* VISTA 1: ENFOCADA EN UN PRODUCTO ESPECÍFICO */}
              {/* ========================================================================= */}
              {!showAllRecipesView && currentItemData && (
                <div className="space-y-5 pt-2">
                  {/* Encabezado del Producto Activo */}
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-frambuesa-400 uppercase tracking-wider">
                          Producto #{selectedItemIndex + 1} en Preparación:
                        </span>
                        <span className="bg-slate-800 text-trigo-300 text-xs font-bold px-2 py-0.5 rounded border border-slate-700">
                          {currentItem?.cantidad} {currentItem?.cantidad === 1 ? 'Unidad' : 'Unidades'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                        {currentItem?.receta_nombre}
                      </h3>
                      <p className="text-xs text-trigo-300 font-semibold mt-0.5">
                        Tamaño: {formatDisplayTamano(currentItem?.tamano_porciones)} • Base: {currentItem?.masa_base || 'Tradicional'} • Relleno: {currentItem?.relleno || 'Artesanal'}
                      </p>
                    </div>

                    {/* Botón Rápido de Timer para esta receta */}
                    {currentReceta?.tiempo_horneado_min && currentReceta.tiempo_horneado_min > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          addTimer(
                            `Horneado ${currentItem?.receta_nombre} (${currentReceta.tiempo_horneado_min}m)`,
                            currentReceta.tiempo_horneado_min * 60,
                            currentPedido?.numero_factura
                          );
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow transition-all active:scale-95"
                      >
                        <Flame className="w-4 h-4 text-amber-200" />
                        <span>Timer {currentReceta.tiempo_horneado_min} min</span>
                      </button>
                    )}
                  </div>

                  {/* Multiplicador de Tanda en Vivo para este Producto */}
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Scale className="w-5 h-5 text-trigo-400" />
                      <span className="font-black text-sm text-white">Multiplicador de Tanda:</span>
                      <span className="text-slate-400 text-xs">
                        (Multiplica gramos para hornear varias tandas a la vez)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((factor) => (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => setActiveRecipeScale(factor)}
                          className={`min-w-[48px] h-12 rounded-xl text-sm font-black transition-all shadow-md active:scale-95 ${
                            activeRecipeScale === factor
                              ? 'bg-frambuesa-500 text-white ring-2 ring-frambuesa-300'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                          }`}
                        >
                          {factor}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro por Estaciones de Trabajo & Progreso de Pesaje */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-700">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-trigo-400" />
                        <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                          Estación de Trabajo:
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEstacionFiltro('todas')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            estacionFiltro === 'todas'
                              ? 'bg-frambuesa-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          Todas ({focusedAllIngs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEstacionFiltro('horneado')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            estacionFiltro === 'horneado'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <span>🔥 Masas / Horneado ({focusedFijos.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEstacionFiltro('decoracion')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            estacionFiltro === 'decoracion'
                              ? 'bg-fuchsia-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <span>✨ Rellenos / Decoración ({focusedVariables.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progreso de Pesaje en Vivo de este producto */}
                    <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-300 flex items-center gap-2">
                          <Scale className="w-4 h-4 text-emerald-400" />
                          Progreso de Pesaje para {currentItem?.receta_nombre}:
                        </span>
                        <span className="font-extrabold text-emerald-400">
                          {currentItemData.checkedCount} de {focusedAllIngs.length} pesados ({currentItemData.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 rounded-full"
                          style={{ width: `${currentItemData.pct}%` }}
                        />
                      </div>
                      {currentItemData.isComplete && focusedAllIngs.length > 0 && (
                        <div className="text-center py-1 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 animate-fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>¡Todos los ingredientes de este producto pesados y añadidos al bowl!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHECKLIST DE PESAJE DE INGREDIENTES FIJOS (MASA) */}
                  {(estacionFiltro === 'todas' || estacionFiltro === 'horneado') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span>1. Masa Base ({focusedFijos.length} ingredientes)</span>
                        </h4>
                        <span className="text-xs text-slate-400 font-bold">
                          Toca al añadir al bowl
                        </span>
                      </div>

                      {focusedFijos.length === 0 ? (
                        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                          No hay ingredientes fijos registrados para esta receta.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {focusedFijos.map((ing, idx) => {
                            const isChecked = currentItemData.isIngChecked(ing.checkKey, ing.fallbackKey);

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleKitchenChecklist(currentPedido.id, ing.checkKey)}
                                className={`min-h-[58px] p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                                  isChecked
                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 line-through opacity-70'
                                    : 'bg-slate-900 border-slate-700 text-white hover:border-trigo-500 hover:bg-slate-900/90'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {isChecked ? (
                                    <CheckSquare className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Square className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                  )}
                                  <span className="font-bold text-xs sm:text-sm truncate">
                                    {ing.insumo_nombre}
                                  </span>
                                </div>

                                <span className="font-black text-base sm:text-lg text-trigo-300 flex-shrink-0">
                                  {formatUnit(ing.cantidad_escalada, ing.unidad_base)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHECKLIST DE INGREDIENTES VARIABLES (RELLENO / COBERTURA) */}
                  {focusedVariables.length > 0 && (estacionFiltro === 'todas' || estacionFiltro === 'decoracion') && (
                    <div className="space-y-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span>2. Rellenos, Coberturas & Empaques ({focusedVariables.length})</span>
                        </h4>
                        <span className="text-xs text-slate-400 font-bold">
                          Toca para marcar
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {focusedVariables.map((ing, idx) => {
                          const isChecked = currentItemData.isIngChecked(ing.checkKey, ing.fallbackKey);

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleKitchenChecklist(currentPedido.id, ing.checkKey)}
                              className={`min-h-[58px] p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                                isChecked
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 line-through opacity-70'
                                  : 'bg-slate-900 border-slate-700 text-white hover:border-frambuesa-500 hover:bg-slate-900/90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {isChecked ? (
                                  <CheckSquare className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <Square className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                )}
                                <span className="font-bold text-xs sm:text-sm truncate">
                                  {ing.insumo_nombre}
                                </span>
                              </div>

                              <span className="font-black text-base sm:text-lg text-frambuesa-300 flex-shrink-0">
                                {formatUnit(ing.cantidad_escalada, ing.unidad_base)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Instrucciones de este producto en vista individual */}
                  {currentReceta?.instrucciones && currentReceta.instrucciones.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-700">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-trigo-400" />
                        <span>Pasos de Elaboración para {currentItem?.receta_nombre}</span>
                      </h4>

                      <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                        {currentReceta.instrucciones.map((step, i) => (
                          <li key={i} className="leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* VISTA 2: TODAS LAS RECETAS DEL PEDIDO APILADAS EN SECUENCIA */}
              {/* ========================================================================= */}
              {showAllRecipesView && (
                <div className="space-y-6 pt-2">
                  <div className="bg-frambuesa-950/40 p-4 rounded-2xl border border-frambuesa-500/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">
                        Viendo Todas las Recetas del Pedido ({allItemsData.length} productos)
                      </h4>
                      <p className="text-xs text-slate-300">
                        Cada producto se muestra con su lista de pesaje y preparación individual.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-trigo-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                      Pesados: {totalOrderChecked} de {totalOrderIngs} ({orderGlobalPct}%)
                    </span>
                  </div>

                  {allItemsData.map((data, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="bg-slate-900 rounded-3xl p-5 border border-slate-700 space-y-4 shadow-lg"
                    >
                      {/* Cabecera del Producto */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-frambuesa-600 text-white flex items-center justify-center font-mono text-xs font-black">
                              {itemIdx + 1}
                            </span>
                            <h3 className="text-lg font-black text-white">
                              {data.item.cantidad}x {data.item.receta_nombre}
                            </h3>
                            <span className="bg-slate-800 text-trigo-300 text-xs font-bold px-2 py-0.5 rounded border border-slate-700">
                              {formatDisplayTamano(data.item.tamano_porciones)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 pl-8">
                            Masa: <strong className="text-white">{data.item.masa_base || 'Estándar'}</strong> • Relleno: <strong className="text-trigo-300">{data.item.relleno || 'Estándar'}</strong> • Cobertura: <strong className="text-frambuesa-300">{data.item.decoracion || 'Estándar'}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pl-8 sm:pl-0">
                          {data.receta?.tiempo_horneado_min && (
                            <button
                              type="button"
                              onClick={() => {
                                addTimer(
                                  `Horneado ${data.item.receta_nombre} (${data.receta?.tiempo_horneado_min}m)`,
                                  (data.receta?.tiempo_horneado_min || 30) * 60,
                                  currentPedido?.numero_factura
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>Timer {data.receta.tiempo_horneado_min}m</span>
                            </button>
                          )}

                          <span className="font-mono text-xs font-black text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                            {data.checkedCount}/{data.allItemIngs.length} pesados ({data.pct}%)
                          </span>
                        </div>
                      </div>

                      {/* Dedicatoria si existe */}
                      {data.item.dedicatoria && (
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2 text-amber-200 text-xs font-serif italic">
                          ✍️ Dedicatoria a escribir: "{data.item.dedicatoria}"
                        </div>
                      )}

                      {/* Si no tiene receta registrada */}
                      {!data.receta ? (
                        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-amber-400 text-xs">
                          ⚠️ Este producto no tiene una receta registrada en el catálogo. Puedes prepararlo siguiendo las especificaciones de masa y relleno indicadas.
                        </div>
                      ) : (
                        <>
                          {/* Ingredientes Fijos (Masa) */}
                          {data.fijos.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-black text-trigo-300 uppercase tracking-wider block">
                                Masa Base ({data.fijos.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {data.fijos.map((ing, fIdx) => {
                                  const isChecked = data.isIngChecked(ing.checkKey, ing.fallbackKey);
                                  return (
                                    <button
                                      key={fIdx}
                                      type="button"
                                      onClick={() => toggleKitchenChecklist(currentPedido.id, ing.checkKey)}
                                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                                        isChecked
                                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-70'
                                          : 'bg-slate-950 border-slate-800 text-white hover:border-trigo-500'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {isChecked ? (
                                          <CheckSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        ) : (
                                          <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        )}
                                        <span className="font-bold text-xs truncate">
                                          {ing.insumo_nombre}
                                        </span>
                                      </div>
                                      <span className="font-black text-sm text-trigo-300 flex-shrink-0">
                                        {formatUnit(ing.cantidad_escalada, ing.unidad_base)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Ingredientes Variables (Relleno & Cobertura) */}
                          {data.variables.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-800">
                              <span className="text-xs font-black text-frambuesa-300 uppercase tracking-wider block">
                                Rellenos & Coberturas ({data.variables.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {data.variables.map((ing, vIdx) => {
                                  const isChecked = data.isIngChecked(ing.checkKey, ing.fallbackKey);
                                  return (
                                    <button
                                      key={vIdx}
                                      type="button"
                                      onClick={() => toggleKitchenChecklist(currentPedido.id, ing.checkKey)}
                                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                                        isChecked
                                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-70'
                                          : 'bg-slate-950 border-slate-800 text-white hover:border-frambuesa-500'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {isChecked ? (
                                          <CheckSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        ) : (
                                          <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        )}
                                        <span className="font-bold text-xs truncate">
                                          {ing.insumo_nombre}
                                        </span>
                                      </div>
                                      <span className="font-black text-sm text-frambuesa-300 flex-shrink-0">
                                        {formatUnit(ing.cantidad_escalada, ing.unidad_base)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Instrucciones de este producto */}
                          {data.receta.instrucciones && data.receta.instrucciones.length > 0 && (
                            <details className="text-xs text-slate-300 pt-1">
                              <summary className="cursor-pointer font-bold text-trigo-400 hover:text-trigo-300 py-1">
                                Ver pasos de elaboración ({data.receta.instrucciones.length} pasos)
                              </summary>
                              <ol className="list-decimal list-inside space-y-1.5 mt-2 pl-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                {data.receta.instrucciones.map((step, sIdx) => (
                                  <li key={sIdx} className="leading-relaxed text-slate-300">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </details>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Temporizadores de Horneado (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Panel de Temporizadores con Alarma */}
            <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-5 h-5 text-frambuesa-500" />
                  <span>Temporizadores de Horno</span>
                </h3>
                <span className="text-xs text-trigo-300 font-bold">{timers.length} Activos</span>
              </div>

              <div className="space-y-3">
                {timers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                    No hay temporizadores en curso. Usa los botones rápidos de cada receta para activar un timer.
                  </div>
                ) : (
                  timers.map((timer) => (
                    <div
                      key={timer.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        timer.isFinished
                          ? 'bg-frambuesa-950 border-frambuesa-500 animate-pulse text-white'
                          : timer.isRunning
                          ? 'bg-slate-900 border-sky-500/80 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="truncate pr-2">{timer.title}</span>
                        {timer.orderNumber && (
                          <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-trigo-300">
                            {timer.orderNumber}
                          </span>
                        )}
                      </div>

                      {/* Display del Cronómetro Gigante */}
                      <div className="text-center py-2">
                        <span
                          className={`font-mono text-4xl sm:text-5xl font-black tracking-widest ${
                            timer.isFinished
                              ? 'text-frambuesa-400 animate-bounce'
                              : timer.isRunning
                              ? 'text-sky-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatTimerSeconds(timer.remainingSeconds)}
                        </span>
                      </div>

                      {/* Botones Grandes para Manos Enharinadas */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => toggleTimer(timer.id)}
                          className={`h-12 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                            timer.isRunning
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{timer.isRunning ? 'Pausar' : 'Iniciar'}</span>
                        </button>

                        <button
                          onClick={() => resetTimer(timer.id)}
                          className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-600 active:scale-95"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reiniciar</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Guía Rápida de Taller */}
            <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-trigo-400" />
                <span>Protocolo de Taller</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Pesa todos los ingredientes antes de encender las batidoras.</li>
                <li>Verifica las dedicatorias y notas especiales antes del armado final.</li>
                <li>Al terminar, marca "Listo en Mostrador" para notificar a despacho y delivery.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-800 rounded-3xl border border-slate-700 text-slate-400">
          <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-40 text-trigo-400" />
          <h3 className="text-lg font-bold text-white">No hay pedidos en cola</h3>
          <p className="text-xs text-slate-400 mt-1">
            Los pedidos que confirmes en el sistema aparecerán aquí listos para cocinar.
          </p>
        </div>
      )}

      {/* Modal de Impresión de Comanda / Hoja accesible directamente en Cocina */}
      {printTicketPedido && (
        <PrintTicketModal
          isOpen={!!printTicketPedido}
          onClose={() => setPrintTicketPedido(null)}
          pedido={printTicketPedido}
        />
      )}
    </div>
  );
};
