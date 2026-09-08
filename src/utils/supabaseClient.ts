import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Credenciales por defecto del proyecto Supabase (Anon Key pública para clientes)
const DEFAULT_SUPABASE_URL = 'https://ahzseugjftsmkdterpgq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_KCDYQsATqBIVTAsYcHFZZQ_NNAoO20N';

// Obtener credenciales desde variables de entorno .env (Vite), configuración manual en localStorage o fallback
const getSupabaseCredentials = () => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const localUrl = (localStorage.getItem('delicias_supabase_url') || '').trim();
  const localKey = (localStorage.getItem('delicias_supabase_anon_key') || '').trim();

  // Priorizar variables de entorno de Vite; luego configuración local explícita; finalmente fallback del proyecto
  const url = envUrl || localUrl || DEFAULT_SUPABASE_URL;
  const anonKey = envKey || localKey || DEFAULT_SUPABASE_ANON_KEY;

  return { url, anonKey };
};

let currentClient: SupabaseClient | null = null;
const { url, anonKey } = getSupabaseCredentials();

if (url && anonKey && url.startsWith('http')) {
  try {
    currentClient = createClient(url, anonKey);
  } catch (e) {
    console.error('Error inicializando Supabase Client:', e);
  }
}

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) return null;
  if (!currentClient) {
    try {
      currentClient = createClient(url, anonKey);
    } catch {
      return null;
    }
  }
  return currentClient;
};

export const setSupabaseCredentials = (url: string, anonKey: string): boolean => {
  try {
    localStorage.setItem('delicias_supabase_url', url.trim());
    localStorage.setItem('delicias_supabase_anon_key', anonKey.trim());
    currentClient = createClient(url.trim(), anonKey.trim());
    return true;
  } catch (e) {
    console.error('Error configurando Supabase:', e);
    return false;
  }
};

export const clearSupabaseCredentials = () => {
  localStorage.removeItem('delicias_supabase_url');
  localStorage.removeItem('delicias_supabase_anon_key');
  currentClient = null;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseCredentials();
  return !!(url && anonKey && url.startsWith('http'));
};

export const getSavedCredentials = () => getSupabaseCredentials();
