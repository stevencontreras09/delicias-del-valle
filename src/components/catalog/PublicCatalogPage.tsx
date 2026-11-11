import React, { useState, useEffect, useMemo } from 'react';
import {
  CatalogProductItem,
  CatalogOrderItemSelection,
  CatalogOrderRequest,
} from '../../types';
import {
  fetchCatalogItemsFromSupabase,
  submitPublicCatalogOrderToSupabase,
  fetchAllFromSupabase,
  fetchQuoteOptionsFromSupabase,
} from '../../services/supabaseService';
import { MapLocationPicker } from '../maps/MapLocationPicker';
import { DELICIAS_WORKSHOP_COORDS } from '../../utils/routeOptimizer';
import { buildWhatsAppUrl } from '../../utils/whatsappHelper';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  MapPin,
  Calendar,
  Clock,
  Phone,
  User,
  Heart,
  Truck,
  Store,
  Send,
  ArrowLeft,
  CheckCircle2,
  Cake,
  FileText,
  X,
} from 'lucide-react';

interface PublicCatalogPageProps {
  onBackToApp?: () => void;
}

const DEFAULT_TAMANOS = [
  '1/2 Libra (8-10 porciones)',
  '1 Libra (16-20 porciones)',
  '1.5 Libras (24-28 porciones)',
  '2 Libras (32-40 porciones)',
  'Porción Individual',
  'Media Docena (6 uds)',
  'Docena (12 uds)',
];

const DEFAULT_MASAS = [
  'Vainilla Tradicional Dominicana',
  'Chocolate Intenso Artesanal',
  'Red Velvet',
  'Zanahoria con Nueces & Canela',
  'Marmoleado (Vainilla & Chocolate)',
  'Limón Natural',
  'Naranja Artesanal',
  'No aplica / Receta Original',
];

const DEFAULT_RELLENOS = [
  'Dulce de Leche Artesanal',
  'Crema Pastelera Tradicional',
  'Nutella / Crema de Avellanas',
  'Mermelada de Fresa / Frutos Rojos',
  'Ganache de Chocolate Oscuro',
  'Cream Cheese (Queso Crema)',
  'Mermelada de Piña Natural',
  'Mermelada de Guayaba',
  'Sin Relleno / Tradicional',
];

const DEFAULT_DECORACIONES = [
  'Suspiro Dominicano Tradicional',
  'Buttercream Suizo Suave',
  'Drip Cake con Ganache',
  'Naked Cake / Semi-Naked',
  'Fondant Personalizado',
  'Acabado Clásico de la Casa',
];

