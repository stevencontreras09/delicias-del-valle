import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Insumo } from '../../types';
import {
  Plus,
  Search,
  PackagePlus,
  AlertOctagon,
  History,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { InsumoFormModal } from './InsumoFormModal';
import { RestockModal } from './RestockModal';
import { WasteModal } from './WasteModal';
import { WasteHistoryModal } from './WasteHistoryModal';

export const InventoryManager: React.FC = () => {
  const {
    insumos,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    reabastecerInsumo,
    reabastecerTodoElStock,
    addMerma,
    mermas,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'active'>('all');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [restockInsumo, setRestockInsumo] = useState<Insumo | null>(null);
  const [wasteInsumo, setWasteInsumo] = useState<Insumo | null>(null);
  const [isWasteHistoryOpen, setIsWasteHistoryOpen] = useState(false);

  // Lista de categorías únicas extraídas de los insumos
  const categories = useMemo(() => {
    const set = new Set<string>();
    insumos.forEach((i) => set.add(i.categoria));
    return Array.from(set).sort();
  }, [insumos]);

  // Filtrado reactivo
  const filteredInsumos = useMemo(() => {
    return insumos.filter((item) => {
      const matchesSearch =
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unidad_compra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || item.categoria === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = item.activo && item.stock_actual <= item.stock_minimo;
      } else if (stockFilter === 'active') {
        matchesStock = item.activo;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [insumos, searchTerm, selectedCategory, stockFilter]);

  const lowStockTotal = insumos.filter((i) => i.activo && i.stock_actual <= i.stock_minimo).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Gestión de Insumos & Inventario
            </h1>
            <span className="bg-crema text-chocolate-800 text-xs font-bold px-3 py-1 rounded-full border border-trigo-300">
              {insumos.length} Materias Primas
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Control de materia prima, conversión a unidades base ($/g, $/ml, $/ud) y deducción automática.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={reabastecerTodoElStock}
            title="Abastecer al 100% todos los 93 insumos"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-sm"
          >
            <PackagePlus className="w-4 h-4 text-emerald-600" />
            <span>Abastecer Stock Completo</span>
          </button>

          <button
            onClick={() => setIsWasteHistoryOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-trigo-300 bg-white hover:bg-crema/60 text-chocolate-700 text-xs font-bold transition-all shadow-sm"
          >
            <History className="w-4 h-4 text-trigo-600" />
            <span>Mermas ({mermas.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingInsumo(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold shadow-frambuesa-glow transition-all transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-trigo-200 shadow-warm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre (ej. Harina, Mantequilla, Cacao)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-trigo-200 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs text-panadero bg-canvas/40"
            />
          </div>

          {/* Filtro de Nivel de Stock */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 md:flex-initial ${
                stockFilter === 'all'
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'bg-crema/60 text-chocolate-600 hover:bg-crema'
              }`}
            >
              Todos ({insumos.length})
            </button>

            <button
              onClick={() => setStockFilter('low')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 md:flex-initial ${
                stockFilter === 'low'
                  ? 'bg-frambuesa-600 text-white shadow-sm'
                  : 'bg-frambuesa-50 text-frambuesa-700 hover:bg-frambuesa-100 border border-frambuesa-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stock Bajo ({lowStockTotal})</span>
            </button>
          </div>
        </div>

        {/* Píldoras de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-trigo-500 text-white shadow-sm'
                : 'bg-canvas text-chocolate-600 hover:bg-crema border border-trigo-200'
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-trigo-500 text-white shadow-sm'
                  : 'bg-canvas text-chocolate-600 hover:bg-crema border border-trigo-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-3xl border border-trigo-200 shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-panadero">
            <thead className="bg-crema text-chocolate-800 font-bold uppercase tracking-wider border-b border-trigo-200 select-none">
              <tr>
                <th className="py-3.5 px-4">Materia Prima / Categoría</th>
                <th className="py-3.5 px-4">Presentación Compra</th>
                <th className="py-3.5 px-4 text-right">Precio Compra</th>
                <th className="py-3.5 px-4 text-right">Costo Base Calculado</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Stock Mínimo</th>
                <th className="py-3.5 px-4 text-center">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trigo-100">
              {filteredInsumos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-chocolate-400">
                    No se encontraron insumos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredInsumos.map((item) => {
                  const isLowStock = item.activo && item.stock_actual <= item.stock_minimo;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-crema/25 transition-colors ${
                        isLowStock ? 'bg-frambuesa-50/30' : ''
                      }`}
                    >
                      {/* Nombre & Categoría */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <span title="Alerta: Stock Bajo">
                              <AlertTriangle className="w-4 h-4 text-frambuesa-500 flex-shrink-0 animate-pulse" />
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-chocolate-900 text-xs leading-snug">
                              {item.nombre}
                            </p>
                            <p className="text-[11px] text-chocolate-500 font-medium">
                              {item.categoria}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Presentación */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-chocolate-700">
                        <span className="font-semibold">{item.unidad_compra}</span>
                        <span className="text-gray-400 text-[11px] block">
                          ({formatUnit(item.presentacion_empaque, item.unidad_base)})
                        </span>
                      </td>

                      {/* Precio de Compra */}
                      <td className="py-3.5 px-4 text-right font-semibold text-chocolate-800 whitespace-nowrap">
                        {formatCurrency(item.precio_compra)}
                      </td>

                      {/* Costo Unitario Base */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-extrabold text-frambuesa-700 text-xs">
                          {formatCurrency(item.costo_unitario_base)}
                        </span>
                        <span className="text-gray-400 text-[10px] block">
                          / {item.unidad_base}
                        </span>
                      </td>

                      {/* Stock Actual con Badge Frambuesa */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isLowStock ? (
                          <Badge variant="frambuesa" size="md" dot>
                            {formatUnit(item.stock_actual, item.unidad_base)}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="md">
                            {formatUnit(item.stock_actual, item.unidad_base)}
                          </Badge>
                        )}
                      </td>

                      {/* Stock Mínimo */}
                      <td className="py-3.5 px-4 text-center text-gray-500 whitespace-nowrap">
                        {formatUnit(item.stock_minimo, item.unidad_base)}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reabastecer */}
                          <button
                            onClick={() => setRestockInsumo(item)}
                            title="Reabastecer stock de insumo"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          {/* Merma */}
                          <button
                            onClick={() => setWasteInsumo(item)}
                            title="Registrar merma o daño"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setEditingInsumo(item);
                              setIsFormOpen(true);
                            }}
                            title="Editar insumo y precios"
                            className="p-1.5 rounded-lg bg-gray-50 text-chocolate-600 hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Deseas eliminar el insumo "${item.nombre}"?`)) {
                                deleteInsumo(item.id);
                              }
                            }}
                            title="Eliminar insumo"
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {isFormOpen && (
        <InsumoFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingInsumo(null);
          }}
          initialInsumo={editingInsumo}
          onSave={(data) => {
            if (editingInsumo) {
              updateInsumo(editingInsumo.id, data);
            } else {
              addInsumo(data);
            }
          }}
        />
      )}

      {restockInsumo && (
        <RestockModal
          isOpen={!!restockInsumo}
          onClose={() => setRestockInsumo(null)}
          insumo={restockInsumo}
          onRestock={reabastecerInsumo}
        />
      )}

      {wasteInsumo && (
        <WasteModal
          isOpen={!!wasteInsumo}
          onClose={() => setWasteInsumo(null)}
          insumo={wasteInsumo}
          onSaveMerma={addMerma}
        />
      )}

      {isWasteHistoryOpen && (
        <WasteHistoryModal
          isOpen={isWasteHistoryOpen}
          onClose={() => setIsWasteHistoryOpen(false)}
          mermas={mermas}
        />
      )}
    </div>
  );
};
