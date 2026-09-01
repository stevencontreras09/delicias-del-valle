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
import { Plus, Trash2, Cake, Gift, Search, ChevronDown, Check, Sparkles, Package } from 'lucide-react';

interface QuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cotizacion: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>) => void;
  recetas: Receta[];
  insumosMap: Map<number, Insumo>;
  initialCotizacion?: Cotizacion | null;
}

export interface OpcionConfigurable {
  id: string;
  nombre: string;
  precio_adicional_base: number; // en RD$ (para tamaño estándar 1 LB / 1x)
  descripcion?: string;
}

export const OPCIONES_MASA_DETALLADAS: OpcionConfigurable[] = [
  { id: 'masa_estandar', nombre: 'Ninguna / Estándar de la Receta', precio_adicional_base: 0, descripcion: 'Masa base incluida en la receta original' },
  { id: 'masa_vainilla', nombre: 'Vainilla Francesa Tradicional', precio_adicional_base: 0, descripcion: 'Bizcochuelo clásico con vainilla pura' },
  { id: 'masa_red_velvet', nombre: 'Red Velvet Aterciopelado', precio_adicional_base: 250, descripcion: 'Cacao holandés, buttermilk y colorante carmín' },
  { id: 'masa_chocolate', nombre: 'Chocolate Suizo 56% Belga', precio_adicional_base: 350, descripcion: 'Bizcocho intenso con chocolate puro fundido' },
  { id: 'masa_zanahoria', nombre: 'Zanahoria, Nuez y Especias de Ceilán', precio_adicional_base: 300, descripcion: 'Zanahoria fresca, nueces de nogal y canela fina' },
  { id: 'masa_almendras', nombre: 'Almendras y Frutos del Bosque', precio_adicional_base: 400, descripcion: 'Harina de almendras extra fina y arándanos silvestres' },
  { id: 'masa_naranja', nombre: 'Naranja y Semillas de Amapola', precio_adicional_base: 200, descripcion: 'Zumo y ralladura de naranja natural con semillas' },
  { id: 'masa_tres_leches', nombre: 'Masa Tradicional de Tres Leches', precio_adicional_base: 150, descripcion: 'Bizcochuelo absorbente ultra aireado' },
  { id: 'masa_brownie', nombre: 'Masa Húmeda de Brownie Fudgy', precio_adicional_base: 350, descripcion: 'Base densa y melcochuda de chocolate real' },
  { id: 'masa_galleta', nombre: 'Masa de Galleta Choco-Chips', precio_adicional_base: 200, descripcion: 'Masa estilo galletera con trozos de chocolate' },
  { id: 'masa_brioche', nombre: 'Masa Hojaldrada / Brioche Francés', precio_adicional_base: 250, descripcion: 'Masa enriquecida con mantequilla pura' },
];

export const OPCIONES_RELLENO_DETALLADAS: OpcionConfigurable[] = [
  { id: 'relleno_ninguno', nombre: 'Ninguno / Sin Relleno', precio_adicional_base: 0, descripcion: 'Sin capas de relleno' },
  { id: 'relleno_arequipe', nombre: 'Dulce de Leche / Arequipe Repostero', precio_adicional_base: 250, descripcion: 'Arequipe artesanal denso y cremoso' },
  { id: 'relleno_queso_crema', nombre: 'Frosting de Queso Crema Philadelphia', precio_adicional_base: 350, descripcion: 'Queso crema auténtico, suave y equilibrado' },
  { id: 'relleno_ganache', nombre: 'Ganache Sedoso de Chocolate 56%', precio_adicional_base: 380, descripcion: 'Emulsión de chocolate amargo con crema 35%' },
  { id: 'relleno_frutos_rojos', nombre: 'Compota Rústica de Frutos Rojos Silvestres', precio_adicional_base: 320, descripcion: 'Fresas, moras y frambuesas reducidas al fuego' },
  { id: 'relleno_crema_pastelera', nombre: 'Crema Pastelera Artesanal de Vainilla', precio_adicional_base: 200, descripcion: 'Leche entera, yemas frescas y vainilla de Madagascar' },
  { id: 'relleno_nutella', nombre: 'Nutella Pura y Avellanas Tostadas', precio_adicional_base: 450, descripcion: 'Crema original de cacao y avellanas' },
  { id: 'relleno_toffee', nombre: 'Caramelo Salado / Toffee Artesanal', precio_adicional_base: 220, descripcion: 'Caramelo cocido con mantequilla y flor de sal' },
  { id: 'relleno_maracuya', nombre: 'Reducción de Maracuyá Cítrico', precio_adicional_base: 260, descripcion: 'Pulpas de chinola fresca con notas ácidas balanceadas' },
  { id: 'relleno_buttercream', nombre: 'Buttercream Suizo de Vainilla', precio_adicional_base: 220, descripcion: 'Merengue suizo emulsionado con mantequilla' },
];

