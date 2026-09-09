import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Cotizacion,
  CotizacionItem,
  CotizacionExtra,
  CategoriaExtra,
  Receta,
  Insumo,
  Cliente,
  FormatoPresentacion,
  TipoDespacho,
  ZonaDelivery,
  MetodoPago,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit, formatDisplayTamano } from '../../utils/formatters';
import {
  calcularCostosReceta,
  calcularCostoIngrediente,
  getRecipePortionsCount,
  getPorcionOpciones,
  redondearPrecioHaciaArribaCero,
} from '../../utils/calculations';
import { parseWhatsAppAddress } from '../../utils/deliveryHelper';
import {
  Plus,
  Trash2,
  Cake,
  Gift,
  Search,
  ChevronDown,
  Check,
  Sparkles,
  Package,
  Settings,
  UserCheck,
  DollarSign,
  Truck,
  Store,
  Navigation,
  ExternalLink,
  MessageSquare,
  MapPin,
  Map,
} from 'lucide-react';
import { OptionsManagerModal, CategoriaOpcion } from './OptionsManagerModal';
import { LocationGoogleMapsModal } from './LocationGoogleMapsModal';

interface QuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cotizacion: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>) => Promise<any> | any;
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
  { id: 'relleno_arequipe', nombre: 'Dulce de Leche / Arequipe Repostero', precio_adicional_base: 0, descripcion: 'Cocción lenta tradicional, espeso y caramelizado' },
  { id: 'relleno_crema_pastelera', nombre: 'Crema Pastelera con Vainilla Bourbon', precio_adicional_base: 0, descripcion: 'Suave, sedosa con yemas frescas y vainilla en vaina' },
  { id: 'relleno_queso_crema', nombre: 'Frosting de Queso Crema Philadelphia', precio_adicional_base: 350, descripcion: 'Queso crema auténtico, suave y equilibrado' },
  { id: 'relleno_ganache', nombre: 'Ganache Sedoso de Chocolate Belga 56%', precio_adicional_base: 380, descripcion: 'Emulsión de chocolate amargo con crema 35%' },
  { id: 'relleno_frutos_rojos', nombre: 'Confitura Casera de Frutos Rojos Silvestres', precio_adicional_base: 320, descripcion: 'Frambuesas, moras y arándanos reducidas al fuego' },
  { id: 'relleno_nutella', nombre: 'Nutella Pura con Crujiente de Avellanas', precio_adicional_base: 450, descripcion: 'Capas generosas de avellana y chocolate con praliné' },
  { id: 'relleno_toffee', nombre: 'Caramelo Salado / Toffee Artesanal', precio_adicional_base: 220, descripcion: 'Caramelo cocido con mantequilla y flor de sal' },
  { id: 'relleno_maracuya', nombre: 'Curd Cítrico de Maracuyá / Chinola Fresca', precio_adicional_base: 220, descripcion: 'Contraste ácido tropical perfecto y aromático' },
];

export const OPCIONES_DECORACION_DETALLADAS: OpcionConfigurable[] = [
  { id: 'deco_azucar', nombre: 'Glaseado Real / Azúcar Glass Espolvoreado', precio_adicional_base: 100, descripcion: 'Fina lluvia de azúcar micropulverizada' },
  { id: 'deco_chantilly', nombre: 'Chantilly Suave con Virutas de Chocolate', precio_adicional_base: 250, descripcion: 'Crema batida fresca y ralladura de chocolate' },
  { id: 'deco_buttercream_alisado', nombre: 'Buttercream Alisado Perfecto Bicolor', precio_adicional_base: 350, descripcion: 'Alisado profesional en bordes rectos y degradé' },
  { id: 'deco_drip_macarons', nombre: 'Drip Dorado Artesanal con Macarons y Fresas', precio_adicional_base: 550, descripcion: 'Goteo de chocolate dorado, macarons franceses y fresas' },
  { id: 'deco_naked_flores', nombre: 'Naked Cake Rústico con Flores Naturales Comestibles', precio_adicional_base: 450, descripcion: 'Acabado semi-desnudo con flores orgánicas' },
  { id: 'deco_espejo', nombre: 'Cubierta Espejo Brillante de Chocolate Belga', precio_adicional_base: 500, descripcion: 'Glaseado espejo ultra reflectivo de alta pastelería' },
  { id: 'deco_fondant_3d', nombre: 'Fondant Temático Personalizado con Figuras 3D', precio_adicional_base: 850, descripcion: 'Modelado artesanal manual en pasta de azúcar' },
];

export function getExtraCategory(extra: CotizacionExtra): CategoriaExtra {
  if (extra.categoria) return extra.categoria;
  const lowerId = (extra.id || '').toLowerCase();
  const lowerName = (extra.nombre || '').toLowerCase();

  if (lowerId.includes('topper') || lowerName.includes('topper')) {
    return 'topper';
  }
  if (
    lowerId.includes('sticker') ||
    lowerName.includes('sticker') ||
    lowerName.includes('etiqueta') ||
    lowerName.includes('sello')
  ) {
    return 'sticker';
  }
  if (
    lowerId.includes('tarjeta') ||
    lowerName.includes('tarjeta') ||
    lowerName.includes('mensaje') ||
    lowerName.includes('dedicatoria')
  ) {
    return 'tarjeta';
  }
  if (
    lowerId.startsWith('insumo_var_') ||
    lowerId.includes('caja') ||
    lowerId.includes('empaque') ||
    lowerId.includes('base') ||
    lowerId.includes('domo') ||
    lowerId.includes('bolsa') ||
    lowerName.includes('caja') ||
    lowerName.includes('empaque') ||
    lowerName.includes('base') ||
    lowerName.includes('domo') ||
    lowerName.includes('bolsa') ||
    lowerName.includes('plato') ||
    lowerName.includes('envase')
  ) {
    return 'empaque';
  }
  return 'otro';
}

export function buildDefaultExtrasList(insumosMap?: Map<number, Insumo>): CotizacionExtra[] {
  const baseList: CotizacionExtra[] = [
    // 📦 Empaques
    { id: 'empaque_caja_lujo', nombre: 'Caja de Lujo con Ventana y Lazo Satinado Frambuesa', precio: 175, categoria: 'empaque' },
    { id: 'empaque_caja_repostera', nombre: 'Caja Repostera Alta Reforzada con Asa de Transporte', precio: 140, categoria: 'empaque' },
    { id: 'empaque_base_rigida', nombre: 'Base Rígida Metalizada Dorada / Plateada Reforzada', precio: 85, categoria: 'empaque' },
    { id: 'empaque_domo_alto', nombre: 'Domo Plástico Cristalino Alto Antivuelco', precio: 65, categoria: 'empaque' },
    { id: 'empaque_bolsa_kraft', nombre: 'Bolsa Ecológica Kraft de Regalo con Asas de Cinta', precio: 45, categoria: 'empaque' },

    // 🎂 Toppers
    { id: 'topper_acrilico_feliz_cumple', nombre: "Topper Acrílico 'Feliz Cumpleaños' Espejado Dorado/Plateado", precio: 250, categoria: 'topper' },
    { id: 'topper_personalizado_nombre', nombre: 'Topper Personalizado con Nombre & Edad (Corte Láser)', precio: 350, categoria: 'topper' },
    { id: 'topper_madera_elegante', nombre: 'Topper Rústico Elegante en Madera Calada', precio: 280, categoria: 'topper' },
    { id: 'topper_mini_cupcakes', nombre: 'Mini Toppers Temáticos para Cupcakes (Pack x 6 ud)', precio: 160, categoria: 'topper' },

    // 🏷️ Stickers
    { id: 'sticker_personalizado_evento', nombre: 'Sticker / Etiqueta Adhesiva Personalizada (Nombre & Ocasión)', precio: 60, categoria: 'sticker' },
    { id: 'sticker_hecho_con_amor', nombre: "Sticker Circular Artesanal 'Hecho a Mano con Amor'", precio: 40, categoria: 'sticker' },
    { id: 'sticker_sello_seguridad', nombre: 'Sello Adhesivo de Garantía para Caja / Cinta con Logo', precio: 35, categoria: 'sticker' },

    // 💌 Tarjeta con Mensaje
    { id: 'tarjeta_caligrafia_artesanal', nombre: 'Tarjeta Artesanal Caligrafiada a Mano con Dedicatoria', precio: 90, categoria: 'tarjeta' },
    { id: 'tarjeta_regalo_sobre_satinado', nombre: 'Tarjeta de Regalo Premium en Sobre Satinado Sellado', precio: 120, categoria: 'tarjeta' },
    { id: 'tarjeta_postal_mini', nombre: 'Mini Tarjeta Postal con Mensaje y Broche Dorado', precio: 75, categoria: 'tarjeta' },

    // ✨ Otros / Detalles
    { id: 'vela_volcan', nombre: 'Vela Volcán Chispas Doradas', precio: 120, categoria: 'otro' },
    { id: 'vela_numerica', nombre: 'Vela Numérica Metalizada Dorada / Oro Rosa', precio: 80, categoria: 'otro' },
    { id: 'macarons_extra', nombre: 'Set de 4 Macarons de Frambuesa y Pistacho Extra', precio: 290, categoria: 'otro' },
  ];

  if (insumosMap) {
    insumosMap.forEach((insumo) => {
      if (insumo.tipo_costo === 'variable' && insumo.activo) {
        let precio = 5;
        if (insumo.costo_unitario_base > 0) {
          precio = Math.max(5, Math.ceil(insumo.costo_unitario_base));
        } else if (insumo.precio_compra > 0) {
          precio = Math.max(5, Math.ceil(insumo.precio_compra / (insumo.presentacion_empaque || 1)));
        }
        const lowerName = (insumo.nombre || '').toLowerCase();
        let cat: CategoriaExtra = 'otro';
        if (
          lowerName.includes('caja') ||
          lowerName.includes('base') ||
          lowerName.includes('domo') ||
          lowerName.includes('bolsa') ||
          lowerName.includes('empaque') ||
          lowerName.includes('envase') ||
          lowerName.includes('plato')
        ) {
          cat = 'empaque';
        } else if (lowerName.includes('topper')) {
          cat = 'topper';
        } else if (lowerName.includes('sticker') || lowerName.includes('etiqueta')) {
          cat = 'sticker';
        } else if (lowerName.includes('tarjeta') || lowerName.includes('mensaje')) {
          cat = 'tarjeta';
        }

        baseList.push({
          id: `insumo_var_${insumo.id}`,
          nombre: `${insumo.nombre} (${insumo.unidad_compra})`,
          precio,
          categoria: cat,
        });
      }
    });
  }

  return baseList;
}

