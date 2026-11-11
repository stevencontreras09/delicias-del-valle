import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Cliente } from '../../types';
import {
  Contact,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Send,
  Share2,
  Copy,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  Navigation,
  Sparkles,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Compass,
  Gift,
  FileText,
  Truck,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import {
  sanitizeDominicanPhone,
  buildWhatsAppUrl,
  sanitizeWhatsAppText,
} from '../../utils/whatsappHelper';
import { DELICIAS_WORKSHOP_COORDS } from '../../utils/routeOptimizer';
import { Modal } from '../ui/Modal';
import { LocationGoogleMapsModal } from '../quotes/LocationGoogleMapsModal';
import {
  MapLocationPicker,
  getResolvedGoogleMapsApiKey,
} from '../maps/MapLocationPicker';

// Extraer coordenadas Lat/Lng desde maps_url o dirección
export function extractCoordsFromCliente(cliente: Cliente): { lat: number; lng: number } | null {
  const source = `${cliente.maps_url || ''} ${cliente.direccion || ''}`;
  const atMatch = source.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const qMatch = source.match(/(?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  const rawMatch = source.match(/(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/);
  if (rawMatch) return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };

  return null;
}

export const ClientPortfolioManager: React.FC = () => {
  const {
    clientes,
    addCliente,
    updateCliente,
    deleteCliente,
    pedidos,
    cotizaciones,
    bazaarEvents,
    zonasDelivery,
    showToast,
    setActiveTab,
  } = useApp();

  type PortfolioSubTab = 'cartera' | 'catalogo' | 'mapa';
  const [subTab, setSubTab] = useState<PortfolioSubTab>('cartera');

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [zonaFilter, setZonaFilter] = useState<string>('todas');
  const [onlyWithGps, setOnlyWithGps] = useState<boolean>(false);

  // Estado de Modal Crear / Editar Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formPuntoRef, setFormPuntoRef] = useState('');
  const [formMapsUrl, setFormMapsUrl] = useState('');
  const [formZonaId, setFormZonaId] = useState<string>('');
  const [formCumpleanos, setFormCumpleanos] = useState('');
  const [formNotas, setFormNotas] = useState('');

  // Modal de Ubicación Google Maps rápido para un cliente específico
  const [locationModalClient, setLocationModalClient] = useState<Cliente | null>(null);

  const activeApiKey = getResolvedGoogleMapsApiKey();
  const publicCatalogUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?catalogo=1`
      : 'https://delicias-del-valle.vercel.app/?catalogo=1';

  // Estados de Difusión de Catálogo Disponible (Mensaje persuasivo + Enlace exclusivo al Catálogo Interactivo)
  const [catalogIntro, setCatalogIntro] = useState(
    '✨ *¡Endulza tus momentos especiales con Delicias del Valle!* ❤️\n\nTe invitamos a entrar a nuestro nuevo *Catálogo Interactivo*, donde podrás ver las fotos de todos nuestros postres, elegir tus favoritos, personalizarlos totalmente a tu gusto (tamaño, masa, relleno, cobertura y dedicatoria) y confirmar tu pedido en segundos:'
  );
  const [catalogFooter, setCatalogFooter] = useState(
    '✔️ Contamos con *entrega a domicilio* y retiro en nuestro taller. ¡Toca el enlace y arma tu orden ideal hoy mismo! ❤️'
  );
  const [sentClientIds, setSentClientIds] = useState<number[]>([]);
  const [copiedCatalogText, setCopiedCatalogText] = useState(false);
  const [copiedPhonesText, setCopiedPhonesText] = useState(false);

  // Estado para el Mapa de Clientes & Ruta Multi-Entrega
  const [selectedMapClient, setSelectedMapClient] = useState<Cliente | null>(null);
  const [selectedRouteClientIds, setSelectedRouteClientIds] = useState<number[]>([]);

  // Estadísticas reales cruzadas con Pedidos y Cotizaciones por cliente
  const clientMetricsMap = useMemo(() => {
    const map = new Map<
      number,
      { pedidosCount: number; totalComprado: number; ultimaCompra?: string }
    >();

    clientes.forEach((c) => {
      const cDigits = (c.telefono || '').replace(/\D/g, '');
      const matchingOrders = pedidos.list.filter((p) => {
        if (p.estado === 'cancelado') return false;
        const pDigits = (p.cliente_telefono || '').replace(/\D/g, '');
        return (
          p.cliente_id === c.id ||
          p.cliente_nombre.trim().toLowerCase() === c.nombre.trim().toLowerCase() ||
          (cDigits.length >= 7 && pDigits === cDigits)
        );
      });

      const pedidosCount = Math.max(c.total_pedidos || 0, matchingOrders.length);
      const totalComprado = matchingOrders.reduce((acc, p) => acc + (p.total || 0), 0);
      const ultimaCompra =
        matchingOrders.length > 0 ? matchingOrders[0].fecha_entrega : c.ultimo_pedido;

      map.set(c.id, { pedidosCount, totalComprado, ultimaCompra });
    });

    return map;
  }, [clientes, pedidos.list]);

  // Filtrado de la cartera
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = c.nombre.toLowerCase().includes(q);
        const matchPhone = (c.telefono || '').toLowerCase().includes(q);
        const matchDir = (c.direccion || '').toLowerCase().includes(q);
        const matchRef = (c.punto_referencia || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDir && !matchRef) return false;
      }

      if (zonaFilter !== 'todas') {
        if (String(c.zona_delivery_id || '') !== zonaFilter) return false;
      }

      if (onlyWithGps) {
        const hasGps = Boolean(extractCoordsFromCliente(c) || (c.maps_url && c.maps_url.trim().length > 5));
        if (!hasGps) return false;
      }

      return true;
    });
  }, [clientes, searchTerm, zonaFilter, onlyWithGps]);

  // Clientes que tienen coordenadas válidas para el mapa
  const mappedClients = useMemo(() => {
    const list: { cliente: Cliente; coords: { lat: number; lng: number } }[] = [];
    clientes.forEach((c) => {
      const coords = extractCoordsFromCliente(c);
      if (coords) {
        list.push({ cliente: c, coords });
      }
    });
    return list;
  }, [clientes]);

  // Sincronizar clientes históricos desde Pedidos, Cotizaciones y Ventas de Bazar
  const handleSincronizarClientesHistoricos = () => {
    let agregados = 0;
    const existingNames = new Set(clientes.map((c) => c.nombre.trim().toLowerCase()));
    const existingPhones = new Set(
      clientes
        .map((c) => (c.telefono || '').replace(/\D/g, ''))
        .filter((d) => d.length >= 7)
    );

    const tryAdd = (info: {
      nombre: string;
      telefono?: string;
      email?: string;
      direccion?: string;
      punto_referencia?: string;
      maps_url?: string;
      zona_delivery_id?: number | null;
    }) => {
      const cleanName = (info.nombre || '').trim();
      if (!cleanName || cleanName.toLowerCase().startsWith('venta general:')) return;
      const digits = (info.telefono || '').replace(/\D/g, '');
      if (existingNames.has(cleanName.toLowerCase())) return;
      if (digits.length >= 7 && existingPhones.has(digits)) return;

      existingNames.add(cleanName.toLowerCase());
      if (digits.length >= 7) existingPhones.add(digits);

      addCliente({
        nombre: cleanName,
        telefono: info.telefono?.trim() || 'N/A',
        email: info.email,
        direccion: info.direccion,
        punto_referencia: info.punto_referencia,
        maps_url: info.maps_url,
        zona_delivery_id: info.zona_delivery_id || null,
      });
      agregados++;
    };

    pedidos.list.forEach((p) => {
      tryAdd({
        nombre: p.cliente_nombre,
        telefono: p.cliente_telefono,
        email: p.cliente_email,
        direccion: p.direccion_entrega,
        punto_referencia: p.punto_referencia,
        maps_url: p.maps_url,
        zona_delivery_id: p.zona_delivery_id,
      });
    });

    cotizaciones.forEach((cot) => {
      tryAdd({
        nombre: cot.cliente_nombre,
        telefono: cot.cliente_telefono,
        email: cot.cliente_email,
        direccion: cot.direccion_entrega,
        punto_referencia: cot.punto_referencia,
        maps_url: cot.maps_url,
        zona_delivery_id: cot.zona_delivery_id,
      });
    });

    bazaarEvents.forEach((bz) => {
      bz.ventas.forEach((v) => {
        if (v.cliente_nombre) {
          tryAdd({
            nombre: v.cliente_nombre,
            telefono: v.cliente_telefono,
            punto_referencia: `Cliente de Bazar (${bz.nombre})`,
          });
        }
      });
    });

    if (agregados > 0) {
      showToast('success', 'Cartera Sincronizada', `Se importaron ${agregados} cliente(s) desde pedidos, cotizaciones y bazares.`);
    } else {
      showToast('info', 'Cartera al Día', 'Todos los clientes de tus pedidos y cotizaciones ya están en la cartera.');
    }
  };

  // Abrir modal para crear o editar cliente
  const handleOpenClientModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingClient(cliente);
      setFormNombre(cliente.nombre);
      setFormTelefono(cliente.telefono || '');
      setFormEmail(cliente.email || '');
      setFormDireccion(cliente.direccion || '');
      setFormPuntoRef(cliente.punto_referencia || '');
      setFormMapsUrl(cliente.maps_url || '');
      setFormZonaId(cliente.zona_delivery_id ? String(cliente.zona_delivery_id) : '');
      setFormCumpleanos(cliente.fecha_cumpleanos || cliente.cumpleanos_familiar || '');
      setFormNotas(cliente.alergias_preferencias || '');
    } else {
      setEditingClient(null);
      setFormNombre('');
      setFormTelefono('');
      setFormEmail('');
      setFormDireccion('');
      setFormPuntoRef('');
      setFormMapsUrl('');
      setFormZonaId('');
      setFormCumpleanos('');
      setFormNotas('');
    }
    setIsClientModalOpen(true);
  };

  const handleSaveClientForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    const payload = {
      nombre: formNombre.trim(),
      telefono: formTelefono.trim() || 'N/A',
      email: formEmail.trim() || undefined,
      direccion: formDireccion.trim() || undefined,
      punto_referencia: formPuntoRef.trim() || undefined,
      maps_url: formMapsUrl.trim() || undefined,
      zona_delivery_id: formZonaId ? Number(formZonaId) : null,
      fecha_cumpleanos: formCumpleanos.trim() || undefined,
      alergias_preferencias: formNotas.trim() || undefined,
    };

    if (editingClient) {
      updateCliente(editingClient.id, payload);
    } else {
      addCliente(payload);
    }
    setIsClientModalOpen(false);
  };

  // Generación dinámica del mensaje persuasivo con el enlace exclusivo al Catálogo Interactivo
  const buildCatalogMessage = (clientName?: string): string => {
    const lines: string[] = [];
    const saludo = clientName
      ? `¡Hola *${clientName.trim()}*! ✨`
      : '¡Hola! ✨';
    lines.push(saludo);
    lines.push('');

    if (catalogIntro.trim()) {
      lines.push(sanitizeWhatsAppText(catalogIntro.trim()));
      lines.push('');
    }

    lines.push(`➡️ *Accede a nuestro Catálogo Interactivo aquí:*`);
    lines.push(publicCatalogUrl);

    if (catalogFooter.trim()) {
      lines.push('');
      lines.push(sanitizeWhatsAppText(catalogFooter.trim()));
    }

    return sanitizeWhatsAppText(lines.join('\n'));
  };

  const handleSendCatalogToClient = (cliente: Cliente) => {
    const phone = sanitizeDominicanPhone(cliente.telefono);
    if (!phone || phone.length < 7) {
      alert(`El cliente "${cliente.nombre}" no tiene un número de WhatsApp válido registrado.`);
      return;
    }
    const text = buildCatalogMessage(cliente.nombre);
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    const url = buildWhatsAppUrl(phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
    if (!sentClientIds.includes(cliente.id)) {
      setSentClientIds((prev) => [...prev, cliente.id]);
    }
  };

  const handleCopyCatalogText = () => {
    const text = buildCatalogMessage();
    navigator.clipboard.writeText(text);
    setCopiedCatalogText(true);
    showToast('success', 'Catálogo Copiado', 'El mensaje del catálogo está listo para pegar en WhatsApp.');
    setTimeout(() => setCopiedCatalogText(false), 2500);
  };

  const handleCopyAllPhones = () => {
    const phones = filteredClientes
      .map((c) => sanitizeDominicanPhone(c.telefono))
      .filter((p) => p.length >= 10);
    navigator.clipboard.writeText(phones.join(', '));
    setCopiedPhonesText(true);
    showToast('success', 'Teléfonos Copiados', `Se copiaron ${phones.length} números de WhatsApp.`);
    setTimeout(() => setCopiedPhonesText(false), 2500);
  };

  const handleExportClientsCsv = () => {
    const headers = ['ID', 'Nombre', 'Telefono', 'Email', 'Direccion', 'Punto Referencia', 'Zona Delivery', 'Google Maps URL', 'Cumpleanos'];
    const rows = clientes.map((c) => {
      const zona = zonasDelivery.find((z) => z.id === c.zona_delivery_id)?.nombre || '';
      return [
        c.id,
        `"${(c.nombre || '').replace(/"/g, '""')}"`,
        `"${c.telefono || ''}"`,
        `"${c.email || ''}"`,
        `"${(c.direccion || '').replace(/"/g, '""')}"`,
        `"${(c.punto_referencia || '').replace(/"/g, '""')}"`,
        `"${zona}"`,
        `"${c.maps_url || ''}"`,
        `"${c.fecha_cumpleanos || ''}"`,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cartera_Clientes_Delicias_del_Valle_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Construir URL de ruta multi-parada en Google Maps para los clientes seleccionados
  const multiStopRouteUrl = useMemo(() => {
    const selectedClients = clientes.filter((c) => selectedRouteClientIds.includes(c.id));
    if (selectedClients.length === 0) return '';

    const origin = `${DELICIAS_WORKSHOP_COORDS.lat},${DELICIAS_WORKSHOP_COORDS.lng}`;
    const stopsStrings = selectedClients
      .map((c) => {
        const coords = extractCoordsFromCliente(c);
        if (coords) return `${coords.lat},${coords.lng}`;
        if (c.direccion) return `${c.direccion}, Santo Domingo, República Dominicana`;
        return '';
      })
      .filter(Boolean);

    if (stopsStrings.length === 0) return '';
    const destination = encodeURIComponent(stopsStrings[stopsStrings.length - 1]);
    const waypoints = stopsStrings
      .slice(0, -1)
      .map((w) => encodeURIComponent(w))
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${destination}${
      waypoints ? `&waypoints=${waypoints}` : ''
    }&travelmode=driving`;
  }, [clientes, selectedRouteClientIds]);

  const toggleSelectClientForRoute = (id: number) => {
    setSelectedRouteClientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Encabezado Principal de Cartera de Clientes */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-trigo-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-frambuesa-500/10 via-amber-400/5 to-transparent rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-chocolate-800 to-chocolate-900 text-white rounded-2xl shadow-md shrink-0">
              <Contact className="w-6 h-6 sm:w-7 sm:h-7 text-trigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-chocolate-900 leading-tight">
                  Cartera de Clientes & Ubicaciones GPS
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-frambuesa-50 text-frambuesa-700 border border-frambuesa-200">
                  {clientes.length} clientes registrados
                </span>
              </div>
              <p className="text-xs text-chocolate-600 mt-0.5">
                Directorio centralizado para compartir el catálogo disponible por WhatsApp y gestionar direcciones exactas en Google Maps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSincronizarClientesHistoricos}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-crema hover:bg-trigo-200/70 text-chocolate-800 border border-trigo-300 text-xs font-bold transition-colors"
              title="Importar automáticamente clientes desde pedidos, cotizaciones y ventas de bazar"
            >
              <RefreshCw className="w-3.5 h-3.5 text-frambuesa-600" />
              <span>Sincronizar Historial</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors"
              title="Abrir el gestor del Catálogo Visual Interactivo (con fotos y sin precios)"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              <span>Catálogo Interactivo</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenClientModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* KPIs Rápidos de la Cartera */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-trigo-100">
          <div className="bg-canvas/80 p-3 rounded-2xl border border-trigo-200">
            <span className="text-[10px] font-bold text-chocolate-500 uppercase tracking-wider block">
              Total Clientes
            </span>
            <span className="text-base sm:text-lg font-bold text-chocolate-900">
              {clientes.length}
            </span>
            <span className="text-[10px] text-chocolate-500 block mt-0.5">
              En cartera activa
            </span>
          </div>

          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Con WhatsApp Activo
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-900">
              {clientes.filter((c) => sanitizeDominicanPhone(c.telefono).length >= 10).length}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Listos para recibir catálogo
            </span>
          </div>

          <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
              Con Ubicación / Dirección
            </span>
            <span className="text-base sm:text-lg font-bold text-sky-900">
              {clientes.filter((c) => Boolean(c.direccion || c.maps_url)).length}
            </span>
            <span className="text-[10px] text-sky-700 block mt-0.5">
              {mappedClients.length} con Pin GPS exacto
            </span>
          </div>

          <div className="bg-gradient-to-br from-frambuesa-50 to-rose-100 p-3 rounded-2xl border border-frambuesa-200">
            <span className="text-[10px] font-bold text-frambuesa-800 uppercase tracking-wider block">
              Catálogos Enviados Hoy
            </span>
            <span className="text-base sm:text-lg font-bold text-frambuesa-950">
              {sentClientIds.length}
            </span>
            <span className="text-[10px] text-frambuesa-700 block mt-0.5">
              Vía WhatsApp directo
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Sub-Pestañas de Cartera */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-trigo-200 shadow-xs overflow-x-auto scrollbar-none text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab('cartera')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'cartera'
              ? 'bg-chocolate-800 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Directorio & Direcciones ({clientes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('catalogo')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'catalogo'
              ? 'bg-frambuesa-600 text-white shadow-sm'
              : 'text-frambuesa-700 bg-frambuesa-50/50 hover:bg-frambuesa-100/70'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir Catálogo Disponible a Clientes</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('mapa')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'mapa'
              ? 'bg-sky-700 text-white shadow-sm'
              : 'text-chocolate-700 hover:bg-crema'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Mapa Google Maps & Planificador de Entregas</span>
        </button>

        <button
          type="button"
          onClick={handleExportClientsCsv}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-chocolate-700 hover:bg-crema transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* 3. SUB-PESTAÑA 1: DIRECTORIO DE CLIENTES Y GESTIÓN DE DIRECCIONES */}
      {subTab === 'cartera' && (
        <div className="space-y-4">
          {/* Buscador y Filtros */}
          <div className="bg-white rounded-3xl p-4 border border-trigo-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-chocolate-400 absolute left-3.5 top-2.5" />
              <input
                type="search"
                aria-label="Buscar cliente por nombre, teléfono o dirección"
                placeholder="Buscar por nombre del cliente, WhatsApp, calle, sector o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-trigo-200 bg-canvas focus:ring-2 focus:ring-frambuesa-400 font-medium"
              />
            </div>

            <select
              aria-label="Filtrar por zona de delivery"
              value={zonaFilter}
              onChange={(e) => setZonaFilter(e.target.value)}
              className="border border-trigo-200 rounded-xl px-3 py-2 bg-canvas font-semibold text-chocolate-800"
            >
              <option value="todas">Todas las Zonas de Entrega</option>
              {zonasDelivery.map((z) => (
                <option key={z.id} value={String(z.id)}>
                  {z.nombre} ({formatCurrency(z.tarifa)})
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-canvas border border-trigo-200 cursor-pointer font-semibold text-chocolate-700">
              <input
                type="checkbox"
                checked={onlyWithGps}
                onChange={(e) => setOnlyWithGps(e.target.checked)}
                className="rounded text-frambuesa-600 focus:ring-frambuesa-500"
              />
              <span>Solo con Pin GPS</span>
            </label>
          </div>

          {/* Tabla Responsiva de Cartera de Clientes */}
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="clients-table-caption"
            className="bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm overflow-x-auto"
          >
            <table className="w-full text-xs text-left border-collapse">
              <caption id="clients-table-caption" className="sr-only">
                Cartera de clientes registrados con sus ubicaciones de entrega y acceso a catálogo por WhatsApp
              </caption>
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-trigo-200 text-[10px] uppercase font-bold text-chocolate-500">
                  <th className="pb-3 pr-3">Nombre del Cliente</th>
                  <th className="pb-3 px-2">WhatsApp / Contacto</th>
                  <th className="pb-3 px-2">Dirección & Referencia de Entrega</th>
                  <th className="pb-3 px-2 text-center">Zona / GPS</th>
                  <th className="pb-3 px-2 text-center">Pedidos</th>
                  <th className="pb-3 pl-2 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trigo-100">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-chocolate-400">
                      No se encontraron clientes con ese criterio. Puedes crear uno nuevo o sincronizar el historial.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => {
                    const stats = clientMetricsMap.get(cliente.id) || {
                      pedidosCount: cliente.total_pedidos || 0,
                      totalComprado: 0,
                    };
                    const zona = zonasDelivery.find((z) => z.id === cliente.zona_delivery_id);
                    const coords = extractCoordsFromCliente(cliente);
                    const hasMapsLink = Boolean(coords || (cliente.maps_url && cliente.maps_url.trim().length > 5));
                    const googleUrl =
                      cliente.maps_url ||
                      (coords
                        ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
                        : cliente.direccion
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${cliente.direccion}, República Dominicana`
                          )}`
                        : '');

                    return (
                      <tr key={cliente.id} className="hover:bg-crema/30 transition-colors">
                        <th scope="row" className="py-3 pr-3 font-bold text-chocolate-900 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-frambuesa-50 text-frambuesa-700 border border-frambuesa-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-chocolate-900">
                                {cliente.nombre}
                              </span>
                              {cliente.fecha_cumpleanos && (
                                <span className="text-[10px] text-amber-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                                  <Gift className="w-3 h-3" /> {cliente.fecha_cumpleanos}
                                </span>
                              )}
                              {cliente.alergias_preferencias && (
                                <span className="block text-[10px] text-chocolate-500 font-normal mt-0.5 max-w-xs truncate">
                                  {cliente.alergias_preferencias}
                                </span>
                              )}
                            </div>
                          </div>
                        </th>

                        <td className="py-3 px-2 align-top">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-chocolate-800 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{cliente.telefono || 'Sin teléfono'}</span>
                            </span>
                            {cliente.email && (
                              <span className="text-[10px] text-chocolate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[150px]">{cliente.email}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-2 align-top max-w-xs">
                          {cliente.direccion ? (
                            <div className="space-y-0.5">
                              <p className="font-semibold text-chocolate-900 leading-snug">
                                {cliente.direccion}
                              </p>
                              {cliente.punto_referencia && (
                                <p className="text-[10px] text-chocolate-600">
                                  <strong className="text-chocolate-700">Ref:</strong> {cliente.punto_referencia}
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setLocationModalClient(cliente)}
                              className="text-[11px] text-frambuesa-600 hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>+ Asignar dirección de entrega</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-2 align-top text-center">
                          <div className="flex flex-col items-center gap-1">
                            {zona && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-crema text-chocolate-800 border border-trigo-300">
                                {zona.nombre} ({formatCurrency(zona.tarifa)})
                              </span>
                            )}
                            {hasMapsLink ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Pin GPS Listo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                Sin Pin GPS
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-2 align-top text-center">
                          <span className="font-bold text-chocolate-900 block">
                            {stats.pedidosCount} {stats.pedidosCount === 1 ? 'pedido' : 'pedidos'}
                          </span>
                          {stats.totalComprado > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              {formatCurrency(stats.totalComprado)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 pl-2 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Botón 1-Clic Enviar Catálogo Disponible */}
                            <button
                              type="button"
                              onClick={() => handleSendCatalogToClient(cliente)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition-colors"
                              title="Enviar catálogo disponible por WhatsApp a este cliente"
                            >
                              <Send className="w-3 h-3" />
                              <span>Catálogo</span>
                            </button>

                            {/* Botón Gestionar Ubicación en Google Maps */}
                            <button
                              type="button"
                              onClick={() => setLocationModalClient(cliente)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                              title="Gestionar dirección y Pin GPS en Google Maps"
                            >
                              <MapPin className="w-3 h-3 text-sky-600" />
                              <span>Ubicación</span>
                            </button>

                            {googleUrl && (
                              <a
                                href={googleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 border border-trigo-200"
                                title="Abrir ubicación en Google Maps"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenClientModal(cliente)}
                              className="p-1.5 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 border border-trigo-200"
                              title="Editar datos del cliente"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Deseas eliminar a "${cliente.nombre}" de la cartera de clientes?`)) {
                                  deleteCliente(cliente.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-red-500 hover:bg-red-50"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 4. SUB-PESTAÑA 2: COMPARTIR CATÁLOGO DISPONIBLE A TODOS LOS CLIENTES */}
      {subTab === 'catalogo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Configurador y Vista Previa en Vivo del Catálogo (6 columnas) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-trigo-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-frambuesa-600" />
                <h2 className="text-sm font-serif font-bold text-chocolate-900">
                  Configurar Catálogo Disponible para Compartir
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCopyCatalogText}
                className="px-3 py-1.5 rounded-xl bg-chocolate-800 hover:bg-chocolate-900 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                {copiedCatalogText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCatalogText ? '¡Catálogo Copiado!' : 'Copiar Catálogo'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="block font-bold text-chocolate-800 mb-1.5 uppercase tracking-wider text-[10px]">
                  Plantillas Llamativas Rápidas (1 clic):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogIntro(
                        '✨ *¡Endulza tus momentos especiales con Delicias del Valle!* ❤️\n\nTe invitamos a entrar a nuestro nuevo *Catálogo Interactivo*, donde podrás ver las fotos de todos nuestros postres, elegir tus favoritos, personalizarlos totalmente a tu gusto (tamaño, masa, relleno, cobertura y dedicatoria) y confirmar tu pedido en segundos:'
                      );
                      setCatalogFooter(
                        '✔️ Contamos con *entrega a domicilio* y retiro en nuestro taller. ¡Toca el enlace y arma tu orden ideal hoy mismo! ❤️'
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-crema hover:bg-trigo-200 text-chocolate-900 border border-trigo-300 font-bold text-[11px] transition-colors"
                  >
                    ✨ Invitación General al Catálogo
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCatalogIntro(
                        '⭐ *¿Tienes un cumpleaños o celebración cerca?* ✨\n\nEn *Delicias del Valle* ya puedes diseñar tu pastel o postre soñado desde tu celular. Entra a nuestro *Catálogo Interactivo*, mira las fotos de nuestras especialidades y configura tu pedido a tu gusto:'
                      );
                      setCatalogFooter(
                        '✔️ Te lo llevamos directo a tu puerta o puedes retirarlo en nuestro taller. ¡Reserva tu fecha desde el enlace! ❤️'
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-crema hover:bg-trigo-200 text-chocolate-900 border border-trigo-300 font-bold text-[11px] transition-colors"
                  >
                    ⭐ Especial Cumpleaños & Eventos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCatalogIntro(
                        '✨ *¡Hoy horneamos delicias frescas para ti en Delicias del Valle!* ❤️\n\nDate un gusto hoy mismo: entra a nuestro *Catálogo Digital*, explora nuestras fotos, personaliza tus postres favoritos y confirma tu orden en línea:'
                      );
                      setCatalogFooter(
                        '✔️ Envíos rápidos a domicilio con ruta GPS. ¡Haz clic en el enlace y pide el tuyo antes de que se agoten! ✨'
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-crema hover:bg-trigo-200 text-chocolate-900 border border-trigo-300 font-bold text-[11px] transition-colors"
                  >
                    ❤️ Antojo de Fin de Semana
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                    Enlace Único que se Enviará al Cliente:
                  </span>
                  <span className="font-mono font-bold text-chocolate-900 text-xs truncate block">
                    {publicCatalogUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold text-[11px] shrink-0"
                >
                  Editar Fotos del Catálogo
                </button>
              </div>

              <div>
                <label htmlFor="catalog-intro-input" className="block font-semibold text-chocolate-700 mb-1">
                  Mensaje Llamativo de Invitación (Antes del Enlace)
                </label>
                <textarea
                  id="catalog-intro-input"
                  rows={3}
                  value={catalogIntro}
                  onChange={(e) => setCatalogIntro(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl p-2.5 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
              </div>

              <div>
                <label htmlFor="catalog-footer-input" className="block font-semibold text-chocolate-700 mb-1">
                  Cierre / Llamado a la Acción (Después del Enlace)
                </label>
                <textarea
                  id="catalog-footer-input"
                  rows={2}
                  value={catalogFooter}
                  onChange={(e) => setCatalogFooter(e.target.value)}
                  className="w-full border border-trigo-200 rounded-xl p-2.5 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
                />
              </div>

              <div>
                <span className="block font-bold text-chocolate-800 mb-1 uppercase tracking-wider text-[10px]">
                  Vista Previa del Catálogo que Recibirá el Cliente en WhatsApp:
                </span>
                <pre className="p-3.5 rounded-2xl bg-emerald-950 text-emerald-50 font-sans text-xs whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border border-emerald-800">
                  {buildCatalogMessage('Nombre del Cliente')}
                </pre>
              </div>
            </div>
          </div>

          {/* Lista de Difusión a Todos los Clientes (6 columnas) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-trigo-100 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-chocolate-900">
                  Envío de Catálogo a Toda la Cartera ({filteredClientes.length} clientes)
                </h3>
                <p className="text-[11px] text-chocolate-500">
                  Envía el catálogo personalizado con el nombre de cada cliente o copia todos los números para difusión
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyAllPhones}
                className="px-3 py-1.5 rounded-xl bg-crema hover:bg-trigo-200 text-chocolate-800 border border-trigo-300 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {copiedPhonesText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPhonesText ? '¡Números Copiados!' : 'Copiar Números'}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
              {filteredClientes.map((cliente) => {
                const isSent = sentClientIds.includes(cliente.id);
                const hasPhone = sanitizeDominicanPhone(cliente.telefono).length >= 10;

                return (
                  <div
                    key={cliente.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isSent
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-canvas border-trigo-200/80 hover:bg-crema/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-chocolate-900 truncate">
                          {cliente.nombre}
                        </span>
                        {isSent && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Enviado
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-chocolate-500 block">
                        {cliente.telefono} {cliente.direccion ? `• ${cliente.direccion}` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!hasPhone}
                      onClick={() => handleSendCatalogToClient(cliente)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 inline-flex items-center gap-1.5 transition-all ${
                        isSent
                          ? 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSent ? 'Reenviar Catálogo' : 'Enviar Catálogo'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-PESTAÑA 3: MAPA DE CLIENTES CON GOOGLE MAPS Y PLANIFICADOR DE ENTREGAS */}
      {subTab === 'mapa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Mapa de Google Maps (7 columnas) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-serif font-bold text-chocolate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-frambuesa-600" />
                  <span>Mapa General de Ubicaciones de Clientes (Google Maps)</span>
                </h2>
                <p className="text-[11px] text-chocolate-500">
                  Selecciona un cliente para ver su ubicación exacta o marca varios para trazar una ruta de reparto
                </p>
              </div>

              {multiStopRouteUrl && (
                <a
                  href={multiStopRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Iniciar Ruta ({selectedRouteClientIds.length} clientes) en Google Maps</span>
                </a>
              )}
            </div>

            {(() => {
              const activeClientForMap = selectedMapClient || filteredClientes[0] || null;
              const activeCoords = activeClientForMap
                ? extractCoordsFromCliente(activeClientForMap)
                : null;

              return (
                <>
                  <MapLocationPicker
                    latitude={activeCoords?.lat ?? DELICIAS_WORKSHOP_COORDS.lat}
                    longitude={activeCoords?.lng ?? DELICIAS_WORKSHOP_COORDS.lng}
                    address={activeClientForMap?.direccion || ''}
                    puntoReferencia={activeClientForMap?.punto_referencia || ''}
                    onChangeLocation={(loc) => {
                      if (!activeClientForMap) return;
                      const nextMapsUrl =
                        loc.mapsUrl ||
                        `https://www.google.com/maps?q=${loc.latitude.toFixed(
                          6
                        )},${loc.longitude.toFixed(6)}`;
                      const nextAddress = loc.address ?? activeClientForMap.direccion;
                      updateCliente(activeClientForMap.id, {
                        direccion: nextAddress,
                        maps_url: nextMapsUrl,
                      });
                      setSelectedMapClient({
                        ...activeClientForMap,
                        direccion: nextAddress,
                        maps_url: nextMapsUrl,
                      });
                    }}
                  />

                  {activeClientForMap && (
                    <div className="p-4 rounded-2xl bg-crema/70 border border-trigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-chocolate-900 text-sm block">
                          📍 Editando Pin en Vivo: {activeClientForMap.nombre}
                        </span>
                        <span className="text-chocolate-700 font-medium block mt-0.5">
                          {activeClientForMap.direccion || 'Arrastra el pin rojo en el mapa para fijar su dirección'}
                        </span>
                        {activeClientForMap.punto_referencia && (
                          <span className="text-[11px] text-chocolate-500 block">
                            Ref: {activeClientForMap.punto_referencia}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setLocationModalClient(activeClientForMap)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 font-bold"
                        >
                          Detalles / Referencia
                        </button>
                        <a
                          href={
                            activeClientForMap.maps_url ||
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              activeClientForMap.direccion || activeClientForMap.nombre
                            )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-chocolate-800 text-white font-bold inline-flex items-center gap-1"
                        >
                          <span>Navegar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Lista de Clientes para Ubicar en el Mapa o Armar Ruta de Entrega (5 columnas) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-trigo-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-trigo-100 pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-chocolate-900">
                  Direcciones de Clientes para Entregas
                </h3>
                <p className="text-[11px] text-chocolate-500">
                  Marca clientes para armar una ruta multi-parada en Google Maps
                </p>
              </div>
              {selectedRouteClientIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRouteClientIds([])}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Limpiar ruta ({selectedRouteClientIds.length})
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
              {filteredClientes.map((cliente) => {
                const coords = extractCoordsFromCliente(cliente);
                const isSelectedForRoute = selectedRouteClientIds.includes(cliente.id);
                const isFocused = selectedMapClient?.id === cliente.id;

                return (
                  <div
                    key={cliente.id}
                    className={`p-3 rounded-2xl border text-xs transition-all ${
                      isFocused
                        ? 'bg-sky-50/80 border-sky-300 shadow-2xs'
                        : 'bg-canvas border-trigo-200/80 hover:bg-crema/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelectedForRoute}
                          onChange={() => toggleSelectClientForRoute(cliente.id)}
                          className="mt-0.5 rounded text-frambuesa-600"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-chocolate-900 block truncate">
                            {cliente.nombre}
                          </span>
                          <span className="text-[11px] text-chocolate-600 block">
                            {cliente.direccion || 'Sin dirección registrada'}
                          </span>
                          {cliente.punto_referencia && (
                            <span className="text-[10px] text-chocolate-500 block">
                              Ref: {cliente.punto_referencia}
                            </span>
                          )}
                        </div>
                      </label>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedMapClient(cliente)}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-crema text-chocolate-700 border border-trigo-200 font-bold text-[10px]"
                        >
                          Ver en Mapa
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationModalClient(cliente)}
                          className="px-2 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[10px] inline-flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{coords ? 'Editar GPS' : 'Fijar GPS'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Cliente completo (con selector de mapa Google Maps integrado) */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title={editingClient ? `Editar Cliente: ${editingClient.nombre}` : 'Registrar Nuevo Cliente en Cartera'}
        subtitle="Guarda su contacto de WhatsApp y su ubicación exacta de Google Maps para futuras entregas y envío de catálogo."
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveClientForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="client-form-nombre" className="font-semibold text-chocolate-700 block mb-1">
                Nombre Completo del Cliente *
              </label>
              <input
                id="client-form-nombre"
                type="text"
                placeholder="Ej: María Fernanda Gómez"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400 font-semibold"
                required
              />
            </div>

            <div>
              <label htmlFor="client-form-telefono" className="font-semibold text-chocolate-700 block mb-1">
                WhatsApp / Teléfono *
              </label>
              <input
                id="client-form-telefono"
                type="tel"
                placeholder="Ej: 809-555-1234"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400 font-semibold"
                required
              />
            </div>

            <div>
              <label htmlFor="client-form-email" className="font-semibold text-chocolate-700 block mb-1">
                Correo Electrónico (Opcional)
              </label>
              <input
                id="client-form-email"
                type="email"
                placeholder="cliente@correo.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="client-form-zona" className="font-semibold text-chocolate-700 block mb-1">
                Zona de Delivery Habitual
              </label>
              <select
                id="client-form-zona"
                value={formZonaId}
                onChange={(e) => setFormZonaId(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              >
                <option value="">Seleccionar zona...</option>
                {zonasDelivery.map((z) => (
                  <option key={z.id} value={String(z.id)}>
                    {z.nombre} ({formatCurrency(z.tarifa)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="client-form-cumple" className="font-semibold text-chocolate-700 block mb-1">
                Cumpleaños / Fecha Especial
              </label>
              <input
                id="client-form-cumple"
                type="text"
                placeholder="Ej: 15 de Mayo / Hija: 10 Oct"
                value={formCumpleanos}
                onChange={(e) => setFormCumpleanos(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              />
            </div>

            <div>
              <label htmlFor="client-form-notas" className="font-semibold text-chocolate-700 block mb-1">
                Preferencias / Sabores Favoritos
              </label>
              <input
                id="client-form-notas"
                type="text"
                placeholder="Ej: Prefiere Tres Leches bajo en azúcar"
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
                className="w-full border border-trigo-200 rounded-xl px-3 py-2 bg-canvas focus:ring-2 focus:ring-frambuesa-400"
              />
            </div>
          </div>

          {/* Bloque de Dirección y Ubicación en Google Maps */}
          <div className="p-4 rounded-2xl bg-crema/50 border border-trigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-chocolate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-frambuesa-600" />
                <span>Ubicación de Entrega y Pin de Google Maps</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="client-form-direccion" className="font-semibold text-chocolate-700 block mb-1">
                  Dirección Exacta de Entrega
                </label>
                <input
                  id="client-form-direccion"
                  type="text"
                  placeholder="Calle, número, edificio, apartamento, sector..."
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-frambuesa-400"
                />
              </div>

              <div>
                <label htmlFor="client-form-referencia" className="font-semibold text-chocolate-700 block mb-1">
                  Punto de Referencia para el Repartidor
                </label>
                <input
                  id="client-form-referencia"
                  type="text"
                  placeholder="Ej: Frente al parque, portón blanco, timbre 3B..."
                  value={formPuntoRef}
                  onChange={(e) => setFormPuntoRef(e.target.value)}
                  className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-frambuesa-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="client-form-maps-url" className="font-semibold text-chocolate-700 block mb-1">
                Enlace de Google Maps / Coordenadas GPS
              </label>
              <input
                id="client-form-maps-url"
                type="text"
                placeholder="https://www.google.com/maps?q=18.486,-69.931"
                value={formMapsUrl}
                onChange={(e) => setFormMapsUrl(e.target.value)}
                className="w-full border border-trigo-300 rounded-xl px-3 py-2 bg-white font-mono text-xs"
              />
            </div>

            <MapLocationPicker
              latitude={
                (() => {
                  const m = formMapsUrl.match(/(?:query|q|@)=(-?\d+\.\d+),(-?\d+\.\d+)/);
                  return m ? parseFloat(m[1]) : undefined;
                })()
              }
              longitude={
                (() => {
                  const m = formMapsUrl.match(/(?:query|q|@)=(-?\d+\.\d+),(-?\d+\.\d+)/);
                  return m ? parseFloat(m[2]) : undefined;
                })()
              }
              address={formDireccion}
              puntoReferencia={formPuntoRef}
              onChangeLocation={(loc) => {
                if (loc.address) setFormDireccion(loc.address);
                if (loc.mapsUrl) setFormMapsUrl(loc.mapsUrl);
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsClientModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-canvas hover:bg-crema text-chocolate-700 font-bold border border-trigo-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-frambuesa-600 hover:bg-frambuesa-700 text-white font-bold shadow-sm"
            >
              Guardar Cliente y Ubicación
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Rápido de Ubicación Google Maps para un Cliente */}
      {locationModalClient && (
        <LocationGoogleMapsModal
          isOpen={Boolean(locationModalClient)}
          onClose={() => setLocationModalClient(null)}
          direccion={locationModalClient.direccion || ''}
          puntoReferencia={locationModalClient.punto_referencia || ''}
          mapsUrl={locationModalClient.maps_url || ''}
          clienteNombre={locationModalClient.nombre}
          zonaNombre={
            zonasDelivery.find((z) => z.id === locationModalClient.zona_delivery_id)?.nombre
          }
          onSave={(data) => {
            updateCliente(locationModalClient.id, {
              direccion: data.direccion,
              punto_referencia: data.punto_referencia,
              maps_url: data.mapsUrl,
            });
            setLocationModalClient(null);
          }}
        />
      )}
    </div>
  );
};
export default ClientPortfolioManager;