export const PublicCatalogPage: React.FC<PublicCatalogPageProps> = ({ onBackToApp }) => {
  const [items, setItems] = useState<CatalogProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Opciones dinámicas sincronizadas desde el cotizador de la pastelería (sin precios)
  const [globalMasas, setGlobalMasas] = useState<string[]>(DEFAULT_MASAS);
  const [globalRellenos, setGlobalRellenos] = useState<string[]>(DEFAULT_RELLENOS);
  const [globalDecoraciones, setGlobalDecoraciones] = useState<string[]>(DEFAULT_DECORACIONES);

  // Producto actualmente abierto en el configurador al gusto del cliente
  const [configuringProduct, setConfiguringProduct] = useState<CatalogProductItem | null>(null);
  const [cfgTamano, setCfgTamano] = useState<string>(DEFAULT_TAMANOS[1]);
  const [cfgMasa, setCfgMasa] = useState<string>(DEFAULT_MASAS[0]);
  const [cfgRelleno, setCfgRelleno] = useState<string>(DEFAULT_RELLENOS[0]);
  const [cfgDecoracion, setCfgDecoracion] = useState<string>(DEFAULT_DECORACIONES[0]);
  const [cfgCantidad, setCfgCantidad] = useState<number>(1);
  const [cfgDedicatoria, setCfgDedicatoria] = useState<string>('');
  const [cfgNotas, setCfgNotas] = useState<string>('');

  // Carrito de productos configurados por el cliente
  const [cart, setCart] = useState<CatalogOrderItemSelection[]>(() => {
    try {
      const saved = localStorage.getItem('delicias_public_catalog_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Datos de confirmación del pedido del cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [horaEntrega, setHoraEntrega] = useState('15:00');
  const [tipoDespacho, setTipoDespacho] = useState<'retiro' | 'delivery'>('delivery');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [puntoReferencia, setPuntoReferencia] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DELICIAS_WORKSHOP_COORDS.lat,
    lng: DELICIAS_WORKSHOP_COORDS.lng,
  });
  const [notasGenerales, setNotasGenerales] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<CatalogOrderRequest | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('delicias_public_catalog_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      setIsLoading(true);
      try {
        const [catalogItems, quoteOpts] = await Promise.all([
          fetchCatalogItemsFromSupabase(),
          fetchQuoteOptionsFromSupabase(),
        ]);

        if (mounted && quoteOpts) {
          if (Array.isArray(quoteOpts.masas) && quoteOpts.masas.length > 0) {
            setGlobalMasas(quoteOpts.masas.map((m) => m.nombre));
          }
          if (Array.isArray(quoteOpts.rellenos) && quoteOpts.rellenos.length > 0) {
            setGlobalRellenos(quoteOpts.rellenos.map((r) => r.nombre));
          }
          if (Array.isArray(quoteOpts.decoraciones) && quoteOpts.decoraciones.length > 0) {
            setGlobalDecoraciones(quoteOpts.decoraciones.map((d) => d.nombre));
          }
        }

        const activeCatalog = (catalogItems || []).filter((i) => i.activo !== false);
        if (activeCatalog.length > 0) {
          if (mounted) setItems(activeCatalog);
        } else {
          // Si aún no hay ítems personalizados guardados, construir catálogo inicial desde las recetas activas
          const allRes = await fetchAllFromSupabase();
          if (mounted && allRes.success && allRes.data?.recetas) {
            const fallbackItems: CatalogProductItem[] = allRes.data.recetas
              .filter((r) => r.activa !== false)
              .map((r, idx) => ({
                id: `cat-rec-${r.id}`,
                receta_id: r.id,
                nombre: r.nombre,
                categoria: r.categoria || 'Pastelería Artesanal',
                descripcion:
                  r.descripcion ||
                  'Elaborado artesanalmente bajo pedido con ingredientes frescos de primera calidad.',
                tamanos_disponibles: DEFAULT_TAMANOS,
                masas_disponibles: DEFAULT_MASAS,
                rellenos_disponibles: DEFAULT_RELLENOS,
                decoraciones_disponibles: DEFAULT_DECORACIONES,
                permite_personalizacion: true,
                permite_dedicatoria: true,
                activo: true,
                orden: idx + 1,
              }));
            setItems(fallbackItems);
          }
        }
      } catch (err) {
        console.warn('Error cargando catálogo público:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>(['Todas']);
    items.forEach((i) => {
      if (i.categoria) cats.add(i.categoria);
    });
    return Array.from(cats);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.activo === false) return false;
      const matchesCat = selectedCategory === 'Todas' || item.categoria === selectedCategory;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.nombre.toLowerCase().includes(q) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(q)) ||
        (item.categoria && item.categoria.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [items, selectedCategory, searchTerm]);

  const handleOpenConfigurator = (product: CatalogProductItem) => {
    const tamanos =
      product.tamanos_disponibles && product.tamanos_disponibles.length > 0
        ? product.tamanos_disponibles
        : DEFAULT_TAMANOS;
    const masas =
      product.masas_disponibles && product.masas_disponibles.length > 0
        ? product.masas_disponibles
        : globalMasas;
    const rellenos =
      product.rellenos_disponibles && product.rellenos_disponibles.length > 0
        ? product.rellenos_disponibles
        : globalRellenos;
    const decoraciones =
      product.decoraciones_disponibles && product.decoraciones_disponibles.length > 0
        ? product.decoraciones_disponibles
        : globalDecoraciones;

    setConfiguringProduct(product);
    setCfgTamano(tamanos[0] || DEFAULT_TAMANOS[0]);
    setCfgMasa(masas[0] || DEFAULT_MASAS[0]);
    setCfgRelleno(rellenos[0] || DEFAULT_RELLENOS[0]);
    setCfgDecoracion(decoraciones[0] || DEFAULT_DECORACIONES[0]);
    setCfgCantidad(1);
    setCfgDedicatoria('');
    setCfgNotas('');
  };

  const handleAddConfiguredToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringProduct) return;

    const newSelection: CatalogOrderItemSelection = {
      id: `sel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      catalog_item_id: configuringProduct.id,
      receta_id: configuringProduct.receta_id,
      producto_nombre: configuringProduct.nombre,
      imagen_url: configuringProduct.imagen_url,
      cantidad: Math.max(1, cfgCantidad),
      tamano_porciones: cfgTamano,
      masa_base: cfgMasa,
      relleno: cfgRelleno,
      decoracion: cfgDecoracion,
      dedicatoria: cfgDedicatoria.trim() || undefined,
      notas_personalizacion: cfgNotas.trim() || undefined,
    };

    setCart((prev) => [...prev, newSelection]);
    setConfiguringProduct(null);
  };

  const handleRemoveFromCart = (selectionId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== selectionId));
  };

  const handleUpdateCartQuantity = (selectionId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== selectionId) return item;
        return { ...item, cantidad: Math.max(1, item.cantidad + delta) };
      })
    );
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!clienteNombre.trim() || !clienteTelefono.trim()) {
      alert('Por favor ingresa tu nombre completo y tu número de WhatsApp / teléfono.');
      return;
    }
    if (tipoDespacho === 'delivery' && !direccionEntrega.trim() && !mapsUrl.trim()) {
      alert('Por favor indica tu dirección de entrega o selecciona tu ubicación en el mapa.');
      return;
    }

    setIsSubmitting(true);
    try {
      const folio = `CAT-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const newOrder: CatalogOrderRequest = {
        id: `req-${Date.now()}`,
        folio,
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim(),
        cliente_email: clienteEmail.trim() || undefined,
        fecha_entrega_deseada: fechaEntrega,
        hora_entrega_deseada: horaEntrega,
        tipo_despacho: tipoDespacho,
        direccion_entrega:
          tipoDespacho === 'delivery'
            ? direccionEntrega.trim() ||
              `Ubicación GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
            : 'Retiro en Taller Delicias del Valle',
        punto_referencia: tipoDespacho === 'delivery' ? puntoReferencia.trim() || undefined : undefined,
        maps_url:
          tipoDespacho === 'delivery'
            ? mapsUrl.trim() || `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`
            : undefined,
        notas_generales: notasGenerales.trim() || undefined,
        items: cart,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
      };

      await submitPublicCatalogOrderToSupabase(newOrder);
      setSubmittedOrder(newOrder);
      setCart([]);
      localStorage.removeItem('delicias_public_catalog_cart');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildWhatsAppOrderSummary = (order: CatalogOrderRequest) => {
    const lines: string[] = [
      `🎂 *NUEVO PEDIDO PERSONALIZADO DESDE EL CATÁLOGO*`,
      `📋 *Folio:* ${order.folio}`,
      `👤 *Cliente:* ${order.cliente_nombre}`,
      `📲 *WhatsApp:* ${order.cliente_telefono}`,
      `📅 *Fecha deseada:* ${order.fecha_entrega_deseada} (${order.hora_entrega_deseada || 'Por confirmar'})`,
      `🛵 *Modalidad:* ${order.tipo_despacho === 'delivery' ? 'Entrega a Domicilio (Delivery)' : 'Retiro en Taller'}`,
    ];
    if (order.tipo_despacho === 'delivery') {
      if (order.direccion_entrega) lines.push(`📍 *Dirección:* ${order.direccion_entrega}`);
      if (order.punto_referencia) lines.push(`🏠 *Referencia:* ${order.punto_referencia}`);
      if (order.maps_url) lines.push(`🗺️ *Pin GPS:* ${order.maps_url}`);
    }
    lines.push('\n🍰 *PRODUCTOS CONFIGURADOS AL GUSTO:*');
    order.items.forEach((item, idx) => {
      lines.push(`\n*${idx + 1}. ${item.producto_nombre} (x${item.cantidad})*`);
      lines.push(`   • Tamaño: ${item.tamano_porciones}`);
      if (item.masa_base && !item.masa_base.toLowerCase().includes('no aplica')) {
        lines.push(`   • Masa: ${item.masa_base}`);
      }
      if (item.relleno && !item.relleno.toLowerCase().includes('sin relleno')) {
        lines.push(`   • Relleno: ${item.relleno}`);
      }
      if (item.decoracion) {
        lines.push(`   • Cobertura/Decoración: ${item.decoracion}`);
      }
      if (item.dedicatoria) {
        lines.push(`   • Dedicatoria: "${item.dedicatoria}"`);
      }
      if (item.notas_personalizacion) {
        lines.push(`   • Detalles: ${item.notas_personalizacion}`);
      }
    });
    if (order.notas_generales) {
      lines.push(`\n📝 *Notas adicionales:* ${order.notas_generales}`);
    }
    return lines.join('\n');
  };

  const totalItemsInCart = cart.reduce((acc, i) => acc + i.cantidad, 0);

  if (submittedOrder) {
    const waText = buildWhatsAppOrderSummary(submittedOrder);
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 shadow-xl text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Folio #{submittedOrder.folio}
            </span>
            <h1 className="text-2xl font-serif font-bold text-chocolate-900 mt-3">
              ¡Tu Pedido Personalizado fue Recibido!
            </h1>
            <p className="text-xs sm:text-sm text-chocolate-600 mt-1">
              Gracias, <span className="font-bold text-chocolate-900">{submittedOrder.cliente_nombre}</span>. Hemos registrado tu selección y configuración en el sistema de <span className="font-bold text-frambuesa-700">Delicias del Valle</span>.
            </p>
          </div>

          <div className="bg-crema/60 rounded-2xl p-4 border border-trigo-200 text-left text-xs space-y-2 max-h-60 overflow-y-auto">
            <p className="font-bold text-chocolate-900 uppercase tracking-wider text-[11px]">
              Resumen de tu Orden Configurada:
            </p>
            {submittedOrder.items.map((item, idx) => (
              <div key={item.id} className="p-2.5 bg-white rounded-xl border border-trigo-200 space-y-0.5">
                <p className="font-bold text-chocolate-900">
                  {idx + 1}. {item.producto_nombre} (x{item.cantidad})
                </p>
                <p className="text-[11px] text-chocolate-700">
                  Tamaño: {item.tamano_porciones} • Masa: {item.masa_base}
                </p>
                <p className="text-[11px] text-chocolate-700">
                  Relleno: {item.relleno} • Cobertura: {item.decoracion}
                </p>
                {item.dedicatoria && (
                  <p className="text-[11px] text-frambuesa-700 italic">
                    Dedicatoria: &ldquo;{item.dedicatoria}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-2">
            <a
              href={buildWhatsAppUrl('', waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Confirmación también por WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSubmittedOrder(null);
                setIsCheckoutOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-canvas hover:bg-crema text-chocolate-800 font-bold text-xs border border-trigo-300 transition-colors"
            >
              Volver al Catálogo de Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-chocolate-900 pb-28">
      {/* Encabezado de Marca del Catálogo Público */}
      <header className="bg-gradient-to-r from-chocolate-900 via-chocolate-800 to-chocolate-900 text-white shadow-lg sticky top-0 z-30 border-b border-chocolate-700">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Delicias del Valle"
              className="w-11 h-11 rounded-2xl object-cover border-2 border-trigo-300 shadow-md bg-white"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                  Delicias del Valle
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-frambuesa-600 text-white">
                  <Sparkles className="w-3 h-3" />
                  Catálogo Personalizable
                </span>
              </div>
              <p className="text-[11px] text-trigo-200">
                Elige tus productos favoritos y configúralos totalmente a tu gusto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/15 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Volver al Panel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="relative px-4 py-2.5 rounded-2xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Mi Pedido ({totalItemsInCart})</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Explicativo Paso a Paso */}
        <section className="bg-white rounded-3xl p-4 sm:p-6 border border-trigo-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-serif font-bold text-chocolate-900 flex items-center gap-2">
              <Cake className="w-5 h-5 text-frambuesa-600 shrink-0" />
              <span>Arma tu Pedido Artesanal a tu Gusto</span>
            </h2>
            <p className="text-xs text-chocolate-600">
              1. Selecciona los postres o pasteles que deseas • 2. Elige masa, relleno, cobertura y dedicatoria • 3. Confirma tu pedido con entrega a domicilio o retiro.
            </p>
          </div>

          {/* Buscador */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-chocolate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="public-catalog-search"
              type="search"
              aria-label="Buscar producto en el catálogo"
              placeholder="Buscar pastel, postre, sabor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-trigo-300 bg-canvas text-xs text-chocolate-900 focus:outline-none focus:ring-2 focus:ring-frambuesa-400"
            />
          </div>
        </section>

        {/* Filtro de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-chocolate-900 text-white shadow-sm'
                  : 'bg-white hover:bg-crema text-chocolate-700 border border-trigo-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Galería de Productos del Catálogo (Sin Precios) */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-trigo-200">
            <Cake className="w-10 h-10 text-frambuesa-600 animate-bounce mx-auto mb-3" />
            <p className="text-sm font-bold text-chocolate-800">Cargando catálogo artesanal...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-trigo-200">
            <p className="text-sm font-bold text-chocolate-800">
              No encontramos productos con ese criterio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-3xl border border-trigo-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Imagen del Producto */}
                  <div className="relative h-56 bg-gradient-to-br from-crema via-amber-50/60 to-frambuesa-50/40 overflow-hidden flex items-center justify-center">
                    {product.imagen_url ? (
                      <img
                        src={product.imagen_url}
                        alt={product.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center mx-auto mb-2 text-frambuesa-600">
                          <Cake className="w-9 h-9" />
                        </div>
                        <span className="text-[11px] font-bold text-chocolate-600 block">
                          Delicias del Valle • Hecho a Mano
                        </span>
                      </div>
                    )}

                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md text-chocolate-900 shadow-xs border border-trigo-200">
                      {product.categoria}
                    </span>

                    {product.destacado && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-frambuesa-600 text-white shadow-xs flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" />
                        Favorito
                      </span>
                    )}
                  </div>

                  {/* Información del Producto */}
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-serif font-bold text-chocolate-900 leading-snug">
                      {product.nombre}
                    </h3>
                    <p className="text-xs text-chocolate-600 line-clamp-3 leading-relaxed">
                      {product.descripcion ||
                        'Personalizable en tamaño, sabor de masa, relleno artesanal y decoración a tu gusto.'}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenConfigurator(product)}
                    className="w-full py-3 px-4 rounded-2xl bg-chocolate-900 hover:bg-frambuesa-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Seleccionar y Configurar a mi Gusto</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Barra Flotante Inferior de Carrito cuando hay productos seleccionados */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-4 inset-x-4 z-30 max-w-2xl mx-auto">
          <div className="bg-chocolate-900 text-white rounded-3xl p-4 shadow-2xl border border-chocolate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-frambuesa-600 flex items-center justify-center font-bold text-sm shrink-0">
                {totalItemsInCart}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {totalItemsInCart} producto(s) configurado(s) en tu orden
                </p>
                <p className="text-[11px] text-trigo-200">
                  Listo para indicar tu dirección o fecha de entrega
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
            >
              Confirmar Pedido →
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Configurador del Producto al Gusto del Cliente */}
      {configuringProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-trigo-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-trigo-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-frambuesa-600">
                  Personaliza tu Orden
                </span>
                <h3 className="text-lg font-serif font-bold text-chocolate-900">
                  {configuringProduct.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringProduct(null)}
                className="p-1.5 rounded-xl bg-canvas hover:bg-crema text-chocolate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddConfiguredToCart} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="cfg-tamano" className="font-bold text-chocolate-800 block mb-1">
                  1. Tamaño / Cantidad de Porciones
                </label>
                <select
                  id="cfg-tamano"
                  value={cfgTamano}
                  onChange={(e) => setCfgTamano(e.target.value)}
                  className="w-full border border-trigo-300 rounded-xl px-3 py-2.5 bg-canvas font-medium text-chocolate-900"
                >
                  {(configuringProduct.tamanos_disponibles?.length
                    ? configuringProduct.tamanos_disponibles
                    : DEFAULT_TAMANOS
                  ).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {configuringProduct.permite_personalizacion !== false && (
                <>
                  <div>
                    <label htmlFor="cfg-masa" className="font-bold text-chocolate-800 block mb-1">
                      2. Sabor de la Masa Base
                    </label>
                    <select
                      id="cfg-masa"
                      value={cfgMasa}
                      onChange={(e) => setCfgMasa(e.target.value)}
                      className="w-full border border-trigo-300 rounded-xl px-3 py-2.5 bg-canvas font-medium text-chocolate-900"
                    >
                      {(configuringProduct.masas_disponibles?.length
                        ? configuringProduct.masas_disponibles
                        : globalMasas
                      ).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cfg-relleno" className="font-bold text-chocolate-800 block mb-1">
                      3. Relleno Preferido
                    </label>
                    <select
                      id="cfg-relleno"
                      value={cfgRelleno}
                      onChange={(e) => setCfgRelleno(e.target.value)}
                      className="w-full border border-trigo-300 rounded-xl px-3 py-2.5 bg-canvas font-medium text-chocolate-900"
                    >
                      {(configuringProduct.rellenos_disponibles?.length
                        ? configuringProduct.rellenos_disponibles
                        : globalRellenos
                      ).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cfg-decoracion" className="font-bold text-chocolate-800 block mb-1">
                      4. Cobertura / Estilo de Decoración
                    </label>
                    <select
                      id="cfg-decoracion"
                      value={cfgDecoracion}
                      onChange={(e) => setCfgDecoracion(e.target.value)}
                      className="w-full border border-trigo-300 rounded-xl px-3 py-2.5 bg-canvas font-medium text-chocolate-900"
                    >
                      {(configuringProduct.decoraciones_disponibles?.length
                        ? configuringProduct.decoraciones_disponibles
                        : globalDecoraciones
                      ).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {configuringProduct.permite_dedicatoria !== false && (
                <div>
                  <label htmlFor="cfg-dedicatoria" className="font-bold text-chocolate-800 block mb-1">
                    5. Dedicatoria o Mensaje Escrito (Opcional)
                  </label>
                  <input
                    id="cfg-dedicatoria"
                    type="text"
                    placeholder="Ej: ¡Feliz Cumpleaños Mamá! / Aniversario..."
                    value={cfgDedicatoria}
                    onChange={(e) => setCfgDedicatoria(e.target.value)}
                    className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas text-chocolate-900"
                  />
                </div>
              )}

              <div>
                <label htmlFor="cfg-notas" className="font-bold text-chocolate-800 block mb-1">
                  6. Detalles a tu Gusto (Colores, temática, alergias, nivel de dulce...)
                </label>
                <textarea
                  id="cfg-notas"
                  rows={2}
                  placeholder="Cuéntanos cómo te gustaría decorarlo o cualquier preferencia especial..."
                  value={cfgNotas}
                  onChange={(e) => setCfgNotas(e.target.value)}
                  className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas text-chocolate-900"
                />
              </div>

              <div className="flex items-center justify-between bg-crema/60 p-3 rounded-2xl border border-trigo-200">
                <span className="font-bold text-chocolate-800">Cantidad de Unidades:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCfgCantidad((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-trigo-300 flex items-center justify-center text-chocolate-800 font-bold"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-sm w-6 text-center">{cfgCantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCfgCantidad((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-white border border-trigo-300 flex items-center justify-center text-chocolate-800 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfiguringProduct(null)}
                  className="px-4 py-2.5 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Agregar a mi Pedido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Revisión del Pedido y Confirmación con Ubicación Google Maps */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-trigo-200 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-trigo-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-chocolate-900">
                  Confirmar Mi Pedido Personalizado
                </h3>
                <p className="text-xs text-chocolate-600">
                  Revisa los productos que configuraste y completa tus datos de entrega
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-chocolate-300 mx-auto" />
                <p className="text-sm font-bold text-chocolate-800">
                  Aún no has seleccionado productos del catálogo.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2 rounded-xl bg-frambuesa-600 text-white text-xs font-bold"
                >
                  Explorar el Catálogo
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmOrder} className="space-y-5 text-xs">
                {/* Lista de productos configurados */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-chocolate-900 uppercase tracking-wider text-[11px]">
                      Productos Seleccionados ({totalItemsInCart})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="text-frambuesa-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar otro producto</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-canvas border border-trigo-200 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-chocolate-900 text-xs sm:text-sm">
                            {item.producto_nombre}
                          </p>
                          <p className="text-[11px] text-chocolate-700">
                            <span className="font-semibold">Tamaño:</span> {item.tamano_porciones} •{' '}
                            <span className="font-semibold">Masa:</span> {item.masa_base}
                          </p>
                          <p className="text-[11px] text-chocolate-700">
                            <span className="font-semibold">Relleno:</span> {item.relleno} •{' '}
                            <span className="font-semibold">Decoración:</span> {item.decoracion}
                          </p>
                          {item.dedicatoria && (
                            <p className="text-[11px] text-frambuesa-700 italic">
                              Dedicatoria: &ldquo;{item.dedicatoria}&rdquo;
                            </p>
                          )}
                          {item.notas_personalizacion && (
                            <p className="text-[11px] text-chocolate-600">
                              Notas: {item.notas_personalizacion}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-trigo-300 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold w-5 text-center">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-trigo-300 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 ml-1"
                            title="Quitar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Datos de Contacto del Cliente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-trigo-200">
                  <div>
                    <label htmlFor="chk-nombre" className="font-bold text-chocolate-800 block mb-1">
                      Tu Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                      <input
                        id="chk-nombre"
                        type="text"
                        required
                        placeholder="Ej: María Fernanda Gómez"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-canvas text-chocolate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="chk-tel" className="font-bold text-chocolate-800 block mb-1">
                      Tu WhatsApp / Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                      <input
                        id="chk-tel"
                        type="tel"
                        required
                        placeholder="809-555-0000"
                        value={clienteTelefono}
                        onChange={(e) => setClienteTelefono(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-canvas text-chocolate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="chk-fecha" className="font-bold text-chocolate-800 block mb-1">
                      Fecha Deseada de Entrega *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                      <input
                        id="chk-fecha"
                        type="date"
                        required
                        value={fechaEntrega}
                        onChange={(e) => setFechaEntrega(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-canvas text-chocolate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="chk-hora" className="font-bold text-chocolate-800 block mb-1">
                      Hora Estimada
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                      <input
                        id="chk-hora"
                        type="time"
                        value={horaEntrega}
                        onChange={(e) => setHoraEntrega(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-canvas text-chocolate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Selección de Modalidad: Delivery o Retiro */}
                <div className="space-y-3 pt-2 border-t border-trigo-200">
                  <span className="font-bold text-chocolate-900 block">
                    ¿Cómo deseas recibir tu pedido?
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoDespacho('delivery')}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        tipoDespacho === 'delivery'
                          ? 'bg-frambuesa-50 border-frambuesa-500 text-frambuesa-900 font-bold'
                          : 'bg-canvas border-trigo-300 text-chocolate-700'
                      }`}
                    >
                      <Truck className="w-5 h-5 text-frambuesa-600 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold">Entrega a Domicilio</span>
                        <span className="block text-[10px] opacity-80">Ubicación con Google Maps</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoDespacho('retiro')}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        tipoDespacho === 'retiro'
                          ? 'bg-frambuesa-50 border-frambuesa-500 text-frambuesa-900 font-bold'
                          : 'bg-canvas border-trigo-300 text-chocolate-700'
                      }`}
                    >
                      <Store className="w-5 h-5 text-chocolate-700 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold">Retiro en Taller</span>
                        <span className="block text-[10px] opacity-80">Pasar a recoger</span>
                      </div>
                    </button>
                  </div>

                  {tipoDespacho === 'delivery' && (
                    <div className="p-3.5 rounded-2xl bg-crema/50 border border-trigo-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="chk-dir" className="font-bold text-chocolate-800 block mb-1">
                            Dirección de Entrega *
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                            <input
                              id="chk-dir"
                              type="text"
                              placeholder="Calle, número, edificio, sector..."
                              value={direccionEntrega}
                              onChange={(e) => setDireccionEntrega(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-white text-chocolate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="chk-ref" className="font-bold text-chocolate-800 block mb-1">
                            Punto de Referencia
                          </label>
                          <div className="relative">
                            <FileText className="w-4 h-4 text-chocolate-400 absolute left-3 top-2.5" />
                            <input
                              id="chk-ref"
                              type="text"
                              placeholder="Color de casa, frente a..."
                              value={puntoReferencia}
                              onChange={(e) => setPuntoReferencia(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-white text-chocolate-900"
                            />
                          </div>
                        </div>
                      </div>

                      <MapLocationPicker
                        latitude={coords.lat}
                        longitude={coords.lng}
                        address={direccionEntrega}
                        puntoReferencia={puntoReferencia}
                        onChangeLocation={(loc) => {
                          setCoords({ lat: loc.latitude, lng: loc.longitude });
                          if (loc.address) setDireccionEntrega(loc.address);
                          if (loc.mapsUrl) setMapsUrl(loc.mapsUrl);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="chk-notas" className="font-bold text-chocolate-800 block mb-1">
                    Comentarios Adicionales para tu Pedido (Opcional)
                  </label>
                  <textarea
                    id="chk-notas"
                    rows={2}
                    placeholder="Alguna indicación especial sobre el horario o el evento..."
                    value={notasGenerales}
                    onChange={(e) => setNotasGenerales(e.target.value)}
                    className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas text-chocolate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
                  >
                    Seguir Viendo Catálogo
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Enviando Pedido...' : 'Confirmar Mi Pedido'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default PublicCatalogPage;
