import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  ChefHat,
  Truck,
  Shield,
  KeyRound,
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const { login, usuarios } = useApp();

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('delicias_last_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Lista de usuarios activos para el Acceso Rápido
  const activeUsers = useMemo(() => {
    return (usuarios || []).filter(
      (u) => u && u.activo && u.username && u.username.trim().length > 0
    );
  }, [usuarios]);

  // Si el usuario ya está recordado, enfocar directamente la contraseña al cargar
  useEffect(() => {
    if (username) {
      passwordInputRef.current?.focus();
    } else {
      usernameInputRef.current?.focus();
    }
  }, []);

  const handleSelectQuickUser = (selectedUsername: string) => {
    setUsername(selectedUsername);
    setError(null);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('delicias_remember_session', 'true');
      } else {
        localStorage.removeItem('delicias_remember_session');
      }

      const res = await login(username, password);
      if (!res.success) {
        setError(res.message);
        passwordInputRef.current?.focus();
      }
    } catch {
      setError('Error al verificar credenciales con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (rol: UserRole) => {
    switch (rol) {
      case 'admin':
        return {
          label: 'Admin',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Shield className="w-3 h-3 text-purple-700" />,
        };
      case 'coadmin':
        return {
          label: 'Co-Admin',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <ShieldCheck className="w-3 h-3 text-blue-700" />,
        };
      case 'cocina':
        return {
          label: 'Cocina',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <ChefHat className="w-3 h-3 text-amber-700" />,
        };
      case 'delivery':
        return {
          label: 'Delivery',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <Truck className="w-3 h-3 text-emerald-700" />,
        };
      default:
        return {
          label: 'Ventas',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <User className="w-3 h-3 text-rose-700" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-crema rounded-full filter blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-frambuesa-100 rounded-full filter blur-3xl opacity-40 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 animate-fade-in space-y-5">
        {/* Cabecera con el Logo Oficial */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Delicias del Valle"
              className="w-52 max-h-36 object-contain drop-shadow-sm hover:scale-105 transition-transform"
            />
          </div>
          <p className="text-xs text-chocolate-500 max-w-xs mx-auto">
            Sistema de Gestión Integral de Costos BOM, Inventario, Pedidos y Producción.
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-trigo-200 shadow-warm space-y-5">
          <div className="border-b border-trigo-100 pb-3 text-center">
            <h2 className="text-lg font-bold text-chocolate-800 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-frambuesa-600" />
              <span>Acceso al Sistema</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ingresa tus credenciales o selecciona tu usuario para acceso rápido
            </p>
          </div>

          {/* Panel de Acceso Rápido (Cuentas Activas en el Sistema) */}
          {activeUsers.length > 0 && (
            <div className="space-y-2 bg-canvas/70 p-3 rounded-2xl border border-trigo-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-chocolate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-frambuesa-600" />
                  <span>Acceso Rápido</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium">1 clic para elegir</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
                {activeUsers.map((u) => {
                  const isSelected = username.trim().toLowerCase() === u.username.trim().toLowerCase();
                  const badge = getRoleBadge(u.rol);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectQuickUser(u.username)}
                      className={`text-left p-2 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-frambuesa-50 border-frambuesa-400 ring-2 ring-frambuesa-200 text-chocolate-900 shadow-sm'
                          : 'bg-white hover:bg-crema/40 border-trigo-200 text-chocolate-800'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          isSelected ? 'bg-frambuesa-600 text-white' : 'bg-chocolate-100 text-chocolate-800'
                        }`}
                      >
                        {u.nombre_completo ? u.nombre_completo.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate text-[11px] leading-tight">
                          {u.nombre_completo || u.username}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[9px] font-extrabold px-1 rounded border leading-none py-0.5 ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-frambuesa-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold animate-shake flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Formulario Estándar con Soporte para Autoguardado de Navegadores (Chrome, Safari, Keychain) */}
          <form onSubmit={handleSubmit} method="post" autoComplete="on" className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-chocolate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <input
                  ref={usernameInputRef}
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-trigo-300 text-sm focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/40 font-medium text-chocolate-900 transition-all"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-chocolate-700">
                  Contraseña
                </label>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  <span>Cifrada</span>
                </span>
              </div>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña secreta"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-trigo-300 text-sm focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/40 font-medium text-chocolate-900 transition-all"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-chocolate-700 transition-colors p-0.5"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opción de Recordar Sesión en este Equipo */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-frambuesa-600 rounded border-trigo-300 focus:ring-frambuesa-500 cursor-pointer accent-frambuesa-600"
                />
                <span className="text-xs text-chocolate-700 font-medium">
                  Recordar sesión en este equipo
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-frambuesa-500 to-frambuesa-600 hover:from-frambuesa-600 hover:to-frambuesa-700 text-white font-bold text-sm shadow-frambuesa-glow hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pie informativo */}
        <p className="text-center text-[11px] text-gray-400">
          Delicias del Valle &copy; {new Date().getFullYear()} • Acceso Seguro y Autorizado
        </p>
      </div>
    </div>
  );
};
