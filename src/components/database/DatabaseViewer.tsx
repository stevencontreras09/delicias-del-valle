import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  RotateCcw,
  Code2,
  Table,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Database,
  Unlink,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { testSupabaseConnection } from '../../services/supabaseService';

export const DatabaseViewer: React.FC = () => {
  const {
    insumos,
    recetas,
    cotizaciones,
    pedidos,
    mermas,
    resetAllData,
    exportDatabaseJSON,
    showToast,
    isSupabaseOnline,
    isSyncing,
    savedCredentials,
    syncFromSupabase,
    configureSupabase,
    disconnectSupabase,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'supabase' | 'seed_sql' | 'insumos' | 'recetas' | 'pedidos'>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState(savedCredentials.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(savedCredentials.anonKey || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);

  const downloadSqlSeed = async () => {
    try {
      const response = await fetch('/delicias_del_valle_seed.sql');
      let text = '';
      if (response.ok) {
        text = await response.text();
      } else {
        text = `-- Archivo delicias_del_valle_seed.sql disponible en la raíz del proyecto`;
      }
      const blob = new Blob([text], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'delicias_del_valle_seed.sql';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('info', 'Descarga', 'El archivo delicias_del_valle_seed.sql se encuentra en la raíz de tu proyecto.');
    }
  };

  const handleTestAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      showToast('warning', 'Campos Incompletos', 'Por favor ingresa la URL de tu proyecto y la Anon Key de Supabase.');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    const success = await configureSupabase(supabaseUrl.trim(), supabaseAnonKey.trim());
    const res = await testSupabaseConnection();
    setTestResult(res);
    setTestingConnection(false);

    if (success) {
      showToast('success', '¡Base de Datos Sincronizada!', 'La aplicación ahora está conectada en tiempo real a Supabase.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Base de Datos PostgreSQL / Supabase & Sincronización
            </h1>
            <span className="bg-crema text-chocolate-800 text-xs font-bold px-3 py-1 rounded-full border border-trigo-300">
              DOP (RD$)
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Conecta tu proyecto de Supabase en vivo, sincroniza las 10 tablas relacionales y ejecuta scripts SQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSupabaseOnline && (
            <button
              onClick={() => syncFromSupabase(false)}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Supabase'}</span>
            </button>
          )}

          <button
            onClick={downloadSqlSeed}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold transition-all shadow-frambuesa-glow"
          >
            <Download className="w-4 h-4" />
            <span>Descargar delicias_del_valle_seed.sql</span>
          </button>

          <button
            onClick={exportDatabaseJSON}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-trigo-300 hover:bg-crema text-chocolate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-chocolate-600" />
            <span>Backup JSON</span>
          </button>

          <button
            onClick={resetAllData}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Dataset RD$</span>
          </button>
        </div>
      </div>

      {/* Banner de Estado de Conexión */}
      <div className={`p-4 rounded-3xl border transition-all ${
        isSupabaseOnline
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : 'bg-canvas border-trigo-200 text-chocolate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isSupabaseOnline ? 'bg-emerald-600 text-white' : 'bg-chocolate-700 text-white'}`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Estado de Conexión:</span>
                {isSupabaseOnline ? (
                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    Conectado y Sincronizado a Supabase Cloud
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                    ● Modo Local Reactivo (Ingresa credenciales abajo para conectar)
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isSupabaseOnline
                  ? 'Todas las operaciones de insumos, recetas y pedidos se guardan tanto en tu base de datos Supabase como localmente.'
                  : 'Pega tu Supabase URL y Anon Key a continuación para sincronizar la base de datos con la página.'}
              </p>
            </div>
          </div>

          {isSupabaseOnline && (
            <button
              onClick={disconnectSupabase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          )}
        </div>
      </div>

      {/* Resumen de Tablas y Registros */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm text-center">
          <span className="text-gray-400 text-xs uppercase font-bold block">insumos</span>
          <span className="text-2xl font-black text-chocolate-800">{insumos.length}</span>
          <span className="text-[10px] text-gray-500 block">materias primas</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm text-center">
          <span className="text-gray-400 text-xs uppercase font-bold block">recetas</span>
          <span className="text-2xl font-black text-chocolate-800">{recetas.length}</span>
          <span className="text-[10px] text-gray-500 block">recetas BOM</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm text-center">
          <span className="text-gray-400 text-xs uppercase font-bold block">cotizaciones</span>
          <span className="text-2xl font-black text-chocolate-800">{cotizaciones.length}</span>
          <span className="text-[10px] text-gray-500 block">cotizaciones</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm text-center">
          <span className="text-gray-400 text-xs uppercase font-bold block">pedidos</span>
          <span className="text-2xl font-black text-chocolate-800">{pedidos.list.length}</span>
          <span className="text-[10px] text-gray-500 block">pedidos / facturas</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm text-center">
          <span className="text-gray-400 text-xs uppercase font-bold block">mermas</span>
          <span className="text-2xl font-black text-chocolate-800">{mermas.length}</span>
          <span className="text-[10px] text-gray-500 block">registros de merma</span>
        </div>
      </div>

      {/* Selector de Pestaña */}
      <div className="bg-white rounded-3xl p-5 border border-trigo-200 shadow-warm space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-trigo-200 pb-3 gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'supabase'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Conexión & Sync Supabase</span>
            </button>
            <button
              onClick={() => setActiveTab('seed_sql')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'seed_sql'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>delicias_del_valle_seed.sql</span>
            </button>
            <button
              onClick={() => setActiveTab('insumos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'insumos'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Tabla insumos ({insumos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('recetas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'recetas'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Tabla recetas ({recetas.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pedidos'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'text-chocolate-600 hover:bg-crema'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Tabla pedidos ({pedidos.list.length})</span>
            </button>
          </div>
        </div>

        {/* Pestaña Conexión Supabase */}
        {activeTab === 'supabase' && (
          <div className="space-y-6">
            {/* Formulario de Conexión */}
            <div className="bg-canvas p-6 rounded-3xl border border-trigo-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-chocolate-800">
                    Sincronización Directa con Supabase
                  </h3>
                  <p className="text-xs text-chocolate-500">
                    Ingresa las credenciales de tu proyecto Supabase (ubicadas en Project Settings $\to$ API en Supabase).
                  </p>
                </div>
              </div>

              <form onSubmit={handleTestAndConnect} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://tu-proyecto.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    API Anon Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                    />
                    <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={testingConnection}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'Conectando...' : 'Conectar y Sincronizar Base de Datos'}</span>
                  </button>

                  {isSupabaseOnline && (
                    <button
                      type="button"
                      onClick={() => syncFromSupabase(false)}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Descargando...' : 'Recargar Datos desde Supabase'}</span>
                    </button>
                  )}
                </div>
              </form>

              {/* Resultado del Test */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
                    testResult.connected
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
                  {testResult.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {testResult.connected ? '¡Conexión Verificada!' : 'Fallo en la Conexión'}
                    </span>
                    <span className="text-[11px]">{testResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Instrucciones de Ayuda */}
            <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl space-y-4 text-xs">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <span>¿Dónde encuentro mi URL y Anon Key en Supabase?</span>
              </h3>

              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  Inicia sesión en tu panel de <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-bold">Supabase Dashboard</a>.
                </li>
                <li>
                  Haz clic en el ícono de engranaje <b>Project Settings</b> (abajo a la izquierda).
                </li>
                <li>
                  Selecciona la pestaña <b>API</b>.
                </li>
                <li>
                  Copia el <b>Project URL</b> (empieza con <code>https://...</code>) y el <b>Project API keys (anon / public)</b>.
                </li>
                <li>
                  Pégalos en el formulario de arriba y presiona <b>Conectar y Sincronizar</b>.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Vista del Archivo SQL Maestro */}
        {activeTab === 'seed_sql' && (
          <div className="space-y-3">
            <div className="bg-crema p-4 rounded-2xl border border-trigo-200 flex items-center justify-between text-xs">
              <span className="text-chocolate-800 font-semibold">
                Este archivo contiene la creación completa de 10 tablas, triggers de inventario, políticas de seguridad RLS y el insert de las 93 materias primas y 53 recetas BOM.
              </span>
              <button
                onClick={downloadSqlSeed}
                className="px-3 py-1.5 bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Archivo</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 max-h-[520px]">
              <pre>{`-- Archivo maestro ubicado en: ./delicias_del_valle_seed.sql
-- y en: ./database/delicias_del_valle_seed.sql

-- 1. Extensiones: uuid-ossp, pgcrypto
-- 2. Tablas: insumos, mermas, recetas, receta_ingredientes, cotizaciones, cotizacion_items, pedidos, pedido_items, pagos, configuracion_taller
-- 3. Triggers: trg_descontar_inventario_pedido(), trg_actualizar_costo_unitario()
-- 4. RLS: Políticas para Supabase
-- 5. Seed Data: 93 Insumos, 53 Recetas con BOM fijos/variables, Cotizaciones, Pedidos y Pagos 50/50 (DOP / RD$)
-- 6. Sincronización de secuencias auto-incrementables

(Archivo verificado y listo para ejecutar en Supabase SQL Editor)`}</pre>
            </div>
          </div>
        )}

        {/* Vista de Tabla Insumos */}
        {activeTab === 'insumos' && (
          <div className="overflow-x-auto border border-trigo-200 rounded-2xl max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-crema text-chocolate-800 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">id</th>
                  <th className="py-2.5 px-3">nombre</th>
                  <th className="py-2.5 px-3">categoria</th>
                  <th className="py-2.5 px-3">unidad_compra</th>
                  <th className="py-2.5 px-3 text-right">precio_compra</th>
                  <th className="py-2.5 px-3 text-right">presentacion_empaque</th>
                  <th className="py-2.5 px-3 text-center">unidad_base</th>
                  <th className="py-2.5 px-3 text-right">costo_unitario_base</th>
                  <th className="py-2.5 px-3 text-right">stock_actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {insumos.map((i) => (
                  <tr key={i.id} className="hover:bg-crema/20">
                    <td className="py-2 px-3 font-mono font-bold text-gray-500">{i.id}</td>
                    <td className="py-2 px-3 font-bold text-chocolate-900">{i.nombre}</td>
                    <td className="py-2 px-3 text-gray-600">{i.categoria}</td>
                    <td className="py-2 px-3 text-gray-600">{i.unidad_compra}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(i.precio_compra)}</td>
                    <td className="py-2 px-3 text-right">{i.presentacion_empaque}</td>
                    <td className="py-2 px-3 text-center font-bold text-frambuesa-600">{i.unidad_base}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(i.costo_unitario_base)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold">{i.stock_actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vista de Tabla Recetas */}
        {activeTab === 'recetas' && (
          <div className="overflow-x-auto border border-trigo-200 rounded-2xl max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-crema text-chocolate-800 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">id</th>
                  <th className="py-2.5 px-3">nombre</th>
                  <th className="py-2.5 px-3">categoria</th>
                  <th className="py-2.5 px-3">rendimiento_unidad</th>
                  <th className="py-2.5 px-3 text-center">ingredientes (fijos/var)</th>
                  <th className="py-2.5 px-3 text-right">indirectos %</th>
                  <th className="py-2.5 px-3 text-right">operativos %</th>
                  <th className="py-2.5 px-3 text-right">mano_obra %</th>
                  <th className="py-2.5 px-3 text-right">margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {recetas.map((r) => (
                  <tr key={r.id} className="hover:bg-crema/20">
                    <td className="py-2 px-3 font-mono font-bold text-gray-500">{r.id}</td>
                    <td className="py-2 px-3 font-bold text-chocolate-900">{r.nombre}</td>
                    <td className="py-2 px-3 text-gray-600">{r.categoria}</td>
                    <td className="py-2 px-3 font-semibold">{r.rendimiento_unidad}</td>
                    <td className="py-2 px-3 text-center">
                      {r.ingredientes.filter((i) => i.tipo === 'fijo').length} fijos /{' '}
                      {r.ingredientes.filter((i) => i.tipo === 'variable').length} variables
                    </td>
                    <td className="py-2 px-3 text-right">{r.materiales_indirectos_pct}%</td>
                    <td className="py-2 px-3 text-right">{r.costos_operativos_pct}%</td>
                    <td className="py-2 px-3 text-right">{r.mano_obra_pct}%</td>
                    <td className="py-2 px-3 text-right font-bold text-frambuesa-600">
                      {r.margen_beneficio_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vista de Tabla Pedidos */}
        {activeTab === 'pedidos' && (
          <div className="overflow-x-auto border border-trigo-200 rounded-2xl max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-crema text-chocolate-800 font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">id</th>
                  <th className="py-2.5 px-3">numero_factura</th>
                  <th className="py-2.5 px-3">cliente_nombre</th>
                  <th className="py-2.5 px-3">fecha_entrega</th>
                  <th className="py-2.5 px-3 text-right">total</th>
                  <th className="py-2.5 px-3 text-right">anticipo_pagado</th>
                  <th className="py-2.5 px-3 text-right">saldo_pendiente</th>
                  <th className="py-2.5 px-3 text-center">estado</th>
                  <th className="py-2.5 px-3 text-center">inventario_descontado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {pedidos.list.map((p) => (
                  <tr key={p.id} className="hover:bg-crema/20">
                    <td className="py-2 px-3 font-mono font-bold text-gray-500">{p.id}</td>
                    <td className="py-2 px-3 font-bold text-chocolate-900">{p.numero_factura}</td>
                    <td className="py-2 px-3">{p.cliente_nombre}</td>
                    <td className="py-2 px-3">{p.fecha_entrega}</td>
                    <td className="py-2 px-3 text-right font-bold">{formatCurrency(p.total)}</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                      {formatCurrency(p.anticipo_pagado)}
                    </td>
                    <td className="py-2 px-3 text-right text-frambuesa-600 font-bold">
                      {formatCurrency(p.saldo_pendiente)}
                    </td>
                    <td className="py-2 px-3 text-center uppercase font-bold">{p.estado}</td>
                    <td className="py-2 px-3 text-center">
                      {p.inventario_descontado ? 'true ✓' : 'false'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
