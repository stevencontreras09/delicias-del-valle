import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BazaarEvent,
  BazaarVentaItem,
  MetodoPagoBazaar,
  CategoriaGastoBazaar,
  BazaarItemStock,
  BazaarCatalogoProducto,
} from '../../types';
import {
  Store,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  UploadCloud,
  History,
  Phone,
  User,
  Coffee,
  Coins,
  Pencil,
  Check,
  X,
  RotateCcw,
  Save,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calcularCostosReceta } from '../../utils/calculations';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

const BAZAAR_CATALOG_STORAGE_KEY = 'delicias_bazaar_catalogo_productos';

// Productos rápidos comunes en bazares de repostería artesanal
const PRODUCTOS_PREDETERMINADOS_BAZAAR: BazaarCatalogoProducto[] = [
  { id: 'bz-prod-1', nombre: 'Porción Pastel Tres Leches', precio: 175, icono: '🍰' },
  { id: 'bz-prod-2', nombre: 'Porción Bizcocho Dominicano', precio: 150, icono: '🎂' },
  { id: 'bz-prod-3', nombre: 'Brownie Fudge Artesanal', precio: 120, icono: '🍫' },
  { id: 'bz-prod-4', nombre: 'Pack Cupcakes x 2', precio: 190, icono: '🧁' },
  { id: 'bz-prod-5', nombre: 'Cupcake Individual', precio: 100, icono: '🧁' },
  { id: 'bz-prod-6', nombre: 'Alfajor Dulce de Leche', precio: 80, icono: '🍪' },
  { id: 'bz-prod-7', nombre: 'Galleta Chispas Chocolate', precio: 75, icono: '🍪' },
  { id: 'bz-prod-8', nombre: 'Galleta Red Velvet', precio: 85, icono: '🍪' },
  { id: 'bz-prod-9', nombre: 'Café Caliente / Frío', precio: 90, icono: '☕' },
  { id: 'bz-prod-10', nombre: 'Botella de Agua', precio: 50, icono: '💧' },
];

const EMOJIS_SUGERIDOS_BAZAAR = ['🍰', '🎂', '🍫', '🧁', '🍪', '🥐', '🍮', '🥧', '🍩', '🍓', '☕', '🧃', '💧', '✨'];

