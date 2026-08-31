import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Cotizacion,
  CotizacionItem,
  CotizacionExtra,
  Receta,
  Insumo,
} from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import { calcularCostosReceta } from '../../utils/calculations';
import { Plus, Trash2, Cake, Gift, Search, ChevronDown, Check } from 'lucide-react';

interface QuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cotizacion: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>) => void;
  recetas: Receta[];
  insumosMap: Map<number, Insumo>;
  initialCotizacion?: Cotizacion | null;
}

export const OPCIONES_MASA = [
  'Ninguna / Estándar de la Receta',
  'Vainilla Francesa Tradicional',
  'Red Velvet Aterciopelado',
  'Chocolate Suizo 56% Belga',
  'Zanahoria, Nuez y Especias de Ceilán',
  'Almendras y Frutos del Bosque',
  'Naranja y Semillas de Amapola',
  'Masa Tradicional de Tres Leches',
  'Masa Húmeda de Brownie Fudgy',
  'Masa de Galleta Choco-Chips',
  'Masa Hojaldrada / Brioche',
];

export const OPCIONES_RELLENO = [
  'Ninguno / Sin Relleno',
  'Dulce de Leche / Arequipe Artesanal Repostero',
  'Frosting de Queso Crema Philadelphia',
  'Ganache Sedoso de Chocolate Semiamargo 56%',
  'Compota Rústica de Frutos Rojos Silvestres',
  'Crema Pastelera Artesanal de Vainilla',
  'Nutella Pura y Avellanas',
  'Caramelo Salado / Toffee Artesanal',
  'Reducción de Maracuyá Cítrico',
  'Buttercream Suizo de Vainilla',
];

export const OPCIONES_DECORACION = [
  'Ninguna / Acabado Rústico Natural (Sin Decorar)',
  'Baño de Caramelo Dorado al Punto Ámbar',
  'Drip Dorado Artesanal con Macarons y Fresas',
  'Naked Cake Rústico con Flores Naturales Comestibles',
  'Chantilly Suave con Virutas de Chocolate',
  'Buttercream Alisado Perfecto Bicolor',
  'Fondant Temático Personalizado con Figuras 3D',
  'Cubierta Espejo Brillante de Chocolate Belga',
  'Glaseado Real / Azúcar Glass Espolvoreado',
];

const EXTRAS_DISPONIBLES: CotizacionExtra[] = [
  { id: 'topper', nombre: "Topper Acrílico 'Feliz Cumpleaños' / Personalizado", precio: 250 },
  { id: 'caja_lujo', nombre: 'Caja de Lujo con Ventana y Lazo Satinado Frambuesa', precio: 175 },
  { id: 'vela_volcan', nombre: 'Vela Volcán Chispas Doradas', precio: 120 },
  { id: 'tarjeta_dedicatoria', nombre: 'Tarjeta Artesanal con Caligrafía Manual', precio: 90 },
  { id: 'macarons_extra', nombre: 'Set de 4 Macarons de Frambuesa y Pistacho Extra', precio: 290 },
];