export const OPCIONES_DECORACION_DETALLADAS: OpcionConfigurable[] = [
  { id: 'deco_ninguna', nombre: 'Ninguna / Acabado Rústico Natural (Sin Decorar)', precio_adicional_base: 0, descripcion: 'Presentación natural de horneado' },
  { id: 'deco_caramelo', nombre: 'Baño de Caramelo Dorado al Punto Ámbar', precio_adicional_base: 150, descripcion: 'Caramelo fluido y brillante para quesillos y flanes' },
  { id: 'deco_azucar', nombre: 'Glaseado Real / Azúcar Glass Espolvoreado', precio_adicional_base: 100, descripcion: 'Fina lluvia de azúcar micropulverizada' },
  { id: 'deco_chantilly', nombre: 'Chantilly Suave con Virutas de Chocolate', precio_adicional_base: 250, descripcion: 'Crema batida fresca y ralladura de chocolate' },
  { id: 'deco_buttercream_alisado', nombre: 'Buttercream Alisado Perfecto Bicolor', precio_adicional_base: 350, descripcion: 'Alisado profesional en bordes rectos y degradé' },
  { id: 'deco_drip_macarons', nombre: 'Drip Dorado Artesanal con Macarons y Fresas', precio_adicional_base: 550, descripcion: 'Goteo de chocolate dorado, macarons franceses y fresas' },
  { id: 'deco_naked_flores', nombre: 'Naked Cake Rústico con Flores Naturales Comestibles', precio_adicional_base: 450, descripcion: 'Acabado semi-desnudo con flores orgánicas' },
  { id: 'deco_espejo', nombre: 'Cubierta Espejo Brillante de Chocolate Belga', precio_adicional_base: 500, descripcion: 'Glaseado espejo ultra reflectivo de alta pastelería' },
  { id: 'deco_fondant_3d', nombre: 'Fondant Temático Personalizado con Figuras 3D', precio_adicional_base: 850, descripcion: 'Modelado artesanal manual en pasta de azúcar' },
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
  const [customMiniCount, setCustomMiniCount] = useState<number>(24);
  const [isCustomMiniSelected, setIsCustomMiniSelected] = useState<boolean>(false);
  const [masaBase, setMasaBase] = useState(OPCIONES_MASA_DETALLADAS[0].nombre);
  const [relleno, setRelleno] = useState(OPCIONES_RELLENO_DETALLADAS[0].nombre);
  const [decoracion, setDecoracion] = useState(OPCIONES_DECORACION_DETALLADAS[0].nombre);
  const [dedicatoria, setDedicatoria] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioBaseManual, setPrecioBaseManual] = useState<number | ''>('');

  const handleCustomMiniQuoteChange = (count: number) => {
    const validCount = Math.max(1, count);
    setCustomMiniCount(validCount);
    const factor = Number((validCount * (0.35 / 12)).toFixed(3));
    setFactorReceta(factor);
    setTamanoPorciones(`${validCount} Mini Bocaditos (${factor}x)`);
  };

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

  // Inicializar nombre del producto en el buscador
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

  // =========================================================================
  // CÁLCULO DINÁMICO DE COSTO BOM + MASA + RELLENO + DECORACIÓN ESCALADOS
  // =========================================================================
  const calcReceta = currentReceta
    ? calcularCostosReceta(currentReceta, insumosMap, factorReceta)
    : null;
  const precioBaseRecetaCalculado = calcReceta ? calcReceta.precio_sugerido_margen_venta : 1500;

  // Costo adicional dinámico de la Masa
  const opcionMasaObj =
    OPCIONES_MASA_DETALLADAS.find((m) => m.nombre === masaBase) || OPCIONES_MASA_DETALLADAS[0];
  const costoMasa = (opcionMasaObj.precio_adicional_base || 0) * factorReceta;

  // Costo adicional dinámico del Relleno
  const opcionRellenoObj =
    OPCIONES_RELLENO_DETALLADAS.find((r) => r.nombre === relleno) || OPCIONES_RELLENO_DETALLADAS[0];
  const costoRelleno = (opcionRellenoObj.precio_adicional_base || 0) * factorReceta;

  // Costo adicional dinámico de la Decoración
  const opcionDecoObj =
    OPCIONES_DECORACION_DETALLADAS.find((d) => d.nombre === decoracion) || OPCIONES_DECORACION_DETALLADAS[0];
  const factorDeco = factorReceta >= 1 ? Math.min(2.5, factorReceta) : 0.7;
  const costoDecoracion = (opcionDecoObj.precio_adicional_base || 0) * factorDeco;

  // Extras adicionales por unidad
  const totalExtrasUnitario = selectedExtras.reduce((sum, extId) => {
    const ext = EXTRAS_DISPONIBLES.find((e) => e.id === extId);
    return sum + (ext ? ext.precio : 0);
  }, 0);

  // Precio Sugerido Total con todas las personalizaciones
  const precioSugeridoConPersonalizacion =
    precioBaseRecetaCalculado + costoMasa + costoRelleno + costoDecoracion;

  // Precio Unitario Final (manual o calculado)
  const precioUnitarioFinal =
    precioBaseManual !== '' && typeof precioBaseManual === 'number'
      ? precioBaseManual
      : precioSugeridoConPersonalizacion;

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
      subtitle="Configurador dinámico: Producto + Masa + Relleno + Decoración con actualización de precio en vivo"
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
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ⚡ Precios y Costos Actualizados en Vivo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Buscador & Selector de Producto / Receta */}
            <div className="sm:col-span-2 md:col-span-3 relative" ref={productDropdownRef}>
              <label className="block font-bold text-chocolate-700 mb-1">
                Buscar o Seleccionar Producto / Receta Base *
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
                value={isCustomMiniSelected ? 'Personalizado Mini' : tamanoPorciones}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'Personalizado Mini') {
                    setIsCustomMiniSelected(true);
                    handleCustomMiniQuoteChange(customMiniCount);
                  } else {
                    setTamanoPorciones(val);
                    if (val.includes('Mini')) {
                      setIsCustomMiniSelected(true);
                      let initialCount = 12;
                      if (val.includes('24')) initialCount = 24;
                      else if (val.includes('50')) initialCount = 50;
                      else if (val.includes('100')) initialCount = 100;
                      setCustomMiniCount(initialCount);
                      const factor = Number((initialCount * (0.35 / 12)).toFixed(3));
                      setFactorReceta(factor);
                    } else {
                      setIsCustomMiniSelected(false);
                      if (val.includes('½ LB') || val.includes('Pack x 6')) {
                        setFactorReceta(0.5);
                      } else if (val.includes('2 LB') || val.includes('2x')) {
                        setFactorReceta(2.0);
                      } else if (val.includes('3 LB')) {
                        setFactorReceta(3.0);
                      } else if (val.includes('1 Porción Individual') || val.includes('0.08x')) {
                        setFactorReceta(0.0833);
                      } else if (val.includes('Pack x 4 Porciones') || val.includes('0.33x')) {
                        setFactorReceta(0.3333);
                      } else {
                        setFactorReceta(1.0);
                      }
                    }
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                <optgroup label="⚖️ Formato Libra (Pasteles & Moldes)">
                  <option value="½ LB (8-10 porciones)">½ LB (8-10 porciones) [0.5x]</option>
                  <option value="1 LB (16-20 porciones)">1 LB (16-20 porciones) [Estándar 1x]</option>
                  <option value="2 LB (30-40 porciones)">2 LB (30-40 porciones) [2x]</option>
                  <option value="3 LB (50+ porciones)">3 LB (50+ porciones) [3x]</option>
                  <option value="1 Molde 22cm (10-12 porciones)">1 Molde 22cm (10-12 porciones) [1x]</option>
                  <option value="1 Molde Bundt 24cm (12-14 porciones)">1 Molde Bundt 24cm (12-14 porciones) [1x]</option>
                </optgroup>
                <optgroup label="🍰 Formato Porción (Rebanadas & Platos)">
                  <option value="1 Porción Individual (Slice)">1 Porción Individual (Slice) [0.08x]</option>
                  <option value="Pack x 4 Porciones">Pack x 4 Porciones [0.33x]</option>
                  <option value="Pack x 6 Porciones">Pack x 6 Porciones [0.5x]</option>
                  <option value="Bandeja 12 porciones">Bandeja 12 porciones [1x]</option>
                </optgroup>
                <optgroup label="🧁 Formato Mini (Bocaditos & Mesa de Dulces)">
                  <option value="Caja x 12 Mini Bocaditos">Caja x 12 Mini Bocaditos [0.35x]</option>
                  <option value="Caja x 24 Mini Bocaditos">Caja x 24 Mini Bocaditos [0.70x]</option>
                  <option value="Caja x 50 Mini Bocaditos (Eventos)">Caja x 50 Mini Bocaditos (Eventos) [1.45x]</option>
                  <option value="Caja x 100 Mini Bocaditos (Banquete)">Caja x 100 Mini Bocaditos (Banquete) [2.90x]</option>
                  <option value="Personalizado Mini">🧁 Personalizado: Cantidad Exacta de Minis...</option>
                </optgroup>
              </select>

              {/* Editor de Cantidad Exacta de Minis si aplica */}
              {isCustomMiniSelected && (
                <div className="mt-2.5 p-3 rounded-2xl bg-canvas border border-trigo-300 animate-fade-in shadow-inner space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-chocolate-900 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-frambuesa-600" />
                      Cantidad Exacta de Minis:
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-trigo-200 text-chocolate-700">
                      Factor: {factorReceta.toFixed(3)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white rounded-xl border border-trigo-300 shadow-sm p-0.5">
                      <button
                        type="button"
                        onClick={() => handleCustomMiniQuoteChange(Math.max(1, customMiniCount - 1))}
                        className="w-7 h-7 flex items-center justify-center text-chocolate-700 hover:bg-crema active:scale-95 rounded-lg font-bold text-sm transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={customMiniCount}
                        onChange={(e) => handleCustomMiniQuoteChange(parseInt(e.target.value) || 1)}
                        className="w-16 text-center font-extrabold text-chocolate-900 focus:outline-none text-sm py-1 bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleCustomMiniQuoteChange(customMiniCount + 1)}
                        className="w-7 h-7 flex items-center justify-center text-chocolate-700 hover:bg-crema active:scale-95 rounded-lg font-bold text-sm transition-all"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-bold text-chocolate-700">minis</span>

                    <div className="flex items-center gap-1 ml-auto overflow-x-auto">
                      {[12, 24, 30, 36, 50, 75, 100].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleCustomMiniQuoteChange(n)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                            customMiniCount === n
                              ? 'bg-frambuesa-500 text-white border-frambuesa-600 shadow-sm'
                              : 'bg-white text-chocolate-700 border-trigo-200 hover:bg-crema'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Masa con Precio Dinámico */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Tipo de Masa / Bizcocho
              </label>
              <select
                value={masaBase}
                onChange={(e) => setMasaBase(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {OPCIONES_MASA_DETALLADAS.map((m) => {
                  const addPrice = m.precio_adicional_base * factorReceta;
                  return (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre} {addPrice > 0 ? `(+${formatCurrency(addPrice)})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Relleno Artesanal con Precio Dinámico */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Relleno Artesanal
              </label>
              <select
                value={relleno}
                onChange={(e) => setRelleno(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {OPCIONES_RELLENO_DETALLADAS.map((r) => {
                  const addPrice = r.precio_adicional_base * factorReceta;
                  return (
                    <option key={r.id} value={r.nombre}>
                      {r.nombre} {addPrice > 0 ? `(+${formatCurrency(addPrice)})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Estilo de Decoración con Precio Dinámico */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Estilo de Decoración & Cobertura
              </label>
              <select
                value={decoracion}
                onChange={(e) => setDecoracion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {OPCIONES_DECORACION_DETALLADAS.map((d) => {
                  const addPrice = d.precio_adicional_base * factorDeco;
                  return (
                    <option key={d.id} value={d.nombre}>
                      {d.nombre} {addPrice > 0 ? `(+${formatCurrency(addPrice)})` : ''}
                    </option>
                  );
                })}
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

            {/* Precio Unitario Personalizado (Opcional) */}
            <div>
              <label className="block font-bold text-chocolate-700 mb-1">
                Precio Unitario Personalizado (Opcional)
              </label>
              <input
                type="number"
                step="1"
                placeholder={`Calculado: ${formatCurrency(precioSugeridoConPersonalizacion)}`}
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

          {/* Desglose Dinámico en Tiempo Real y Botón Agregar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-trigo-200 bg-crema/50 p-4 rounded-2xl">
            <div className="text-xs text-chocolate-700 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[11px]">
                <span>Base Receta: <b className="text-chocolate-900">{formatCurrency(precioBaseRecetaCalculado)}</b></span>
                {costoMasa > 0 && <span className="text-amber-800">+ Masa: <b>+{formatCurrency(costoMasa)}</b></span>}
                {costoRelleno > 0 && <span className="text-indigo-800">+ Relleno: <b>+{formatCurrency(costoRelleno)}</b></span>}
                {costoDecoracion > 0 && <span className="text-purple-800">+ Deco: <b>+{formatCurrency(costoDecoracion)}</b></span>}
                {totalExtrasUnitario > 0 && <span className="text-emerald-800">+ Extras: <b>+{formatCurrency(totalExtrasUnitario)}</b></span>}
              </div>
              <div className="text-sm font-extrabold text-frambuesa-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  Precio Unitario: {formatCurrency(precioUnitarioFinal + totalExtrasUnitario)} • Subtotal ({cantidad} ud): {formatCurrency(subtotalItemActual)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-chocolate-700 hover:bg-chocolate-800 text-white font-bold text-xs shadow-warm transition-all transform hover:scale-105 active:scale-95 shrink-0"
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
              Aún no has añadido ningún producto. Configura uno arriba y presiona "Añadir Producto a Cotización".
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
