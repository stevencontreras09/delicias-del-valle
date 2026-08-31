import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Receta } from '../../types';
import {
  Plus,
  Search,
  BookOpen,
  Scale,
  Clock,
  Flame,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { calcularCostosReceta } from '../../utils/calculations';
import { Badge } from '../ui/Badge';
import { RecipeDetailModal } from './RecipeDetailModal';
import { RecipeFormModal } from './RecipeFormModal';

export const RecipeManager: React.FC = () => {
  const {
    recetas,
    insumos,
    insumosMap,
    addReceta,
    updateReceta,
    deleteReceta,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState<Receta | null>(null);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);

  // Categorías
  const categories = useMemo(() => {
    const set = new Set<string>();
    recetas.forEach((r) => set.add(r.categoria));
    return Array.from(set).sort();
  }, [recetas]);

  // Filtrado reactivo
  const filteredRecetas = useMemo(() => {
    return recetas.filter((r) => {
      const matchesSearch =
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.rendimiento_unidad.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || r.categoria === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [recetas, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Recetario Maestro & Escandallos (BOM)
            </h1>
            <span className="bg-crema text-chocolate-800 text-xs font-bold px-3 py-1 rounded-full border border-trigo-300">
              {recetas.length} Recetas
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Estructura Bill of Materials (BOM), costeo en cascada, escalador dinámico y rentabilidad.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReceta(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold shadow-frambuesa-glow transition-all transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Receta BOM</span>
        </button>
      </div>

      {/* Buscador y Categorías */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-trigo-200 shadow-warm space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar receta por nombre (ej. Torta Chocolate, Red Velvet, Croissant)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-trigo-200 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-xs text-panadero bg-canvas/40"
          />
        </div>

        {/* Píldoras de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-chocolate-700 text-white shadow-sm'
                : 'bg-canvas text-chocolate-600 hover:bg-crema border border-trigo-200'
            }`}
          >
            Todas ({recetas.length})
          </button>
          {categories.map((cat) => {
            const count = recetas.filter((r) => r.categoria === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-chocolate-700 text-white shadow-sm'
                    : 'bg-canvas text-chocolate-600 hover:bg-crema border border-trigo-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Recetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecetas.map((receta) => {
          const costData = calcularCostosReceta(receta, insumosMap, 1);
          const fijosCount = receta.ingredientes.filter((i) => i.tipo === 'fijo').length;
          const varCount = receta.ingredientes.filter((i) => i.tipo === 'variable').length;

          return (
            <div
              key={receta.id}
              className="bg-white rounded-3xl border border-trigo-200 shadow-warm hover:shadow-warm-lg transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Encabezado */}
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="trigo" size="sm">
                    {receta.categoria}
                  </Badge>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {receta.margen_beneficio_pct}% Margen
                  </span>
                </div>

                <h3 className="text-base font-bold text-chocolate-900 group-hover:text-frambuesa-600 transition-colors line-clamp-1">
                  {receta.nombre}
                </h3>

                <p className="text-xs text-chocolate-500 font-medium mt-1">
                  Rendimiento: <b className="text-chocolate-800">{receta.rendimiento_unidad}</b>
                </p>

                {/* Tiempos de Taller */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-trigo-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-chocolate-500" />
                    Prep: {receta.tiempo_preparacion_min}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-frambuesa-500" />
                    Horno: {receta.tiempo_horneado_min}m ({receta.temperatura_horno_c}°C)
                  </span>
                </div>

                {/* Resumen de Ingredientes */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    BOM: <b>{fijosCount}</b> fijos + <b>{varCount}</b> variables
                  </span>
                  <span className="text-[11px] font-semibold text-chocolate-700">
                    {receta.ingredientes.length} items
                  </span>
                </div>
              </div>

              {/* Pie de Tarjeta Financiero */}
              <div className="bg-crema/40 p-4 border-t border-trigo-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Costo Producción (CTP):</span>
                    <span className="text-sm font-black text-chocolate-900">
                      {formatCurrency(costData.costo_total_produccion)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-800 font-bold block text-[11px]">
                      Precio Sugerido:
                    </span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {formatCurrency(costData.precio_sugerido_margen_venta)}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedReceta(receta)}
                    className="flex-1 py-2 px-3 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ver Escandallo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingReceta(receta);
                      setIsFormOpen(true);
                    }}
                    title="Editar receta"
                    className="p-2 rounded-xl bg-white border border-trigo-300 hover:bg-crema text-chocolate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`¿Deseas eliminar la receta "${receta.nombre}"?`)) {
                        deleteReceta(receta.id);
                      }
                    }}
                    title="Eliminar receta"
                    className="p-2 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      {selectedReceta && (
        <RecipeDetailModal
          isOpen={!!selectedReceta}
          onClose={() => setSelectedReceta(null)}
          receta={selectedReceta}
          insumosMap={insumosMap}
          onEdit={(r) => {
            setEditingReceta(r);
            setIsFormOpen(true);
          }}
        />
      )}

      {isFormOpen && (
        <RecipeFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingReceta(null);
          }}
          insumos={insumos}
          initialReceta={editingReceta}
          onSave={(data) => {
            if (editingReceta) {
              updateReceta(editingReceta.id, data);
            } else {
              addReceta(data);
            }
          }}
        />
      )}
    </div>
  );
};