export const QuoteBuilderModal: React.FC<QuoteBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recetas,
  insumosMap,
  initialCotizacion,
}) => {
  // Datos del Cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [validezDias, setValidezDias] = useState<number>(5);
  const [costoEnvio, setCostoEnvio] = useState<number | ''>(0);
  const [descuento, setDescuento] = useState<number | ''>(0);
  const [notas, setNotas] = useState('');

  // Item a configurar (Wizard)
  const [selectedRecetaId, setSelectedRecetaId] = useState<number>(recetas[0]?.id || 1);
  const [searchProductTerm, setSearchProductTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [tamanoPorciones, setTamanoPorciones] = useState('1 LB (16-20 porciones)');
  const [factorReceta, setFactorReceta] = useState<number>(1);
  const [masaBase, setMasaBase] = useState(OPCIONES_MASA[0]);
  const [relleno, setRelleno] = useState(OPCIONES_RELLENO[0]);
  const [decoracion, setDecoracion] = useState(OPCIONES_DECORACION[0]);
  const [dedicatoria, setDedicatoria] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioBaseManual, setPrecioBaseManual] = useState<number | ''>('');

  // Lista de items de la cotización
  const [items, setItems] = useState<CotizacionItem[]>([]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialCotizacion) {
      setClienteNombre(initialCotizacion.cliente_nombre);
      setClienteTelefono(initialCotizacion.cliente_telefono);
      setClienteEmail(initialCotizacion.cliente_email || '');
      setFechaEvento(initialCotizacion.fecha_evento || '');
      setValidezDias(initialCotizacion.validez_dias || 5);
      setCostoEnvio(initialCotizacion.costo_envio || 0);
      setDescuento(initialCotizacion.descuento || 0);
      setNotas(initialCotizacion.notas || '');
      setItems(initialCotizacion.items);
    } else {
      setClienteNombre('');
      setClienteTelefono('');
      setClienteEmail('');
      setFechaEvento('');
      setValidezDias(5);
      setCostoEnvio(0);
      setDescuento(0);
      setNotas('');
      setItems([]);
    }
  }, [initialCotizacion, isOpen]);

  // Receta seleccionada actual
  const currentReceta = useMemo(() => {
    return recetas.find((r) => r.id === selectedRecetaId) || recetas[0];
  }, [recetas, selectedRecetaId]);

  // Inicializar nombre del producto en el input
  useEffect(() => {
    if (currentReceta && !searchProductTerm) {
      setSearchProductTerm(currentReceta.nombre);
    }
  }, [currentReceta]);

  // Filtro inteligente de recetas
  const filteredRecetas = useMemo(() => {
    if (!searchProductTerm.trim()) return recetas;
    const term = searchProductTerm.toLowerCase();
    return recetas.filter(
      (r) =>
        r.nombre.toLowerCase().includes(term) ||
        r.categoria.toLowerCase().includes(term) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(term))
    );
  }, [recetas, searchProductTerm]);

  const handleSelectReceta = (receta: Receta) => {
    setSelectedRecetaId(receta.id);
    setSearchProductTerm(receta.nombre);
    setIsProductDropdownOpen(false);
    if (receta.rendimiento_unidad) {
      setTamanoPorciones(receta.rendimiento_unidad);
    }
  };

  // Cálculo de precio sugerido automático para el item
  const calcReceta = currentReceta
    ? calcularCostosReceta(currentReceta, insumosMap, factorReceta)
    : null;
  const precioSugeridoCalculado = calcReceta ? calcReceta.precio_sugerido_margen_venta : 1500;

  const precioUnitarioFinal =
    precioBaseManual !== '' && typeof precioBaseManual === 'number'
      ? precioBaseManual
      : precioSugeridoCalculado;

  const totalExtrasUnitario = selectedExtras.reduce((sum, extId) => {
    const ext = EXTRAS_DISPONIBLES.find((e) => e.id === extId);
    return sum + (ext ? ext.precio : 0);
  }, 0);

  const subtotalItemActual = (precioUnitarioFinal + totalExtrasUnitario) * cantidad;

  const handleAddItem = () => {
    if (!currentReceta) return;

    const extrasObj: CotizacionExtra[] = selectedExtras
      .map((id) => EXTRAS_DISPONIBLES.find((e) => e.id === id))
      .filter(Boolean) as CotizacionExtra[];

    const newItem: CotizacionItem = {
      id: `item-${Date.now()}`,
      receta_id: currentReceta.id,
      receta_nombre: currentReceta.nombre,
      tamano_porciones: tamanoPorciones,
      masa_base: masaBase,
      relleno,
      decoracion,
      dedicatoria: dedicatoria.trim(),
      extras: extrasObj,
      cantidad,
      precio_unitario: precioUnitarioFinal + totalExtrasUnitario,
      subtotal: subtotalItemActual,
      factor_receta: factorReceta,
    };

    setItems((prev) => [...prev, newItem]);

    // Limpiar dedicatoria y extras para el siguiente item
    setDedicatoria('');
    setSelectedExtras([]);
    setCantidad(1);
    setPrecioBaseManual('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotalCotizacion = items.reduce((sum, i) => sum + i.subtotal, 0);
  const envioNum = typeof costoEnvio === 'number' ? costoEnvio : 0;
  const descNum = typeof descuento === 'number' ? descuento : 0;
  const totalCotizacion = Math.max(0, subtotalCotizacion + envioNum - descNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || !clienteTelefono.trim() || items.length === 0) {
      alert('Por favor agrega los datos del cliente y al menos un producto a la cotización.');
      return;
    }

    onSave({
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      cliente_email: clienteEmail.trim(),
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_evento: fechaEvento || undefined,
      validez_dias: validezDias,
      items,
      subtotal: subtotalCotizacion,
      descuento: descNum,
      costo_envio: envioNum,
      total: totalCotizacion,
      notas: notas.trim(),
      estado: initialCotizacion ? initialCotizacion.estado : 'pendiente',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCotizacion ? 'Editar Cotización' : 'Generador Interactivo de Cotizaciones'}
      subtitle="Configurador rápido: Búsqueda de Producto + Porciones + Relleno/Masa Opcional + Extras"
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Datos del Cliente */}
        <div className="bg-crema/40 p-4 rounded-2xl border border-trigo-200 space-y-3">
          <h3 className="text-xs font-bold text-chocolate-800 uppercase tracking-wider">
            1. Datos del Cliente & Evento
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Valeria Morales"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                WhatsApp / Teléfono *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (809) 555-0142"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Fecha del Evento (Opcional)
              </label>
              <input
                type="date"
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white text-chocolate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                Validez de Cotización (Días)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={validezDias}
                onChange={(e) => setValidezDias(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white text-chocolate-900 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 2. Configurador Interactivo de Producto */}
        <div className="bg-white p-5 rounded-2xl border-2 border-trigo-300 shadow-warm space-y-4">
          <div className="flex items-center justify-between border-b border-trigo-100 pb-3">
            <h3 className="text-sm font-bold text-chocolate-800 uppercase tracking-wider flex items-center gap-2">
              <Cake className="w-4 h-4 text-frambuesa-500" />
              <span>2. Personalizar Producto Gastronómico</span>
            </h3>
            <span className="text-xs text-chocolate-600 font-medium">
              Cálculo de costo BOM en tiempo real
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Buscador & Selector de Producto / Receta */}
            <div className="sm:col-span-2 md:col-span-3 relative" ref={productDropdownRef}>
              <label className="block font-bold text-chocolate-700 mb-1">
                Buscar o Seleccionar Producto / Receta *
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-chocolate-400" />
                <input
                  type="text"
                  value={searchProductTerm}
                  onFocus={() => setIsProductDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchProductTerm(e.target.value);
                    setIsProductDropdownOpen(true);
                  }}
                  placeholder="Escribe el nombre del producto (ej. Quesillo, Red Velvet, Brownie, Galletas, Tres Leches)..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:border-frambuesa-500 focus:outline-none bg-canvas/30 font-bold text-chocolate-900 text-sm shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chocolate-500 hover:text-chocolate-800"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Menú Desplegable Flotante de Resultados Filtrados */}
              {isProductDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-2xl border-2 border-trigo-300 shadow-warm-xl max-h-64 overflow-y-auto divide-y divide-trigo-100 animate-scale-up">
                  {filteredRecetas.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No se encontró ningún producto con "{searchProductTerm}".
                    </div>
                  ) : (
                    filteredRecetas.map((r) => {
                      const isSelected = r.id === selectedRecetaId;
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelectReceta(r)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-frambuesa-50/80 text-frambuesa-900 font-bold'
                              : 'hover:bg-crema/60 text-chocolate-800'
                          }`}
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{r.nombre}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-trigo-100 text-chocolate-600 font-semibold border border-trigo-200">
                                {r.categoria}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              Rendimiento: {r.rendimiento_unidad}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-frambuesa-600 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Tamaño / Porciones y Factor */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Tamaño / Porciones *
              </label>
              <select
                value={tamanoPorciones}
                onChange={(e) => {
                  const val = e.target.value;
                  setTamanoPorciones(val);
                  if (val.includes('½ LB') || val.includes('0.5')) {
                    setFactorReceta(0.5);
                  } else if (val.includes('2 LB')) {
                    setFactorReceta(2);
                  } else if (val.includes('3 LB')) {
                    setFactorReceta(3);
                  } else {
                    setFactorReceta(1);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                <option value="1 Molde 22cm (10-12 porciones)">1 Molde 22cm (10-12 porciones) [Estándar]</option>
                <option value="1 Molde Bundt 24cm (12-14 porciones)">1 Molde Bundt 24cm (12-14 porciones)</option>
                <option value="½ LB (8-10 porciones)">½ LB (8-10 porciones) [0.5x]</option>
                <option value="1 LB (16-20 porciones)">1 LB (16-20 porciones) [1x]</option>
                <option value="2 LB (30-40 porciones)">2 LB (30-40 porciones) [2x]</option>
                <option value="3 LB (50+ porciones)">3 LB (50+ porciones) [3x]</option>
                <option value="12 unidades (Caja / Docena)">12 unidades (Caja / Docena)</option>
                <option value="24 unidades (Caja)">24 unidades (Caja)</option>
                <option value="Bandeja 12 porciones">Bandeja 12 porciones</option>
              </select>
            </div>

            {/* Masa Base (con opción Ninguna) */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Tipo de Masa / Bizcocho (Opcional)
              </label>
              <select
                value={masaBase}
                onChange={(e) => setMasaBase(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {OPCIONES_MASA.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Relleno (con opción Ninguno) */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Relleno Artesanal (Opcional)
              </label>
              <select
                value={relleno}
                onChange={(e) => setRelleno(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {OPCIONES_RELLENO.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Decoración (con opción Ninguna) */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Estilo de Decoración (Opcional)
              </label>
              <select
                value={decoracion}
                onChange={(e) => setDecoracion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {OPCIONES_DECORACION.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Cantidad de Unidades
              </label>
              <input
                type="number"
                min="1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-bold text-chocolate-900"
              />
            </div>

            {/* Precio Base Manual (Opcional) */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Precio Unitario Personalizado (RD$)
              </label>
              <input
                type="number"
                step="1"
                placeholder={`Sugerido: ${formatCurrency(precioSugeridoCalculado)}`}
                value={precioBaseManual}
                onChange={(e) =>
                  setPrecioBaseManual(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-semibold text-chocolate-900"
              />
            </div>

            {/* Dedicatoria */}
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block font-bold text-chocolate-700 mb-1">
                Dedicatoria / Mensaje Personalizado (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. ¡Feliz Cumpleaños Mariana! Que cumplas muchos más"
                value={dedicatoria}
                onChange={(e) => setDedicatoria(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none text-xs bg-white text-chocolate-900"
              />
            </div>

            {/* Extras */}
            <div className="sm:col-span-2 md:col-span-3 bg-canvas p-3.5 rounded-xl border border-trigo-200">
              <span className="block font-bold text-chocolate-700 mb-2 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-frambuesa-500" />
                <span>Adicionales & Extras Opcionales:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {EXTRAS_DISPONIBLES.map((extra) => {
                  const isChecked = selectedExtras.includes(extra.id);
                  return (
                    <label
                      key={extra.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-frambuesa-50 border-frambuesa-300 text-frambuesa-900 font-bold shadow-sm'
                          : 'bg-white border-trigo-200 text-chocolate-700 hover:bg-crema/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedExtras((prev) => prev.filter((id) => id !== extra.id));
                          } else {
                            setSelectedExtras((prev) => [...prev, extra.id]);
                          }
                        }}
                        className="rounded text-frambuesa-600 focus:ring-frambuesa-400"
                      />
                      <span className="flex-1">{extra.nombre}</span>
                      <span className="text-frambuesa-700 whitespace-nowrap font-bold">
                        +{formatCurrency(extra.precio)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Barra de Subtotal del Item y Botón Agregar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-trigo-200 bg-crema/40 p-3.5 rounded-xl">
            <div className="text-xs text-chocolate-700">
              <span>Precio Base Unitario: </span>
              <span className="font-bold text-chocolate-900">
                {formatCurrency(precioUnitarioFinal)}
              </span>
              {totalExtrasUnitario > 0 && (
                <span> + Extras: {formatCurrency(totalExtrasUnitario)}</span>
              )}
              <span className="text-sm font-extrabold text-frambuesa-600 ml-2">
                = {formatCurrency(subtotalItemActual)} (x{cantidad})
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold text-xs shadow-warm transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Producto a Cotización</span>
            </button>
          </div>
        </div>

        {/* 3. Items Añadidos a la Cotización */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-chocolate-800 uppercase tracking-wider">
            3. Resumen de Productos en esta Cotización ({items.length})
          </h3>

          {items.length === 0 ? (
            <div className="bg-canvas border-2 border-dashed border-trigo-300 rounded-2xl p-6 text-center text-xs text-chocolate-500">
              Aún no has añadido ningún producto. Selecciona o busca uno arriba y presiona "Añadir Producto a Cotización".
            </div>
          ) : (
            <div className="border border-trigo-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-crema text-chocolate-800 font-bold uppercase tracking-wider border-b border-trigo-200">
                  <tr>
                    <th className="py-2.5 px-3">Producto & Especificaciones</th>
                    <th className="py-2.5 px-3 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trigo-100 bg-white">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-crema/20">
                      <td className="py-3 px-3">
                        <p className="font-bold text-chocolate-900">{item.receta_nombre}</p>
                        <p className="text-[11px] text-chocolate-600">
                          {item.tamano_porciones}
                          {item.masa_base && !item.masa_base.toLowerCase().startsWith('ningun') && ` • Masa: ${item.masa_base}`}
                          {item.relleno && !item.relleno.toLowerCase().startsWith('ningun') && ` • Relleno: ${item.relleno}`}
                        </p>
                        {item.decoracion && !item.decoracion.toLowerCase().startsWith('ningun') && (
                          <p className="text-[11px] text-gray-500">
                            Decoración: {item.decoracion}
                          </p>
                        )}
                        {item.dedicatoria && (
                          <p className="text-[11px] text-frambuesa-700 italic">
                            Dedicatoria: "{item.dedicatoria}"
                          </p>
                        )}
                        {item.extras.length > 0 && (
                          <p className="text-[10px] text-trigo-700 font-medium mt-0.5">
                            + Extras: {item.extras.map((e) => e.nombre).join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-chocolate-800">
                        {item.cantidad}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600 font-semibold">
                        {formatCurrency(item.precio_unitario)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-chocolate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Resumen Financiero y Totales */}
        <div className="bg-canvas p-4 rounded-2xl border border-trigo-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-chocolate-700 mb-1">
              Descuento Especial (RD$)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={descuento}
              onChange={(e) =>
                setDescuento(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-chocolate-700 mb-1">
              Costo de Envío / Entrega (RD$)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={costoEnvio}
              onChange={(e) =>
                setCostoEnvio(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col justify-center items-end text-right">
            <span className="text-gray-500">Subtotal: {formatCurrency(subtotalCotizacion)}</span>
            {descNum > 0 && (
              <span className="text-emerald-700 font-semibold">
                Descuento: -{formatCurrency(descNum)}
              </span>
            )}
            {envioNum > 0 && (
              <span className="text-chocolate-700">Envío: +{formatCurrency(envioNum)}</span>
            )}
            <div className="text-lg sm:text-xl font-black text-chocolate-900 mt-1">
              <span>Total Cotización: </span>
              <span className="text-frambuesa-600">{formatCurrency(totalCotizacion)}</span>
            </div>
          </div>

          <div className="sm:col-span-2 md:col-span-4">
            <label className="block font-semibold text-chocolate-700 mb-1">
              Notas Adicionales / Instrucciones Especiales
            </label>
            <textarea
              rows={2}
              placeholder="Instrucciones sobre alérgenos, horario preferido de entrega o requerimientos del cliente..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs bg-white"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-trigo-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-xs font-semibold text-chocolate-600 hover:bg-crema transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-xs shadow-frambuesa-glow hover:shadow-lg transition-all transform hover:scale-105"
          >
            {initialCotizacion ? 'Guardar Cambios' : 'Crear Cotización'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
