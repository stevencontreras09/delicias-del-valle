import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Pedido } from '../../types';
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
} from 'lucide-react';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import { enriquecerIngredientes } from '../../utils/calculations';
import { playOvenTimerAlarm, playSuccessChime } from '../../utils/kitchenAudio';
import { useWakeLock } from '../../hooks/useWakeLock';
import { EstacionCocina } from '../../types';

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
  const [activeRecipeScale, setActiveRecipeScale] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [estacionFiltro, setEstacionFiltro] = useState<EstacionCocina>('todas');

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

  const currentPedido = activeOrders.find((p) => p.id === selectedPedidoId) || activeOrders[0];

  // Receta activa del pedido seleccionado (primer item con receta)
  const currentItem = currentPedido?.items[0];
  const currentReceta = currentItem?.receta_id
    ? recetas.find((r) => r.id === currentItem.receta_id)
    : recetas[0];

  // Factor de escalado base del item o seleccionado por el pastelero
  const effectiveScale = (currentItem?.factor_receta || 1) * (currentItem?.cantidad || 1) * activeRecipeScale;

  const ingredientesEnriquecidos = currentReceta
    ? enriquecerIngredientes(currentReceta.ingredientes, insumosMap, effectiveScale)
    : [];

  const fijos = ingredientesEnriquecidos.filter((i) => i.tipo === 'fijo');
  const variables = ingredientesEnriquecidos.filter((i) => i.tipo === 'variable');

  const fijosConKey = fijos.map((ing) => ({
    ...ing,
    checkKey: `${ing.insumo_id}_${currentPedido?.id}_fijo`,
  }));
  const variablesConKey = variables.map((ing) => ({
    ...ing,
    checkKey: `${ing.insumo_id}_${currentPedido?.id}_var`,
  }));
  const allCurrentIngs = [...fijosConKey, ...variablesConKey];
  const checkedCount = allCurrentIngs.filter((i) => currentPedido?.checklist_completado?.[i.checkKey]).length;
  const progressPct = allCurrentIngs.length > 0 ? Math.round((checkedCount / allCurrentIngs.length) * 100) : 0;

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
              Interfaz ergonómica táctil optimizada para manos enharinadas y trabajo en taller
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
              const mins = prompt('¿Minutos para el temporizador de horneado?', '30');
              if (mins && parseInt(mins) > 0) {
                addTimer(
                  `Horneado Tanda (${mins}m)`,
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
        <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
          Cola de Pedidos en Taller ({activeOrders.length}) — Toca para preparar:
        </span>

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
                  setActiveRecipeScale(1);
                }}
                className={`p-4 rounded-3xl border-2 text-left transition-all relative ${
                  isSelected
                    ? 'bg-slate-800 text-white border-frambuesa-500 shadow-2xl ring-4 ring-frambuesa-500/30 scale-[1.02]'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-black text-trigo-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
                    {pedido.numero_factura}
                  </span>
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
                  <span>📅 Entrega: {pedido.hora_entrega}</span>
                  <span className="text-white font-extrabold">{formatCurrency(pedido.total)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {currentPedido ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Checklist de Pesaje & Receta Escalada (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tarjeta Principal del Pedido Seleccionado */}
            <div className="bg-slate-800 rounded-3xl p-5 sm:p-7 border border-slate-700 shadow-xl space-y-5">
              {/* Encabezado del Pedido */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-frambuesa-400 uppercase tracking-wider">
                      Preparando Ahora:
                    </span>
                    <span className="bg-slate-900 text-trigo-300 text-xs font-black px-2.5 py-0.5 rounded-lg border border-slate-700">
                      {currentPedido.numero_factura}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {currentItem?.receta_nombre || currentPedido.items[0]?.receta_nombre}
                  </h2>
                  <p className="text-sm font-semibold text-trigo-300 mt-1">
                    {currentItem?.tamano_porciones} • Cliente: {currentPedido.cliente_nombre}
                  </p>
                </div>

                {/* Botones Gigantes de Avance de Estado en 1 Toque */}
                <div className="flex flex-wrap items-center gap-2">
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

              {/* Especificaciones del Pastel (Dedicatoria, Relleno, Decoración) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Masa Base:</span>
                  <span className="font-extrabold text-white text-sm">
                    {currentItem?.masa_base || 'Tradicional'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Relleno:</span>
                  <span className="font-extrabold text-trigo-300 text-sm">
                    {currentItem?.relleno || 'Artesanal'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Decoración:</span>
                  <span className="font-extrabold text-frambuesa-300 text-sm">
                    {currentItem?.decoracion || 'Estándar'}
                  </span>
                </div>

                {currentItem?.dedicatoria && (
                  <div className="sm:col-span-3 pt-2 border-t border-slate-800">
                    <span className="text-amber-400 font-bold uppercase text-[10px] block">
                      Dedicatoria a Escribir en Pastel / Tarjeta:
                    </span>
                    <p className="text-base font-serif italic text-white font-black mt-0.5">
                      "{currentItem.dedicatoria}"
                    </p>
                  </div>
                )}
              </div>

              {/* Escalador de Tanda en Vivo para Cocina */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Scale className="w-5 h-5 text-trigo-400" />
                  <span className="font-black text-sm text-white">Multiplicador de Tanda:</span>
                  <span className="text-slate-400 text-xs">
                    (Multiplica los gramos para hornear varias unidades a la vez)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((factor) => (
                    <button
                      key={factor}
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

              {/* BARRA DE FILTRO POR ESTACIONES Y PROGRESO DE PESAJE */}
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
                      onClick={() => setEstacionFiltro('todas')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        estacionFiltro === 'todas'
                          ? 'bg-frambuesa-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      Todas ({allCurrentIngs.length})
                    </button>
                    <button
                      onClick={() => setEstacionFiltro('horneado')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        estacionFiltro === 'horneado'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span>🔥 Masas / Horneado ({fijos.length})</span>
                    </button>
                    <button
                      onClick={() => setEstacionFiltro('decoracion')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        estacionFiltro === 'decoracion'
                          ? 'bg-fuchsia-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span>✨ Rellenos / Decoración ({variables.length})</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso de Pesaje en Vivo */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-300 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-400" />
                      Progreso de Pesaje y Preparación:
                    </span>
                    <span className="font-extrabold text-emerald-400">
                      {checkedCount} de {allCurrentIngs.length} pesados ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {progressPct === 100 && allCurrentIngs.length > 0 && (
                    <div className="text-center py-1 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¡Todos los ingredientes pesados y añadidos al bowl!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CHECKLIST DE PESAJE DE INGREDIENTES FIJOS (MASA) */}
              {(estacionFiltro === 'todas' || estacionFiltro === 'horneado') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>1. Checklist de Pesaje: Masa Base ({fijos.length})</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-bold">
                      Toca cada ingrediente al añadir al bowl
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {fijosConKey.map((ing, idx) => {
                      const isChecked = !!currentPedido.checklist_completado?.[ing.checkKey];

                      return (
                        <button
                          key={idx}
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
                </div>
              )}

              {/* CHECKLIST DE INGREDIENTES VARIABLES (RELLENO / COBERTURA) */}
              {variables.length > 0 && (estacionFiltro === 'todas' || estacionFiltro === 'decoracion') && (
                <div className="space-y-3 pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>2. Rellenos, Coberturas & Empaques ({variables.length})</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-bold">
                      Toca para marcar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {variablesConKey.map((ing, idx) => {
                      const isChecked = !!currentPedido.checklist_completado?.[ing.checkKey];

                      return (
                        <button
                          key={idx}
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
            </div>
          </div>

          {/* Columna Derecha: Temporizadores de Horneado & Instrucciones (4 cols) */}
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
                {timers.map((timer) => (
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
                ))}
              </div>
            </div>

            {/* Instrucciones de Cocina del Producto Activo */}
            {currentReceta?.instrucciones && (
              <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-trigo-400" />
                  <span>Pasos de Elaboración</span>
                </h3>

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
    </div>
  );
};
