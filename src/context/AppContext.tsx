import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Insumo,
  Receta,
  Cotizacion,
  Pedido,
  Merma,
  Usuario,
  EstadoPedido,
  EstadoCotizacion,
  PagoRegistro,
  KitchenTimerState,
} from '../types';
import {
  INITIAL_INSUMOS,
  INITIAL_RECETAS,
  INITIAL_COTIZACIONES,
  INITIAL_PEDIDOS,
  INITIAL_MERMAS,
  INITIAL_USUARIOS,
} from '../utils/initialData';
import { calcularCostoUnitarioBase } from '../utils/calculations';
import { playSuccessChime } from '../utils/kitchenAudio';
import confetti from 'canvas-confetti';
import {
  isSupabaseConfigured,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  getSavedCredentials,
} from '../utils/supabaseClient';
import {
  testSupabaseConnection,
  fetchAllFromSupabase,
  syncInsumoToSupabase,
  syncRecetaToSupabase,
  syncPedidoToSupabase,
} from '../services/supabaseService';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'recipes'
  | 'quotes'
  | 'orders'
  | 'kitchen'
  | 'database'
  | 'users';

interface ToastInfo {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Autenticación & Sesión
  currentUser: Usuario | null;
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  // Gestión de Usuarios (Exclusivo Admin)
  usuarios: Usuario[];
  addUsuario: (usuario: Omit<Usuario, 'id' | 'created_at'>) => Usuario;
  updateUsuario: (id: number, usuario: Partial<Usuario>) => void;
  deleteUsuario: (id: number) => { success: boolean; message?: string };
  toggleUsuarioEstado: (id: number) => void;
  resetPasswordUsuario: (id: number, newPassword: string) => void;
  // Insumos
  insumos: Insumo[];
  insumosMap: Map<number, Insumo>;
  addInsumo: (insumo: Omit<Insumo, 'id' | 'costo_unitario_base' | 'factor_conversion'>) => Insumo;
  updateInsumo: (id: number, insumo: Partial<Insumo>) => void;
  deleteInsumo: (id: number) => void;
  reabastecerInsumo: (id: number, cantidadComprada: number, nuevoPrecio?: number) => void;
  reabastecerTodoElStock: () => void;
  // Mermas
  mermas: Merma[];
  addMerma: (merma: Omit<Merma, 'id' | 'costo_perdido'>) => void;
  // Recetas
  recetas: Receta[];
  addReceta: (receta: Omit<Receta, 'id'>) => Receta;
  updateReceta: (id: number, receta: Partial<Receta>) => void;
  deleteReceta: (id: number) => void;
  duplicarReceta: (id: number) => void;
  // Cotizaciones
  cotizaciones: Cotizacion[];
  addCotizacion: (cotizacion: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>) => Cotizacion;
  updateCotizacion: (id: number, cotizacion: Partial<Cotizacion>) => void;
  deleteCotizacion: (id: number) => void;
  cambiarEstadoCotizacion: (id: number, estado: EstadoCotizacion) => void;
  convertirCotizacionAPedido: (cotizacionId: number, anticipo: number, fechaEntrega: string, horaEntrega: string, tipoEntrega: 'recogida_local' | 'domicilio', direccion?: string) => Pedido;
  // Pedidos
  pedidos: PedidosContextActions;
  // Modo Cocina
  timers: KitchenTimerState[];
  addTimer: (title: string, seconds: number, orderNumber?: string) => void;
  removeTimer: (id: string) => void;
  toggleTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  toggleKitchenChecklist: (pedidoId: number, checklistKey: string) => void;
  // Toasts
  toasts: ToastInfo[];
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  // Utilidades de Datos & Supabase Sync
  resetAllData: () => void;
  exportDatabaseJSON: () => void;
  isSupabaseOnline: boolean;
  isSyncing: boolean;
  savedCredentials: { url: string; anonKey: string };
  syncFromSupabase: (silent?: boolean) => Promise<boolean>;
  configureSupabase: (url: string, key: string) => Promise<boolean>;
  disconnectSupabase: () => void;
}

interface PedidosContextActions {
  list: Pedido[];
  addPedidoDirecto: (pedido: Omit<Pedido, 'id' | 'numero_factura' | 'saldo_pendiente' | 'created_at'>) => Pedido;
  updatePedido: (id: number, pedido: Partial<Pedido>) => void;
  cambiarEstadoPedido: (id: number, nuevoEstado: EstadoPedido) => void;
  registrarPago: (pedidoId: number, monto: number, metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'sinpe_zelle', referencia: string, tipoPago: 'anticipo_50' | 'saldo_50' | 'pago_completo' | 'abono') => void;
  descontarInventarioPorPedido: (pedido: Pedido) => boolean;
  verificarStockParaPedido: (pedido: Pedido) => { tieneSuficiente: boolean; faltantes: { insumoNombre: string; requerido: number; disponible: number; unidad: string }[] };
}

