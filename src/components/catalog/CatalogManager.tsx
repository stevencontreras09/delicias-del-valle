import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CatalogProductItem,
  CatalogOrderRequest,
  CotizacionItem,
} from '../../types';
import {
  fetchCatalogItemsFromSupabase,
  syncCatalogItemsToSupabase,
  fetchCatalogOrdersFromSupabase,
  syncCatalogOrdersToSupabase,
} from '../../services/supabaseService';
import { calcularCostosReceta } from '../../utils/calculations';
import { sanitizeDominicanPhone } from '../../utils/whatsappHelper';
import { Modal } from '../ui/Modal';
import { PublicCatalogPage } from './PublicCatalogPage';
import {
  BookOpen,
  Plus,
  Upload,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Send,
  FileText,
  MapPin,
  Calendar,
  Heart,
  Search,
} from 'lucide-react';

const DEFAULT_TAMANOS = [
  '1/2 Libra (8-10 porciones)',
  '1 Libra (16-20 porciones)',
  '1.5 Libras (24-28 porciones)',
  '2 Libras (32-40 porciones)',
  'Porción Individual',
  'Media Docena (6 uds)',
  'Docena (12 uds)',
];

// Comprime una imagen subida desde archivo a JPEG ligero (máx 720px) para guardar en Supabase
async function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 720;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(ev.target?.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = String(ev.target?.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const CatalogManager: React.FC = () => {
  const {
    recetas,
    insumosMap,
    quoteOptions,
    addCotizacion,
    convertirCotizacionAPedido,
    setActiveTab,
    showToast,
    broadcastChange,
  } = useApp();

  const [subTab, setSubTab] = useState<'productos' | 'solicitudes' | 'vista_previa'>('productos');
  const [catalogItems, setCatalogItems] = useState<CatalogProductItem[]>([]);
  const [catalogOrders, setCatalogOrders] = useState<CatalogOrderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal de Crear / Editar Producto del Catálogo
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogProductItem | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState('Pastelería Artesanal');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formImagenUrl, setFormImagenUrl] = useState('');
  const [formRecetaId, setFormRecetaId] = useState<string>('');
  const [formTamanosText, setFormTamanosText] = useState(DEFAULT_TAMANOS.join('\n'));
  const [formPermitePersonalizacion, setFormPermitePersonalizacion] = useState(true);
  const [formPermiteDedicatoria, setFormPermiteDedicatoria] = useState(true);
  const [formDestacado, setFormDestacado] = useState(false);
  const [formActivo, setFormActivo] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const publicCatalogUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?catalogo=1`
      : 'https://delicias-del-valle.vercel.app/?catalogo=1';

  const defaultMasasList = useMemo(
    () =>
      quoteOptions.masas?.length
        ? quoteOptions.masas.map((m) => m.nombre)
        : ['Vainilla Tradicional', 'Chocolate Intenso', 'Red Velvet', 'Zanahoria con Nueces'],
    [quoteOptions.masas]
  );

  const defaultRellenosList = useMemo(
    () =>
      quoteOptions.rellenos?.length
        ? quoteOptions.rellenos.map((r) => r.nombre)
        : ['Dulce de Leche Artesanal', 'Nutella', 'Crema Pastelera', 'Frutos Rojos', 'Sin Relleno'],
    [quoteOptions.rellenos]
  );

  const defaultDecoracionesList = useMemo(
    () =>
      quoteOptions.decoraciones?.length
        ? quoteOptions.decoraciones.map((d) => d.nombre)
        : ['Suspiro Dominicano', 'Buttercream Suizo', 'Drip Cake', 'Fondant Personalizado'],
    [quoteOptions.decoraciones]
  );

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [itemsDb, ordersDb] = await Promise.all([
        fetchCatalogItemsFromSupabase(),
        fetchCatalogOrdersFromSupabase(),
      ]);

      if (itemsDb && itemsDb.length > 0) {
        setCatalogItems(itemsDb);
      } else if (recetas.length > 0) {
        const seeded: CatalogProductItem[] = recetas
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
            masas_disponibles: defaultMasasList,
            rellenos_disponibles: defaultRellenosList,
            decoraciones_disponibles: defaultDecoracionesList,
            permite_personalizacion: true,
            permite_dedicatoria: true,
            destacado: idx < 3,
            activo: true,
            orden: idx + 1,
            updated_at: new Date().toISOString(),
          }));
        setCatalogItems(seeded);
        await syncCatalogItemsToSupabase(seeded);
      }

      if (ordersDb) {
        setCatalogOrders(ordersDb);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicCatalogUrl);
    setCopiedLink(true);
    showToast(
      'success',
      'Enlace del Catálogo Copiado',
      'Comparte este enlace con tus clientes para que vean las fotos y configuren su pedido.'
    );
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSyncFromRecetas = async () => {
    const existingRecetaIds = new Set(
      catalogItems.map((i) => i.receta_id).filter((id): id is number => Boolean(id))
    );
    const existingNames = new Set(catalogItems.map((i) => i.nombre.trim().toLowerCase()));

    const newItems: CatalogProductItem[] = [];
    recetas
      .filter((r) => r.activa !== false)
      .forEach((r, idx) => {
        if (existingRecetaIds.has(r.id) || existingNames.has(r.nombre.trim().toLowerCase())) {
          return;
        }
        newItems.push({
          id: `cat-rec-${r.id}-${Date.now()}`,
          receta_id: r.id,
          nombre: r.nombre,
          categoria: r.categoria || 'Pastelería Artesanal',
          descripcion:
            r.descripcion ||
            'Elaborado artesanalmente bajo pedido con ingredientes frescos de primera calidad.',
          tamanos_disponibles: DEFAULT_TAMANOS,
          masas_disponibles: defaultMasasList,
          rellenos_disponibles: defaultRellenosList,
          decoraciones_disponibles: defaultDecoracionesList,
          permite_personalizacion: true,
          permite_dedicatoria: true,
          activo: true,
          orden: catalogItems.length + idx + 1,
          updated_at: new Date().toISOString(),
        });
      });

    if (newItems.length === 0) {
      showToast('info', 'Catálogo al Día', 'Todas tus recetas activas ya están en el catálogo.');
      return;
    }

    const updated = [...catalogItems, ...newItems];
    setCatalogItems(updated);
    await syncCatalogItemsToSupabase(updated);
    showToast(
      'success',
      'Recetas Importadas al Catálogo',
      `Se agregaron ${newItems.length} producto(s) al catálogo visual.`
    );
  };

  const handleOpenProductModal = (item?: CatalogProductItem) => {
    if (item) {
      setEditingItem(item);
      setFormNombre(item.nombre);
      setFormCategoria(item.categoria || 'Pastelería Artesanal');
      setFormDescripcion(item.descripcion || '');
      setFormImagenUrl(item.imagen_url || '');
      setFormRecetaId(item.receta_id ? String(item.receta_id) : '');
      setFormTamanosText(
        (item.tamanos_disponibles?.length ? item.tamanos_disponibles : DEFAULT_TAMANOS).join('\n')
      );
      setFormPermitePersonalizacion(item.permite_personalizacion !== false);
      setFormPermiteDedicatoria(item.permite_dedicatoria !== false);
      setFormDestacado(Boolean(item.destacado));
      setFormActivo(item.activo !== false);
    } else {
      setEditingItem(null);
      setFormNombre('');
      setFormCategoria('Pastelería Artesanal');
      setFormDescripcion('');
      setFormImagenUrl('');
      setFormRecetaId('');
      setFormTamanosText(DEFAULT_TAMANOS.join('\n'));
      setFormPermitePersonalizacion(true);
      setFormPermiteDedicatoria(true);
      setFormDestacado(false);
      setFormActivo(true);
    }
    setIsProductModalOpen(true);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file);
      setFormImagenUrl(compressedDataUrl);
      showToast('success', 'Foto Cargada', 'La fotografía se optimizó y está lista para guardar.');
    } catch {
      showToast('error', 'Error de Imagen', 'No se pudo procesar la foto seleccionada.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('Por favor ingresa el nombre del producto.');
      return;
    }

    const tamanos = formTamanosText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: CatalogProductItem = {
      id: editingItem ? editingItem.id : `cat-${Date.now()}`,
      receta_id: formRecetaId ? Number(formRecetaId) : undefined,
      nombre: formNombre.trim(),
      categoria: formCategoria.trim() || 'Pastelería Artesanal',
      descripcion: formDescripcion.trim(),
      imagen_url: formImagenUrl.trim() || undefined,
      tamanos_disponibles: tamanos.length > 0 ? tamanos : DEFAULT_TAMANOS,
      masas_disponibles: editingItem?.masas_disponibles || defaultMasasList,
      rellenos_disponibles: editingItem?.rellenos_disponibles || defaultRellenosList,
      decoraciones_disponibles: editingItem?.decoraciones_disponibles || defaultDecoracionesList,
      permite_personalizacion: formPermitePersonalizacion,
      permite_dedicatoria: formPermiteDedicatoria,
      destacado: formDestacado,
      activo: formActivo,
      updated_at: new Date().toISOString(),
    };

    const nextList = editingItem
      ? catalogItems.map((i) => (i.id === editingItem.id ? payload : i))
      : [payload, ...catalogItems];

    setCatalogItems(nextList);
    setIsProductModalOpen(false);
    await syncCatalogItemsToSupabase(nextList);
    broadcastChange('actualizó', 'el producto del catálogo', payload.nombre);
    showToast(
      'success',
      editingItem ? 'Producto Actualizado' : 'Producto Agregado al Catálogo',
      `"${payload.nombre}" ya está sincronizado en el catálogo público (sin precios).`
    );
  };

  const handleToggleProductVisibility = async (item: CatalogProductItem) => {
    const nextList = catalogItems.map((i) =>
      i.id === item.id ? { ...i, activo: !i.activo, updated_at: new Date().toISOString() } : i
    );
    setCatalogItems(nextList);
    await syncCatalogItemsToSupabase(nextList);
    showToast(
      'info',
      !item.activo ? 'Producto Visible' : 'Producto Oculto',
      `"${item.nombre}" ahora está ${!item.activo ? 'visible' : 'oculto'} en el catálogo público.`
    );
  };

  const handleDeleteProduct = async (item: CatalogProductItem) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}" del catálogo público?`)) return;
    const nextList = catalogItems.filter((i) => i.id !== item.id);
    setCatalogItems(nextList);
    await syncCatalogItemsToSupabase(nextList);
    showToast('info', 'Producto Eliminado', `Se quitó "${item.nombre}" del catálogo.`);
  };

  const handleConvertRequestToQuote = async (req: CatalogOrderRequest) => {
    const quoteItems: CotizacionItem[] = req.items.map((sel, idx) => {
      const matchedReceta =
        (sel.receta_id ? recetas.find((r) => r.id === sel.receta_id) : undefined) ||
        recetas.find((r) => r.nombre.trim().toLowerCase() === sel.producto_nombre.trim().toLowerCase());

      let unitPrice = 1200;
      if (matchedReceta) {
        const costos = calcularCostosReceta(matchedReceta, insumosMap);
        unitPrice = Math.round(
          costos.precio_sugerido_margen_venta || costos.precio_sugerido_venta || 1200
        );
      }

      return {
        id: `item-cat-${Date.now()}-${idx}`,
        receta_id: matchedReceta?.id,
        receta_nombre: sel.producto_nombre,
        tamano_porciones: sel.tamano_porciones,
        masa_base: sel.masa_base,
        relleno: sel.relleno,
        decoracion: sel.decoracion,
        empaque: 'Estándar de la Receta',
        dedicatoria: sel.dedicatoria || '',
        extras: sel.notas_personalizacion
          ? [{ id: `nota-${idx}`, nombre: `Personalización: ${sel.notas_personalizacion}`, precio: 0 }]
          : [],
        cantidad: sel.cantidad,
        precio_unitario: unitPrice,
        subtotal: unitPrice * sel.cantidad,
        factor_receta: 1,
      };
    });

    const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);
    const createdQuote = await addCotizacion({
      descripcion: `Solicitud Catálogo #${req.folio}`,
      cliente_nombre: req.cliente_nombre,
      cliente_telefono: req.cliente_telefono,
      cliente_email: req.cliente_email,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_evento: req.fecha_entrega_deseada,
      validez_dias: 7,
      items: quoteItems,
      subtotal,
      descuento: 0,
      costo_envio: 0,
      total: subtotal,
      notas: req.notas_generales || `Pedido configurado por el cliente desde el Catálogo Interactivo (#${req.folio}).`,
      estado: 'pendiente',
      tipo_despacho: req.tipo_despacho,
      direccion_entrega: req.direccion_entrega,
      punto_referencia: req.punto_referencia,
      maps_url: req.maps_url,
    });

    if (createdQuote) {
      const updatedOrders = catalogOrders.map((o) =>
        o.id === req.id
          ? { ...o, estado: 'cotizado' as const, cotizacion_id: createdQuote.id }
          : o
      );
      setCatalogOrders(updatedOrders);
      await syncCatalogOrdersToSupabase(updatedOrders);
      showToast(
        'success',
        'Cotización del Catálogo Creada',
        `Se generó la cotización ${createdQuote.codigo} para ${req.cliente_nombre} en Cotizaciones del Catálogo.`
      );
      setActiveTab('quotes');
    }
  };

  const handleConfirmRequestDirectlyToOrder = async (req: CatalogOrderRequest) => {
    const quoteItems: CotizacionItem[] = req.items.map((sel, idx) => {
      const matchedReceta =
        (sel.receta_id ? recetas.find((r) => r.id === sel.receta_id) : undefined) ||
        recetas.find((r) => r.nombre.trim().toLowerCase() === sel.producto_nombre.trim().toLowerCase());

      let unitPrice = 1200;
      if (matchedReceta) {
        const costos = calcularCostosReceta(matchedReceta, insumosMap);
        unitPrice = Math.round(
          costos.precio_sugerido_margen_venta || costos.precio_sugerido_venta || 1200
        );
      }

      return {
        id: `item-cat-${Date.now()}-${idx}`,
        receta_id: matchedReceta?.id,
        receta_nombre: sel.producto_nombre,
        tamano_porciones: sel.tamano_porciones,
        masa_base: sel.masa_base,
        relleno: sel.relleno,
        decoracion: sel.decoracion,
        empaque: 'Estándar de la Receta',
        dedicatoria: sel.dedicatoria || '',
        extras: sel.notas_personalizacion
          ? [{ id: `nota-${idx}`, nombre: `Personalización: ${sel.notas_personalizacion}`, precio: 0 }]
          : [],
        cantidad: sel.cantidad,
        precio_unitario: unitPrice,
        subtotal: unitPrice * sel.cantidad,
        factor_receta: 1,
      };
    });

    const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);
    const createdQuote = await addCotizacion({
      descripcion: `Solicitud Catálogo #${req.folio}`,
      cliente_nombre: req.cliente_nombre,
      cliente_telefono: req.cliente_telefono,
      cliente_email: req.cliente_email,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_evento: req.fecha_entrega_deseada,
      validez_dias: 7,
      items: quoteItems,
      subtotal,
      descuento: 0,
      costo_envio: 0,
      total: subtotal,
      notas: req.notas_generales || `Pedido configurado por el cliente desde el Catálogo Interactivo (#${req.folio}).`,
      estado: 'aprobada',
      tipo_despacho: req.tipo_despacho,
      direccion_entrega: req.direccion_entrega,
      punto_referencia: req.punto_referencia,
      maps_url: req.maps_url,
    });

    if (createdQuote) {
      const updatedOrders = catalogOrders.map((o) =>
        o.id === req.id
          ? { ...o, estado: 'cotizado' as const, cotizacion_id: createdQuote.id }
          : o
      );
      setCatalogOrders(updatedOrders);
      await syncCatalogOrdersToSupabase(updatedOrders);

      convertirCotizacionAPedido(
        createdQuote.id,
        0,
        req.fecha_entrega_deseada || new Date().toISOString().split('T')[0],
        req.hora_entrega_deseada || '14:00',
        req.tipo_despacho === 'delivery' ? 'domicilio' : 'recogida_local',
        req.direccion_entrega || '',
        {
          punto_referencia: req.punto_referencia,
          costo_delivery: 0,
        }
      );

      showToast(
        'success',
        'Orden Confirmada en Pedidos',
        `La solicitud #${req.folio} de ${req.cliente_nombre} pasó directamente a Pedidos Confirmados.`
      );
      setActiveTab('orders');
    }
  };

  const handleDeleteOrderRequest = async (req: CatalogOrderRequest) => {
    if (!window.confirm(`¿Eliminar la solicitud #${req.folio} de ${req.cliente_nombre}?`)) return;
    const next = catalogOrders.filter((o) => o.id !== req.id);
    setCatalogOrders(next);
    await syncCatalogOrdersToSupabase(next);
  };

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.categoria.toLowerCase().includes(q) ||
        (i.descripcion && i.descripcion.toLowerCase().includes(q))
    );
  }, [catalogItems, searchTerm]);

  const pendingOrdersCount = catalogOrders.filter((o) => o.estado === 'pendiente').length;

  if (subTab === 'vista_previa') {
    return <PublicCatalogPage onBackToApp={() => setSubTab('productos')} />;
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Encabezado Principal + Enlace Público Compartible */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-frambuesa-600 to-chocolate-900 text-white rounded-2xl shadow-md shrink-0">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-chocolate-900 leading-tight">
                  Catálogo Visual Interactivo (Sin Precios)
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {catalogItems.filter((i) => i.activo !== false).length} productos activos
                </span>
              </div>
              <p className="text-xs text-chocolate-600 mt-0.5">
                Sube las fotos de tus productos sin mostrar precios. Tus clientes acceden mediante el enlace público, eligen sus productos, los configuran a su gusto y confirman su pedido.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSyncFromRecetas}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-crema hover:bg-trigo-200/70 text-chocolate-800 border border-trigo-300 text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-frambuesa-600" />
              <span>Importar desde Recetas</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('vista_previa')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Ver como Cliente</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenProductModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Producto al Catálogo</span>
            </button>
          </div>
        </div>

        {/* Barra del Enlace Público Compartible */}
        <div className="p-3.5 rounded-2xl bg-crema/70 border border-trigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-frambuesa-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Enlace Público del Catálogo para Clientes (Sin Precios & Configurador de Orden):
            </span>
            <p className="text-xs font-mono font-bold text-chocolate-900 break-all">
              {publicCatalogUrl}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="px-3.5 py-2 rounded-xl bg-chocolate-900 hover:bg-chocolate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>

            <a
              href={publicCatalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white hover:bg-canvas text-chocolate-800 border border-trigo-300 text-xs font-bold flex items-center gap-1.5"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Pestañas Internas del Módulo de Catálogo */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-trigo-200 shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setSubTab('productos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'productos'
              ? 'bg-chocolate-900 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Productos & Fotos ({catalogItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab('solicitudes');
            loadAll();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            subTab === 'solicitudes'
              ? 'bg-chocolate-900 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Órdenes por Confirmar de Clientes ({catalogOrders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-frambuesa-600 text-white font-black">
              {pendingOrdersCount} por confirmar
            </span>
          )}
        </button>
      </div>

      {/* SUB-PESTAÑA 1: PRODUCTOS Y FOTOS */}
      {subTab === 'productos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-trigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-chocolate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="catalog-admin-search"
                type="search"
                aria-label="Buscar producto en el catálogo"
                placeholder="Buscar producto por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-trigo-300 bg-canvas text-xs text-chocolate-900"
              />
            </div>
            <p className="text-[11px] text-chocolate-600">
              Haz clic en <strong>Subir / Cambiar Foto</strong> en cualquier tarjeta para cargar la imagen del producto.
            </p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-trigo-200 text-xs text-chocolate-600">
              Cargando catálogo...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                    item.activo !== false ? 'border-trigo-200' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="relative h-48 bg-crema/60 flex items-center justify-center overflow-hidden">
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-chocolate-500">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-60" />
                          <span className="text-[11px] font-bold block">Sin foto cargada</span>
                        </div>
                      )}

                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-chocolate-900 border border-trigo-200">
                        {item.categoria}
                      </span>

                      {item.destacado && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-frambuesa-600 text-white flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-current" />
                          Destacado
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="text-sm font-serif font-bold text-chocolate-900">
                        {item.nombre}
                      </h3>
                      <p className="text-xs text-chocolate-600 line-clamp-2">
                        {item.descripcion || 'Sin descripción adicional.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-trigo-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenProductModal(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-crema hover:bg-trigo-200 text-chocolate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-frambuesa-600" />
                      <span>Editar / Subir Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleProductVisibility(item)}
                      className="p-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 border border-trigo-200"
                      title={item.activo !== false ? 'Ocultar del catálogo público' : 'Mostrar en el catálogo público'}
                    >
                      {item.activo !== false ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(item)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      title="Eliminar del catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-PESTAÑA 2: SOLICITUDES DE PEDIDOS CONFIRMADAS POR CLIENTES */}
      {subTab === 'solicitudes' && (
        <div className="space-y-4">
          {catalogOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-trigo-200 space-y-2">
              <ShoppingBag className="w-10 h-10 text-chocolate-300 mx-auto" />
              <p className="text-sm font-bold text-chocolate-900">
                Aún no hay pedidos enviados desde el enlace público del catálogo
              </p>
              <p className="text-xs text-chocolate-600 max-w-md mx-auto">
                Cuando un cliente abra el enlace del catálogo, personalice sus productos y confirme su orden, aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {catalogOrders.map((req) => {
                const cleanPhone = sanitizeDominicanPhone(req.cliente_telefono);
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border border-trigo-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-trigo-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-frambuesa-50 text-frambuesa-700 border border-frambuesa-200">
                            #{req.folio}
                          </span>
                          <h3 className="text-base font-bold text-chocolate-900">
                            {req.cliente_nombre}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.estado === 'cotizado'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {req.estado === 'cotizado' ? 'Cotización Creada' : 'Nuevo Pedido por Cotizar'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-chocolate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-frambuesa-600" />
                            Entrega deseada: <strong>{req.fecha_entrega_deseada}</strong> ({req.hora_entrega_deseada || 'Por definir'})
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {req.tipo_despacho === 'delivery'
                              ? `Delivery: ${req.direccion_entrega || 'Con ubicación GPS'}`
                              : 'Retiro en Taller'}
                          </span>
                          {req.maps_url && (
                            <a
                              href={req.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-700 font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Ver Pin en Google Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {cleanPhone.length >= 10 && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `¡Hola *${req.cliente_nombre}*! 🍰 Recibimos tu pedido personalizado *#${req.folio}* desde nuestro catálogo de *Delicias del Valle*. Te compartimos la cotización y confirmación:`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Responder WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleConvertRequestToQuote(req)}
                          className="px-3.5 py-2 rounded-xl bg-chocolate-900 hover:bg-chocolate-800 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-trigo-300" />
                          <span>Asignar Precios (Cotizar)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmRequestDirectlyToOrder(req)}
                          className="px-3.5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar Directo a Pedido</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOrderRequest(req)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          title="Eliminar solicitud"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {req.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-canvas border border-trigo-200 text-xs space-y-1"
                        >
                          <p className="font-bold text-chocolate-900">
                            {idx + 1}. {item.producto_nombre} (x{item.cantidad})
                          </p>
                          <p className="text-[11px] text-chocolate-700">
                            <strong>Tamaño:</strong> {item.tamano_porciones} • <strong>Masa:</strong> {item.masa_base}
                          </p>
                          <p className="text-[11px] text-chocolate-700">
                            <strong>Relleno:</strong> {item.relleno} • <strong>Decoración:</strong> {item.decoracion}
                          </p>
                          {item.dedicatoria && (
                            <p className="text-[11px] text-frambuesa-700 italic">
                              Dedicatoria: &ldquo;{item.dedicatoria}&rdquo;
                            </p>
                          )}
                          {item.notas_personalizacion && (
                            <p className="text-[11px] text-chocolate-600">
                              Detalles: {item.notas_personalizacion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO Y SUBIR FOTO */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingItem ? `Editar Producto: ${editingItem.nombre}` : 'Nuevo Producto para el Catálogo'}
        subtitle="Sube la fotografía del producto y define sus opciones personalizables. No se mostrará ningún precio al público."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          {/* Subida de Fotografía */}
          <div className="p-4 rounded-2xl bg-crema/60 border border-trigo-200 space-y-3">
            <label htmlFor="cat-photo-upload" className="font-bold text-chocolate-900 block">
              Fotografía del Producto
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 rounded-2xl bg-white border border-trigo-300 overflow-hidden flex items-center justify-center shrink-0">
                {formImagenUrl ? (
                  <img src={formImagenUrl} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-chocolate-300" />
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <label
                    htmlFor="cat-photo-upload"
                    className="px-3.5 py-2 rounded-xl bg-chocolate-900 hover:bg-chocolate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingPhoto ? 'Optimizando foto...' : 'Subir Foto desde mi Dispositivo'}</span>
                  </label>
                  <input
                    id="cat-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                  {formImagenUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImagenUrl('')}
                      className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs"
                    >
                      Quitar Foto
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor="cat-photo-url" className="text-[11px] text-chocolate-600 block mb-1">
                    O pega el enlace directo de una imagen (URL):
                  </label>
                  <input
                    id="cat-photo-url"
                    type="text"
                    placeholder="https://..."
                    value={formImagenUrl}
                    onChange={(e) => setFormImagenUrl(e.target.value)}
                    className="w-full border border-trigo-300 rounded-xl px-3 py-1.5 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cat-prod-nombre" className="font-semibold text-chocolate-700 block mb-1">
                Nombre del Producto *
              </label>
              <input
                id="cat-prod-nombre"
                type="text"
                required
                placeholder="Ej: Bizcocho Dominicano de Suspiro"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas font-medium text-chocolate-900"
              />
            </div>

            <div>
              <label htmlFor="cat-prod-categoria" className="font-semibold text-chocolate-700 block mb-1">
                Categoría
              </label>
              <input
                id="cat-prod-categoria"
                type="text"
                placeholder="Ej: Pasteles de Celebración, Postres Fríos, Mesas de Dulces..."
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value)}
                className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas font-medium text-chocolate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cat-prod-receta" className="font-semibold text-chocolate-700 block mb-1">
              Vincular con Receta Interna (para calcular costos automáticamente al generar cotización)
            </label>
            <select
              id="cat-prod-receta"
              value={formRecetaId}
              onChange={(e) => setFormRecetaId(e.target.value)}
              className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas text-chocolate-900"
            >
              <option value="">-- Sin vincular / Producto personalizado --</option>
              {recetas.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nombre} ({r.categoria})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cat-prod-desc" className="font-semibold text-chocolate-700 block mb-1">
              Descripción Atractiva para el Cliente
            </label>
            <textarea
              id="cat-prod-desc"
              rows={2}
              placeholder="Describe la textura, frescura y opciones de personalización..."
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas text-chocolate-900"
            />
          </div>

          <div>
            <label htmlFor="cat-prod-tamanos" className="font-semibold text-chocolate-700 block mb-1">
              Tamaños / Presentaciones Disponibles (uno por línea)
            </label>
            <textarea
              id="cat-prod-tamanos"
              rows={4}
              value={formTamanosText}
              onChange={(e) => setFormTamanosText(e.target.value)}
              className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-canvas text-chocolate-900 font-mono text-[11px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label htmlFor="cat-chk-pers" className="inline-flex items-center gap-2 cursor-pointer">
              <input
                id="cat-chk-pers"
                type="checkbox"
                checked={formPermitePersonalizacion}
                onChange={(e) => setFormPermitePersonalizacion(e.target.checked)}
                className="rounded border-trigo-300 text-frambuesa-600"
              />
              <span className="font-semibold text-chocolate-800">
                Permitir elegir Masa, Relleno y Decoración
              </span>
            </label>

            <label htmlFor="cat-chk-ded" className="inline-flex items-center gap-2 cursor-pointer">
              <input
                id="cat-chk-ded"
                type="checkbox"
                checked={formPermiteDedicatoria}
                onChange={(e) => setFormPermiteDedicatoria(e.target.checked)}
                className="rounded border-trigo-300 text-frambuesa-600"
              />
              <span className="font-semibold text-chocolate-800">Permitir Dedicatoria</span>
            </label>

            <label htmlFor="cat-chk-dest" className="inline-flex items-center gap-2 cursor-pointer">
              <input
                id="cat-chk-dest"
                type="checkbox"
                checked={formDestacado}
                onChange={(e) => setFormDestacado(e.target.checked)}
                className="rounded border-trigo-300 text-frambuesa-600"
              />
              <span className="font-semibold text-chocolate-800">Destacar como Favorito</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-trigo-200">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold shadow-sm"
            >
              Guardar en el Catálogo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default CatalogManager;
