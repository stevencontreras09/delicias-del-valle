import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-[95vw]',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-chocolate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative bg-white rounded-3xl shadow-warm-xl border border-trigo-200/80 w-full ${maxWidthClasses} overflow-hidden my-auto z-10 flex flex-col max-h-[92vh] transform transition-all animate-scale-up`}
      >
        {/* Cabecera del Modal con estilo artesanal */}
        <div className="bg-crema px-6 py-4 border-b border-trigo-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-chocolate-700 font-serif leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-chocolate-500 mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-chocolate-400 hover:text-frambuesa-600 hover:bg-frambuesa-50 p-2 rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-frambuesa-400"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Contenido con scroll suave */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-panadero">
          {children}
        </div>
      </div>
    </div>
  );
};