const STORAGE_KEY = 'delicias_del_valle_abastecido_v9';

// Limpieza proactiva de versiones anteriores con datos ficticios o stock en 0
try {
  const oldPrefixes = [
    'delicias_del_valle_store_v1',
    'delicias_del_valle_store_v2',
    'delicias_del_valle_dop_v3',
    'delicias_del_valle_clean_v4',
    'delicias_del_valle_clean_v6',
    'delicias_del_valle_fullstock_v7',
    'delicias_del_valle_v1',
  ];
  oldPrefixes.forEach((prefix) => {
    ['insumos', 'recetas', 'cotizaciones', 'pedidos', 'mermas', 'usuarios', 'session_user'].forEach((suffix) => {
      localStorage.removeItem(`${prefix}_${suffix}`);
    });
  });
} catch {}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Estados de autenticación & Usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_usuarios`);
    return saved ? JSON.parse(saved) : INITIAL_USUARIOS;
  });

  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    // Siempre iniciar en la pantalla de Login primero
    return null;
  });

  // Estados de datos operacionales
  const [insumos, setInsumos] = useState<Insumo[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_insumos`);
    if (saved) {
      try {
        const parsed: Insumo[] = JSON.parse(saved);
        const totalStock = parsed.reduce((acc, i) => acc + (i.stock_actual || 0), 0);
        if (totalStock > 1000 && parsed.length >= 90) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_INSUMOS;
  });

  const [mermas, setMermas] = useState<Merma[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_mermas`);
    return saved ? JSON.parse(saved) : [];
  });

  const [recetas, setRecetas] = useState<Receta[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_recetas`);
    return saved ? JSON.parse(saved) : INITIAL_RECETAS;
  });

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cotizaciones`);
    if (saved) {
      try {
        const parsed: Cotizacion[] = JSON.parse(saved);
        // Filtrar datos ficticios antiguos
        const clean = parsed.filter(c => !c.codigo.includes('COT-2026-001') && !c.codigo.includes('COT-2026-002'));
        return clean;
      } catch {}
    }
    return [];
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pedidos`);
    if (saved) {
      try {
        const parsed: Pedido[] = JSON.parse(saved);
        // Filtrar datos ficticios antiguos
        const clean = parsed.filter(p => !p.numero_factura.includes('FAC-2026-001') && !p.numero_factura.includes('FAC-2026-002'));
        return clean;
      } catch {}
    }
    return [];
  });

  const [timers, setTimers] = useState<KitchenTimerState[]>([
    {
      id: 'timer-default-1',
      title: 'Horneado de Bizcochos (175°C)',
      initialSeconds: 45 * 60,
      remainingSeconds: 45 * 60,
      isRunning: false,
      isFinished: false,
    },
    {
      id: 'timer-default-2',
      title: 'Enfriado y Reposo de Masas',
      initialSeconds: 20 * 60,
      remainingSeconds: 20 * 60,
      isRunning: false,
      isFinished: false,
    },
  ]);


  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [savedCredentials, setSavedCredentialsState] = useState<{ url: string; anonKey: string }>(getSavedCredentials);

  const showToast = useCallback((type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ==========================================
  // AUTENTICACIÓN (LOGIN / LOGOUT)
  // ==========================================
  const login = useCallback(
    (usernameInput: string, passwordInput: string): { success: boolean; message: string } => {
      const user = usuarios.find(
        u => u.username.trim().toLowerCase() === usernameInput.trim().toLowerCase()
      );

      if (!user) {
        return { success: false, message: 'Usuario no encontrado en el sistema.' };
      }

      if (!user.activo) {
        return { success: false, message: 'Este usuario está inactivo. Contacta al Administrador.' };
      }

      if (user.password !== passwordInput.trim()) {
        return { success: false, message: 'Contraseña incorrecta.' };
      }

      const updatedUser: Usuario = {
        ...user,
        ultimo_acceso: new Date().toISOString(),
      };

      setCurrentUser(updatedUser);
      setUsuarios(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));
      localStorage.setItem(`${STORAGE_KEY}_session_user`, JSON.stringify(updatedUser));

      showToast('success', `¡Bienvenido, ${user.nombre_completo}!`, `Sesión iniciada como ${user.rol.toUpperCase()}.`);
      playSuccessChime();

      return { success: true, message: 'Autenticación exitosa.' };
    },
    [usuarios, showToast]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY}_session_user`);
    setActiveTab('dashboard');
    showToast('info', 'Sesión Cerrada', 'Has salido del sistema de Delicias del Valle.');
  }, [showToast]);

  // ==========================================
  // GESTIÓN DE USUARIOS (CRUD)
  // ==========================================
  const addUsuario = useCallback((data: Omit<Usuario, 'id' | 'created_at'>): Usuario => {
    const nextId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
    const newUsuario: Usuario = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
    };
    setUsuarios(prev => [newUsuario, ...prev]);
    showToast('success', 'Usuario Creado', `Usuario "${newUsuario.username}" registrado exitosamente.`);
    return newUsuario;
  }, [usuarios, showToast]);

  const updateUsuario = useCallback((id: number, data: Partial<Usuario>) => {
    setUsuarios(prev =>
      prev.map(u => {
        if (u.id !== id) return u;
        const updated = { ...u, ...data };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
          localStorage.setItem(`${STORAGE_KEY}_session_user`, JSON.stringify(updated));
        }
        return updated;
      })
    );
    showToast('info', 'Usuario Actualizado', 'Los datos del usuario fueron guardados.');
  }, [currentUser, showToast]);

  const deleteUsuario = useCallback((id: number): { success: boolean; message?: string } => {
    const user = usuarios.find(u => u.id === id);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };

    if (user.username === 'Steven9909' || id === 1) {
      showToast('error', 'Acción Denegada', 'No es posible eliminar al Administrador Maestro del sistema.');
      return { success: false, message: 'No puedes eliminar al Administrador Maestro.' };
    }

    if (currentUser?.id === id) {
      showToast('error', 'Acción Denegada', 'No puedes eliminar tu propia sesión activa.');
      return { success: false, message: 'No puedes eliminar tu propia cuenta mientras estés conectado.' };
    }

    setUsuarios(prev => prev.filter(u => u.id !== id));
    showToast('warning', 'Usuario Eliminado', `"${user.nombre_completo}" fue eliminado del sistema.`);
    return { success: true };
  }, [usuarios, currentUser, showToast]);

  const toggleUsuarioEstado = useCallback((id: number) => {
    const user = usuarios.find(u => u.id === id);
    if (!user) return;

    if (user.username === 'Steven9909' || id === 1) {
      showToast('error', 'Acción Denegada', 'No puedes desactivar la cuenta del Administrador Maestro.');
      return;
    }

    const nuevoEstado = !user.activo;
    updateUsuario(id, { activo: nuevoEstado });
    showToast('info', 'Estado Modificado', `Usuario "${user.username}" ahora está ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}.`);
  }, [usuarios, updateUsuario, showToast]);

  const resetPasswordUsuario = useCallback((id: number, newPassword: string) => {
    updateUsuario(id, { password: newPassword.trim() });
    showToast('success', 'Contraseña Actualizada', 'La nueva contraseña fue establecida con éxito.');
  }, [updateUsuario, showToast]);

  // Sincronizar cambios en usuarios en localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_usuarios`, JSON.stringify(usuarios));
  }, [usuarios]);

  // Sincronización Supabase
  const syncFromSupabase = useCallback(async (silent = false): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      if (!silent) {
        showToast('warning', 'Supabase No Configurado', 'Ingresa la URL y Anon Key en la pestaña Base SQL.');
      }
      return false;
    }

    setIsSyncing(true);
    try {
      const res = await fetchAllFromSupabase();
      if (res.success && res.data) {
        if (res.data.insumos.length > 0) setInsumos(res.data.insumos);
        if (res.data.recetas.length > 0) setRecetas(res.data.recetas);
        if (res.data.cotizaciones.length > 0) setCotizaciones(res.data.cotizaciones);
        if (res.data.pedidos.length > 0) setPedidos(res.data.pedidos);
        if (res.data.mermas.length > 0) setMermas(res.data.mermas);

        setIsSupabaseOnline(true);
        if (!silent) {
          showToast(
            'success',
            'Sincronización Completada',
            `Se sincronizaron ${res.data.insumos.length} insumos y ${res.data.recetas.length} recetas desde Supabase.`
          );
        }
        return true;
      } else {
        setIsSupabaseOnline(false);
        if (!silent) {
          showToast('error', 'Error de Sincronización', res.error || 'No se pudo leer la base de datos de Supabase.');
        }
        return false;
      }
    } catch (err: any) {
      setIsSupabaseOnline(false);
      if (!silent) {
        showToast('error', 'Error de Conexión', err.message || 'Fallo de red al contactar Supabase.');
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const configureSupabase = useCallback(async (url: string, key: string): Promise<boolean> => {
    setIsSyncing(true);
    const configured = setSupabaseCredentials(url, key);
    if (!configured) {
      setIsSyncing(false);
      showToast('error', 'Error', 'URL o clave de Supabase inválida.');
      return false;
    }

    setSavedCredentialsState({ url, anonKey: key });
    const test = await testSupabaseConnection();
    if (test.connected) {
      setIsSupabaseOnline(true);
      showToast('success', 'Conexión Exitosa con Supabase', test.message);
      await syncFromSupabase(true);
      setIsSyncing(false);
      return true;
    } else {
      setIsSupabaseOnline(false);
      setIsSyncing(false);
      showToast('error', 'Conexión Fallida', test.message);
      return false;
    }
  }, [showToast, syncFromSupabase]);

  const disconnectSupabase = useCallback(() => {
    clearSupabaseCredentials();
    setSavedCredentialsState({ url: '', anonKey: '' });
    setIsSupabaseOnline(false);
    showToast('info', 'Desconectado', 'Se ha vuelto al modo de almacenamiento local.');
  }, [showToast]);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then(res => {
        setIsSupabaseOnline(res.connected);
        if (res.connected) {
          syncFromSupabase(true);
        }
      });
    }
  }, [syncFromSupabase]);

  // Guardar en localStorage como respaldo local offline
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_insumos`, JSON.stringify(insumos));
  }, [insumos]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_mermas`, JSON.stringify(mermas));
  }, [mermas]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_recetas`, JSON.stringify(recetas));
  }, [recetas]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cotizaciones`, JSON.stringify(cotizaciones));
  }, [cotizaciones]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pedidos`, JSON.stringify(pedidos));
  }, [pedidos]);

  const insumosMap = useMemo(() => {
    const map = new Map<number, Insumo>();
    insumos.forEach((insumo) => {
      map.set(insumo.id, insumo);
    });
    return map;
  }, [insumos]);

  // ==========================================
  // INSUMOS CRUD
  // ==========================================
  const addInsumo = (data: Omit<Insumo, 'id' | 'costo_unitario_base' | 'factor_conversion'>): Insumo => {
    const nextId = insumos.length > 0 ? Math.max(...insumos.map((i) => i.id)) + 1 : 1;
    const factor_conversion = data.presentacion_empaque;
    const costo_unitario_base = calcularCostoUnitarioBase(data.precio_compra, data.presentacion_empaque);

    const newInsumo: Insumo = {
      ...data,
      id: nextId,
      factor_conversion,
      costo_unitario_base,
    };

    setInsumos((prev) => [newInsumo, ...prev]);
    showToast('success', 'Insumo Creado', `Se agregó "${newInsumo.nombre}" al inventario.`);

    if (isSupabaseConfigured()) {
      syncInsumoToSupabase(newInsumo);
    }

    return newInsumo;
  };

  const updateInsumo = (id: number, data: Partial<Insumo>) => {
    setInsumos((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...data };
        if (data.precio_compra !== undefined || data.presentacion_empaque !== undefined) {
          const precio = data.precio_compra !== undefined ? data.precio_compra : i.precio_compra;
          const pres = data.presentacion_empaque !== undefined ? data.presentacion_empaque : i.presentacion_empaque;
          updated.costo_unitario_base = calcularCostoUnitarioBase(precio, pres);
          updated.factor_conversion = pres;
        }
        if (isSupabaseConfigured()) {
          syncInsumoToSupabase(updated);
        }
        return updated;
      })
    );
    showToast('info', 'Insumo Actualizado', 'Los cambios y costos han sido guardados.');
  };

  const deleteInsumo = (id: number) => {
    const insumo = insumos.find((i) => i.id === id);
    if (!insumo) return;

    const recetasQueLoUsan = recetas.filter((r) => r.ingredientes.some((ing) => ing.insumo_id === id));
    if (recetasQueLoUsan.length > 0) {
      showToast('error', 'No se puede eliminar', `El insumo está en uso en ${recetasQueLoUsan.length} receta(s).`);
      return;
    }

    setInsumos((prev) => prev.filter((i) => i.id !== id));
    showToast('warning', 'Insumo Eliminado', `"${insumo.nombre}" fue retirado del inventario.`);
  };

  const reabastecerInsumo = (id: number, cantidadComprada: number, nuevoPrecio?: number) => {
    setInsumos((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nuevoStock = i.stock_actual + cantidadComprada;
        const precioActualizado = nuevoPrecio !== undefined && nuevoPrecio > 0 ? nuevoPrecio : i.precio_compra;
        const updated = {
          ...i,
          stock_actual: nuevoStock,
          precio_compra: precioActualizado,
          costo_unitario_base: calcularCostoUnitarioBase(precioActualizado, i.presentacion_empaque),
        };
        if (isSupabaseConfigured()) {
          syncInsumoToSupabase(updated);
        }
        return updated;
      })
    );
    showToast('success', 'Inventario Reabastecido', `Se ingresaron ${cantidadComprada} al stock.`);
  };

  const reabastecerTodoElStock = () => {
    setInsumos(INITIAL_INSUMOS);
    localStorage.setItem(`${STORAGE_KEY}_insumos`, JSON.stringify(INITIAL_INSUMOS));
    showToast('success', 'Inventario 100% Abastecido', 'Se cargó el stock completo para los 93 insumos.');
  };

  // ==========================================
  // MERMAS
  // ==========================================
  const addMerma = (data: Omit<Merma, 'id' | 'costo_perdido'>) => {
    const insumo = insumosMap.get(data.insumo_id);
    const costoUnit = insumo ? insumo.costo_unitario_base : 0;
    const costo_perdido = data.cantidad * costoUnit;

    const nextId = mermas.length > 0 ? Math.max(...mermas.map((m) => m.id)) + 1 : 1;
    const newMerma: Merma = {
      ...data,
      id: nextId,
      costo_perdido,
    };

    setMermas((prev) => [newMerma, ...prev]);

    if (insumo) {
      updateInsumo(insumo.id, {
        stock_actual: Math.max(0, insumo.stock_actual - data.cantidad),
      });
    }

    showToast('warning', 'Merma Registrada', `Se descontaron ${data.cantidad} ${data.unidad_base} de "${data.insumo_nombre}".`);
  };

  // ==========================================
  // RECETAS CRUD
  // ==========================================
  const addReceta = (data: Omit<Receta, 'id'>): Receta => {
    const nextId = recetas.length > 0 ? Math.max(...recetas.map((r) => r.id)) + 1 : 1;
    const newReceta: Receta = {
      ...data,
      id: nextId,
    };

    setRecetas((prev) => [newReceta, ...prev]);
    showToast('success', 'Receta Creada', `"${newReceta.nombre}" guardada en el catálogo maestro.`);

    if (isSupabaseConfigured()) {
      syncRecetaToSupabase(newReceta);
    }

    return newReceta;
  };

  const updateReceta = (id: number, data: Partial<Receta>) => {
    setRecetas((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...data };
        if (isSupabaseConfigured()) {
          syncRecetaToSupabase(updated);
        }
        return updated;
      })
    );
    showToast('info', 'Receta Actualizada', 'Los cambios en la receta y sus ingredientes se guardaron.');
  };

  const deleteReceta = (id: number) => {
    const receta = recetas.find((r) => r.id === id);
    if (!receta) return;

    setRecetas((prev) => prev.filter((r) => r.id !== id));
    showToast('warning', 'Receta Eliminada', `"${receta.nombre}" fue eliminada.`);
  };

  const duplicarReceta = (id: number) => {
    const original = recetas.find((r) => r.id === id);
    if (!original) return;

    const nextId = recetas.length > 0 ? Math.max(...recetas.map((r) => r.id)) + 1 : 1;
    const clon: Receta = {
      ...original,
      id: nextId,
      nombre: `${original.nombre} (Copia)`,
      ingredientes: original.ingredientes.map((i) => ({ ...i })),
    };

    setRecetas((prev) => [clon, ...prev]);
    showToast('success', 'Receta Duplicada', `Se creó una copia de "${original.nombre}".`);

    if (isSupabaseConfigured()) {
      syncRecetaToSupabase(clon);
    }
  };

  // ==========================================
  // COTIZACIONES
  // ==========================================
  const addCotizacion = (data: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>): Cotizacion => {
    const nextId = cotizaciones.length > 0 ? Math.max(...cotizaciones.map((c) => c.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const codigo = `COT-${year}-${String(nextId).padStart(3, '0')}`;

    const newCotizacion: Cotizacion = {
      ...data,
      id: nextId,
      codigo,
      created_at: new Date().toISOString(),
    };

    setCotizaciones((prev) => [newCotizacion, ...prev]);
    showToast('success', 'Cotización Guardada', `Cotización ${codigo} creada para ${newCotizacion.cliente_nombre}.`);
    return newCotizacion;
  };

  const updateCotizacion = (id: number, data: Partial<Cotizacion>) => {
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    showToast('info', 'Cotización Actualizada', 'Cambios guardados exitosamente.');
  };

  const deleteCotizacion = (id: number) => {
    setCotizaciones((prev) => prev.filter((c) => c.id !== id));
    showToast('warning', 'Cotización Eliminada', 'La cotización fue eliminada del sistema.');
  };

  const cambiarEstadoCotizacion = (id: number, estado: EstadoCotizacion) => {
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado } : c))
    );
    showToast('info', 'Estado Actualizado', `Cotización marcada como "${estado}".`);
  };

  // ==========================================
  // PEDIDOS & FACTURACIÓN & DEDUCCIÓN DE INVENTARIO
  // ==========================================
  const verificarStockParaPedido = useCallback(
    (pedido: Pedido) => {
      const faltantes: { insumoNombre: string; requerido: number; disponible: number; unidad: string }[] = [];
      const mapaRequeridos = new Map<number, number>();

      pedido.items.forEach((item) => {
        if (!item.receta_id) return;
        const receta = recetas.find((r) => r.id === item.receta_id);
        if (!receta) return;

        const factor = (item.factor_receta || 1) * item.cantidad;
        receta.ingredientes.forEach((ing) => {
          const acumulado = mapaRequeridos.get(ing.insumo_id) || 0;
          mapaRequeridos.set(ing.insumo_id, acumulado + ing.cantidad * factor);
        });
      });

      mapaRequeridos.forEach((requerido, insumoId) => {
        const insumo = insumosMap.get(insumoId);
        if (insumo && insumo.stock_actual < requerido) {
          faltantes.push({
            insumoNombre: insumo.nombre,
            requerido,
            disponible: insumo.stock_actual,
            unidad: insumo.unidad_base,
          });
        }
      });

      return {
        tieneSuficiente: faltantes.length === 0,
        faltantes,
      };
    },
    [recetas, insumosMap]
  );

  const descontarInventarioPorPedido = useCallback(
    (pedido: Pedido): boolean => {
      if (pedido.inventario_descontado) return false;

      const deducciones = new Map<number, number>();

      pedido.items.forEach((item) => {
        if (!item.receta_id) return;
        const receta = recetas.find((r) => r.id === item.receta_id);
        if (!receta) return;

        const factor = (item.factor_receta || 1) * item.cantidad;
        receta.ingredientes.forEach((ing) => {
          const acum = deducciones.get(ing.insumo_id) || 0;
          deducciones.set(ing.insumo_id, acum + ing.cantidad * factor);
        });
      });

      if (deducciones.size === 0) return false;

      setInsumos((prev) =>
        prev.map((insumo) => {
          const aDescontar = deducciones.get(insumo.id);
          if (aDescontar !== undefined) {
            const updated = {
              ...insumo,
              stock_actual: Math.max(0, insumo.stock_actual - aDescontar),
            };
            if (isSupabaseConfigured()) {
              syncInsumoToSupabase(updated);
            }
            return updated;
          }
          return insumo;
        })
      );

      return true;
    },
    [recetas]
  );

  const addPedidoDirecto = (
    data: Omit<Pedido, 'id' | 'numero_factura' | 'saldo_pendiente' | 'created_at'>
  ): Pedido => {
    const nextId = pedidos.length > 0 ? Math.max(...pedidos.map((p) => p.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const numero_factura = `FAC-${year}-${String(nextId).padStart(3, '0')}`;
    const saldo_pendiente = Math.max(0, data.total - data.anticipo_pagado);

    const newPedido: Pedido = {
      ...data,
      id: nextId,
      numero_factura,
      saldo_pendiente,
      inventario_descontado: false,
      created_at: new Date().toISOString(),
    };

    if (newPedido.estado !== 'cancelado') {
      descontarInventarioPorPedido(newPedido);
      newPedido.inventario_descontado = true;
    }

    setPedidos((prev) => [newPedido, ...prev]);
    showToast(
      'success',
      '¡Pedido Confirmado y Agendado!',
      `Factura ${numero_factura} para ${newPedido.cliente_nombre}. Stock descontado.`
    );
    playSuccessChime();

    if (isSupabaseConfigured()) {
      syncPedidoToSupabase(newPedido);
    }

    return newPedido;
  };

  const convertirCotizacionAPedido = (
    cotizacionId: number,
    anticipo: number,
    fechaEntrega: string,
    horaEntrega: string,
    tipoEntrega: 'recogida_local' | 'domicilio',
    direccion?: string
  ): Pedido => {
    const cot = cotizaciones.find((c) => c.id === cotizacionId);
    if (!cot) throw new Error('Cotización no encontrada');

    const nextId = pedidos.length > 0 ? Math.max(...pedidos.map((p) => p.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const numero_factura = `FAC-${year}-${String(nextId).padStart(3, '0')}`;
    const saldo_pendiente = Math.max(0, cot.total - anticipo);

    const pedidoItems = cot.items.map((item) => ({
      id: `item-ped-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      receta_id: item.receta_id,
      receta_nombre: item.receta_nombre,
      tamano_porciones: item.tamano_porciones,
      masa_base: item.masa_base,
      relleno: item.relleno,
      decoracion: item.decoracion,
      dedicatoria: item.dedicatoria,
      extras_texto: item.extras?.map((e) => `${e.nombre}`).join(', ') || '',
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal,
      factor_receta: item.factor_receta,
    }));

    const nuevoPedido: Pedido = {
      id: nextId,
      cotizacion_id: cot.id,
      numero_factura,
      cliente_nombre: cot.cliente_nombre,
      cliente_telefono: cot.cliente_telefono,
      cliente_email: cot.cliente_email,
      fecha_pedido: new Date().toISOString().split('T')[0],
      fecha_entrega: fechaEntrega,
      hora_entrega: horaEntrega,
      tipo_entrega: tipoEntrega,
      direccion_entrega: direccion,
      items: pedidoItems,
      subtotal: cot.subtotal,
      costo_envio: cot.costo_envio,
      total: cot.total,
      anticipo_pagado: anticipo,
      saldo_pendiente,
      estado: 'confirmado',
      inventario_descontado: false,
      created_at: new Date().toISOString(),
      pagos: [
        {
          id: `pago-${Date.now()}`,
          pedido_id: nextId,
          fecha: new Date().toISOString(),
          monto: anticipo,
          metodo: 'transferencia',
          referencia: `Anticipo 50% de ${cot.codigo}`,
          tipo_pago: 'anticipo_50',
        },
      ],
    };

    descontarInventarioPorPedido(nuevoPedido);
    nuevoPedido.inventario_descontado = true;

    setPedidos((prev) => [nuevoPedido, ...prev]);
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === cotizacionId ? { ...c, estado: 'convertida' } : c))
    );

    showToast(
      'success',
      '¡Cotización Convertida a Pedido!',
      `Se generó la factura ${numero_factura} con 50% de anticipo y se descontó la materia prima del stock.`
    );
    playSuccessChime();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

    if (isSupabaseConfigured()) {
      syncPedidoToSupabase(nuevoPedido);
    }

    return nuevoPedido;
  };

  const updatePedido = (id: number, data: Partial<Pedido>) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        if (isSupabaseConfigured()) {
          syncPedidoToSupabase(updated);
        }
        return updated;
      })
    );
    showToast('info', 'Pedido Actualizado', 'Los cambios en la orden fueron registrados.');
  };

  const cambiarEstadoPedido = (id: number, nuevoEstado: EstadoPedido) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    if (
      (nuevoEstado === 'confirmado' || nuevoEstado === 'en_produccion') &&
      !pedido.inventario_descontado
    ) {
      descontarInventarioPorPedido(pedido);
      pedido.inventario_descontado = true;
    }

    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, estado: nuevoEstado, inventario_descontado: pedido.inventario_descontado };
        if (isSupabaseConfigured()) {
          syncPedidoToSupabase(updated);
        }
        return updated;
      })
    );

    if (nuevoEstado === 'listo' || nuevoEstado === 'entregado') {
      playSuccessChime();
      confetti({ particleCount: 50, spread: 40, origin: { y: 0.7 } });
    }

    showToast('info', 'Estado Actualizado', `Pedido ${pedido.numero_factura} ahora está en "${nuevoEstado}".`);
  };

  const registrarPago = (
    pedidoId: number,
    monto: number,
    metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'sinpe_zelle',
    referencia: string,
    tipoPago: 'anticipo_50' | 'saldo_50' | 'pago_completo' | 'abono'
  ) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    const nuevoPago: PagoRegistro = {
      id: `pago-${Date.now()}`,
      pedido_id: pedidoId,
      fecha: new Date().toISOString(),
      monto,
      metodo,
      referencia,
      tipo_pago: tipoPago,
    };

    const nuevoAnticipo = pedido.anticipo_pagado + monto;
    const nuevoSaldo = Math.max(0, pedido.total - nuevoAnticipo);

    const updatedPedido: Pedido = {
      ...pedido,
      anticipo_pagado: nuevoAnticipo,
      saldo_pendiente: nuevoSaldo,
      pagos: [...(pedido.pagos || []), nuevoPago],
    };

    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? updatedPedido : p)));
    showToast('success', 'Pago Registrado', `Se ingresó el pago de RD$ ${monto.toFixed(2)}. Saldo restante: RD$ ${nuevoSaldo.toFixed(2)}.`);
    playSuccessChime();

    if (isSupabaseConfigured()) {
      syncPedidoToSupabase(updatedPedido);
    }
  };

  // ==========================================
  // MODO COCINA & TEMPORIZADORES
  // ==========================================
  const addTimer = (title: string, seconds: number, orderNumber?: string) => {
    const newTimer: KitchenTimerState = {
      id: `timer-${Date.now()}`,
      title,
      initialSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true,
      isFinished: false,
      orderNumber,
    };
    setTimers((prev) => [newTimer, ...prev]);
    showToast('info', 'Temporizador Iniciado', `Iniciado cronómetro para "${title}".`);
  };

  const removeTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const resetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, remainingSeconds: t.initialSeconds, isRunning: false, isFinished: false } : t
      )
    );
  };

  const toggleKitchenChecklist = (pedidoId: number, checklistKey: string) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;
        const current = p.checklist_completado || {};
        const updated = {
          ...p,
          checklist_completado: {
            ...current,
            [checklistKey]: !current[checklistKey],
          },
        };
        if (isSupabaseConfigured()) {
          syncPedidoToSupabase(updated);
        }
        return updated;
      })
    );
  };

  // ==========================================
  // RESET Y EXPORTACIÓN
  // ==========================================
  const resetAllData = () => {
    if (window.confirm('¿Seguro que deseas restaurar la base de datos a los valores iniciales artesanos?')) {
      setInsumos(INITIAL_INSUMOS);
      setRecetas(INITIAL_RECETAS);
      setCotizaciones(INITIAL_COTIZACIONES);
      setPedidos(INITIAL_PEDIDOS);
      setMermas(INITIAL_MERMAS);
      setUsuarios(INITIAL_USUARIOS);
      setCurrentUser(INITIAL_USUARIOS[0]);
      localStorage.clear();
      showToast('success', 'Base de Datos Restaurada', 'Se cargaron los 93 insumos y 53 recetas maestras en RD$.');
    }
  };

  const exportDatabaseJSON = () => {
    const data = {
      insumos,
      recetas,
      cotizaciones,
      pedidos,
      mermas,
      usuarios: usuarios.map(({ password, ...rest }) => rest), // Exportar sin hashes sensibles
      exportDate: new Date().toISOString(),
      system: 'Delicias del Valle Pastelería Artesanal v2.0 (DOP / RD$)',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Delicias_del_Valle_RD_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Copia de Seguridad Exportada', 'Archivo JSON generado y descargado.');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        login,
        logout,
        usuarios,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        toggleUsuarioEstado,
        resetPasswordUsuario,
        insumos,
        insumosMap,
        addInsumo,
        updateInsumo,
        deleteInsumo,
        reabastecerInsumo,
        reabastecerTodoElStock,
        mermas,
        addMerma,
        recetas,
        addReceta,
        updateReceta,
        deleteReceta,
        duplicarReceta,
        cotizaciones,
        addCotizacion,
        updateCotizacion,
        deleteCotizacion,
        cambiarEstadoCotizacion,
        convertirCotizacionAPedido,
        pedidos: {
          list: pedidos,
          addPedidoDirecto,
          updatePedido,
          cambiarEstadoPedido,
          registrarPago,
          descontarInventarioPorPedido,
          verificarStockParaPedido,
        },
        timers,
        addTimer,
        removeTimer,
        toggleTimer,
        resetTimer,
        toggleKitchenChecklist,
        toasts,
        showToast,
        removeToast,
        resetAllData,
        exportDatabaseJSON,
        isSupabaseOnline,
        isSyncing,
        savedCredentials,
        syncFromSupabase,
        configureSupabase,
        disconnectSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
};
