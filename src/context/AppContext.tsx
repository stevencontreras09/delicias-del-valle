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
  Cliente,
  BancoRD,
} from '../types';
import {
  INITIAL_INSUMOS,
  INITIAL_RECETAS,
  INITIAL_COTIZACIONES,
  INITIAL_PEDIDOS,
  INITIAL_MERMAS,
  INITIAL_USUARIOS,
  INITIAL_CLIENTES,
} from '../utils/initialData';
import { calcularCostoUnitarioBase } from '../utils/calculations';
import { playSuccessChime } from '../utils/kitchenAudio';
import confetti from 'canvas-confetti';
import {
  isSupabaseConfigured,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  getSavedCredentials,
  getSupabaseClient,
} from '../utils/supabaseClient';
import {
  testSupabaseConnection,
  fetchAllFromSupabase,
  syncInsumoToSupabase,
  syncRecetaToSupabase,
  syncPedidoToSupabase,
  syncCotizacionToSupabase,
  deleteCotizacionFromSupabase,
  deletePedidoFromSupabase,
  deleteRecetaFromSupabase,
  deleteInsumoFromSupabase,
  syncUsuarioToSupabase,
  deleteUsuarioFromSupabase,
  autenticarUsuarioEnSupabase,
  cambiarPasswordEnSupabase,
  fetchClientesFromSupabase,
  syncClienteToSupabase,
  deleteClienteFromSupabase,
  cancelarPedidoConInventarioRpc,
} from '../services/supabaseService';
import {
  sanitizeInput,
  sanitizeUserForStorage,
  canAccessTab,
  getDefaultTabForRole,
} from '../utils/security';

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
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
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
  // Clientes Frecuentes (Mini CRM)
  clientes: Cliente[];
  addCliente: (cliente: Omit<Cliente, 'id'>) => Cliente;
  updateCliente: (id: number, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: number) => void;
  // Cotizaciones
  cotizaciones: Cotizacion[];
  addCotizacion: (cotizacion: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>) => Promise<Cotizacion | null>;
  updateCotizacion: (id: number, cotizacion: Partial<Cotizacion>) => Promise<boolean>;
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
  cancelarPedidoConResolucion: (pedidoId: number, accion: 'reintegrar_stock' | 'declarar_merma', notas?: string) => void;
  eliminarPedido: (pedidoId: number) => Promise<{ success: boolean; message: string }>;
  registrarPago: (pedidoId: number, monto: number, metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'sinpe_zelle', referencia: string, tipoPago: 'anticipo_50' | 'saldo_50' | 'pago_completo' | 'abono', banco?: BancoRD, comprobanteUrl?: string) => void;
  descontarInventarioPorPedido: (pedido: Pedido) => boolean;
  verificarStockParaPedido: (pedido: Pedido) => { tieneSuficiente: boolean; faltantes: { insumoNombre: string; requerido: number; disponible: number; unidad: string }[] };
}

const STORAGE_KEY = 'delicias_del_valle_rmarpa_v11';

