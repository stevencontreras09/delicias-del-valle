import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { OpcionConfigurable } from './QuoteBuilderModal';
import { CotizacionExtra } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2, Edit2, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';

export type CategoriaOpcion = 'masas' | 'rellenos' | 'decoraciones' | 'extras';

interface OptionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CategoriaOpcion;
  masas: OpcionConfigurable[];
  rellenos: OpcionConfigurable[];
  decoraciones: OpcionConfigurable[];
  extras: CotizacionExtra[];
  onSave: (data: {
    masas: OpcionConfigurable[];
    rellenos: OpcionConfigurable[];
    decoraciones: OpcionConfigurable[];
    extras: CotizacionExtra[];
  }) => void;
  onResetDefaults: () => void;
}

export const OptionsManagerModal: React.FC<OptionsManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'masas',
  masas: initialMasas,
  rellenos: initialRellenos,
  decoraciones: initialDecoraciones,
  extras: initialExtras,
  onSave,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<CategoriaOpcion>(initialTab);

  const [masas, setMasas] = useState<OpcionConfigurable[]>(initialMasas);
  const [rellenos, setRellenos] = useState<OpcionConfigurable[]>(initialRellenos);
  const [decoraciones, setDecoraciones] = useState<OpcionConfigurable[]>(initialDecoraciones);
  const [extras, setExtras] = useState<CotizacionExtra[]>(initialExtras);

  // Sincronizar estado cuando se abre el modal o cambian los items
  useEffect(() => {
    if (isOpen) {
      setMasas(initialMasas);
      setRellenos(initialRellenos);
      setDecoraciones(initialDecoraciones);
      setExtras(initialExtras);
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, initialMasas, initialRellenos, initialDecoraciones, initialExtras]);

  // Estado para crear nueva opción
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>(0);
  const [newDesc, setNewDesc] = useState('');

  // Estado para editar opción existente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>(0);
  const [editDesc, setEditDesc] = useState('');

  const handleStartEdit = (item: OpcionConfigurable | CotizacionExtra) => {
    setEditingId(item.id);
    setEditName(item.nombre);
    setEditPrice('precio_adicional_base' in item ? item.precio_adicional_base : item.precio);
    setEditDesc('descripcion' in item ? (item.descripcion || '') : '');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    const finalPrice = typeof editPrice === 'number' ? editPrice : 0;

    if (activeTab === 'masas') {
      setMasas(prev => prev.map(m => m.id === editingId ? { ...m, nombre: editName.trim(), precio_adicional_base: finalPrice, descripcion: editDesc.trim() } : m));
    } else if (activeTab === 'rellenos') {
      setRellenos(prev => prev.map(r => r.id === editingId ? { ...r, nombre: editName.trim(), precio_adicional_base: finalPrice, descripcion: editDesc.trim() } : r));
    } else if (activeTab === 'decoraciones') {
      setDecoraciones(prev => prev.map(d => d.id === editingId ? { ...d, nombre: editName.trim(), precio_adicional_base: finalPrice, descripcion: editDesc.trim() } : d));
    } else if (activeTab === 'extras') {
      setExtras(prev => prev.map(e => e.id === editingId ? { ...e, nombre: editName.trim(), precio: finalPrice } : e));
    }

    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'masas') {
      if (masas.length <= 1) return alert('Debes mantener al menos una opción');
      setMasas(prev => prev.filter(m => m.id !== id));
    } else if (activeTab === 'rellenos') {
      if (rellenos.length <= 1) return alert('Debes mantener al menos una opción');
      setRellenos(prev => prev.filter(r => r.id !== id));
    } else if (activeTab === 'decoraciones') {
      if (decoraciones.length <= 1) return alert('Debes mantener al menos una opción');
      setDecoraciones(prev => prev.filter(d => d.id !== id));
    } else if (activeTab === 'extras') {
      setExtras(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleCreateNew = () => {
    if (!newName.trim()) return;
    const finalPrice = typeof newPrice === 'number' ? newPrice : 0;
    const id = `${activeTab}_${Date.now()}`;

    if (activeTab === 'extras') {
      setExtras(prev => [...prev, { id, nombre: newName.trim(), precio: finalPrice }]);
    } else {
      const newOption: OpcionConfigurable = {
        id,
        nombre: newName.trim(),
        precio_adicional_base: finalPrice,
        descripcion: newDesc.trim() || undefined,
      };
      if (activeTab === 'masas') setMasas(prev => [...prev, newOption]);
      if (activeTab === 'rellenos') setRellenos(prev => [...prev, newOption]);
      if (activeTab === 'decoraciones') setDecoraciones(prev => [...prev, newOption]);
    }

    setNewName('');
    setNewPrice(0);
    setNewDesc('');
    setIsAdding(false);
  };

  const handleApplyAll = () => {
    onSave({ masas, rellenos, decoraciones, extras });
    onClose();
  };

  const currentItems = activeTab === 'masas' ? masas : activeTab === 'rellenos' ? rellenos : activeTab === 'decoraciones' ? decoraciones : extras;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚙️ Gestionar Opciones del Cotizador"
      subtitle="Edita, agrega o elimina masas, rellenos, coberturas y extras opcionales con sus precios en RD$"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Pestañas de Navegación de Opciones */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-canvas border border-trigo-200 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('masas'); setEditingId(null); setIsAdding(false); }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'masas' ? 'bg-chocolate-700 text-white shadow-sm' : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            Masa / Bizcocho ({masas.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('rellenos'); setEditingId(null); setIsAdding(false); }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rellenos' ? 'bg-chocolate-700 text-white shadow-sm' : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            Relleno Artesanal ({rellenos.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('decoraciones'); setEditingId(null); setIsAdding(false); }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'decoraciones' ? 'bg-chocolate-700 text-white shadow-sm' : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            Decoración & Cobertura ({decoraciones.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('extras'); setEditingId(null); setIsAdding(false); }}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'extras' ? 'bg-chocolate-700 text-white shadow-sm' : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            Adicionales & Extras ({extras.length})
          </button>
        </div>

        {/* Acciones Superiores: Agregar y Restablecer */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Cancelar Nueva' : 'Agregar Nueva Opción'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('¿Deseas restablecer todas las opciones a los valores iniciales de fábrica?')) {
                onResetDefaults();
                onClose();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-chocolate-500 hover:text-chocolate-800 hover:bg-crema rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Valores de Fábrica</span>
          </button>
        </div>

        {/* Formulario de Nueva Opción */}
        {isAdding && (
          <div className="p-4 rounded-2xl bg-crema/40 border border-trigo-300 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-chocolate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-frambuesa-500" />
              Nueva Opción para {activeTab === 'masas' ? 'Masa' : activeTab === 'rellenos' ? 'Relleno' : activeTab === 'decoraciones' ? 'Decoración' : 'Extra'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-chocolate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Dulce de Guayaba & Queso, Baño Espejo Dorado, etc."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-trigo-300 text-xs text-chocolate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-chocolate-700 mb-1">Precio Adicional (RD$) *</label>
                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-trigo-300 text-xs font-bold text-chocolate-900 bg-white"
                />
              </div>
            </div>
            {activeTab !== 'extras' && (
              <div>
                <label className="block text-[11px] font-bold text-chocolate-700 mb-1">Descripción / Detalle (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Mermelada artesanal con trozos naturales"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-trigo-300 text-xs text-chocolate-900 bg-white"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 text-xs text-chocolate-700 font-bold hover:bg-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={!newName.trim()}
                className="px-4 py-1.5 rounded-xl bg-chocolate-700 text-white text-xs font-bold hover:bg-chocolate-800 disabled:opacity-50"
              >
                Guardar Opción
              </button>
            </div>
          </div>
        )}

        {/* Lista de Opciones Actuales */}
        <div className="max-h-80 overflow-y-auto divide-y divide-trigo-100 border border-trigo-200 rounded-2xl bg-white shadow-inner">
          {currentItems.map((item) => {
            const isEditing = editingId === item.id;
            const price = 'precio_adicional_base' in item ? item.precio_adicional_base : item.precio;
            const desc = 'descripcion' in item ? item.descripcion : '';

            if (isEditing) {
              return (
                <div key={item.id} className="p-3 bg-amber-50/50 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-trigo-300 text-xs font-bold text-chocolate-900 bg-white"
                    />
                    <input
                      type="number"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="px-2.5 py-1.5 rounded-lg border border-trigo-300 text-xs font-bold text-chocolate-900 bg-white"
                    />
                  </div>
                  {activeTab !== 'extras' && (
                    <input
                      type="text"
                      placeholder="Descripción opcional"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border border-trigo-200 text-xs text-chocolate-700 bg-white"
                    />
                  )}
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Guardar
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-crema/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-chocolate-900">{item.nombre}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      price > 0 ? 'bg-frambuesa-100 text-frambuesa-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {price > 0 ? `+${formatCurrency(price)}` : 'Incluido (RD$ 0)'}
                    </span>
                  </div>
                  {desc && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{desc}</p>}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    title="Editar opción"
                    className="p-1.5 rounded-lg text-chocolate-600 hover:bg-crema transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Eliminar opción"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between pt-2 border-t border-trigo-200">
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-chocolate-400" />
            Los cambios se guardan localmente para tus cotizaciones.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-chocolate-700 hover:bg-crema"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleApplyAll}
              className="px-5 py-2 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white text-xs font-bold shadow-sm transition-all"
            >
              Aplicar y Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
