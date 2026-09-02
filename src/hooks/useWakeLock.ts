import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseWakeLockReturn {
  isLocked: boolean;
  isSupported: boolean;
  error: string | null;
  requestWakeLock: () => Promise<boolean>;
  releaseWakeLock: () => Promise<boolean>;
}

/**
 * Hook para la Screen Wake Lock API
 * Mantiene la pantalla encendida de tablets y smartphones en el taller de cocina
 * sin que se apague por inactividad. Incluye reconexión automática tras visibilitychange.
 */
export function useWakeLock(autoRequest = true): UseWakeLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<any>(null);
  const requestedRef = useRef<boolean>(autoRequest);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!('wakeLock' in navigator)) {
      setError('Screen Wake Lock API no está soportada en este navegador o dispositivo.');
      return false;
    }

    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        await sentinelRef.current.release();
      }

      const sentinel = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsLocked(true);
      setError(null);
      requestedRef.current = true;

      sentinel.addEventListener('release', () => {
        setIsLocked(false);
      });

      return true;
    } catch (err: any) {
      setIsLocked(false);
      setError(err?.message || 'Error al solicitar el bloqueo de suspensión de pantalla.');
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async (): Promise<boolean> => {
    requestedRef.current = false;
    if (sentinelRef.current && !sentinelRef.current.released) {
      try {
        await sentinelRef.current.release();
        sentinelRef.current = null;
        setIsLocked(false);
        return true;
      } catch (err: any) {
        setError(err?.message || 'Error al liberar el bloqueo de suspensión.');
        return false;
      }
    }
    setIsLocked(false);
    return true;
  }, []);

  useEffect(() => {
    if (autoRequest && 'wakeLock' in navigator) {
      requestWakeLock();
    }

    return () => {
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {});
      }
    };
  }, [autoRequest, requestWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && requestedRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestWakeLock]);

  return {
    isLocked,
    isSupported,
    error,
    requestWakeLock,
    releaseWakeLock,
  };
}