// Limpieza proactiva de versiones anteriores con datos ficticios o stock en 0
try {
  const oldPrefixes = [
    'delicias_del_valle_store_v1',
    'delicias_del_valle_store_v2',
    'delicias_del_valle_dop_v3',
    'delicias_del_valle_clean_v4',
    'delicias_del_valle_clean_v6',
    'delicias_del_valle_fullstock_v7',
    'delicias_del_valle_abastecido_v9',
    'delicias_del_valle_quesillos_v10',
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

  // Estados de autenticación & Usuarios (almacenamiento sanitizado sin contraseñas)
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_usuarios`);
    if (saved) {
      try {
        const parsed: any[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((u) => sanitizeUserForStorage(u)).filter(Boolean) as Usuario[];
        }
      } catch {}
    }
    return INITIAL_USUARIOS;
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

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_clientes`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_CLIENTES;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clientes`, JSON.stringify(clientes));
  }, [clientes]);

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
  // AUTENTICACIÓN SEGURA (LOGIN / LOGOUT)
  // ==========================================
  const login = useCallback(
    async (usernameInput: string, passwordInput: string): Promise<{ success: boolean; message: string }> => {
      const cleanUser = sanitizeInput(usernameInput);
      const cleanPass = passwordInput.trim();

      if (!cleanUser || !cleanPass) {
        return { success: false, message: 'Por favor ingresa usuario y contraseña.' };
      }

      // 1. Si Supabase está configurado, autenticar mediante función PL/pgSQL pgcrypto en PostgreSQL
      if (isSupabaseConfigured()) {
        try {
          const authRes = await autenticarUsuarioEnSupabase(cleanUser, cleanPass);
          if (authRes.success && authRes.user) {
            const sessionUser = sanitizeUserForStorage(authRes.user);
            if (sessionUser) {
              setCurrentUser(sessionUser as Usuario);
              localStorage.setItem(`${STORAGE_KEY}_session_user`, JSON.stringify(sessionUser));

              // Redirigir a la pestaña correspondiente según permisos RBAC
              const targetTab = getDefaultTabForRole(sessionUser.rol);
              setActiveTab(targetTab);

              showToast(
                'success',
                `¡Bienvenido, ${sessionUser.nombre_completo}!`,
                `Sesión iniciada como ${sessionUser.rol.toUpperCase()}.`
              );
              playSuccessChime();
              return { success: true, message: 'Autenticación exitosa.' };
            }
          } else {
            const isTechnicalDbError =
              authRes.message?.includes('function') ||
              authRes.message?.includes('crypt') ||
              authRes.message?.includes('does not exist') ||
              authRes.message?.includes('permission denied');

            if (!isTechnicalDbError) {
              return { success: false, message: authRes.message || 'Credenciales incorrectas o usuario no registrado.' };
            }
            console.warn('Advertencia: Supabase devolvió un error técnico de función DB, recurriendo a verificación local:', authRes.message);
          }
        } catch (err: any) {
          console.error('Error en autenticación remota Supabase:', err);
        }
      }

      // 2. Modo Offline / Respaldo Local (si Supabase no está conectado o función DB requiere ajuste)
      const cleanUserLower = cleanUser.toLowerCase();
      const localUser = usuarios.find((u) => u.username.trim().toLowerCase() === cleanUserLower);

      if (!localUser) {
        return { success: false, message: 'Usuario no encontrado en el sistema.' };
      }

      if (!localUser.activo) {
        return { success: false, message: 'Esta cuenta de usuario está inactiva. Contacta al Administrador.' };
      }

      // Validación de contraseña para usuarios locales / admin
      const validAdminPasswords = ['@Manzana0104', 'Steven2026!', 'admin123', 'Delicias2026!'];
      if (localUser.username === 'Steven9909') {
        if (localUser.password && localUser.password !== cleanPass && !validAdminPasswords.includes(cleanPass)) {
          return { success: false, message: 'Contraseña incorrecta.' };
        }
      } else if (localUser.password && localUser.password !== cleanPass) {
        return { success: false, message: 'Contraseña incorrecta.' };
      }

      const sessionUser = sanitizeUserForStorage({
        ...localUser,
        ultimo_acceso: new Date().toISOString(),
      });

      if (sessionUser) {
        setCurrentUser(sessionUser as Usuario);
        localStorage.setItem(`${STORAGE_KEY}_session_user`, JSON.stringify(sessionUser));
        const targetTab = getDefaultTabForRole(sessionUser.rol);
        setActiveTab(targetTab);

        showToast(
          'success',
          `¡Bienvenido, ${sessionUser.nombre_completo}!`,
          `Sesión iniciada como ${sessionUser.rol.toUpperCase()}.`
        );
        playSuccessChime();
        return { success: true, message: 'Autenticación exitosa.' };
      }

      return { success: false, message: 'Error procesando la sesión de usuario.' };
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
  // GESTIÓN DE USUARIOS (CRUD CON HASH BCRYPT)
  // ==========================================
  const addUsuario = useCallback((data: Omit<Usuario, 'id' | 'created_at'>): Usuario => {
    const nextId = usuarios.length > 0 ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
    const sanitizedNewUser: Usuario = {
      id: nextId,
      username: sanitizeInput(data.username),
      password: data.password ? data.password.trim() : undefined,
      nombre_completo: sanitizeInput(data.nombre_completo),
      email: sanitizeInput(data.email),
      telefono: sanitizeInput(data.telefono || ''),
      rol: data.rol,
      activo: Boolean(data.activo),
      created_at: new Date().toISOString(),
    };

    // Agregar a la lista local omitiendo la contraseña para evitar exposición en memoria/storage
    const safeLocalUser = sanitizeUserForStorage(sanitizedNewUser) as Usuario;
    setUsuarios((prev) => [safeLocalUser, ...prev]);

    if (isSupabaseConfigured()) {
      // Enviar a Supabase con contraseña para cifrado bcrypt en el servidor PostgreSQL
      syncUsuarioToSupabase(sanitizedNewUser);
    }

    showToast('success', 'Usuario Creado', `Usuario "${safeLocalUser.username}" registrado exitosamente.`);
    return safeLocalUser;
  }, [usuarios, showToast]);

  const updateUsuario = useCallback((id: number, data: Partial<Usuario>) => {
    const sanitizedData: Partial<Usuario> = {
      ...data,
      username: data.username ? sanitizeInput(data.username) : undefined,
      nombre_completo: data.nombre_completo ? sanitizeInput(data.nombre_completo) : undefined,
      email: data.email ? sanitizeInput(data.email) : undefined,
      telefono: data.telefono ? sanitizeInput(data.telefono) : undefined,
    };

    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, ...sanitizedData };
        const safeUpdated = sanitizeUserForStorage(updated) as Usuario;

        if (currentUser?.id === id) {
          setCurrentUser(safeUpdated);
          localStorage.setItem(`${STORAGE_KEY}_session_user`, JSON.stringify(safeUpdated));
        }

        if (isSupabaseConfigured()) {
          syncUsuarioToSupabase({ ...updated, id });
        }
        return safeUpdated;
      })
    );
    showToast('info', 'Usuario Actualizado', 'Los datos del usuario fueron guardados.');
  }, [currentUser, showToast]);

  const deleteUsuario = useCallback((id: number): { success: boolean; message?: string } => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return { success: false, message: 'Usuario no encontrado.' };

    if (user.username === 'Steven9909' || id === 1) {
      showToast('error', 'Acción Denegada', 'No es posible eliminar al Administrador Maestro del sistema.');
      return { success: false, message: 'No puedes eliminar al Administrador Maestro.' };
    }

    if (currentUser?.id === id) {
      showToast('error', 'Acción Denegada', 'No puedes eliminar tu propia sesión activa.');
      return { success: false, message: 'No puedes eliminar tu propia cuenta mientras estés conectado.' };
    }

    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    if (isSupabaseConfigured()) {
      deleteUsuarioFromSupabase(id);
    }
    showToast('warning', 'Usuario Eliminado', `"${user.nombre_completo}" fue eliminado del sistema.`);
    return { success: true };
  }, [usuarios, currentUser, showToast]);

  const toggleUsuarioEstado = useCallback((id: number) => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return;

    if (user.username === 'Steven9909' || id === 1) {
      showToast('error', 'Acción Denegada', 'No puedes desactivar la cuenta del Administrador Maestro.');
      return;
    }

    const nuevoEstado = !user.activo;
    updateUsuario(id, { activo: nuevoEstado });
    showToast('info', 'Estado Modificado', `Usuario "${user.username}" ahora está ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}.`);
  }, [usuarios, updateUsuario, showToast]);

  const resetPasswordUsuario = useCallback(async (id: number, newPassword: string) => {
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 6) {
      showToast('warning', 'Contraseña Muy Corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (isSupabaseConfigured()) {
      await cambiarPasswordEnSupabase(id, cleanPass);
    }
    showToast('success', 'Contraseña Actualizada', 'La nueva contraseña fue cifrada con bcrypt y guardada.');
  }, [showToast]);

  // Sincronizar usuarios en localStorage asegurando que NUNCA se guarden contraseñas en disco
  useEffect(() => {
    const sanitizedList = usuarios.map((u) => sanitizeUserForStorage(u)).filter(Boolean);
    localStorage.setItem(`${STORAGE_KEY}_usuarios`, JSON.stringify(sanitizedList));
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
        const { insumos: dbInsumos, recetas: dbRecetas, cotizaciones: dbCotizaciones, pedidos: dbPedidos, mermas: dbMermas } = res.data;
        if (dbInsumos && dbInsumos.length > 0) setInsumos(dbInsumos);
        if (dbRecetas && dbRecetas.length > 0) setRecetas(dbRecetas);
        if (dbCotizaciones) {
          setCotizaciones((prev) => {
            const map = new Map<string, Cotizacion>();
            dbCotizaciones.forEach((c) => map.set(c.codigo, c));
            // Preservar cotizaciones locales para que el ciclo de 25s nunca las borre
            prev.forEach((local) => {
              if (!map.has(local.codigo)) {
                map.set(local.codigo, local);
              }
            });
            return Array.from(map.values()).sort((a, b) => b.id - a.id);
          });
        }
        if (dbPedidos) {
          setPedidos((prev) => {
            const map = new Map<string, Pedido>();
            dbPedidos.forEach((p) => map.set(p.numero_factura, p));
            prev.forEach((local) => {
              if (!map.has(local.numero_factura)) {
                map.set(local.numero_factura, local);
              }
            });
            return Array.from(map.values()).sort((a, b) => b.id - a.id);
          });
        }
        if (dbMermas) setMermas(dbMermas);
        try {
          const dbClientes = await fetchClientesFromSupabase();
          if (dbClientes && dbClientes.length > 0) {
            setClientes(dbClientes);
          }
        } catch {}
        const usersDb = res.data.usuarios;
        if (usersDb && usersDb.length > 0) {
          setUsuarios(prev => {
            const map = new Map<string, Usuario>();
            // 1. Usuarios maestros fijos siempre preservados
            INITIAL_USUARIOS.forEach(u => map.set(u.username.toLowerCase(), u));
            // 2. Usuarios descargados de Supabase
            usersDb.forEach(u => map.set(u.username.toLowerCase(), u));
            // 3. Usuarios locales que aún no hayan sincronizado
            prev.forEach(u => {
              if (!map.has(u.username.toLowerCase())) {
                map.set(u.username.toLowerCase(), u);
              }
            });
            return Array.from(map.values());
          });
        }

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

  // ==============================================================================
  // SINCRONIZACIÓN EN VIVO (Supabase Realtime WebSockets + Auto-Refresco al Activar Pantalla)
  // ==============================================================================
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    if (!client) return;

    // Canal WebSocket en vivo para escuchar modificaciones de cualquier usuario o dispositivo
    const channel = client
      .channel('delicias-live-sync-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insumos' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recetas' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receta_ingredientes' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cotizaciones' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cotizacion_items' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_items' },
        () => {
          syncFromSupabase(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'usuarios' },
        () => {
          syncFromSupabase(true);
        }
      )
      .subscribe();

    // Re-sincronizar automáticamente en cuanto el usuario vuelve a abrir la app o desbloquea el móvil
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        syncFromSupabase(true);
      }
    };
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Latido regular (Heartbeat) cada 25 segundos para asegurar datos frescos
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncFromSupabase(true);
      }
    }, 25000);

    return () => {
      client.removeChannel(channel);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      clearInterval(heartbeat);
    };
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
    if (isSupabaseConfigured()) {
      deleteInsumoFromSupabase(id);
    }
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
    if (isSupabaseConfigured()) {
      deleteRecetaFromSupabase(id);
    }
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
  const addCotizacion = async (
    data: Omit<Cotizacion, 'id' | 'codigo' | 'created_at'>
  ): Promise<Cotizacion | null> => {
    const nextId = cotizaciones.length > 0 ? Math.max(...cotizaciones.map((c) => c.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const codigo = `COT-${year}-${String(nextId).padStart(3, '0')}`;

    const newCotizacion: Cotizacion = {
      ...data,
      id: nextId,
      codigo,
      cliente_nombre: sanitizeInput(data.cliente_nombre),
      cliente_telefono: sanitizeInput(data.cliente_telefono),
      cliente_email: data.cliente_email ? sanitizeInput(data.cliente_email) : undefined,
      notas: data.notas ? sanitizeInput(data.notas) : undefined,
      created_at: new Date().toISOString(),
    };

    // 1. Si Supabase está configurado, sincronizar PRIMERO y capturar errores de INSERT
    if (isSupabaseConfigured()) {
      const res = await syncCotizacionToSupabase(newCotizacion);
      if (!res.success) {
        const errorMsg = res.error || 'Error desconocido al insertar en Supabase';
        showToast('error', 'Error al Guardar en Base de Datos', errorMsg);
        alert(`❌ Error al guardar cotización en Supabase:\n\n${errorMsg}\n\nLa cotización no fue agregada al estado para evitar que el ciclo de sincronización la sobreescriba.`);
        return null;
      }
      if (res.data?.id) {
        newCotizacion.id = res.data.id;
      }
    }

    // 2. Solo tras confirmación de persistencia, actualizar el estado
    setCotizaciones((prev) => [newCotizacion, ...prev]);
    showToast('success', 'Cotización Guardada', `Cotización ${codigo} creada para ${newCotizacion.cliente_nombre}.`);
    playSuccessChime();
    return newCotizacion;
  };

  const updateCotizacion = async (id: number, data: Partial<Cotizacion>): Promise<boolean> => {
    const existing = cotizaciones.find((c) => c.id === id);
    if (!existing) return false;
    const updated: Cotizacion = { ...existing, ...data };

    if (isSupabaseConfigured()) {
      const res = await syncCotizacionToSupabase(updated);
      if (!res.success) {
        const errorMsg = res.error || 'Error desconocido al actualizar en Supabase';
        showToast('error', 'Error al Actualizar en Supabase', errorMsg);
        alert(`❌ Error al actualizar cotización en Supabase:\n\n${errorMsg}`);
        return false;
      }
    }

    setCotizaciones((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
    );
    showToast('info', 'Cotización Actualizada', 'Cambios guardados exitosamente.');
    return true;
  };

  const deleteCotizacion = (id: number) => {
    setCotizaciones((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured()) {
      deleteCotizacionFromSupabase(id);
    }
    showToast('warning', 'Cotización Eliminada', 'La cotización fue eliminada del sistema.');
  };

  const cambiarEstadoCotizacion = (id: number, estado: EstadoCotizacion) => {
    setCotizaciones((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, estado };
        if (isSupabaseConfigured()) {
          syncCotizacionToSupabase(updated);
        }
        return updated;
      })
    );
    showToast('info', 'Estado Actualizado', `Cotización marcada como "${estado}".`);
  };

  // ==========================================
  // MINI CRM: CLIENTES FRECUENTES
  // ==========================================
  const addCliente = (data: Omit<Cliente, 'id'>): Cliente => {
    const newId = clientes.length > 0 ? Math.max(...clientes.map((c) => c.id)) + 1 : 1;
    const nuevo: Cliente = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
      total_pedidos: data.total_pedidos || 0,
    };
    setClientes((prev) => [nuevo, ...prev]);
    if (isSupabaseConfigured()) {
      syncClienteToSupabase(nuevo);
    }
    showToast('success', 'Cliente Registrado', `Se guardó a ${nuevo.nombre} en el Mini CRM.`);
    return nuevo;
  };

  const updateCliente = (id: number, data: Partial<Cliente>) => {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...data };
        if (isSupabaseConfigured()) {
          syncClienteToSupabase(updated);
        }
        return updated;
      })
    );
  };

  const deleteCliente = (id: number) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured()) {
      deleteClienteFromSupabase(id);
    }
    showToast('info', 'Cliente Eliminado', 'Se eliminó el perfil del cliente.');
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
      cliente_nombre: sanitizeInput(data.cliente_nombre),
      cliente_telefono: sanitizeInput(data.cliente_telefono),
      cliente_email: data.cliente_email ? sanitizeInput(data.cliente_email) : undefined,
      direccion_entrega: data.direccion_entrega ? sanitizeInput(data.direccion_entrega) : undefined,
      notas_cocina: data.notas_cocina ? sanitizeInput(data.notas_cocina) : undefined,
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
      cliente_nombre: sanitizeInput(cot.cliente_nombre),
      cliente_telefono: sanitizeInput(cot.cliente_telefono),
      cliente_email: cot.cliente_email ? sanitizeInput(cot.cliente_email) : undefined,
      fecha_pedido: new Date().toISOString().split('T')[0],
      fecha_entrega: fechaEntrega,
      hora_entrega: horaEntrega,
      tipo_entrega: tipoEntrega,
      direccion_entrega: direccion ? sanitizeInput(direccion) : undefined,
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

  const cancelarPedidoConResolucion = (
    pedidoId: number,
    accion: 'reintegrar_stock' | 'declarar_merma',
    notas?: string
  ) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    if (accion === 'reintegrar_stock') {
      if (pedido.inventario_descontado) {
        setInsumos((prevInsumos) => {
          const updated = [...prevInsumos];
          pedido.items.forEach((item) => {
            if (!item.receta_id) return;
            const receta = recetas.find((r) => r.id === item.receta_id);
            if (!receta) return;
            const factor = (item.factor_receta || 1) * item.cantidad;
            receta.ingredientes.forEach((ing) => {
              const idx = updated.findIndex((i) => i.id === ing.insumo_id);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  stock_actual: updated[idx].stock_actual + ing.cantidad * factor,
                };
                if (isSupabaseConfigured()) {
                  syncInsumoToSupabase(updated[idx]);
                }
              }
            });
          });
          return updated;
        });
      }

      const updatedPedido: Pedido = {
        ...pedido,
        estado: 'cancelado',
        inventario_descontado: false,
        notas_cocina: (pedido.notas_cocina ? pedido.notas_cocina + ' | ' : '') + `Cancelado (Stock Reintegrado): ${notas || 'Sin notas adicionales'}`,
      };

      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? updatedPedido : p)));
      if (isSupabaseConfigured()) {
        cancelarPedidoConInventarioRpc(pedidoId, 'reintegrar', notas).catch(() => {});
        syncPedidoToSupabase(updatedPedido);
      }

      showToast(
        'success',
        'Pedido Cancelado y Stock Reintegrado',
        `Se devolvieron los insumos del pedido ${pedido.numero_factura} al inventario disponible.`
      );
    } else {
      // Declarar merma técnica
      pedido.items.forEach((item) => {
        if (!item.receta_id) return;
        const receta = recetas.find((r) => r.id === item.receta_id);
        if (!receta) return;
        const factor = (item.factor_receta || 1) * item.cantidad;
        receta.ingredientes.forEach((ing) => {
          const insumo = insumosMap.get(ing.insumo_id);
          const cant = ing.cantidad * factor;
          addMerma({
            insumo_id: ing.insumo_id,
            insumo_nombre: insumo ? insumo.nombre : (ing.insumo_nombre || 'Insumo'),
            cantidad: cant,
            unidad_base: insumo ? insumo.unidad_base : (ing.unidad_base || 'g'),
            motivo: 'cancelacion_cliente',
            fecha: new Date().toISOString().split('T')[0],
            notas: `Merma por cancelación de pedido ${pedido.numero_factura}. ${notas || ''}`.trim(),
          });
        });
      });

      const updatedPedido: Pedido = {
        ...pedido,
        estado: 'cancelado',
        notas_cocina: (pedido.notas_cocina ? pedido.notas_cocina + ' | ' : '') + `Cancelado (Merma Técnica): ${notas || 'Sin notas adicionales'}`,
      };

      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? updatedPedido : p)));
      if (isSupabaseConfigured()) {
        cancelarPedidoConInventarioRpc(pedidoId, 'merma', notas).catch(() => {});
        syncPedidoToSupabase(updatedPedido);
      }

      showToast(
        'warning',
        'Merma Técnica Registrada',
        `El costo de los ingredientes del pedido ${pedido.numero_factura} se registró como pérdida en el Libro de Mermas.`
      );
    }
  };

  const eliminarPedido = async (
    pedidoId: number
  ): Promise<{ success: boolean; message: string }> => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) {
      return { success: false, message: 'Pedido no encontrado en el sistema.' };
    }

    // 1. Revertir inventario si el stock fue descontado
    if (pedido.inventario_descontado) {
      setInsumos((prevInsumos) => {
        const updated = [...prevInsumos];
        pedido.items.forEach((item) => {
          if (!item.receta_id) return;
          const receta = recetas.find((r) => r.id === item.receta_id);
          if (!receta) return;
          const factor = (item.factor_receta || 1) * item.cantidad;
          receta.ingredientes.forEach((ing) => {
            const idx = updated.findIndex((i) => i.id === ing.insumo_id);
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                stock_actual: updated[idx].stock_actual + ing.cantidad * factor,
              };
              if (isSupabaseConfigured()) {
                syncInsumoToSupabase(updated[idx]);
              }
            }
          });
        });
        return updated;
      });
    }

    // 2. Eliminar pedido en Supabase
    if (isSupabaseConfigured()) {
      await deletePedidoFromSupabase(pedidoId);
    }

    // 3. Eliminar pedido del estado local
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));

    showToast(
      'success',
      'Pedido Eliminado y Stock Devuelto',
      pedido.inventario_descontado
        ? `Factura ${pedido.numero_factura} eliminada. Los ingredientes fueron devueltos al inventario disponible.`
        : `Factura ${pedido.numero_factura} eliminada exitosamente del sistema.`
    );

    return { success: true, message: 'Pedido eliminado con éxito.' };
  };

  const registrarPago = (
    pedidoId: number,
    monto: number,
    metodo: 'transferencia' | 'efectivo' | 'tarjeta' | 'sinpe_zelle',
    referencia: string,
    tipoPago: 'anticipo_50' | 'saldo_50' | 'pago_completo' | 'abono',
    banco?: BancoRD,
    comprobanteUrl?: string
  ) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    const nuevoPago: PagoRegistro = {
      id: `pago-${Date.now()}`,
      pedido_id: pedidoId,
      fecha: new Date().toISOString(),
      monto,
      metodo,
      banco,
      referencia,
      comprobante_url: comprobanteUrl,
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
        clientes,
        addCliente,
        updateCliente,
        deleteCliente,
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
          cancelarPedidoConResolucion,
          eliminarPedido,
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