export const BazaarManager: React.FC = () => {
  const {
    bazaarEvents,
    activeBazaar,
    setActiveBazaarId,
    crearBazaarEvent,
    actualizarBazaarEvent,
    agregarVentaBazaar,
    agregarGastoBazaar,
    actualizarStockBazaar,
    finalizarBazaar,
    importarBazaarAContabilidadGeneral,
    eliminarBazaarEvent,
    recetas,
    insumosMap,
    showToast,
  } = useApp();

  // Pestañas internas del módulo de Bazar
  type SubTab = 'pos' | 'gastos' | 'inventario' | 'arqueo' | 'historial';
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>('pos');

  // Catálogo editable de productos rápidos de bazar (sincronizado en localStorage y en el evento activo)
  const loadSavedCatalog = (): BazaarCatalogoProducto[] => {
    try {
      const raw = localStorage.getItem(BAZAAR_CATALOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any, i: number) => ({
            id: p.id || `bz-prod-${i + 1}`,
            nombre: String(p.nombre || 'Producto'),
            precio: Number(p.precio) || 0,
            icono: String(p.icono || '🍰'),
            receta_id: p.receta_id,
          }));
        }
      }
    } catch {}
    return PRODUCTOS_PREDETERMINADOS_BAZAAR;
  };

  const [catalogoProductos, setCatalogoProductos] = useState<BazaarCatalogoProducto[]>(() => {
    if (activeBazaar?.catalogo_productos && activeBazaar.catalogo_productos.length > 0) {
      return activeBazaar.catalogo_productos;
    }
    return loadSavedCatalog();
  });

  useEffect(() => {
    if (activeBazaar?.catalogo_productos && activeBazaar.catalogo_productos.length > 0) {
      setCatalogoProductos(activeBazaar.catalogo_productos);
    } else {
      setCatalogoProductos(loadSavedCatalog());
    }
  }, [activeBazaar?.id]);

  // Modo de edición masiva en cuadrícula de productos táctiles
  const [isEditingCatalog, setIsEditingCatalog] = useState(false);

  // Modal de edición individual / creación de producto en el catálogo de bazar
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [modalProdNombre, setModalProdNombre] = useState('');
  const [modalProdPrecio, setModalProdPrecio] = useState('');
  const [modalProdIcono, setModalProdIcono] = useState('🍰');

  // Precios personalizados por receta para el recetario maestro en Bazar
  const [recetaPreciosBazaar, setRecetaPreciosBazaar] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('delicias_bazaar_receta_precios');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingRecetaId, setEditingRecetaId] = useState<number | null>(null);
  const [editingRecetaPrecioVal, setEditingRecetaPrecioVal] = useState<string>('');

  // Edición en línea de items dentro del carrito de cobro
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);

  const persistirCatalogoProductos = (
    nuevosProductos: BazaarCatalogoProducto[],
    toastMessage?: string,
    oldProductName?: string,
    updatedProduct?: { nombre: string; precio: number }
  ) => {
    setCatalogoProductos(nuevosProductos);
    try {
      localStorage.setItem(BAZAAR_CATALOG_STORAGE_KEY, JSON.stringify(nuevosProductos));
    } catch {}

    if (activeBazaar) {
      const updates: Partial<BazaarEvent> = {
        catalogo_productos: nuevosProductos,
      };
      // Si se renombró o cambió el precio de un producto que también está en el stock del bazar, sincronizarlo
      if (oldProductName && updatedProduct && activeBazaar.inventario.length > 0) {
        const hasMatch = activeBazaar.inventario.some(
          (st) => st.producto_nombre.toLowerCase() === oldProductName.toLowerCase()
        );
        if (hasMatch) {
          updates.inventario = activeBazaar.inventario.map((st) =>
            st.producto_nombre.toLowerCase() === oldProductName.toLowerCase()
              ? { ...st, producto_nombre: updatedProduct.nombre, precio_unitario: updatedProduct.precio }
              : st
          );
        }
      }
      actualizarBazaarEvent(activeBazaar.id, updates);
    }

    // Si el producto editado está en el carrito actual, actualizar su nombre y precio en el carrito
    if (oldProductName && updatedProduct) {
      setCart((prev) =>
        prev.map((item) => {
          if (item.producto_nombre.toLowerCase() !== oldProductName.toLowerCase()) return item;
          return {
            ...item,
            producto_nombre: updatedProduct.nombre,
            precio_unitario: updatedProduct.precio,
            subtotal: item.cantidad * updatedProduct.precio,
          };
        })
      );
    }

    if (toastMessage) {
      showToast('success', 'Productos de Bazar Actualizados', toastMessage);
    }
  };

  const handleOpenEditProductModal = (prod?: BazaarCatalogoProducto) => {
    if (prod) {
      setEditingProductId(prod.id);
      setModalProdNombre(prod.nombre);
      setModalProdPrecio(String(prod.precio));
      setModalProdIcono(prod.icono || '🍰');
    } else {
      setEditingProductId(null);
      setModalProdNombre('');
      setModalProdPrecio('');
      setModalProdIcono('🍰');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProductModal = (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = modalProdNombre.trim();
    const precioNum = Number(modalProdPrecio);
    if (!nombreLimpio || isNaN(precioNum) || precioNum < 0) {
      alert('Por favor ingresa un nombre válido y un precio mayor o igual a 0.');
      return;
    }

    if (editingProductId) {
      const prodAnterior = catalogoProductos.find((p) => p.id === editingProductId);
      const actualizados = catalogoProductos.map((p) =>
        p.id === editingProductId
          ? { ...p, nombre: nombreLimpio, precio: precioNum, icono: modalProdIcono || '🍰' }
          : p
      );
      persistirCatalogoProductos(
        actualizados,
        `Se actualizó "${nombreLimpio}" (${formatCurrency(precioNum)}).`,
        prodAnterior?.nombre,
        { nombre: nombreLimpio, precio: precioNum }
      );
    } else {
      const nuevo: BazaarCatalogoProducto = {
        id: `bz-prod-${Date.now()}`,
        nombre: nombreLimpio,
        precio: precioNum,
        icono: modalProdIcono || '🍰',
      };
      persistirCatalogoProductos(
        [...catalogoProductos, nuevo],
        `Se añadió "${nombreLimpio}" (${formatCurrency(precioNum)}) al catálogo de bazar.`
      );
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteCatalogProduct = (id: string) => {
    const prod = catalogoProductos.find((p) => p.id === id);
    if (!prod) return;
    const filtrados = catalogoProductos.filter((p) => p.id !== id);
    persistirCatalogoProductos(filtrados, `Se eliminó "${prod.nombre}" del catálogo táctil.`);
    if (editingProductId === id) {
      setIsProductModalOpen(false);
    }
  };

  const handleInlineUpdateCatalogProduct = (
    id: string,
    field: 'nombre' | 'precio' | 'icono',
    value: string | number
  ) => {
    const prodAnterior = catalogoProductos.find((p) => p.id === id);
    const nuevos = catalogoProductos.map((p) => {
      if (p.id !== id) return p;
      if (field === 'precio') {
        const num = Math.max(0, Number(value) || 0);
        return { ...p, precio: num };
      }
      return { ...p, [field]: String(value) };
    });
    const prodNuevo = nuevos.find((p) => p.id === id);
    persistirCatalogoProductos(
      nuevos,
      undefined,
      prodAnterior?.nombre,
      prodNuevo ? { nombre: prodNuevo.nombre, precio: prodNuevo.precio } : undefined
    );
  };

  const handleRestaurarCatalogoPredeterminado = () => {
    if (confirm('¿Deseas restaurar los productos y precios predeterminados del bazar?')) {
      persistirCatalogoProductos(
        PRODUCTOS_PREDETERMINADOS_BAZAAR,
        'Se restauraron los productos y precios predeterminados.'
      );
    }
  };

  const handleSaveRecetaPrecioBazaar = (recetaId: number, nuevoPrecio: number) => {
    const precioLimpio = Math.max(0, Math.round(nuevoPrecio));
    const nextMap = { ...recetaPreciosBazaar, [recetaId]: precioLimpio };
    setRecetaPreciosBazaar(nextMap);
    try {
      localStorage.setItem('delicias_bazaar_receta_precios', JSON.stringify(nextMap));
    } catch {}
    setEditingRecetaId(null);
    showToast('success', 'Precio de Receta en Bazar', `Precio actualizado a ${formatCurrency(precioLimpio)}.`);
  };

  // Modal para iniciar nuevo bazar
  const [isNewBazaarModalOpen, setIsNewBazaarModalOpen] = useState(false);
  const [newBazaarNombre, setNewBazaarNombre] = useState('');
  const [newBazaarFecha, setNewBazaarFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newBazaarFechaFin, setNewBazaarFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [newBazaarFondo, setNewBazaarFondo] = useState('2000');
  const [newBazaarUbicacion, setNewBazaarUbicacion] = useState('');
  const [newBazaarNotas, setNewBazaarNotas] = useState('');

  // Helpers para calcular duración en días y formatear rango de fechas del bazar
  const getBazaarDurationDays = (inicio: string, fin?: string): number => {
    if (!fin || fin === inicio) return 1;
    const d1 = new Date(`${inicio}T00:00:00`);
    const d2 = new Date(`${fin}T00:00:00`);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const formatBazaarDateRange = (inicio: string, fin?: string): string => {
    if (!fin || fin === inicio) {
      return formatDate(inicio);
    }
    return `Del ${formatDate(inicio)} al ${formatDate(fin)}`;
  };

  // Estados del POS Express
  const [cart, setCart] = useState<BazaarVentaItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoBazaar>('efectivo');
  const [dineroRecibido, setDineroRecibido] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [customItemNombre, setCustomItemNombre] = useState('');
  const [customItemPrecio, setCustomItemPrecio] = useState('');

  // Estados de Gastos
  const [gastoConcepto, setGastoConcepto] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoCategoria, setGastoCategoria] = useState<CategoriaGastoBazaar>('stand_mesa');
  const [gastoPagadoCon, setGastoPagadoCon] = useState<'caja_efectivo' | 'cuenta_banco'>('caja_efectivo');

  // Estados de Inventario Llevado
  const [stockItemNombre, setStockItemNombre] = useState('');
  const [stockItemPrecio, setStockItemPrecio] = useState('');
  const [stockItemCantidad, setStockItemCantidad] = useState('');

  // Estados de Arqueo
  const [efectivoContadoFisico, setEfectivoContadoFisico] = useState('');
  const [notasCierre, setNotasCierre] = useState('');

  // Totales y Métricas del Bazar Activo
  const metricas = useMemo(() => {
    if (!activeBazaar) {
      return {
        totalVentas: 0,
        ventasEfectivo: 0,
        ventasTransferencia: 0,
        ventasTarjeta: 0,
        totalGastos: 0,
        gastosEfectivo: 0,
        gastosBanco: 0,
        gananciaNeta: 0,
        efectivoEsperadoCaja: 0,
        unidadesVendidas: 0,
      };
    }

    const totalVentas = activeBazaar.ventas.reduce((acc, v) => acc + v.total, 0);
    const ventasEfectivo = activeBazaar.ventas
      .filter((v) => v.metodo_pago === 'efectivo')
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTransferencia = activeBazaar.ventas
      .filter((v) => v.metodo_pago === 'transferencia')
      .reduce((acc, v) => acc + v.total, 0);
    const ventasTarjeta = activeBazaar.ventas
      .filter((v) => v.metodo_pago === 'tarjeta')
      .reduce((acc, v) => acc + v.total, 0);

    const totalGastos = activeBazaar.gastos.reduce((acc, g) => acc + g.monto, 0);
    const gastosEfectivo = activeBazaar.gastos
      .filter((g) => g.pagado_con === 'caja_efectivo')
      .reduce((acc, g) => acc + g.monto, 0);
    const gastosBanco = totalGastos - gastosEfectivo;

    const gananciaNeta = totalVentas - totalGastos;
    const efectivoEsperadoCaja = activeBazaar.fondo_caja_inicial + ventasEfectivo - gastosEfectivo;

    const unidadesVendidas = activeBazaar.ventas.reduce(
      (acc, v) => acc + v.items.reduce((sum, item) => sum + item.cantidad, 0),
      0
    );

    return {
      totalVentas,
      ventasEfectivo,
      ventasTransferencia,
      ventasTarjeta,
      totalGastos,
      gastosEfectivo,
      gastosBanco,
      gananciaNeta,
      efectivoEsperadoCaja,
      unidadesVendidas,
    };
  }, [activeBazaar]);

  // Total del carrito POS
  const totalCarrito = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  // Cálculo del cambio en efectivo
  const dineroRecibidoNum = Number(dineroRecibido) || 0;
  const cambioDevuelto = dineroRecibidoNum > 0 ? Math.max(0, dineroRecibidoNum - totalCarrito) : 0;

  // Manejo de adición de producto al carrito
  const handleAddItemToCart = (nombre: string, precio: number, receta_id?: number) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.producto_nombre === nombre);
      if (existingIndex !== -1) {
        const copy = [...prev];
        const item = copy[existingIndex];
        const newCantidad = item.cantidad + 1;
        copy[existingIndex] = {
          ...item,
          cantidad: newCantidad,
          subtotal: newCantidad * item.precio_unitario,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          producto_nombre: nombre,
          precio_unitario: precio,
          cantidad: 1,
          subtotal: precio,
          receta_id,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const newCant = item.cantidad + delta;
      if (newCant <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = {
        ...item,
        cantidad: newCant,
        subtotal: newCant * item.precio_unitario,
      };
      return copy;
    });
  };

  const handleUpdateCartItemField = (
    itemId: string,
    field: 'producto_nombre' | 'precio_unitario',
    value: string | number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (field === 'precio_unitario') {
          const nuevoPrecio = Math.max(0, Number(value) || 0);
          return {
            ...item,
            precio_unitario: nuevoPrecio,
            subtotal: item.cantidad * nuevoPrecio,
          };
        }
        return {
          ...item,
          producto_nombre: String(value),
        };
      })
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCobrarVenta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBazaar) return;
    if (cart.length === 0) {
      alert('Por favor selecciona al menos un producto para despachar.');
      return;
    }

    if (metodoPago === 'efectivo' && dineroRecibidoNum > 0 && dineroRecibidoNum < totalCarrito) {
      alert(`El dinero recibido (RD$${dineroRecibidoNum.toLocaleString()}) es menor al total de la venta (RD$${totalCarrito.toLocaleString()}).`);
      return;
    }

    agregarVentaBazaar(activeBazaar.id, {
      items: cart,
      total: totalCarrito,
      metodo_pago: metodoPago,
      dinero_recibido: metodoPago === 'efectivo' ? dineroRecibidoNum : undefined,
      cambio_devuelto: metodoPago === 'efectivo' ? cambioDevuelto : undefined,
      cliente_nombre: clienteNombre.trim() || undefined,
      cliente_telefono: clienteTelefono.trim() || undefined,
    });

    // Limpiar carrito para la siguiente venta inmediata
    setCart([]);
    setDineroRecibido('');
    setClienteNombre('');
    setClienteTelefono('');
  };

  const handleCrearNuevoBazaar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBazaarNombre.trim()) {
      alert('Por favor indica el nombre del bazar o evento.');
      return;
    }
    if (newBazaarFechaFin && newBazaarFechaFin < newBazaarFecha) {
      alert('La fecha final del evento no puede ser anterior a la fecha de inicio.');
      return;
    }
    const fondo = Number(newBazaarFondo) || 0;
    crearBazaarEvent(
      newBazaarNombre.trim(),
      newBazaarFecha,
      fondo,
      newBazaarUbicacion.trim() || undefined,
      newBazaarNotas.trim() || undefined,
      newBazaarFechaFin || newBazaarFecha
    );

    setIsNewBazaarModalOpen(false);
    setNewBazaarNombre('');
    setNewBazaarUbicacion('');
    setNewBazaarNotas('');
    setCurrentSubTab('pos');
  };

  const handleRegistrarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBazaar) return;
    const monto = Number(gastoMonto);
    if (!gastoConcepto.trim() || isNaN(monto) || monto <= 0) {
      alert('Por favor escribe un concepto y un monto válido.');
      return;
    }

    agregarGastoBazaar(activeBazaar.id, {
      concepto: gastoConcepto.trim(),
      monto,
      categoria: gastoCategoria,
      pagado_con: gastoPagadoCon,
    });

    setGastoConcepto('');
    setGastoMonto('');
  };

  const handleAgregarItemStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBazaar) return;
    const precio = Number(stockItemPrecio) || 0;
    const cant = Number(stockItemCantidad) || 0;
    if (!stockItemNombre.trim() || cant <= 0) {
      alert('Por favor ingresa el nombre del producto y la cantidad llevada.');
      return;
    }

    const newItem: BazaarItemStock = {
      id: `stock-bz-${Date.now()}`,
      producto_nombre: stockItemNombre.trim(),
      precio_unitario: precio,
      cantidad_inicial: cant,
      cantidad_vendida: 0,
      cantidad_degustacion: 0,
      cantidad_sobrante: cant,
    };

    actualizarStockBazaar(activeBazaar.id, [newItem, ...activeBazaar.inventario]);
    setStockItemNombre('');
    setStockItemPrecio('');
    setStockItemCantidad('');
  };

  const handleActualizarDegustacion = (itemId: string, degus: number) => {
    if (!activeBazaar) return;
    const updated = activeBazaar.inventario.map((item) => {
      if (item.id !== itemId) return item;
      const deg = Math.max(0, degus);
      return {
        ...item,
        cantidad_degustacion: deg,
        cantidad_sobrante: Math.max(0, item.cantidad_inicial - item.cantidad_vendida - deg),
      };
    });
    actualizarStockBazaar(activeBazaar.id, updated);
  };

  const handleActualizarItemStock = (
    itemId: string,
    field: 'producto_nombre' | 'precio_unitario' | 'cantidad_inicial',
    value: string | number
  ) => {
    if (!activeBazaar) return;
    const updated = activeBazaar.inventario.map((item) => {
      if (item.id !== itemId) return item;
      if (field === 'producto_nombre') {
        return { ...item, producto_nombre: String(value) };
      }
      if (field === 'precio_unitario') {
        return { ...item, precio_unitario: Math.max(0, Number(value) || 0) };
      }
      const nuevaCantInicial = Math.max(0, Number(value) || 0);
      return {
        ...item,
        cantidad_inicial: nuevaCantInicial,
        cantidad_sobrante: Math.max(0, nuevaCantInicial - item.cantidad_vendida - (item.cantidad_degustacion || 0)),
      };
    });
    actualizarStockBazaar(activeBazaar.id, updated);
  };

  const handleEliminarItemStock = (itemId: string) => {
    if (!activeBazaar) return;
    const updated = activeBazaar.inventario.filter((item) => item.id !== itemId);
    actualizarStockBazaar(activeBazaar.id, updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Encabezado Principal y Selector de Bazar Activo */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-frambuesa-500/10 via-amber-400/5 to-transparent rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-frambuesa-600 to-rose-700 text-white rounded-2xl shadow-md shadow-frambuesa-600/30 shrink-0">
              <Store className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-chocolate-900 leading-tight">
                  {activeBazaar ? activeBazaar.nombre : 'Venta de Bazar & Pop-Up'}
                </h1>
                {activeBazaar && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      activeBazaar.estado === 'activo'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeBazaar.estado === 'activo' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {activeBazaar.estado === 'activo' ? 'Bazar en Curso' : 'Bazar Finalizado'}
                  </span>
                )}
                {activeBazaar?.importado_a_central && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Importado a Central
                  </span>
                )}
              </div>
              <p className="text-xs text-chocolate-600 mt-0.5 flex items-center gap-3 flex-wrap">
                {activeBazaar?.fecha && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-chocolate-700">
                    <Calendar className="w-3.5 h-3.5 text-frambuesa-600" />
                    <span>{formatBazaarDateRange(activeBazaar.fecha, activeBazaar.fecha_fin)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-200">
                      {getBazaarDurationDays(activeBazaar.fecha, activeBazaar.fecha_fin)}{' '}
                      {getBazaarDurationDays(activeBazaar.fecha, activeBazaar.fecha_fin) === 1 ? 'día' : 'días'}
                    </span>
                  </span>
                )}
                {activeBazaar?.ubicacion && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-frambuesa-500" />
                    {activeBazaar.ubicacion}
                  </span>
                )}
                <span>• POS Express & Arqueo Independiente</span>
              </p>
            </div>
          </div>

          {/* Selector de Bazares & Botón Iniciar Nuevo */}
          <div className="flex items-center gap-2 flex-wrap">
            {bazaarEvents.length > 0 && (
              <select
                value={activeBazaar?.id || ''}
                onChange={(e) => setActiveBazaarId(e.target.value)}
                className="text-xs font-bold text-chocolate-800 bg-canvas border border-trigo-300 rounded-xl px-3 py-2 shadow-xs focus:ring-2 focus:ring-frambuesa-400"
              >
                {bazaarEvents.map((b) => {
                  const rango = b.fecha_fin && b.fecha_fin !== b.fecha ? `${b.fecha} al ${b.fecha_fin}` : b.fecha;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.nombre} ({rango}) {b.estado === 'activo' ? '⚡' : '✓'}
                    </option>
                  );
                })}
              </select>
            )}

            <button
              onClick={() => setIsNewBazaarModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Bazar</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas en Tiempo Real */}
        {activeBazaar && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-trigo-100">
            <div className="bg-canvas/80 p-3 rounded-2xl border border-trigo-200">
              <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block">
                Fondo Caja Inicial
              </span>
              <span className="text-sm sm:text-base font-bold text-chocolate-800">
                {formatCurrency(activeBazaar.fondo_caja_inicial)}
              </span>
              <span className="text-[9px] text-chocolate-400 block mt-0.5">Para cambio</span>
            </div>

            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Total Vendido
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-900">
                {formatCurrency(metricas.totalVentas)}
              </span>
              <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                {metricas.unidadesVendidas} unid. ({activeBazaar.ventas.length} tickets)
              </span>
            </div>

            <div className="bg-red-50/80 p-3 rounded-2xl border border-red-200">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                Gastos del Bazar
              </span>
              <span className="text-sm sm:text-base font-bold text-red-900">
                {formatCurrency(metricas.totalGastos)}
              </span>
              <span className="text-[9px] text-red-700 font-semibold block mt-0.5">
                {activeBazaar.gastos.length} gastos reg.
              </span>
            </div>

            <div className="bg-gradient-to-br from-frambuesa-50 to-rose-100 p-3 rounded-2xl border border-frambuesa-200">
              <span className="text-[10px] font-bold text-frambuesa-800 uppercase tracking-wider block">
                Ganancia Neta Bazar
              </span>
              <span className="text-sm sm:text-base font-bold text-frambuesa-950">
                {formatCurrency(metricas.gananciaNeta)}
              </span>
              <span className="text-[9px] text-frambuesa-700 font-semibold block mt-0.5">
                Margen: {metricas.totalVentas > 0 ? `${Math.round((metricas.gananciaNeta / metricas.totalVentas) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Si no hay bazares creados aún */}
      {!activeBazaar && (
        <div className="bg-white rounded-3xl p-10 text-center border border-trigo-200 shadow-sm max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-frambuesa-50 text-frambuesa-600 flex items-center justify-center mx-auto mb-4 border border-frambuesa-200">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-serif font-bold text-chocolate-900">
            No hay ningún bazar activo en este momento
          </h2>
          <p className="text-xs text-chocolate-600 mt-2 max-w-md mx-auto">
            Inicia un evento de bazar para despachar con el POS rápido táctil, calcular cambio al instante, registrar
            gastos independientes y luego importar las ventas a la contabilidad general de Delicias del Valle.
          </p>
          <button
            onClick={() => setIsNewBazaarModalOpen(true)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Iniciar Nuevo Bazar Ahora</span>
          </button>
        </div>
      )}

      {/* 2. Barra de Navegación de Sub-Módulos del Bazar */}
      {activeBazaar && (
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-trigo-200 shadow-xs overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setCurrentSubTab('pos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'pos'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Despachador POS Express</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('gastos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'gastos'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Gastos del Evento ({activeBazaar.gastos.length})</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('inventario')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'inventario'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock Llevado vs Sobrante</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('arqueo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              currentSubTab === 'arqueo'
                ? 'bg-frambuesa-600 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Arqueo de Caja & Cierre</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('historial')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ml-auto ${
              currentSubTab === 'historial'
                ? 'bg-chocolate-800 text-white shadow-sm'
                : 'text-chocolate-700 hover:bg-crema'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Bazares</span>
          </button>
        </div>
      )}

      {/* 3. Contenido según la Pestaña Activa */}
      {activeBazaar && currentSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lado Izquierdo: Catálogo de Productos Táctiles (7 columnas) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-sm font-serif font-bold text-chocolate-900">
                    Productos Táctiles de Bazar
                  </h2>
                  <p className="text-[11px] text-chocolate-500">
                    {isEditingCatalog
                      ? 'Edita los nombres, precios en RD$ e íconos de tus productos directamente'
                      : 'Toca un producto para añadirlo a la orden o usa el lápiz para editarlo'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenEditProductModal()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-crema hover:bg-trigo-200/70 text-chocolate-800 border border-trigo-300 text-[11px] font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-frambuesa-600" />
                    <span>Nuevo Producto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingCatalog) {
                        showToast('success', 'Catálogo Guardado', 'Los productos y precios del bazar quedaron actualizados.');
                      }
                      setIsEditingCatalog((prev) => !prev);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                      isEditingCatalog
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-frambuesa-50 hover:bg-frambuesa-100 text-frambuesa-700 border-frambuesa-200'
                    }`}
                  >
                    {isEditingCatalog ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Listo (Guardar)</span>
                      </>
                    ) : (
                      <>
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Productos y Precios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Barra auxiliar cuando está activo el modo de edición masiva */}
              {isEditingCatalog && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Modo Edición Activo: modifica cualquier nombre o precio y se guardará automáticamente.</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRestaurarCatalogoPredeterminado}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Predeterminados</span>
                  </button>
                </div>
              )}

              {/* Botones de Productos Frecuentes (o Tarjetas Editables) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {catalogoProductos.map((prod) =>
                  isEditingCatalog ? (
                    <div
                      key={prod.id}
                      className="p-2.5 rounded-2xl bg-crema/60 border-2 border-frambuesa-300/80 shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <input
                          type="text"
                          aria-label={`Icono de ${prod.nombre}`}
                          value={prod.icono}
                          onChange={(e) => handleInlineUpdateCatalogProduct(prod.id, 'icono', e.target.value)}
                          className="w-10 text-center text-base bg-white border border-trigo-300 rounded-lg py-0.5 focus:ring-2 focus:ring-frambuesa-400"
                          title="Icono o Emoji"
                        />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-[10px] font-bold text-chocolate-500">RD$</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Precio de ${prod.nombre}`}
                            value={prod.precio}
                            onChange={(e) => handleInlineUpdateCatalogProduct(prod.id, 'precio', e.target.value)}
                            className="w-full text-xs font-extrabold text-frambuesa-700 bg-white border border-trigo-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-frambuesa-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCatalogProduct(prod.id)}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        aria-label={`Nombre del producto ${prod.nombre}`}
                        value={prod.nombre}
                        onChange={(e) => handleInlineUpdateCatalogProduct(prod.id, 'nombre', e.target.value)}
                        placeholder="Nombre del producto..."
                        className="w-full text-xs font-bold text-chocolate-900 bg-white border border-trigo-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-frambuesa-400"
                      />
                    </div>
                  ) : (
                    <div
                      key={prod.id}
                      onClick={() => handleAddItemToCart(prod.nombre, prod.precio, prod.receta_id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleAddItemToCart(prod.nombre, prod.precio, prod.receta_id);
                        }
                      }}
                      className="p-3 rounded-2xl bg-canvas hover:bg-crema border border-trigo-200/80 hover:border-frambuesa-300 text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between h-24 group relative cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xl">{prod.icono}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-frambuesa-700 bg-white px-2 py-0.5 rounded-full border border-trigo-200 shadow-2xs">
                            {formatCurrency(prod.precio)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditProductModal(prod);
                            }}
                            className="p-1 rounded-lg bg-white/90 hover:bg-frambuesa-50 text-chocolate-500 hover:text-frambuesa-700 border border-trigo-200/80 transition-colors"
                            title="Editar producto o precio"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-chocolate-900 leading-tight line-clamp-2 group-hover:text-frambuesa-700">
                        {prod.nombre}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Catálogo Maestro de Recetas Disponibles (con precio editable para Bazar) */}
              {recetas.length > 0 && (
                <div className="pt-4 border-t border-trigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block">
                      O añadir desde el Recetario Maestro (puedes ajustar el precio)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                    {recetas.map((rec) => {
                      const costCalculated = calcularCostosReceta(rec, insumosMap);
                      const defaultPrecio = Math.round(
                        costCalculated.precio_sugerido_margen_venta || costCalculated.precio_sugerido_venta || 150
                      );
                      const recPrecio =
                        recetaPreciosBazaar[rec.id] !== undefined ? recetaPreciosBazaar[rec.id] : defaultPrecio;
                      const isEditingThisReceta = editingRecetaId === rec.id;

                      return (
                        <div
                          key={rec.id}
                          className="p-2 rounded-xl bg-white hover:bg-crema border border-trigo-200 text-left text-xs transition-colors flex flex-col justify-between min-h-16 relative group"
                        >
                          <div
                            onClick={() => {
                              if (!isEditingThisReceta) {
                                handleAddItemToCart(rec.nombre, recPrecio, rec.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (!isEditingThisReceta && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleAddItemToCart(rec.nombre, recPrecio, rec.id);
                              }
                            }}
                            className="cursor-pointer flex-1 flex flex-col justify-between"
                          >
                            <span className="font-semibold text-chocolate-800 text-[11px] truncate pr-5">
                              {rec.nombre}
                            </span>

                            {isEditingThisReceta ? (
                              <div
                                className="flex items-center gap-1 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  aria-label={`Precio en bazar para ${rec.nombre}`}
                                  value={editingRecetaPrecioVal}
                                  onChange={(e) => setEditingRecetaPrecioVal(e.target.value)}
                                  className="w-16 text-[11px] font-bold border border-frambuesa-300 rounded px-1.5 py-0.5 bg-canvas"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveRecetaPrecioBazaar(rec.id, Number(editingRecetaPrecioVal) || 0)
                                  }
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                  title="Guardar precio"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRecetaId(null)}
                                  className="p-1 rounded bg-gray-200 text-chocolate-700 hover:bg-gray-300"
                                  title="Cancelar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-bold text-frambuesa-700">
                                  {formatCurrency(recPrecio)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingRecetaId(rec.id);
                                      setEditingRecetaPrecioVal(String(recPrecio));
                                    }}
                                    className="p-0.5 rounded hover:bg-trigo-200 text-chocolate-500 hover:text-chocolate-800"
                                    title="Editar precio de receta en bazar"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const yaExiste = catalogoProductos.some(
                                        (p) => p.nombre.toLowerCase() === rec.nombre.toLowerCase()
                                      );
                                      if (yaExiste) {
                                        showToast('info', 'Ya en Catálogo', `"${rec.nombre}" ya está en tus productos táctiles.`);
                                        return;
                                      }
                                      const nuevoProd: BazaarCatalogoProducto = {
                                        id: `bz-rec-${rec.id}-${Date.now()}`,
                                        nombre: rec.nombre,
                                        precio: recPrecio,
                                        icono: '🍰',
                                        receta_id: rec.id,
                                      };
                                      persistirCatalogoProductos(
                                        [...catalogoProductos, nuevoProd],
                                        `"${rec.nombre}" se fijó en los botones táctiles del bazar.`
                                      );
                                    }}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-crema hover:bg-frambuesa-100 text-chocolate-700 hover:text-frambuesa-800 border border-trigo-200"
                                    title="Fijar como botón táctil del bazar"
                                  >
                                    + Fijar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agregar Producto Manual Rápido (al Ticket o al Catálogo) */}
              <div className="pt-3 border-t border-trigo-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  aria-label="Nombre de otro producto o extra"
                  placeholder="Otro producto / extra..."
                  value={customItemNombre}
                  onChange={(e) => setCustomItemNombre(e.target.value)}
                  className="flex-1 min-w-[140px] text-xs border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  aria-label="Precio en pesos dominicanos"
                  placeholder="Precio RD$"
                  value={customItemPrecio}
                  onChange={(e) => setCustomItemPrecio(e.target.value)}
                  className="w-28 text-xs border border-trigo-200 rounded-xl px-2.5 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const pr = Number(customItemPrecio);
                    if (!customItemNombre.trim() || isNaN(pr) || pr <= 0) {
                      alert('Ingresa el nombre y precio del producto');
                      return;
                    }
                    handleAddItemToCart(customItemNombre.trim(), pr);
                    setCustomItemNombre('');
                    setCustomItemPrecio('');
                  }}
                  className="px-3 py-2 rounded-xl bg-chocolate-700 text-white text-xs font-bold hover:bg-chocolate-800 transition-colors shrink-0 inline-flex items-center gap-1"
                  title="Añadir solo al ticket actual"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Al Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pr = Number(customItemPrecio);
                    if (!customItemNombre.trim() || isNaN(pr) || pr <= 0) {
                      alert('Ingresa el nombre y precio del producto para guardarlo en el catálogo');
                      return;
                    }
                    const nuevo: BazaarCatalogoProducto = {
                      id: `bz-prod-${Date.now()}`,
                      nombre: customItemNombre.trim(),
                      precio: pr,
                      icono: '🍰',
                    };
                    persistirCatalogoProductos(
                      [...catalogoProductos, nuevo],
                      `Se guardó "${nuevo.nombre}" (${formatCurrency(pr)}) en los botones de bazar.`
                    );
                    setCustomItemNombre('');
                    setCustomItemPrecio('');
                  }}
                  className="px-3 py-2 rounded-xl bg-frambuesa-600 text-white text-xs font-bold hover:bg-frambuesa-700 transition-colors shrink-0 inline-flex items-center gap-1"
                  title="Guardar permanentemente en los botones táctiles del bazar"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar en Bazar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Carrito / Ticket de Cobro Express (5 columnas) */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleCobrarVenta}
              className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-trigo-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-frambuesa-600" />
                  <h3 className="text-sm font-serif font-bold text-chocolate-900">
                    Ticket de Cobro #{activeBazaar.ventas.length + 1}
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-600 hover:underline font-bold"
                  >
                    Vaciar Carrito
                  </button>
                )}
              </div>

              {/* Items del Carrito (con edición en línea de producto y precio) */}
              {cart.length === 0 ? (
                <div className="py-8 text-center text-chocolate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Toca productos de la izquierda para agregarlos</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                  {cart.map((item, idx) => {
                    const isEditingCartItem = editingCartItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-canvas border border-trigo-200/70 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {isEditingCartItem ? (
                              <div className="space-y-1.5 pr-1">
                                <input
                                  type="text"
                                  aria-label="Editar nombre del producto en el ticket"
                                  value={item.producto_nombre}
                                  onChange={(e) =>
                                    handleUpdateCartItemField(item.id, 'producto_nombre', e.target.value)
                                  }
                                  className="w-full text-xs font-bold text-chocolate-900 bg-white border border-frambuesa-300 rounded-lg px-2 py-1"
                                />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-chocolate-600">Precio RD$:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    aria-label="Editar precio unitario en el ticket"
                                    value={item.precio_unitario}
                                    onChange={(e) =>
                                      handleUpdateCartItemField(item.id, 'precio_unitario', e.target.value)
                                    }
                                    className="w-24 text-xs font-bold text-frambuesa-700 bg-white border border-frambuesa-300 rounded-lg px-2 py-0.5"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditingCartItemId(null)}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700"
                                  >
                                    Listo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <span className="font-bold text-chocolate-900 block truncate">
                                    {item.producto_nombre}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCartItemId(item.id)}
                                    className="text-[10px] text-chocolate-600 hover:text-frambuesa-700 font-semibold inline-flex items-center gap-1 mt-0.5"
                                    title="Clic para editar nombre o precio en este ticket"
                                  >
                                    <span>{formatCurrency(item.precio_unitario)} c/u</span>
                                    <Pencil className="w-2.5 h-2.5 text-frambuesa-600" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQuantity(idx, -1)}
                              className="w-6 h-6 rounded-lg bg-white border border-trigo-300 text-chocolate-700 font-bold flex items-center justify-center hover:bg-crema"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-chocolate-900">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQuantity(idx, 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-trigo-300 text-chocolate-700 font-bold flex items-center justify-center hover:bg-crema"
                            >
                              +
                            </button>
                          </div>

                          <span className="w-16 text-right font-bold text-chocolate-900 shrink-0">
                            {formatCurrency(item.subtotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Quitar del ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Prominente */}
              <div className="p-3.5 bg-crema/70 rounded-2xl border border-trigo-200 flex items-center justify-between">
                <span className="text-xs font-bold text-chocolate-700 uppercase tracking-wider">
                  Total a Cobrar:
                </span>
                <span className="text-xl font-bold font-serif text-frambuesa-700">
                  {formatCurrency(totalCarrito)}
                </span>
              </div>

              {/* Selector de Método de Pago */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-chocolate-600 uppercase tracking-wider block">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['efectivo', 'transferencia', 'tarjeta'] as MetodoPagoBazaar[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPago(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        metodoPago === m
                          ? 'bg-chocolate-800 text-white border-chocolate-800 shadow-sm'
                          : 'bg-white text-chocolate-700 border-trigo-200 hover:bg-crema'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculadora de Cambio en Efectivo (DOP) */}
              {metodoPago === 'efectivo' && totalCarrito > 0 && (
                <div className="p-3 bg-canvas rounded-2xl border border-trigo-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-chocolate-700 uppercase flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600" />
                      Calculadora de Cambio
                    </span>
                    {cambioDevuelto > 0 && (
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                        Cambio: {formatCurrency(cambioDevuelto)}
                      </span>
                    )}
                  </div>

                  {/* Botones de Billetes Dominicanos Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[100, 200, 500, 1000, 2000].map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setDineroRecibido(String(billete))}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          dineroRecibido === String(billete)
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-white border-trigo-200 text-chocolate-700 hover:bg-crema'
                        }`}
                      >
                        RD${billete}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDineroRecibido(String(totalCarrito))}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    >
                      Exacto
                    </button>
                  </div>

                  <input
                    type="number"
                    placeholder="Efectivo recibido (ej. 500)..."
                    value={dineroRecibido}
                    onChange={(e) => setDineroRecibido(e.target.value)}
                    className="w-full text-xs font-bold border border-trigo-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-frambuesa-400"
                  />
                </div>
              )}

              {/* Captura Express de Cliente (Mini CRM Opcional para Fidelización) */}
              <div className="pt-2 border-t border-trigo-100 space-y-2">
                <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block">
                  Captar Cliente (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Nombre cliente"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="border border-trigo-200 rounded-xl px-2.5 py-1.5 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="border border-trigo-200 rounded-xl px-2.5 py-1.5 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  />
                </div>
              </div>

              {/* Botón Principal de Cobro */}
              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COBRAR Y DESPACHAR ({formatCurrency(totalCarrito)})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Sub-Pestaña: Gastos del Evento */}
      {activeBazaar && currentSubTab === 'gastos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-serif font-bold text-chocolate-900">
              Registrar Gasto del Bazar
            </h2>
            <form onSubmit={handleRegistrarGasto} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-chocolate-700 block mb-1">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago de stand / mesa, hielo, transporte..."
                  value={gastoConcepto}
                  onChange={(e) => setGastoConcepto(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-chocolate-700 block mb-1">
                    Monto RD$ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value)}
                    className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-chocolate-700 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value as CategoriaGastoBazaar)}
                    className="w-full border border-trigo-200 rounded-xl px-2 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  >
                    <option value="stand_mesa">Alquiler de Stand</option>
                    <option value="transporte_gasolina">Transporte / Uber</option>
                    <option value="hielo_insumos">Hielo / Enfriado</option>
                    <option value="empaques">Empaques / Servilletas</option>
                    <option value="merienda_socias">Comida / Socias</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-chocolate-700 block mb-1">
                  Fuente de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGastoPagadoCon('caja_efectivo')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      gastoPagadoCon === 'caja_efectivo'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                        : 'bg-white border-trigo-200 text-chocolate-700'
                    }`}
                  >
                    <span>Efectivo de Caja</span>
                    <span className="block text-[9px] text-chocolate-400">Resta del arqueo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGastoPagadoCon('cuenta_banco')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      gastoPagadoCon === 'cuenta_banco'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                        : 'bg-white border-trigo-200 text-chocolate-700'
                    }`}
                  >
                    <span>Cuenta de Banco</span>
                    <span className="block text-[9px] text-chocolate-400">Transferencia previa</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Guardar Gasto
              </button>
            </form>
          </div>

          {/* Tabla de Gastos */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-chocolate-900">
                Historial de Gastos del Evento
              </h3>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                Total: {formatCurrency(metricas.totalGastos)}
              </span>
            </div>

            {activeBazaar.gastos.length === 0 ? (
              <p className="text-xs text-chocolate-400 py-6 text-center">
                Aún no hay gastos registrados para este bazar.
              </p>
            ) : (
              <div className="divide-y divide-trigo-100">
                {activeBazaar.gastos.map((g) => (
                  <div key={g.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-chocolate-900 block">{g.concepto}</span>
                      <span className="text-[10px] text-chocolate-500 capitalize">
                        {g.categoria.replace('_', ' ')} • Pagado con {g.pagado_con === 'caja_efectivo' ? 'Caja Efectivo' : 'Banco'} • {g.hora}
                      </span>
                    </div>
                    <span className="font-bold text-red-700">{formatCurrency(g.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Sub-Pestaña: Control de Inventario Llevado vs Sobrante */}
      {activeBazaar && currentSubTab === 'inventario' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-serif font-bold text-chocolate-900 mb-0.5">
                  Registro de Productos Llevados al Bazar
                </h2>
                <p className="text-xs text-chocolate-500">
                  Anota las unidades preparadas y su precio unitario; puedes editar nombres, precios y cantidades directamente en la tabla
                </p>
              </div>
              {catalogoProductos.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <label htmlFor="quick-stock-select" className="text-[10px] font-bold text-chocolate-600">
                    Autocompletar desde catálogo:
                  </label>
                  <select
                    id="quick-stock-select"
                    value=""
                    onChange={(e) => {
                      const found = catalogoProductos.find((p) => p.id === e.target.value);
                      if (found) {
                        setStockItemNombre(found.nombre);
                        setStockItemPrecio(String(found.precio));
                      }
                    }}
                    className="text-xs border border-trigo-300 rounded-xl px-2.5 py-1.5 bg-crema/60 font-semibold text-chocolate-800 focus:ring-2 focus:ring-frambuesa-400"
                  >
                    <option value="">Elegir producto...</option>
                    {catalogoProductos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icono} {p.nombre} ({formatCurrency(p.precio)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form onSubmit={handleAgregarItemStock} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs items-end">
              <div className="sm:col-span-5">
                <label htmlFor="stock-item-nombre" className="font-semibold text-chocolate-700 block mb-1">
                  Nombre del Producto *
                </label>
                <input
                  id="stock-item-nombre"
                  type="text"
                  placeholder="Ej: Porción Pastel Tres Leches..."
                  value={stockItemNombre}
                  onChange={(e) => setStockItemNombre(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="stock-item-precio" className="font-semibold text-chocolate-700 block mb-1">
                  Precio Unitario (RD$)
                </label>
                <input
                  id="stock-item-precio"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 175"
                  value={stockItemPrecio}
                  onChange={(e) => setStockItemPrecio(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="stock-item-cantidad" className="font-semibold text-chocolate-700 block mb-1">
                  Cantidad Llevada *
                </label>
                <input
                  id="stock-item-cantidad"
                  type="number"
                  min="1"
                  placeholder="Unid."
                  value={stockItemCantidad}
                  onChange={(e) => setStockItemCantidad(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold transition-colors"
                >
                  + Añadir al Stock
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Inventario Editable */}
          <div className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-trigo-200 text-[10px] uppercase font-bold text-chocolate-500">
                  <th className="pb-2">Producto (Editable)</th>
                  <th className="pb-2 text-center">Precio Unit. (RD$)</th>
                  <th className="pb-2 text-center">Llevado</th>
                  <th className="pb-2 text-center">Vendido</th>
                  <th className="pb-2 text-center">Muestras / Degustación</th>
                  <th className="pb-2 text-center">Sobrante Devuelto</th>
                  <th className="pb-2 text-right">Efectividad Venta</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {activeBazaar.inventario.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-chocolate-400">
                      No has cargado inventario para este bazar todavía. Puedes agregarlo arriba.
                    </td>
                  </tr>
                ) : (
                  activeBazaar.inventario.map((item) => {
                    const pct = item.cantidad_inicial > 0 ? Math.round((item.cantidad_vendida / item.cantidad_inicial) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-crema/40">
                        <td className="py-2.5 pr-2">
                          <input
                            type="text"
                            aria-label={`Nombre de producto en stock: ${item.producto_nombre}`}
                            value={item.producto_nombre}
                            onChange={(e) => handleActualizarItemStock(item.id, 'producto_nombre', e.target.value)}
                            className="w-full min-w-[140px] font-bold text-chocolate-900 bg-canvas border border-trigo-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-frambuesa-400"
                          />
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Precio unitario de ${item.producto_nombre}`}
                            value={item.precio_unitario || 0}
                            onChange={(e) => handleActualizarItemStock(item.id, 'precio_unitario', e.target.value)}
                            className="w-20 text-center border border-trigo-200 rounded-lg p-1 bg-canvas font-bold text-frambuesa-700 focus:ring-2 focus:ring-frambuesa-400"
                          />
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            aria-label={`Cantidad inicial llevada de ${item.producto_nombre}`}
                            value={item.cantidad_inicial}
                            onChange={(e) => handleActualizarItemStock(item.id, 'cantidad_inicial', e.target.value)}
                            className="w-16 text-center border border-trigo-200 rounded-lg p-1 bg-canvas font-semibold text-chocolate-900 focus:ring-2 focus:ring-frambuesa-400"
                          />
                        </td>
                        <td className="py-2.5 text-center font-bold text-emerald-700">{item.cantidad_vendida}</td>
                        <td className="py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            aria-label={`Muestras o degustación de ${item.producto_nombre}`}
                            value={item.cantidad_degustacion || 0}
                            onChange={(e) => handleActualizarDegustacion(item.id, Number(e.target.value))}
                            className="w-14 text-center border border-trigo-200 rounded-lg p-1 bg-canvas font-bold text-amber-800"
                          />
                        </td>
                        <td className="py-2.5 text-center font-semibold text-chocolate-600">{item.cantidad_sobrante}</td>
                        <td className="py-2.5 text-right font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pct}% vendido
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleEliminarItemStock(item.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar producto del stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Sub-Pestaña: Arqueo de Caja & Cierre */}
      {activeBazaar && currentSubTab === 'arqueo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-trigo-100">
              <h2 className="text-base font-serif font-bold text-chocolate-900">
                Arqueo de Caja & Conciliación
              </h2>
              <span className="text-xs font-bold text-chocolate-600">
                {activeBazaar.nombre}
              </span>
            </div>

            {/* Desglose de Caja */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-dashed border-trigo-200">
                <span className="text-chocolate-600">Fondo Inicial de Caja (Cambio):</span>
                <span className="font-bold text-chocolate-900">{formatCurrency(activeBazaar.fondo_caja_inicial)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-trigo-200 text-emerald-700">
                <span>(+) Ventas Cobradas en Efectivo:</span>
                <span className="font-bold">{formatCurrency(metricas.ventasEfectivo)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-trigo-200 text-red-600">
                <span>(-) Gastos Pagados con Efectivo de Caja:</span>
                <span className="font-bold">-{formatCurrency(metricas.gastosEfectivo)}</span>
              </div>
              <div className="flex justify-between py-2.5 bg-canvas p-3 rounded-2xl border border-trigo-200 font-bold text-sm">
                <span className="text-chocolate-900">Total Efectivo Físico Esperado en Caja:</span>
                <span className="text-emerald-800 text-base">{formatCurrency(metricas.efectivoEsperadoCaja)}</span>
              </div>
            </div>

            {/* Comparación con Efectivo Contado */}
            <div className="p-4 bg-crema/60 rounded-2xl border border-trigo-200 space-y-3">
              <label className="text-xs font-bold text-chocolate-800 block">
                Ingresa el Efectivo Físico Contado al Cerrar el Bazar:
              </label>
              <input
                type="number"
                placeholder="RD$ contado en la caja física..."
                value={efectivoContadoFisico}
                onChange={(e) => setEfectivoContadoFisico(e.target.value)}
                className="w-full text-base font-bold border border-trigo-300 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-frambuesa-400"
              />

              {efectivoContadoFisico && (
                <div className="text-xs font-bold pt-1">
                  {(() => {
                    const diff = Number(efectivoContadoFisico) - metricas.efectivoEsperadoCaja;
                    if (Math.abs(diff) < 1) {
                      return (
                        <p className="text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          ¡Caja Cuadrada Exacta! No hay sobrante ni faltante.
                        </p>
                      );
                    }
                    if (diff > 0) {
                      return (
                        <p className="text-blue-700">
                          Sobrante de caja: +{formatCurrency(diff)}
                        </p>
                      );
                    }
                    return (
                      <p className="text-red-700">
                        Faltante de caja: {formatCurrency(diff)}
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Botón Finalizar Bazar */}
            {activeBazaar.estado === 'activo' && (
              <div className="space-y-2 pt-2">
                <textarea
                  placeholder="Notas de cierre (ej: excelente flujo de clientes, se agotaron los tres leches a las 4pm)..."
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  className="w-full text-xs border border-trigo-200 rounded-xl p-3 bg-canvas"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => finalizarBazaar(activeBazaar.id, notasCierre)}
                  className="w-full py-2.5 px-4 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold text-xs transition-colors"
                >
                  Finalizar Bazar Oficialmente
                </button>
              </div>
            )}
          </div>

          {/* Tarjeta de Importación a Contabilidad General */}
          <div className="lg:col-span-5 bg-gradient-to-br from-white to-frambuesa-50/40 rounded-3xl p-5 sm:p-6 border border-frambuesa-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-frambuesa-800">
              <UploadCloud className="w-5 h-5 text-frambuesa-600" />
              <h3 className="font-serif font-bold text-sm">
                Importar a Contabilidad General
              </h3>
            </div>
            <p className="text-xs text-chocolate-600 leading-relaxed">
              Al hacer clic en este botón, todos los ingresos y ventas consolidadas del bazar{' '}
              <span className="font-bold text-chocolate-900">"{activeBazaar.nombre}"</span> se transferirán de
              forma automática a la contabilidad general de Delicias del Valle, registrando una orden pagada y oficial.
            </p>

            <div className="p-3 bg-white rounded-2xl border border-frambuesa-100 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-chocolate-700">
                <span>Ingresos Brutos a Importar:</span>
                <span className="font-bold text-chocolate-900">{formatCurrency(metricas.totalVentas)}</span>
              </div>
              <div className="flex justify-between font-semibold text-chocolate-700">
                <span>Gastos Deducidos del Evento:</span>
                <span className="font-bold text-red-600">-{formatCurrency(metricas.totalGastos)}</span>
              </div>
              <div className="flex justify-between font-bold text-frambuesa-800 pt-1 border-t border-trigo-100">
                <span>Ganancia Neta Reportada:</span>
                <span>{formatCurrency(metricas.gananciaNeta)}</span>
              </div>
            </div>

            {activeBazaar.importado_a_central ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Este evento ya fue importado a la contabilidad central el{' '}
                  {formatDate(activeBazaar.fecha_importado || activeBazaar.updated_at)}.
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => importarBazaarAContabilidadGeneral(activeBazaar.id)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-frambuesa-600 to-rose-700 hover:from-frambuesa-700 hover:to-rose-800 text-white text-xs font-extrabold shadow-md shadow-frambuesa-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>IMPORTAR DATOS A CONTABILIDAD GENERAL</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. Sub-Pestaña: Historial de Bazares */}
      {currentSubTab === 'historial' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-chocolate-900">
                Historial de Bazares Asistidos
              </h2>
              <p className="text-xs text-chocolate-500">
                Registro histórico de eventos, recaudación total y márgenes
              </p>
            </div>
            <span className="text-xs font-bold text-chocolate-600">
              {bazaarEvents.length} eventos registrados
            </span>
          </div>

          <div className="divide-y divide-trigo-100">
            {bazaarEvents.length === 0 ? (
              <p className="text-xs text-chocolate-400 py-8 text-center">
                No hay historial de bazares aún.
              </p>
            ) : (
              bazaarEvents.map((b) => {
                const ventasTot = b.ventas.reduce((acc, v) => acc + v.total, 0);
                const gastosTot = b.gastos.reduce((acc, g) => acc + g.monto, 0);
                const ganancia = ventasTot - gastosTot;

                return (
                  <div
                    key={b.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-crema/20 rounded-xl px-2 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-chocolate-900">
                          {b.nombre}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                            b.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {b.estado === 'activo' ? 'En Curso' : 'Finalizado'}
                        </span>
                        {b.importado_a_central && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                            ✓ Importado
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-chocolate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-chocolate-700">
                          {formatBazaarDateRange(b.fecha, b.fecha_fin)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {getBazaarDurationDays(b.fecha, b.fecha_fin)}{' '}
                          {getBazaarDurationDays(b.fecha, b.fecha_fin) === 1 ? 'día' : 'días'}
                        </span>
                        <span>• {b.ubicacion || 'Sin ubicación registrada'}</span>
                        <span>• {b.ventas.length} tickets</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-chocolate-400 block">Ganancia Neta</span>
                        <span className="font-bold text-emerald-700 text-sm">{formatCurrency(ganancia)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBazaarId(b.id);
                            setCurrentSubTab('pos');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white font-bold text-xs"
                        >
                          Ver / Operar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarBazaarEvent(b.id)}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50"
                          title="Eliminar historial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Bazar */}
      <Modal
        isOpen={isNewBazaarModalOpen}
        onClose={() => setIsNewBazaarModalOpen(false)}
        title="Iniciar Nuevo Bazar o Evento Pop-Up"
        maxWidth="lg"
      >
        <form onSubmit={handleCrearNuevoBazaar} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-chocolate-700 block mb-1">
              Nombre del Evento o Bazar *
            </label>
            <input
              type="text"
              placeholder="Ej: Bazar Primavera Agora Mall, Mercadito Gourmet..."
              value={newBazaarNombre}
              onChange={(e) => setNewBazaarNombre(e.target.value)}
              className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-chocolate-700 block mb-1">
                Fecha de Inicio del Evento *
              </label>
              <input
                type="date"
                value={newBazaarFecha}
                onChange={(e) => {
                  const nuevaFechaInicio = e.target.value;
                  setNewBazaarFecha(nuevaFechaInicio);
                  if (newBazaarFechaFin < nuevaFechaInicio) {
                    setNewBazaarFechaFin(nuevaFechaInicio);
                  }
                }}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-chocolate-700 flex items-center justify-between mb-1">
                <span>Fecha Final del Evento *</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-frambuesa-50 text-frambuesa-700 border border-frambuesa-200">
                  {getBazaarDurationDays(newBazaarFecha, newBazaarFechaFin)}{' '}
                  {getBazaarDurationDays(newBazaarFecha, newBazaarFechaFin) === 1 ? 'día' : 'días'}
                </span>
              </label>
              <input
                type="date"
                min={newBazaarFecha}
                value={newBazaarFechaFin}
                onChange={(e) => setNewBazaarFechaFin(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-chocolate-700 block mb-1">
                Fondo Inicial de Caja (RD$) *
              </label>
              <input
                type="number"
                placeholder="2000"
                value={newBazaarFondo}
                onChange={(e) => setNewBazaarFondo(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-chocolate-700 block mb-1">
                Ubicación / Plaza (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Ágora Mall, Nivel 1, Santo Domingo"
                value={newBazaarUbicacion}
                onChange={(e) => setNewBazaarUbicacion(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-chocolate-700 block mb-1">
              Notas Adicionales
            </label>
            <textarea
              placeholder="Detalles sobre stand, horario de montaje, etc..."
              value={newBazaarNotas}
              onChange={(e) => setNewBazaarNotas(e.target.value)}
              className="w-full border border-trigo-200 rounded-xl p-3 bg-canvas"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewBazaarModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold shadow-sm"
            >
              Iniciar Bazar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Editar o Agregar un Producto del Catálogo Táctil de Bazar */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProductId ? 'Editar Producto y Precio de Bazar' : 'Nuevo Producto para Catálogo de Bazar'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProductModal} className="space-y-4 text-xs">
          <div>
            <label htmlFor="modal-bazaar-prod-nombre" className="font-semibold text-chocolate-700 block mb-1">
              Nombre del Producto *
            </label>
            <input
              id="modal-bazaar-prod-nombre"
              type="text"
              placeholder="Ej: Porción Pastel Tres Leches, Brownie Fudge..."
              value={modalProdNombre}
              onChange={(e) => setModalProdNombre(e.target.value)}
              className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400 font-semibold text-chocolate-900"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-bazaar-prod-precio" className="font-semibold text-chocolate-700 block mb-1">
                Precio de Venta (RD$) *
              </label>
              <input
                id="modal-bazaar-prod-precio"
                type="number"
                min="0"
                step="1"
                placeholder="Ej: 175"
                value={modalProdPrecio}
                onChange={(e) => setModalProdPrecio(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400 font-bold text-frambuesa-700 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="modal-bazaar-prod-icono" className="font-semibold text-chocolate-700 block mb-1">
                Ícono / Emoji
              </label>
              <input
                id="modal-bazaar-prod-icono"
                type="text"
                value={modalProdIcono}
                onChange={(e) => setModalProdIcono(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400 text-center text-base"
              />
            </div>
          </div>

          <div>
            <span className="font-semibold text-chocolate-600 block mb-1.5 text-[11px]">
              Íconos rápidos sugeridos:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJIS_SUGERIDOS_BAZAAR.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setModalProdIcono(emoji)}
                  className={`w-8 h-8 rounded-xl border text-base flex items-center justify-center transition-all ${
                    modalProdIcono === emoji
                      ? 'bg-frambuesa-100 border-frambuesa-400 shadow-xs scale-105'
                      : 'bg-canvas border-trigo-200 hover:bg-crema'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-trigo-100">
            {editingProductId ? (
              <button
                type="button"
                onClick={() => handleDeleteCatalogProduct(editingProductId)}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold shadow-sm inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
