import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export const UpdateNotificationBanner: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Comprobar si hay una nueva versión publicada en Vercel/GitHub
  const checkForUpdate = useCallback(async () => {
    try {
      // 1. Comprobar /version.json con cache: 'no-store'
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.buildTime === 'number') {
          // Si el build del servidor es más reciente que el build embebido en este bundle
          if (typeof __APP_BUILD_TIME__ === 'number' && data.buildTime > __APP_BUILD_TIME__) {
            setHasUpdate(true);
            return;
          }
        }
      }
    } catch {
      // Silencioso ante fallos de red
    }

    // 2. Comprobar Service Worker esperando activación
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          setHasUpdate(true);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    // Chequeo inicial tras 5 segundos de carga
    const initialTimer = setTimeout(() => {
      checkForUpdate();
    }, 5000);

    // Chequeo regular cada 45 segundos si la pantalla está visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    }, 45000);

    // Chequeo inmediato al volver a enfocar la ventana o desbloquear el móvil
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Escuchar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setHasUpdate(true);
      });
    }

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdate]);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Desregistrar Service Workers viejos
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      // 2. Limpiar caches de Workbox / PWA
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.warn('Error purgando caches:', e);
    }
    // 3. Forzar recarga completa de la página
    window.location.reload();
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <aside
      aria-label="Aviso de actualización"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[94%] bg-gradient-to-r from-amber-600 via-chocolate-800 to-frambuesa-600 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border-2 border-white/30 flex items-center justify-between gap-3 animate-slide-down"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-spin" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
            <span>¡Nueva versión disponible en Delicias del Valle!</span>
            <span className="bg-amber-400 text-chocolate-900 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              Nuevo
            </span>
          </p>
          <p className="text-[11px] sm:text-xs text-white/90 leading-snug mt-0.5 truncate sm:whitespace-normal">
            Se han publicado nuevas mejoras al sistema. Recarga la página para aplicarlas de inmediato.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white hover:bg-amber-50 active:scale-95 text-chocolate-800 font-bold text-xs rounded-xl shadow-lg transition-all transform whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-chocolate-700 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'Actualizando...' : 'Recargar Ahora'}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Posponer"
          aria-label="Posponer aviso de actualización"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
