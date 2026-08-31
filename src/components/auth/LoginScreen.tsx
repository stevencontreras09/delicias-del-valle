import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, ChefHat } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('Steven9909');
  const [password, setPassword] = useState('@Manzana0104');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setError(res.message);
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-crema rounded-full filter blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-frambuesa-100 rounded-full filter blur-3xl opacity-40 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 animate-fade-in space-y-6">
        {/* Cabecera / Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-crema rounded-3xl border border-trigo-300 shadow-md">
            <img
              src="/logo.svg"
              alt="Delicias del Valle"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-chocolate-800">
              Delicias del Valle
            </h1>
            <p className="text-xs font-semibold text-trigo-700 uppercase tracking-widest mt-0.5">
              Pastelería & Panadería Artesanal
            </p>
          </div>
          <p className="text-xs text-chocolate-500 max-w-xs mx-auto">
            Sistema de Gestión Integral de Costos BOM, Inventario, Pedidos y Producción.
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-trigo-200 shadow-warm space-y-5">
          <div className="border-b border-trigo-100 pb-3 text-center">
            <h2 className="text-lg font-bold text-chocolate-800 flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-frambuesa-600" />
              <span>Acceso al Taller</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Ingresa con tus credenciales asignadas
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold animate-shake flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-chocolate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: Steven9909"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-trigo-300 text-sm focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/40 font-medium text-chocolate-900 transition-all"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña secreta"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-trigo-300 text-sm focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/40 font-medium text-chocolate-900 transition-all"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-chocolate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-frambuesa-500 to-frambuesa-600 hover:from-frambuesa-600 hover:to-frambuesa-700 text-white font-bold text-sm shadow-frambuesa-glow hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
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

          {/* Accesos Rápidos para Demostración y Taller */}
          <div className="pt-2 border-t border-trigo-100 space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center">
              Usuarios Disponibles del Taller
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('Steven9909', '@Manzana0104')}
                className="p-2.5 bg-crema hover:bg-trigo-100 rounded-2xl border border-trigo-300 text-left transition-all group shadow-sm hover:scale-[1.02]"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-chocolate-800">
                  <ShieldCheck className="w-4 h-4 text-frambuesa-600" />
                  <span>Admin Maestro</span>
                </div>
                <span className="text-[11px] text-frambuesa-700 font-bold block mt-0.5">Steven9909</span>
                <span className="text-[10px] text-gray-500 block">Acceso Total + SQL + Sync</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('taller_delicias', 'Delicias2026*')}
                className="p-2.5 bg-canvas hover:bg-crema rounded-2xl border border-trigo-200 text-left transition-all group shadow-sm hover:scale-[1.02]"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-chocolate-800">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>Personal del Taller</span>
                </div>
                <span className="text-[11px] text-chocolate-800 font-bold block mt-0.5">taller_delicias</span>
                <span className="text-[10px] text-gray-500 block">Acceso Operativo Completo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pie informativo */}
        <p className="text-center text-[11px] text-gray-400">
          Delicias del Valle &copy; {new Date().getFullYear()} • Acceso Administrador & Taller Gastronómico
        </p>
      </div>
    </div>
  );
};
