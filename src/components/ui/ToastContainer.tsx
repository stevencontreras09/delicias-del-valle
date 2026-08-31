import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-warm transition-all duration-300 animate-slide-up ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
              <p className="text-xs text-opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
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