export const EXTRAS_DISPONIBLES: CotizacionExtra[] = buildDefaultExtrasList();

export const QuoteBuilderModal: React.FC<QuoteBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recetas,
  insumosMap,
  initialCotizacion,
}) => {
  const { clientes, zonasDelivery, usuarios } = useApp();
  const deliveryUsers = (usuarios || []).filter((u) => u.rol === 'delivery' && u.activo);

  // Datos del Cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [validezDias, setValidezDias] = useState<number>(5);
  const [costoEnvio, setCostoEnvio] = useState<number | ''>(0);
  const [descuento, setDescuento] = useState<number | ''>(0);
  const [notas, setNotas] = useState('');

  // Logística & Despacho
  const [tipoDespacho, setTipoDespacho] = useState<TipoDespacho>('retiro');
  const [zonaDeliveryId, setZonaDeliveryId] = useState<number | ''>('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [puntoReferencia, setPuntoReferencia] = useState('');
  const [repartidorNombre, setRepartidorNombre] = useState('');
  const [repartidorTelefono, setRepartidorTelefono] = useState('');
  const [isWhatsAppBoxOpen, setIsWhatsAppBoxOpen] = useState(false);
  const [whatsAppInputText, setWhatsAppInputText] = useState('');
  const [detectedMapsLink, setDetectedMapsLink] = useState<string | null>(null);
  const [isMapPreviewOpen, setIsMapPreviewOpen] = useState(false);

  // Condiciones de Pago
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('transferencia');
  const [pagoDelivery, setPagoDelivery] = useState<'completo' | 'efectivo_aparte'>('completo');
  const [cobroContraEntrega, setCobroContraEntrega] = useState<boolean>(false);

  // Mini CRM Clientes Autocompletado
  const [selectedClienteCrm, setSelectedClienteCrm] = useState<Cliente | null>(null);
  const [isClientSuggestionsOpen, setIsClientSuggestionsOpen] = useState(false);
  const clientInputRef = useRef<HTMLDivElement>(null);

  const matchingClientes = useMemo(() => {
    const q = clienteNombre.trim().toLowerCase();
    if (q.length < 2) return [];
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
    );
  }, [clientes, clienteNombre]);

  // Item a configurar (Wizard)
  const [selectedRecetaId, setSelectedRecetaId] = useState<number>(recetas[0]?.id || 1);
  const [searchProductTerm, setSearchProductTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const [tamanoPorciones, setTamanoPorciones] = useState('1 LB (16-20 porciones)');
  const [factorReceta, setFactorReceta] = useState<number>(1);
  const [customMiniCount, setCustomMiniCount] = useState<number>(24);
  const [isCustomMiniSelected, setIsCustomMiniSelected] = useState<boolean>(false);

  // Opciones configurables con persistencia local
  const [masasOpciones, setMasasOpciones] = useState<OpcionConfigurable[]>(() => {
    try {
      const saved = localStorage.getItem('delicias_custom_quote_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.masas) && parsed.masas.length > 0) return parsed.masas;
      }
    } catch (e) {}
    return OPCIONES_MASA_DETALLADAS;
  });

  const [rellenosOpciones, setRellenosOpciones] = useState<OpcionConfigurable[]>(() => {
    try {
      const saved = localStorage.getItem('delicias_custom_quote_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.rellenos) && parsed.rellenos.length > 0) return parsed.rellenos;
      }
    } catch (e) {}
    return OPCIONES_RELLENO_DETALLADAS;
  });

  const [decoracionesOpciones, setDecoracionesOpciones] = useState<OpcionConfigurable[]>(() => {
    try {
      const saved = localStorage.getItem('delicias_custom_quote_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.decoraciones) && parsed.decoraciones.length > 0) return parsed.decoraciones;
      }
    } catch (e) {}
    return OPCIONES_DECORACION_DETALLADAS;
  });

  const [extrasOpciones, setExtrasOpciones] = useState<CotizacionExtra[]>(() => {
    const defaultExtras = buildDefaultExtrasList(insumosMap);
    try {
      const saved = localStorage.getItem('delicias_custom_quote_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.extras) && parsed.extras.length > 0) {
          const existingIds = new Set(parsed.extras.map((e: CotizacionExtra) => e.id));
          const missingVars = defaultExtras.filter((e) => !existingIds.has(e.id));
          return [...parsed.extras, ...missingVars];
        }
      }
    } catch (e) {}
    return defaultExtras;
  });

  // Asegurar que todos los insumos variables aparezcan en extrasOpciones
  useEffect(() => {
    if (insumosMap && insumosMap.size > 0) {
      setExtrasOpciones((prevExtras) => {
        const existingIds = new Set(prevExtras.map((e) => e.id));
        const newFromInsumos: CotizacionExtra[] = [];

        insumosMap.forEach((insumo) => {
          if (insumo.tipo_costo === 'variable' && insumo.activo) {
            const id = `insumo_var_${insumo.id}`;
            if (!existingIds.has(id)) {
              let precio = 5;
              if (insumo.costo_unitario_base > 0) {
                precio = Math.max(5, Math.ceil(insumo.costo_unitario_base));
              } else if (insumo.precio_compra > 0) {
                precio = Math.max(5, Math.ceil(insumo.precio_compra / (insumo.presentacion_empaque || 1)));
              }
              const lowerName = (insumo.nombre || '').toLowerCase();
              let cat: CategoriaExtra = 'otro';
              if (
                lowerName.includes('caja') ||
                lowerName.includes('base') ||
                lowerName.includes('domo') ||
                lowerName.includes('bolsa') ||
                lowerName.includes('empaque') ||
                lowerName.includes('envase') ||
                lowerName.includes('plato')
              ) {
                cat = 'empaque';
              } else if (lowerName.includes('topper')) {
                cat = 'topper';
              } else if (lowerName.includes('sticker') || lowerName.includes('etiqueta')) {
                cat = 'sticker';
              } else if (lowerName.includes('tarjeta') || lowerName.includes('mensaje')) {
                cat = 'tarjeta';
              }
              newFromInsumos.push({
                id,
                nombre: `${insumo.nombre} (${insumo.unidad_compra})`,
                precio,
                categoria: cat,
              });
            }
          }
        });

        if (newFromInsumos.length > 0) {
          return [...prevExtras, ...newFromInsumos];
        }
        return prevExtras;
      });
    }
  }, [insumosMap]);

  // Filtros y búsqueda para el catálogo completo de extras categorizado
  const [searchExtraTerm, setSearchExtraTerm] = useState('');
  const [filterExtraCategory, setFilterExtraCategory] = useState<
    'all' | 'empaques' | 'toppers' | 'stickers' | 'tarjetas' | 'otros'
  >('all');

  const filteredExtrasList = useMemo(() => {
    return extrasOpciones.filter((extra) => {
      const matchesSearch = extra.nombre.toLowerCase().includes(searchExtraTerm.toLowerCase());
      const cat = getExtraCategory(extra);
      let matchesCategory = true;
      if (filterExtraCategory === 'empaques') {
        matchesCategory = cat === 'empaque';
      } else if (filterExtraCategory === 'toppers') {
        matchesCategory = cat === 'topper';
      } else if (filterExtraCategory === 'stickers') {
        matchesCategory = cat === 'sticker';
      } else if (filterExtraCategory === 'tarjetas') {
        matchesCategory = cat === 'tarjeta';
      } else if (filterExtraCategory === 'otros') {
        matchesCategory = cat === 'otro';
      }
      return matchesSearch && matchesCategory;
    });
  }, [extrasOpciones, searchExtraTerm, filterExtraCategory]);

  const empaquesCount = useMemo(
    () => extrasOpciones.filter((e) => getExtraCategory(e) === 'empaque').length,
    [extrasOpciones]
  );
  const toppersCount = useMemo(
    () => extrasOpciones.filter((e) => getExtraCategory(e) === 'topper').length,
    [extrasOpciones]
  );
  const stickersCount = useMemo(
    () => extrasOpciones.filter((e) => getExtraCategory(e) === 'sticker').length,
    [extrasOpciones]
  );
  const tarjetasCount = useMemo(
    () => extrasOpciones.filter((e) => getExtraCategory(e) === 'tarjeta').length,
    [extrasOpciones]
  );
  const otrosCount = useMemo(
    () => extrasOpciones.filter((e) => getExtraCategory(e) === 'otro').length,
    [extrasOpciones]
  );

  const [isOptionsManagerOpen, setIsOptionsManagerOpen] = useState(false);
  const [optionsManagerTab, setOptionsManagerTab] = useState<CategoriaOpcion>('masas');

  const openOptionsManager = (tab: CategoriaOpcion) => {
    setOptionsManagerTab(tab);
    setIsOptionsManagerOpen(true);
  };

  const handleSaveCustomOptions = (data: {
    masas: OpcionConfigurable[];
    rellenos: OpcionConfigurable[];
    decoraciones: OpcionConfigurable[];
    extras: CotizacionExtra[];
  }) => {
    setMasasOpciones(data.masas);
    setRellenosOpciones(data.rellenos);
    setDecoracionesOpciones(data.decoraciones);
    setExtrasOpciones(data.extras);
    localStorage.setItem('delicias_custom_quote_options', JSON.stringify(data));
  };

  const handleResetCustomOptions = () => {
    setMasasOpciones(OPCIONES_MASA_DETALLADAS);
    setRellenosOpciones(OPCIONES_RELLENO_DETALLADAS);
    setDecoracionesOpciones(OPCIONES_DECORACION_DETALLADAS);
    const defaults = buildDefaultExtrasList(insumosMap);
    setExtrasOpciones(defaults);
    localStorage.removeItem('delicias_custom_quote_options');
  };

  const [masaBase, setMasaBase] = useState(OPCIONES_MASA_DETALLADAS[0].nombre);
  const [relleno, setRelleno] = useState(OPCIONES_RELLENO_DETALLADAS[0].nombre);
  const [decoracion, setDecoracion] = useState(OPCIONES_DECORACION_DETALLADAS[0].nombre);
  const [dedicatoria, setDedicatoria] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const dedicatoriaInputRef = useRef<HTMLInputElement>(null);

  const isTarjetaSelected = useMemo(() => {
    return selectedExtras.some((id) => {
      const extra = extrasOpciones.find((e) => e.id === id);
      return extra ? getExtraCategory(extra) === 'tarjeta' : false;
    });
  }, [selectedExtras, extrasOpciones]);
  const [cantidad, setCantidad] = useState<number>(1);
  const [precioBaseManual, setPrecioBaseManual] = useState<number | ''>('');
  const [tipoPrecioSeleccionado, setTipoPrecioSeleccionado] = useState<'redondeado' | 'real' | 'personalizado'>('redondeado');

  const handleCustomMiniQuoteChange = (count: number) => {
    const validCount = Math.max(1, count);
    setCustomMiniCount(validCount);
    const factor = Number((validCount * (0.35 / 12)).toFixed(3));
    setFactorReceta(factor);
    setTamanoPorciones(`${validCount} Mini Bocaditos`);
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
      if (
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setIsClientSuggestionsOpen(false);
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
      setCostoEnvio(initialCotizacion.costo_delivery ?? initialCotizacion.costo_envio ?? 0);
      setDescuento(initialCotizacion.descuento || 0);
      setNotas(initialCotizacion.notas || '');
      setItems(initialCotizacion.items);
      setTipoDespacho(initialCotizacion.tipo_despacho || (Number(initialCotizacion.costo_delivery || initialCotizacion.costo_envio || 0) > 0 ? 'delivery' : 'retiro'));
      setZonaDeliveryId(initialCotizacion.zona_delivery_id || '');
      setDireccionEntrega(initialCotizacion.direccion_entrega || '');
      setPuntoReferencia(initialCotizacion.punto_referencia || '');
      setRepartidorNombre(initialCotizacion.repartidor_nombre || '');
      setRepartidorTelefono(initialCotizacion.repartidor_telefono || '');
      setMetodoPago(initialCotizacion.metodo_pago || 'transferencia');
      setPagoDelivery(initialCotizacion.pago_delivery || (initialCotizacion.cobro_delivery_al_recibir ? 'efectivo_aparte' : 'completo'));
      setCobroContraEntrega(Boolean(initialCotizacion.cobro_contra_entrega));
      setIsWhatsAppBoxOpen(false);
      setWhatsAppInputText('');
      setDetectedMapsLink(initialCotizacion.maps_url || null);
      setIsMapPreviewOpen(false);
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
      setTipoDespacho('retiro');
      setZonaDeliveryId('');
      setDireccionEntrega('');
      setPuntoReferencia('');
      setRepartidorNombre('');
      setRepartidorTelefono('');
      setMetodoPago('transferencia');
      setPagoDelivery('completo');
      setCobroContraEntrega(false);
      setIsWhatsAppBoxOpen(false);
      setWhatsAppInputText('');
      setDetectedMapsLink(null);
    }
  }, [initialCotizacion, isOpen]);

  const handleToggleTipoDespacho = (tipo: TipoDespacho) => {
    setTipoDespacho(tipo);
    if (tipo === 'retiro') {
      setCostoEnvio(0);
      setZonaDeliveryId('');
    } else {
      if (!zonaDeliveryId && zonasDelivery && zonasDelivery.length > 0) {
        const first = zonasDelivery.find(z => z.activo) || zonasDelivery[0];
        if (first) {
          setZonaDeliveryId(first.id);
          setCostoEnvio(first.tarifa);
        }
      }
    }
  };

  const handleSelectZona = (id: number | '') => {
    setZonaDeliveryId(id);
    if (id === '') {
      setCostoEnvio(0);
    } else {
      const found = zonasDelivery.find(z => z.id === Number(id));
      if (found) {
        setCostoEnvio(found.tarifa);
      }
    }
  };

  const handleParseWhatsApp = () => {
    if (!whatsAppInputText.trim()) return;
    const res = parseWhatsAppAddress(whatsAppInputText, zonasDelivery);
    if (res.direccion) {
      setDireccionEntrega(res.direccion);
    }
    if (res.punto_referencia) {
      setPuntoReferencia(res.punto_referencia);
    }
    if (res.mapsUrl) {
      setDetectedMapsLink(res.mapsUrl);
    }
    if (res.detectedZoneId) {
      handleSelectZona(res.detectedZoneId);
    }
  };

  // Receta seleccionada actual
  const currentReceta = useMemo(() => {
    return recetas.find((r) => r.id === selectedRecetaId) || recetas[0];
  }, [recetas, selectedRecetaId]);

  // Formatos de presentación permitidos para la receta seleccionada
  const allowedFormatosQuote = useMemo<FormatoPresentacion[]>(() => {
    if (currentReceta?.formatos_permitidos && currentReceta.formatos_permitidos.length > 0) {
      return currentReceta.formatos_permitidos;
    }
    return ['libra', 'porcion', 'mini'];
  }, [currentReceta?.formatos_permitidos]);

  // Porciones base de la receta seleccionada en el cotizador
  const basePorcionesQuote = useMemo(() => {
    if (!currentReceta) return 12;
    return getRecipePortionsCount(currentReceta);
  }, [currentReceta]);

  const porcionQuoteOpciones = useMemo(() => {
    return getPorcionOpciones(basePorcionesQuote, currentReceta?.rendimiento_unidad);
  }, [basePorcionesQuote, currentReceta?.rendimiento_unidad]);

  // Set de insumos variables seleccionados para la receta actual
  const [activeRecipeVariableIds, setActiveRecipeVariableIds] = useState<Set<number>>(new Set());

  // Limpiar variables seleccionadas al cambiar de receta
  useEffect(() => {
    setActiveRecipeVariableIds(new Set());
  }, [currentReceta?.id]);

  // Lista de ingredientes variables de la receta seleccionada
  const variablesReceta = useMemo(() => {
    if (!currentReceta || !Array.isArray(currentReceta.ingredientes)) return [];
    return currentReceta.ingredientes.filter((i) => i.tipo === 'variable');
  }, [currentReceta]);

  const handleToggleRecipeVariable = (insumoId: number) => {
    setActiveRecipeVariableIds((prev) => {
      const next = new Set(prev);
      if (next.has(insumoId)) {
        next.delete(insumoId);
      } else {
        next.add(insumoId);
      }
      return next;
    });
  };

  const handleSelectAllRecipeVariables = () => {
    if (!currentReceta) return;
    const all = new Set<number>();
    currentReceta.ingredientes
      .filter((i) => i.tipo === 'variable')
      .forEach((i) => all.add(i.insumo_id));
    setActiveRecipeVariableIds(all);
  };

  const handleDeselectAllRecipeVariables = () => {
    setActiveRecipeVariableIds(new Set());
  };

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

    const allowed = receta.formatos_permitidos && receta.formatos_permitidos.length > 0
      ? receta.formatos_permitidos
      : ['libra', 'porcion', 'mini'];

    if (allowed.includes('libra')) {
      setTamanoPorciones(receta.rendimiento_unidad || '1 LB (16-20 porciones)');
      setFactorReceta(1.0);
      setIsCustomMiniSelected(false);
    } else if (allowed.includes('porcion')) {
      const portions = getRecipePortionsCount(receta);
      const opts = getPorcionOpciones(portions, receta.rendimiento_unidad);
      const defaultOpt = opts[0];
      setTamanoPorciones(defaultOpt?.label || '1 Porción');
      setFactorReceta(defaultOpt?.factor || 1);
      setIsCustomMiniSelected(false);
    } else if (allowed.includes('mini')) {
      setTamanoPorciones('Caja x 12 Mini Bocaditos');
      setFactorReceta(0.35);
      setIsCustomMiniSelected(false);
    }
  };

  // =========================================================================
  // CÁLCULO DINÁMICO DE COSTO BOM + VARIABLES + MASA + RELLENO + DECORACIÓN
  // =========================================================================
  const calcReceta = currentReceta
    ? calcularCostosReceta(currentReceta, insumosMap, factorReceta, activeRecipeVariableIds)
    : null;
  const calcRecetaBasePuro = currentReceta
    ? calcularCostosReceta(currentReceta, insumosMap, factorReceta, false)
    : null;

  const precioBaseRecetaCalculado = calcReceta ? calcReceta.precio_sugerido_margen_venta : 1500;
  const precioBaseRecetaReal = calcReceta
    ? (calcReceta.precio_sugerido_margen_venta_raw ?? calcReceta.precio_sugerido_margen_venta)
    : 1500;

  const diferenciaPrecioVariablesReceta = calcReceta && calcRecetaBasePuro
    ? Math.max(0, calcReceta.precio_sugerido_margen_venta - calcRecetaBasePuro.precio_sugerido_margen_venta)
    : 0;

  // Costo adicional dinámico de la Masa
  const opcionMasaObj =
    masasOpciones.find((m) => m.nombre === masaBase) || masasOpciones[0] || { precio_adicional_base: 0 };
  const costoMasa = (opcionMasaObj.precio_adicional_base || 0) * factorReceta;

  // Costo adicional dinámico del Relleno
  const opcionRellenoObj =
    rellenosOpciones.find((r) => r.nombre === relleno) || rellenosOpciones[0] || { precio_adicional_base: 0 };
  const costoRelleno = (opcionRellenoObj.precio_adicional_base || 0) * factorReceta;

  // Costo adicional dinámico de la Decoración
  const opcionDecoObj =
    decoracionesOpciones.find((d) => d.nombre === decoracion) || decoracionesOpciones[0] || { precio_adicional_base: 0 };
  const factorDeco = factorReceta >= 1 ? Math.min(2.5, factorReceta) : 0.7;
  const costoDecoracion = (opcionDecoObj.precio_adicional_base || 0) * factorDeco;

  const costoPersonalizaciones = costoMasa + costoRelleno + costoDecoracion;

  // Extras adicionales por unidad
  const totalExtrasUnitario = selectedExtras.reduce((sum, extId) => {
    const ext = extrasOpciones.find((e) => e.id === extId);
    return sum + (ext ? ext.precio : 0);
  }, 0);

  // Precios Sugeridos Totales del Producto (Receta + Masa + Relleno + Decoración)
  const precioSugeridoRedondeado = redondearPrecioHaciaArribaCero(precioBaseRecetaCalculado + costoPersonalizaciones);
  const precioSugeridoReal = Number((precioBaseRecetaReal + costoPersonalizaciones).toFixed(2));

  // Precio Unitario Final (manual o según modo seleccionado)
  const precioUnitarioFinal =
    tipoPrecioSeleccionado === 'personalizado' && precioBaseManual !== '' && typeof precioBaseManual === 'number'
      ? precioBaseManual
      : tipoPrecioSeleccionado === 'real'
      ? precioSugeridoReal
      : precioSugeridoRedondeado;

  const subtotalItemActual = (precioUnitarioFinal + totalExtrasUnitario) * cantidad;

  const handleSelectTipoPrecio = (tipo: 'real' | 'redondeado') => {
    setTipoPrecioSeleccionado(tipo);
    setPrecioBaseManual(tipo === 'real' ? precioSugeridoReal : precioSugeridoRedondeado);
  };

  const handleAddItem = () => {
    if (!currentReceta) return;

    const extrasObj: CotizacionExtra[] = selectedExtras
      .map((id) => extrasOpciones.find((e) => e.id === id))
      .filter(Boolean) as CotizacionExtra[];

    const variablesRecetaNombres: string[] = currentReceta.ingredientes
      .filter((i) => i.tipo === 'variable' && activeRecipeVariableIds.has(i.insumo_id))
      .map((i) => {
        const ins = insumosMap.get(i.insumo_id);
        const cant = formatUnit(i.cantidad * factorReceta, ins?.unidad_base || 'g');
        return `${ins?.nombre || `Insumo #${i.insumo_id}`} (${cant})`;
      });

    const newItem: CotizacionItem = {
      id: `item-${Date.now()}`,
      receta_id: currentReceta.id,
      receta_nombre: currentReceta.nombre,
      tamano_porciones: formatDisplayTamano(tamanoPorciones),
      masa_base: masaBase,
      relleno,
      decoracion,
      dedicatoria: dedicatoria.trim(),
      extras: extrasObj,
      cantidad,
      precio_unitario: precioUnitarioFinal + totalExtrasUnitario,
      subtotal: subtotalItemActual,
      factor_receta: factorReceta,
      variables_receta: variablesRecetaNombres,
      variables_seleccionadas: Array.from(activeRecipeVariableIds),
      tipo_precio_aplicado: tipoPrecioSeleccionado,
      precio_real_base: precioSugeridoReal,
      precio_redondeado_base: precioSugeridoRedondeado,
    };

    setItems((prev) => [...prev, newItem]);

    // Limpiar dedicatoria, extras y variables para el siguiente item
    setDedicatoria('');
    setSelectedExtras([]);
    setActiveRecipeVariableIds(new Set());
    setCantidad(1);
    setPrecioBaseManual('');
    setTipoPrecioSeleccionado('redondeado');
  };

  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
        return {
          ...i,
          precio_unitario: validPrice,
          subtotal: Number((validPrice * i.cantidad).toFixed(2)),
          tipo_precio_aplicado: 'personalizado',
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotalCotizacion = items.reduce((sum, i) => sum + i.subtotal, 0);
  const envioNum = typeof costoEnvio === 'number' ? costoEnvio : 0;
  const descNum = typeof descuento === 'number' ? descuento : 0;
  const totalCotizacion = Math.max(0, subtotalCotizacion + envioNum - descNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || items.length === 0) {
      alert('Por favor completa el nombre del cliente y agrega al menos un producto a la cotización.');
      return;
    }

    if (tipoDespacho === 'delivery') {
      if (!direccionEntrega.trim()) {
        alert('Para envíos a domicilio, la Dirección de Entrega es obligatoria.');
        return;
      }
      if (!puntoReferencia.trim()) {
        alert('Para envíos a domicilio, el Punto de Referencia es obligatorio para el chofer.');
        return;
      }
    }

    const res = await onSave({
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim() || 'N/A',
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
      tipo_despacho: tipoDespacho,
      zona_delivery_id: tipoDespacho === 'delivery' && zonaDeliveryId ? Number(zonaDeliveryId) : null,
      costo_delivery: tipoDespacho === 'delivery' ? envioNum : 0,
      direccion_entrega: tipoDespacho === 'delivery' ? direccionEntrega.trim() : undefined,
      punto_referencia: tipoDespacho === 'delivery' ? puntoReferencia.trim() : undefined,
      repartidor_nombre: repartidorNombre.trim() || undefined,
      repartidor_telefono: repartidorTelefono.trim() || undefined,
      metodo_pago: metodoPago,
      pago_delivery: tipoDespacho === 'delivery' ? pagoDelivery : undefined,
      cobro_delivery_al_recibir: tipoDespacho === 'delivery' && pagoDelivery === 'efectivo_aparte',
      cobro_contra_entrega: cobroContraEntrega,
      maps_url: tipoDespacho === 'delivery' ? (detectedMapsLink || undefined) : undefined,
    });

    if (res === null || res === false) {
      return;
    }

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
            <div className="relative" ref={clientInputRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-chocolate-700">
                  Nombre del Cliente *
                </label>
                {selectedClienteCrm && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Cliente CRM</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Escribe para buscar o ingresar cliente..."
                value={clienteNombre}
                onFocus={() => setIsClientSuggestionsOpen(true)}
                onChange={(e) => {
                  setClienteNombre(e.target.value);
                  setIsClientSuggestionsOpen(true);
                  if (selectedClienteCrm && e.target.value !== selectedClienteCrm.nombre) {
                    setSelectedClienteCrm(null);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              />

              {/* Sugerencias de clientes frecuentes del CRM */}
              {isClientSuggestionsOpen && matchingClientes.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-trigo-300 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  <div className="p-2 bg-crema/60 border-b border-trigo-100 text-[10px] font-bold text-chocolate-700 uppercase tracking-wider flex justify-between">
                    <span>Clientes Frecuentes Guardados</span>
                    <span>Toca para autocompletar</span>
                  </div>
                  {matchingClientes.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setClienteNombre(c.nombre);
                        setClienteTelefono(c.telefono);
                        if (c.email) setClienteEmail(c.email);
                        setSelectedClienteCrm(c);
                        setIsClientSuggestionsOpen(false);
                      }}
                      className="p-2.5 hover:bg-crema/40 cursor-pointer border-b border-trigo-50 last:border-0 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-chocolate-900 text-xs">{c.nombre}</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold">{c.telefono}</span>
                      </div>
                      {c.alergias_preferencias && (
                        <p className="text-[10px] text-amber-800 truncate mt-0.5">
                          ⚠️ {c.alergias_preferencias}
                        </p>
                      )}
                      {c.cumpleanos_familiar && (
                        <p className="text-[10px] text-chocolate-500 truncate">
                          🎂 {c.cumpleanos_familiar}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-chocolate-700 mb-1">
                WhatsApp / Teléfono <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="tel"
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

          {/* Ficha CRM de Cliente Frecuente */}
          {selectedClienteCrm && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900 animate-fade-in">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-amber-950">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Perfil CRM: {selectedClienteCrm.nombre} ({selectedClienteCrm.total_pedidos || 1} pedidos anteriores)
                </span>
                {selectedClienteCrm.ultimo_pedido && (
                  <span className="text-[10px] text-amber-700 font-normal">
                    Último pedido: {selectedClienteCrm.ultimo_pedido}
                  </span>
                )}
              </div>
              {selectedClienteCrm.alergias_preferencias && (
                <p className="text-xs text-amber-900 font-medium">
                  <strong className="text-red-700">⚠️ Alergias / Preferencias:</strong> {selectedClienteCrm.alergias_preferencias}
                </p>
              )}
              {selectedClienteCrm.cumpleanos_familiar && (
                <p className="text-xs text-chocolate-700">
                  <strong>🎂 Cumpleaños registrado:</strong> {selectedClienteCrm.cumpleanos_familiar}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 2. Logística & Modalidad de Entrega */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-trigo-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-trigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-chocolate-800 uppercase tracking-wider">
                  2. Modalidad de Despacho & Logística
                </h3>
                <p className="text-[11px] text-chocolate-500">
                  Selecciona si el cliente retirará en el taller o requiere envío a domicilio con flete calculado.
                </p>
              </div>
            </div>

            {/* Selector Interactivo: Retiro en Taller vs Envío a Domicilio */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-crema/80 rounded-2xl border border-trigo-300 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleToggleTipoDespacho('retiro')}
                className={`flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  tipoDespacho === 'retiro'
                    ? 'bg-chocolate-700 text-white shadow-sm ring-2 ring-chocolate-700/20'
                    : 'text-chocolate-700 hover:bg-white/80'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>🏬 Retiro en Taller</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleTipoDespacho('delivery')}
                className={`flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  tipoDespacho === 'delivery'
                    ? 'bg-frambuesa-500 text-white shadow-sm ring-2 ring-frambuesa-500/20'
                    : 'text-chocolate-700 hover:bg-white/80'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>🛵 Envío a Domicilio</span>
              </button>
            </div>
          </div>

          {tipoDespacho === 'delivery' && (
            <div className="space-y-4 animate-fade-in pt-1">
              {/* Selector de Zona de Envío */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-chocolate-700 mb-1 text-xs">
                    Zona de Envío / Tarifa Automática *
                  </label>
                  <select
                    value={zonaDeliveryId}
                    onChange={(e) => handleSelectZona(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 text-xs bg-white font-medium text-chocolate-900"
                  >
                    <option value="">-- Seleccionar zona de entrega --</option>
                    {zonasDelivery.filter(z => z.activo).map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.nombre} — {formatCurrency(z.tarifa)} ({z.tiempo_estimado_min || 45} min est.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-chocolate-700 mb-1 text-xs">
                    Tarifa de Flete Sumada al Total (RD$)
                  </label>
                  <div className="flex items-center px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-black text-sm">
                    <span>{formatCurrency(Number(costoEnvio || 0))}</span>
                    <span className="text-[10px] text-amber-700 font-normal ml-auto">
                      Se suma automáticamente
                    </span>
                  </div>
                </div>
              </div>

              {/* Importar Dirección desde WhatsApp */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950">
                      ¿El cliente te envió la dirección por WhatsApp?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWhatsAppBoxOpen(!isWhatsAppBoxOpen)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{isWhatsAppBoxOpen ? 'Ocultar' : '📲 Pegar y Auto-Detectar'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isWhatsAppBoxOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isWhatsAppBoxOpen && (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <textarea
                      rows={2}
                      placeholder="Pega aquí el mensaje de WhatsApp (ej: 'Calle 5 #12, Ensanche Naco. Referencia: Casa verde portón negro. https://maps.app.goo.gl/...')"
                      value={whatsAppInputText}
                      onChange={(e) => setWhatsAppInputText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-400 text-xs bg-white text-chocolate-900"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleParseWhatsApp}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>⚡ Auto-Extraer Dirección & Referencia</span>
                      </button>
                      {detectedMapsLink && (
                        <a
                          href={detectedMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Ver ubicación en Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Barra / Botón de Vista Previa y Corrección con Google Maps */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-sky-50/90 border border-sky-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-sky-950 block truncate">
                      {direccionEntrega ? `📍 ${direccionEntrega}` : 'Aún no has fijado la ubicación'}
                    </span>
                    <span className="text-[11px] text-sky-700 block truncate">
                      {puntoReferencia ? `Ref: ${puntoReferencia}` : 'Verifica el mapa para asegurar la entrega sin demoras'}
                      {detectedMapsLink && ' • ✅ Enlace Maps vinculado'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMapPreviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition transform hover:scale-[1.02] active:scale-98 cursor-pointer shrink-0"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>🗺️ Vista Previa & Corrección Google Maps</span>
                </button>
              </div>

              {/* Campos Obligatorios: Dirección exacta y Punto de referencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-chocolate-700">
                      Dirección Exacta de Entrega *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsMapPreviewOpen(true)}
                      className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Ver en Mapa</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required={tipoDespacho === 'delivery'}
                    placeholder="Calle, Número, Edificio, Apto, Sector..."
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-medium text-chocolate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-chocolate-700 mb-1">
                    Punto de Referencia (Obligatorio para el chofer) *
                  </label>
                  <input
                    type="text"
                    required={tipoDespacho === 'delivery'}
                    placeholder="Ej: Frente al parque, portón negro, timbre blanco..."
                    value={puntoReferencia}
                    onChange={(e) => setPuntoReferencia(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white font-medium text-chocolate-900"
                  />
                </div>
              </div>

              {/* Asignación Opcional de Chofer / Repartidor */}
              <div className="space-y-2 bg-canvas/60 p-3 rounded-xl border border-trigo-200 text-xs">
                {deliveryUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pb-1.5 border-b border-trigo-200/80">
                    <span className="text-[10px] font-bold text-chocolate-700">Repartidores registrados:</span>
                    {deliveryUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setRepartidorNombre(u.nombre_completo);
                          if (u.telefono) setRepartidorTelefono(u.telefono);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-stone-700 border border-trigo-300 text-[10px] font-semibold transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>🛵 {u.nombre_completo}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Chofer / Repartidor <span className="text-gray-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      list="choferes-registrados-list"
                      placeholder="Nombre del mensajero o chofer"
                      value={repartidorNombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRepartidorNombre(val);
                        const matched = deliveryUsers.find(
                          (u) =>
                            u.nombre_completo.toLowerCase() === val.toLowerCase() ||
                            u.username.toLowerCase() === val.toLowerCase()
                        );
                        if (matched && matched.telefono) {
                          setRepartidorTelefono(matched.telefono);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                    <datalist id="choferes-registrados-list">
                      {deliveryUsers.map((u) => (
                        <option key={u.id} value={u.nombre_completo}>
                          {u.telefono ? `Tel: ${u.telefono}` : `@${u.username}`}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-semibold text-chocolate-700 mb-1">
                      Teléfono del Chofer <span className="text-gray-400 font-normal">(Para despacho WhatsApp)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej: 809-555-0199"
                      value={repartidorTelefono}
                      onChange={(e) => setRepartidorTelefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 bg-white"
                    />
                  </div>
                </div>

                {/* Modalidad de Pago del Delivery */}
                <div className="pt-2 border-t border-trigo-200">
                  <label className="block font-bold text-chocolate-800 mb-1.5 text-xs">
                    ¿Cómo se pagará la tarifa de Delivery ({formatCurrency(envioNum)})? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPagoDelivery('efectivo_aparte')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        pagoDelivery === 'efectivo_aparte'
                          ? 'border-frambuesa-500 bg-frambuesa-50/80 text-frambuesa-950 font-bold shadow-2xs ring-1 ring-frambuesa-400'
                          : 'border-trigo-300 bg-white hover:bg-crema/40 text-chocolate-700'
                      }`}
                    >
                      <span className="text-base leading-none">💵</span>
                      <div>
                        <div className="text-xs font-bold">En efectivo aparte al repartidor</div>
                        <div className="text-[10px] text-gray-500 font-normal">
                          El cliente entrega los {formatCurrency(envioNum)} directamente al chofer en efectivo contra entrega.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPagoDelivery('completo')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        pagoDelivery === 'completo'
                          ? 'border-frambuesa-500 bg-frambuesa-50/80 text-frambuesa-950 font-bold shadow-2xs ring-1 ring-frambuesa-400'
                          : 'border-trigo-300 bg-white hover:bg-crema/40 text-chocolate-700'
                      }`}
                    >
                      <span className="text-base leading-none">📦</span>
                      <div>
                        <div className="text-xs font-bold">Completo con el pedido</div>
                        <div className="text-[10px] text-gray-500 font-normal">
                          La tarifa se incluye en el total a transferir o pagar a la pastelería.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Configurador Interactivo de Producto */}
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
                      const matchingPorcion = porcionQuoteOpciones.find((p) => val.startsWith(p.label));
                      if (matchingPorcion) {
                        setFactorReceta(matchingPorcion.factor);
                      } else if (val.includes('½ LB') || val.includes('Pack x 6')) {
                        setFactorReceta(0.5);
                      } else if (val.includes('2 LB') || val.includes('2x')) {
                        setFactorReceta(2.0);
                      } else if (val.includes('3 LB')) {
                        setFactorReceta(3.0);
                      } else {
                        setFactorReceta(1.0);
                      }
                    }
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {allowedFormatosQuote.includes('libra') && (
                  <optgroup label="⚖️ Formato Libra (Pasteles & Moldes)">
                    <option value="½ LB (8-10 porciones)">½ LB (8-10 porciones) [0.5x]</option>
                    <option value="1 LB (16-20 porciones)">1 LB (16-20 porciones) [Estándar 1x]</option>
                    <option value="2 LB (30-40 porciones)">2 LB (30-40 porciones) [2x]</option>
                    <option value="3 LB (50+ porciones)">3 LB (50+ porciones) [3x]</option>
                    <option value="1 Molde 22cm (10-12 porciones)">1 Molde 22cm (10-12 porciones) [1x]</option>
                    <option value="1 Molde Bundt 24cm (12-14 porciones)">1 Molde Bundt 24cm (12-14 porciones) [1x]</option>
                  </optgroup>
                )}
                {allowedFormatosQuote.includes('porcion') && (
                  <optgroup label="🍰 Formato Porción (Rebanadas & Platos)">
                    {porcionQuoteOpciones.map((opc) => (
                      <option key={opc.label} value={`${opc.label} [${opc.factor}x]`}>
                        {opc.label} [{opc.factor}x] - {opc.descripcion}
                      </option>
                    ))}
                  </optgroup>
                )}
                {allowedFormatosQuote.includes('mini') && (
                  <optgroup label="🧁 Formato Mini (Bocaditos & Mesa de Dulces)">
                    <option value="Caja x 12 Mini Bocaditos">Caja x 12 Mini Bocaditos [0.35x]</option>
                    <option value="Caja x 24 Mini Bocaditos">Caja x 24 Mini Bocaditos [0.70x]</option>
                    <option value="Caja x 50 Mini Bocaditos (Eventos)">Caja x 50 Mini Bocaditos (Eventos) [1.45x]</option>
                    <option value="Caja x 100 Mini Bocaditos (Banquete)">Caja x 100 Mini Bocaditos (Banquete) [2.90x]</option>
                    <option value="Personalizado Mini">🧁 Personalizado: Cantidad Exacta de Minis...</option>
                  </optgroup>
                )}
              </select>

              {/* Editor de Cantidad Exacta de Minis si aplica */}
              {isCustomMiniSelected && allowedFormatosQuote.includes('mini') && (
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

            {/* ================================================================= */}
            {/* INSUMOS VARIABLES ESPECÍFICOS DE LA RECETA SELECCIONADA          */}
            {/* ================================================================= */}
            {variablesReceta.length > 0 && (
              <div className="sm:col-span-2 md:col-span-3 bg-white p-4 rounded-2xl border-2 border-emerald-300/80 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-chocolate-900 text-xs flex items-center gap-1.5">
                        Insumos Variables de la Receta:
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {activeRecipeVariableIds.size} de {variablesReceta.length} seleccionados
                        </span>
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        Marca los rellenos, coberturas o empaques propios de esta receta que deseas incluir en esta cotización.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllRecipeVariables}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllRecipeVariables}
                      className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      Ninguno
                    </button>
                    {diferenciaPrecioVariablesReceta > 0 && (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-extrabold text-xs">
                        +{formatCurrency(diferenciaPrecioVariablesReceta)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {variablesReceta.map((ing) => {
                    const insumo = insumosMap.get(ing.insumo_id);
                    const isApplied = activeRecipeVariableIds.has(ing.insumo_id);
                    const cantidadEscalada = ing.cantidad * factorReceta;
                    const nombreInsumo = insumo?.nombre || `Insumo #${ing.insumo_id}`;
                    const unidadBase = insumo?.unidad_base || 'g';
                    const costoCalculado = calcularCostoIngrediente(cantidadEscalada, insumo);

                    return (
                      <label
                        key={ing.insumo_id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isApplied
                            ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-300'
                            : 'bg-canvas/50 border-trigo-200 text-gray-500 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isApplied}
                          onChange={() => handleToggleRecipeVariable(ing.insumo_id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`block truncate text-xs ${isApplied ? 'text-chocolate-900 font-bold' : 'text-gray-500'}`}>
                            {nombreInsumo}
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal block">
                            {formatUnit(cantidadEscalada, unidadBase)} • Costo: {formatCurrency(costoCalculado)}
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ${
                          isApplied ? 'bg-emerald-200/80 text-emerald-900' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isApplied ? '✓ Aplicado' : 'Opcional'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tipo de Masa con Precio Dinámico */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-chocolate-700 text-xs">
                  Tipo de Masa / Bizcocho
                </label>
                <button
                  type="button"
                  onClick={() => openOptionsManager('masas')}
                  className="text-[11px] text-frambuesa-600 hover:text-frambuesa-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <Settings className="w-3 h-3" />
                  <span>Editar Opciones</span>
                </button>
              </div>
              <select
                value={masaBase}
                onChange={(e) => setMasaBase(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {masasOpciones.map((m) => {
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-chocolate-700 text-xs">
                  Relleno Artesanal
                </label>
                <button
                  type="button"
                  onClick={() => openOptionsManager('rellenos')}
                  className="text-[11px] text-frambuesa-600 hover:text-frambuesa-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <Settings className="w-3 h-3" />
                  <span>Editar Opciones</span>
                </button>
              </div>
              <select
                value={relleno}
                onChange={(e) => setRelleno(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {rellenosOpciones.map((r) => {
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-chocolate-700 text-xs">
                  Estilo de Decoración & Cobertura
                </label>
                <button
                  type="button"
                  onClick={() => openOptionsManager('decoraciones')}
                  className="text-[11px] text-frambuesa-600 hover:text-frambuesa-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <Settings className="w-3 h-3" />
                  <span>Editar Opciones</span>
                </button>
              </div>
              <select
                value={decoracion}
                onChange={(e) => setDecoracion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-medium text-chocolate-900"
              >
                {decoracionesOpciones.map((d) => {
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
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-chocolate-700">
                  Precio Unitario
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  tipoPrecioSeleccionado === 'real'
                    ? 'bg-crema text-chocolate-700 border border-trigo-200'
                    : tipoPrecioSeleccionado === 'redondeado'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {tipoPrecioSeleccionado === 'real' ? 'Real' : tipoPrecioSeleccionado === 'redondeado' ? 'Redondeado' : 'Editado'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  RD$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Calculado: ${formatCurrency(tipoPrecioSeleccionado === 'real' ? precioSugeridoReal : precioSugeridoRedondeado)}`}
                  value={
                    precioBaseManual !== ''
                      ? precioBaseManual
                      : (tipoPrecioSeleccionado === 'real' ? precioSugeridoReal : precioSugeridoRedondeado)
                  }
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                    setPrecioBaseManual(val);
                    setTipoPrecioSeleccionado('personalizado');
                  }}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 focus:outline-none bg-white font-mono font-bold text-chocolate-900"
                />
              </div>
            </div>

            {/* Dedicatoria / Tarjeta con Mensaje */}
            <div className="sm:col-span-2 md:col-span-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-chocolate-700 text-xs">
                  Dedicatoria / Mensaje Personalizado (Opcional)
                </label>
                {isTarjetaSelected && (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-fade-in shadow-xs">
                    <span>💌</span> Tarjeta con Mensaje Seleccionada
                  </span>
                )}
              </div>

              {isTarjetaSelected && (
                <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] flex items-center gap-2 animate-fade-in">
                  <span className="text-base shrink-0">✍️</span>
                  <span>
                    <strong>¡Has incluido una Tarjeta con Mensaje!</strong> Escribe a continuación el texto o dedicatoria personalizada que se caligrafiará en la tarjeta del producto:
                  </span>
                </div>
              )}

              <input
                ref={dedicatoriaInputRef}
                type="text"
                placeholder={
                  isTarjetaSelected
                    ? "Escribe aquí la dedicatoria para la tarjeta (ej. '¡Feliz Cumpleaños Mariana! Con todo nuestro cariño...')"
                    : "Ej. ¡Feliz Cumpleaños Mariana! Que cumplas muchos más..."
                }
                value={dedicatoria}
                onChange={(e) => setDedicatoria(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-chocolate-900 transition-all focus:outline-none ${
                  isTarjetaSelected && !dedicatoria.trim()
                    ? 'border-emerald-400 ring-2 ring-emerald-200/80 shadow-sm placeholder:text-emerald-700/60'
                    : 'border-trigo-300 focus:ring-2 focus:ring-frambuesa-400'
                }`}
              />
            </div>

            {/* Extras y Productos Variables Opcionales */}
            <div className="sm:col-span-2 md:col-span-3 bg-canvas p-4 rounded-2xl border border-trigo-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-chocolate-800 flex items-center gap-1.5 text-xs">
                    <Gift className="w-4 h-4 text-frambuesa-500" />
                    <span>Adicionales, Extras & Productos Variables:</span>
                  </span>
                  {selectedExtras.length > 0 && (
                    <span className="text-[10px] font-extrabold bg-frambuesa-100 text-frambuesa-800 px-2 py-0.5 rounded-full">
                      {selectedExtras.length} seleccionados (+{formatCurrency(totalExtrasUnitario)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedExtras.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedExtras([])}
                      className="text-[11px] text-gray-500 hover:text-chocolate-800 font-semibold underline"
                    >
                      Deseleccionar Todos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openOptionsManager('extras')}
                    className="text-[11px] text-frambuesa-600 hover:text-frambuesa-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Gestionar Extras / Precios</span>
                  </button>
                </div>
              </div>

              {/* Barra de Búsqueda y Píldoras de Filtro de Extras (Empaques, Toppers, Stickers, Tarjetas, Otros) */}
              <div className="flex flex-col gap-2">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar producto variable o extra (ej. Caja, Topper, Sticker, Tarjeta, Vela)..."
                    value={searchExtraTerm}
                    onChange={(e) => setSearchExtraTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-trigo-200 text-xs bg-white text-chocolate-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-frambuesa-400"
                  />
                </div>
                
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setFilterExtraCategory('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 ${
                      filterExtraCategory === 'all'
                        ? 'bg-chocolate-700 text-white shadow-sm'
                        : 'bg-white text-chocolate-600 border border-trigo-200 hover:bg-crema'
                    }`}
                  >
                    Todos ({extrasOpciones.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExtraCategory('empaques')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      filterExtraCategory === 'empaques'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span>📦</span> Empaques ({empaquesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExtraCategory('toppers')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      filterExtraCategory === 'toppers'
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100'
                    }`}
                  >
                    <span>🎂</span> Toppers ({toppersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExtraCategory('stickers')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      filterExtraCategory === 'stickers'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>🏷️</span> Stickers ({stickersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExtraCategory('tarjetas')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      filterExtraCategory === 'tarjetas'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span>💌</span> Tarjetas con Mensaje ({tarjetasCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterExtraCategory('otros')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      filterExtraCategory === 'otros'
                        ? 'bg-chocolate-600 text-white shadow-sm'
                        : 'bg-crema text-chocolate-700 border border-trigo-200 hover:bg-trigo-100'
                    }`}
                  >
                    <span>✨</span> Otros ({otrosCount})
                  </button>
                </div>
              </div>

              {/* Grid Scrollable de Extras */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 border border-trigo-100 rounded-xl bg-white/70"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {filteredExtrasList.length === 0 ? (
                  <p className="sm:col-span-3 text-center py-4 text-xs text-gray-400">
                    No se encontraron productos variables o extras en esta categoría.
                  </p>
                ) : (
                  filteredExtrasList.map((extra) => {
                    const isChecked = selectedExtras.includes(extra.id);
                    const cat = getExtraCategory(extra);
                    
                    const catBadgeStyle: Record<CategoriaExtra, string> = {
                      empaque: 'bg-purple-100 text-purple-700 border-purple-200',
                      topper: 'bg-pink-100 text-pink-700 border-pink-200',
                      sticker: 'bg-amber-100 text-amber-800 border-amber-200',
                      tarjeta: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      otro: 'bg-trigo-100 text-chocolate-700 border-trigo-200',
                    };

                    const catLabel: Record<CategoriaExtra, string> = {
                      empaque: '📦 Empaque',
                      topper: '🎂 Topper',
                      sticker: '🏷️ Sticker',
                      tarjeta: '💌 Tarjeta con Mensaje',
                      otro: '✨ Detalle Especial',
                    };

                    return (
                      <label
                        key={extra.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-frambuesa-50 border-frambuesa-400 text-frambuesa-900 font-bold shadow-sm ring-1 ring-frambuesa-300'
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
                              if (cat === 'tarjeta' && !dedicatoria.trim()) {
                                setTimeout(() => {
                                  dedicatoriaInputRef.current?.focus();
                                }, 100);
                              }
                            }
                          }}
                          className="w-4 h-4 rounded text-frambuesa-600 focus:ring-frambuesa-400 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-[11px] leading-snug">{extra.nombre}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 border ${catBadgeStyle[cat]}`}>
                            {catLabel[cat]}
                          </span>
                        </div>
                        <span className="text-frambuesa-700 whitespace-nowrap font-extrabold text-xs shrink-0">
                          +{formatCurrency(extra.precio)}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Selector de Modalidad de Precio (Real vs Redondeado) y Edición Libre */}
          <div className="bg-canvas/80 p-4 rounded-2xl border-2 border-trigo-300 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-chocolate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Modalidad de Precio Unitario
                </span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Selecciona entre el precio de costo real exacto o el redondeado comercial, o escribe un precio personalizado.
                </p>
              </div>

              {/* Botones de Selección Rápida */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-trigo-300 shadow-sm self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSelectTipoPrecio('real')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex flex-col ${
                    tipoPrecioSeleccionado === 'real'
                      ? 'bg-chocolate-700 text-white shadow-sm ring-2 ring-chocolate-800'
                      : 'text-chocolate-800 hover:bg-crema/60'
                  }`}
                >
                  <span className={`text-[9px] uppercase font-semibold ${tipoPrecioSeleccionado === 'real' ? 'text-trigo-200' : 'text-gray-500'}`}>
                    Precio Real (Sin Redondeo)
                  </span>
                  <span className="font-mono text-xs font-extrabold">
                    {formatCurrency(precioSugeridoReal)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTipoPrecio('redondeado')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left flex flex-col ${
                    tipoPrecioSeleccionado === 'redondeado'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-700'
                      : 'text-chocolate-800 hover:bg-crema/60'
                  }`}
                >
                  <span className={`text-[9px] uppercase font-semibold ${tipoPrecioSeleccionado === 'redondeado' ? 'text-emerald-100' : 'text-gray-500'}`}>
                    Precio Redondeado (0 Superior)
                  </span>
                  <span className="font-mono text-xs font-extrabold">
                    {formatCurrency(precioSugeridoRedondeado)}
                  </span>
                </button>
              </div>
            </div>

            {/* Input Editable de Precio Unitario */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-trigo-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-chocolate-800">
                  Precio Unitario Base Aplicado:
                </span>
                <span className="text-[11px] text-gray-500">
                  (Masa, relleno, deco y receta incluidos; extras se suman aparte)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    RD$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      precioBaseManual !== ''
                        ? precioBaseManual
                        : tipoPrecioSeleccionado === 'real'
                        ? precioSugeridoReal
                        : precioSugeridoRedondeado
                    }
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setPrecioBaseManual(val);
                      setTipoPrecioSeleccionado('personalizado');
                    }}
                    placeholder="0.00"
                    className="w-36 pl-10 pr-3 py-1.5 rounded-xl border border-trigo-300 text-xs font-mono font-black text-chocolate-900 focus:ring-2 focus:ring-frambuesa-500 outline-none bg-white shadow-inner"
                  />
                </div>

                {tipoPrecioSeleccionado === 'personalizado' ? (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
                    ✏️ Manual Editado
                  </span>
                ) : tipoPrecioSeleccionado === 'real' ? (
                  <span className="text-[10px] font-bold text-chocolate-700 bg-crema px-2.5 py-1 rounded-lg border border-trigo-300">
                    ⚖️ Real sin redondeo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                    ✨ Redondeado sugerido
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desglose Dinámico en Tiempo Real y Botón Agregar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-trigo-200 bg-crema/50 p-4 rounded-2xl">
            <div className="text-xs text-chocolate-700 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-[11px]">
                <span>
                  Base Receta ({tipoPrecioSeleccionado === 'real' ? 'Real' : tipoPrecioSeleccionado === 'redondeado' ? 'Redondeada' : 'Manual'}):{' '}
                  <b className="text-chocolate-900 font-mono">
                    {formatCurrency(
                      tipoPrecioSeleccionado === 'real'
                        ? (calcRecetaBasePuro ? (calcRecetaBasePuro.precio_sugerido_margen_venta_raw ?? calcRecetaBasePuro.precio_sugerido_margen_venta) : precioBaseRecetaReal)
                        : (calcRecetaBasePuro ? calcRecetaBasePuro.precio_sugerido_margen_venta : precioBaseRecetaCalculado)
                    )}
                  </b>
                </span>
                {diferenciaPrecioVariablesReceta > 0 && (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                    + Variables ({activeRecipeVariableIds.size}): <b>+{formatCurrency(diferenciaPrecioVariablesReceta)}</b>
                  </span>
                )}
                {costoMasa > 0 && <span className="text-amber-800 font-mono">+ Masa: <b>+{formatCurrency(costoMasa)}</b></span>}
                {costoRelleno > 0 && <span className="text-indigo-800 font-mono">+ Relleno: <b>+{formatCurrency(costoRelleno)}</b></span>}
                {costoDecoracion > 0 && <span className="text-purple-800 font-mono">+ Deco: <b>+{formatCurrency(costoDecoracion)}</b></span>}
                {totalExtrasUnitario > 0 && <span className="text-emerald-800 font-mono">+ Extras: <b>+{formatCurrency(totalExtrasUnitario)}</b></span>}
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
                        {item.variables_receta && item.variables_receta.length > 0 && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            🎨 Variables: {item.variables_receta.join(', ')}
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
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[10px] text-gray-400 font-mono">RD$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.precio_unitario}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              handleUpdateItemPrice(item.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-24 px-2 py-1 text-right text-xs font-mono font-bold text-chocolate-900 border border-trigo-300 rounded-lg focus:ring-1 focus:ring-frambuesa-500 bg-canvas/30 hover:bg-white transition-colors"
                            title="Haz clic para editar el precio unitario de este producto"
                          />
                        </div>
                        {item.tipo_precio_aplicado && (
                          <span className="text-[9px] text-gray-400 block mt-0.5 capitalize">
                            {item.tipo_precio_aplicado === 'real' ? 'Precio real' : item.tipo_precio_aplicado === 'redondeado' ? 'Redondeado' : 'Editado'}
                          </span>
                        )}
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
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-chocolate-700">
                Costo de Envío (RD$)
              </label>
              {tipoDespacho === 'retiro' ? (
                <span className="text-[10px] text-stone-500 font-bold bg-stone-100 px-1.5 py-0.5 rounded">
                  Retiro en Taller
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Flete a Domicilio
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="1"
              disabled={tipoDespacho === 'retiro'}
              value={costoEnvio}
              onChange={(e) =>
                setCostoEnvio(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className={`w-full px-3 py-2 rounded-xl border border-trigo-300 focus:ring-2 focus:ring-frambuesa-400 ${
                tipoDespacho === 'retiro' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white font-bold text-chocolate-900'
              }`}
            />
          </div>

          {/* Método de Pago Preferido */}
          <div className="sm:col-span-2 md:col-span-4 bg-white p-3 rounded-2xl border border-trigo-200">
            <label className="block font-bold text-chocolate-800 mb-1.5 text-xs">
              Forma de Pago del Cliente *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  metodoPago === 'transferencia'
                    ? 'bg-chocolate-700 text-white border-chocolate-700 shadow-sm'
                    : 'bg-crema/40 text-chocolate-700 border-trigo-300 hover:bg-white'
                }`}
              >
                <span>🏦 Transferencia</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('efectivo')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  metodoPago === 'efectivo'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-crema/40 text-chocolate-700 border-trigo-300 hover:bg-white'
                }`}
              >
                <span>💵 Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('tarjeta')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 col-span-2 sm:col-span-1 ${
                  metodoPago === 'tarjeta'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-crema/40 text-chocolate-700 border-trigo-300 hover:bg-white'
                }`}
              >
                <span>💳 Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Esquema de Cobro: Anticipo 50% vs Contra Entrega 100% (Pedidos Pequeños) */}
          <div className="sm:col-span-2 md:col-span-4 bg-white p-3.5 rounded-2xl border border-trigo-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <label className="block font-bold text-chocolate-900 text-xs">
                  Modalidad de Cobro y Anticipo *
                </label>
                <p className="text-[11px] text-chocolate-600">
                  Selecciona si se requiere el 50% de anticipo tradicional o si se autoriza el cobro 100% contra entrega para pedidos pequeños.
                </p>
              </div>
              {totalCotizacion > 0 && totalCotizacion <= 1500 && (
                <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  💡 Pedido Pequeño (Sugerido Contra Entrega)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCobroContraEntrega(false)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-start gap-2.5 ${
                  !cobroContraEntrega
                    ? 'bg-chocolate-700 text-white border-chocolate-800 shadow-sm'
                    : 'bg-crema/40 text-chocolate-800 border-trigo-300 hover:bg-white'
                }`}
              >
                <span className="text-base leading-none">⚖️</span>
                <div>
                  <div className="font-bold">50% Anticipo / 50% Saldo</div>
                  <div className={`text-[10px] ${!cobroContraEntrega ? 'text-trigo-200' : 'text-chocolate-500'}`}>
                    Esquema estándar: requiere 50% de depósito para confirmar y agendar en taller.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCobroContraEntrega(true)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-start gap-2.5 ${
                  cobroContraEntrega
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-crema/40 text-chocolate-800 border-trigo-300 hover:bg-white'
                }`}
              >
                <span className="text-base leading-none">🛵</span>
                <div>
                  <div className="font-bold">100% Contra Entrega (Pedidos Pequeños)</div>
                  <div className={`text-[10px] ${cobroContraEntrega ? 'text-emerald-100' : 'text-chocolate-500'}`}>
                    Sin anticipo previo. El cliente abona el monto total en efectivo/transferencia al recibir.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex flex-col justify-center items-end text-right bg-crema/30 p-3.5 rounded-2xl border border-trigo-200 space-y-1">
            <span className="text-gray-500 text-xs">Subtotal Productos: {formatCurrency(subtotalCotizacion)}</span>
            {descNum > 0 && (
              <span className="text-emerald-700 font-semibold text-xs">
                Descuento: -{formatCurrency(descNum)}
              </span>
            )}
            {envioNum > 0 && (
              <span className="text-chocolate-700 text-xs">
                Delivery ({tipoDespacho === 'delivery' && pagoDelivery === 'efectivo_aparte' ? 'efectivo directo al chofer' : 'incluido en total'}): +{formatCurrency(envioNum)}
              </span>
            )}

            {tipoDespacho === 'delivery' && pagoDelivery === 'efectivo_aparte' ? (
              <div className="mt-1 space-y-0.5">
                <div className="text-xs text-chocolate-800 font-bold">
                  Total Pedido Pastelería: <b className="text-base text-frambuesa-600">{formatCurrency(Math.max(0, subtotalCotizacion - descNum))}</b>
                </div>
                <div className="text-[11px] text-gray-500">
                  + {formatCurrency(envioNum)} flete a pagar en efectivo aparte al repartidor contra entrega
                </div>
              </div>
            ) : (
              <div className="text-lg sm:text-xl font-black text-chocolate-900 mt-1">
                <span>Total Cotización: </span>
                <span className="text-frambuesa-600">{formatCurrency(totalCotizacion)}</span>
              </div>
            )}

            {/* Desglose de Anticipo vs Contra Entrega */}
            <div className="pt-2 mt-1 border-t border-trigo-200/80 w-full flex flex-col items-end text-xs">
              {cobroContraEntrega ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-right w-full sm:w-auto">
                  <span className="font-bold text-emerald-800 flex items-center justify-end gap-1">
                    <span>🛵 Autorizado 100% Contra Entrega</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 block">
                    Anticipo: <strong>RD$ 0.00</strong> • Cobrar <strong>{formatCurrency(totalCotizacion)}</strong> al recibir
                  </span>
                </div>
              ) : (
                <div className="text-chocolate-700 text-[11px]">
                  <span>Anticipo 50%: <strong>{formatCurrency(totalCotizacion * 0.5)}</strong></span>
                  <span className="mx-1.5">•</span>
                  <span>Saldo al entregar (50%): <strong>{formatCurrency(totalCotizacion * 0.5)}</strong></span>
                </div>
              )}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-trigo-200">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[11px] text-gray-500 block">Total Cotización:</span>
            <span className="text-base sm:text-lg font-black text-frambuesa-600 leading-none">
              {formatCurrency(totalCotizacion)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-trigo-300 text-xs font-semibold text-chocolate-600 hover:bg-crema transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-xs shadow-frambuesa-glow hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {initialCotizacion ? 'Guardar Cambios' : 'Crear Cotización'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Gestor de Opciones Personalizadas */}
      <OptionsManagerModal
        isOpen={isOptionsManagerOpen}
        onClose={() => setIsOptionsManagerOpen(false)}
        initialTab={optionsManagerTab}
        masas={masasOpciones}
        rellenos={rellenosOpciones}
        decoraciones={decoracionesOpciones}
        extras={extrasOpciones}
        onSave={handleSaveCustomOptions}
        onResetDefaults={handleResetCustomOptions}
      />

      {/* Modal de Vista Previa y Corrección de Ubicación con Google Maps */}
      <LocationGoogleMapsModal
        isOpen={isMapPreviewOpen}
        onClose={() => setIsMapPreviewOpen(false)}
        direccion={direccionEntrega}
        puntoReferencia={puntoReferencia}
        mapsUrl={detectedMapsLink || undefined}
        clienteNombre={clienteNombre}
        zonaNombre={zonasDelivery.find(z => z.id === Number(zonaDeliveryId))?.nombre}
        onSave={(data) => {
          setDireccionEntrega(data.direccion);
          setPuntoReferencia(data.punto_referencia);
          if (data.mapsUrl) {
            setDetectedMapsLink(data.mapsUrl);
          }
        }}
      />
    </Modal>
  );
};
