import DOMPurify from 'dompurify';
import { UserRole, ActiveTab, Usuario } from '../types';

/**
 * Matriz de Permisos RBAC por Rol para Delicias del Valle
 */
export const ROLE_PERMISSIONS: Record<UserRole, Record<ActiveTab, boolean>> = {
  admin: {
    dashboard: true,
    inventory: true,
    recipes: true,
    quotes: true,
    orders: true,
    kitchen: true,
    users: true,
    database: true,
  },
  coadmin: {
    dashboard: true,
    inventory: true,
    recipes: true,
    quotes: true,
    orders: true,
    kitchen: true,
    users: true,
    database: false, // Restricción: credenciales y consola SQL restringidas al Admin Maestro
  },
  pastelero: {
    dashboard: true,
    inventory: true, // Consulta de stock y registro de mermas
    recipes: true,   // Fórmulas BOM, escalado y recetas
    quotes: false,   // Restricción: no tiene acceso a presupuestos comerciales
    orders: true,    // Consulta de pedidos en producción
    kitchen: true,   // Acceso completo al Modo Cocina / Display
    users: false,    // Restricción: sin gestión de usuarios
    database: false, // Restricción: sin acceso a base de datos
  },
  cajero: {
    dashboard: true,
    inventory: true, // Verificación de disponibilidad de producto
    recipes: false,  // Restricción: sin acceso a márgenes y escandallos técnicos
    quotes: true,    // Elaboración y emisión de cotizaciones
    orders: true,    // Registro de pedidos, anticipos y cobros
    kitchen: false,  // Restricción: no opera en cocina
    users: false,    // Restricción: sin gestión de usuarios
    database: false, // Restricción: sin acceso a base de datos
  },
  operador: {
    dashboard: true,
    inventory: true,
    recipes: false,
    quotes: false,
    orders: true,
    kitchen: true,
    users: false,
    database: false,
  },
};

/**
 * Valida si un rol de usuario tiene autorización para acceder a una pestaña
 */
export function canAccessTab(role: UserRole | string | undefined, tab: ActiveTab): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return false;
  return Boolean(permissions[tab]);
}

/**
 * Devuelve la primera pestaña permitida para un rol determinado
 */
export function getDefaultTabForRole(role: UserRole | string | undefined): ActiveTab {
  if (!role) return 'dashboard';
  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole];
  if (!permissions) return 'dashboard';
  if (permissions.dashboard) return 'dashboard';
  if (permissions.kitchen) return 'kitchen';
  if (permissions.orders) return 'orders';
  if (permissions.quotes) return 'quotes';
  if (permissions.recipes) return 'recipes';
  return 'inventory';
}

/**
 * Saneamiento estricto contra ataques XSS (Cross-Site Scripting)
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  // Limpiar con DOMPurify prohibiendo etiquetas ejecutables
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Sin HTML permitido en campos de texto convencionales
    ALLOWED_ATTR: [],
  });
  return clean.trim();
}

/**
 * Saneamiento seguro de objetos de usuario antes de almacenarlos en localStorage
 * Garantiza que contraseñas, tokens y credenciales NUNCA se escriban en disco del navegador
 */
export function sanitizeUserForStorage(user: Partial<Usuario> | null | undefined): Omit<Usuario, 'password'> | null {
  if (!user) return null;
  return {
    id: Number(user.id),
    username: sanitizeInput(user.username),
    nombre_completo: sanitizeInput(user.nombre_completo),
    email: sanitizeInput(user.email),
    telefono: sanitizeInput(user.telefono || ''),
    rol: (user.rol || 'pastelero') as UserRole,
    activo: Boolean(user.activo),
    avatar_url: user.avatar_url || '',
    ultimo_acceso: user.ultimo_acceso || new Date().toISOString(),
    created_at: user.created_at || new Date().toISOString(),
  };
}
