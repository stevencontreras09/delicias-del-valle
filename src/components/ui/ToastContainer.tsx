import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Users, Sparkles } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-white border-trigo-300 text-panadero';
        let icon = <Info className="w-5 h-5 text-trigo-600 flex-shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-[#F9FBF7] border-green-300 text-green-950 shadow-warm-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-[#FFFDF6] border-amber-300 text-amber-950 shadow-warm-lg';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-[#FEF5F7] border-frambuesa-300 text-frambuesa-950 shadow-warm-lg';
          icon = <XCircle className="w-5 h-5 text-frambuesa-600 flex-shrink-0" />;
        } else if (toast.type === 'collaborative') {
          bg = 'bg-gradient-to-r from-purple-50 via-white to-blue-50 border-purple-300 text-purple-950 shadow-2xl border-2 ring-2 ring-purple-100';
          icon = (
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Users className="w-4 h-4 animate-pulse" />
            </div>
          );
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-warm transition-all duration-300 animate-slide-up ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs leading-tight">{toast.title}</h4>
                {toast.type === 'collaborative' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-600 text-white tracking-wider uppercase animate-pulse">
                    EN VIVO
                  </span>
                )}
              </div>
              <p className="text-xs text-opacity-90 mt-1 leading-relaxed font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
