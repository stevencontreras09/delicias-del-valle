import React from 'react';
import { Navbar } from './Navbar';
import { ToastContainer } from '../ui/ToastContainer';
import { useApp } from '../../context/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab } = useApp();

  const isKitchenMode = activeTab === 'kitchen';

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans antialiased text-panadero">
      <Navbar />

      <main className={`flex-1 ${isKitchenMode ? 'p-2 sm:p-4 md:p-6 bg-slate-900 text-slate-100' : 'max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8'}`}>
        {children}
      </main>

      {!isKitchenMode && (
        <footer className="bg-chocolate-900 text-trigo-200 border-t border-chocolate-800 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-white text-sm">Delicias del Valle</span>
              <span>•</span>
              <span>Sistema Integral de Costeo, Inventarios & Producción</span>
            </div>
            <p className="text-trigo-400">
              © {new Date().getFullYear()} Delicias del Valle - Pastelería y Panadería Artesanal.
            </p>
          </div>
        </footer>
      )}

      <ToastContainer />
    </div>
  );
};
