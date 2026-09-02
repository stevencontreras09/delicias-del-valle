import React, { useState } from 'react';
import { Pedido, Receta, Insumo } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency, formatUnit } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { autenticarUsuarioEnSupabase } from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../utils/supabaseClient';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Lock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

interface OrderDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  recetas: Receta[];
  insumosMap: Map<number, Insumo>;
  onConfirmDelete: (pedidoId: number) => Promise<any>;
}

export const OrderDeleteDialog: React.FC<OrderDeleteDialogProps> = ({
  isOpen,
  onClose,
  pedido,
  recetas,
  insumosMap,
  onConfirmDelete,
}) => {
  const { currentUser, usuarios } = useApp();

  // Estados de autorización
  const [supervisorUsername, setSupervisorUsername] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  if (!pedido) return null;

  // Comprobar si la sesión actual ya tiene rol admin o coadmin
  const isCurrentAdminOrCoadmin =
    currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'coadmin');

  // Filtrar posibles supervisores (admin y coadmin) para el selector si se requiere autorización externa
  const adminUsers = usuarios.filter(
    (u) => (u.rol === 'admin' || u.rol === 'coadmin') && u.activo
  );

  // Calcular insumos que se devolverán al inventario
  const insumosADevolver: {
    insumoId: number;
    nombre: string;
    cantidad: number;
    unidad: string;
    costoEstimado: number;
  }[] = [];

  let valorTotalDevuelto = 0;

  if (pedido.inventario_descontado) {
    pedido.items.forEach((item) => {
      if (!item.receta_id) return;
      const receta = recetas.find((r) => r.id === item.receta_id);
      if (!receta) return;

      const factor = (item.factor_receta || 1) * item.cantidad;
      receta.ingredientes.forEach((ing) => {
        const insumo = insumosMap.get(ing.insumo_id);
        const cant = ing.cantidad * factor;
        const costo = insumo ? cant * insumo.costo_unitario_base : 0;
        valorTotalDevuelto += costo;

        const exist = insumosADevolver.find((x) => x.insumoId === ing.insumo_id);
        if (exist) {
          exist.cantidad += cant;
          exist.costoEstimado += costo;
        } else {
          insumosADevolver.push({
            insumoId: ing.insumo_id,
            nombre: insumo ? insumo.nombre : (ing.insumo_nombre || 'Insumo'),
            cantidad: cant,
            unidad: insumo ? insumo.unidad_base : (ing.unidad_base || 'g'),
            costoEstimado: costo,
          });
        }
      });
    });
  }

  const handleDelete = async () => {
    setAuthError('');
    setIsAuthorizing(true);

    try {
      // 1. Si la sesión activa NO es admin ni coadmin, validar credenciales del supervisor
      if (!isCurrentAdminOrCoadmin) {
        if (!supervisorUsername.trim() || !supervisorPassword.trim()) {
          setAuthError('Por favor selecciona el supervisor e ingresa su contraseña.');
          setIsAuthorizing(false);
          return;
        }

        const supervisorUser = adminUsers.find(
          (u) => u.username.toLowerCase() === supervisorUsername.trim().toLowerCase()
        );

        if (!supervisorUser) {
          setAuthError('Usuario supervisor no reconocido con rol Administrador o Co-Administrador.');
          setIsAuthorizing(false);
          return;
        }

        // Validar contraseña
        let isAuthValid = false;
        if (isSupabaseConfigured()) {
          const res = await autenticarUsuarioEnSupabase(
            supervisorUser.username,
            supervisorPassword.trim()
          );
          if (res.success && res.user && (res.user.rol === 'admin' || res.user.rol === 'coadmin')) {
            isAuthValid = true;
          }
        }

        // Verificación local / fallback de contraseñas maestras
        const validAdminPasswords = ['@Manzana0104', 'Steven2026!', 'admin123', 'Delicias2026!'];
        if (
          supervisorUser.password === supervisorPassword.trim() ||
          validAdminPasswords.includes(supervisorPassword.trim())
        ) {
          isAuthValid = true;
        }

        if (!isAuthValid) {
          setAuthError('Contraseña incorrecta. Solo Admin o Coadmin pueden autorizar esta eliminación.');
          setIsAuthorizing(false);
          return;
        }
      }

      // 2. Ejecutar eliminación atómica con reversión de inventario
      await onConfirmDelete(pedido.id);
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Error al procesar la eliminación.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Pedido y Devolver Insumos al Inventario"
      subtitle={'Factura: ' + pedido.numero_factura + ' • Cliente: ' + pedido.cliente_nombre}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Alerta de Devolución de Stock */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
          <RotateCcw className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 animate-spin-slow" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
              <span>Reversión Automática de Inventario</span>
              <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                REINTEGRO ACTIVO
              </span>
            </p>
            {pedido.inventario_descontado ? (
              <p className="text-emerald-800">
                Al confirmar la eliminación, todos los ingredientes descontados de este pedido valorados en{' '}
                <strong className="text-emerald-950 font-black">{formatCurrency(valorTotalDevuelto)}</strong>{' '}
                serán <b>devueltos automáticamente al stock disponible</b>.
              </p>
            ) : (
              <p className="text-emerald-800">
                El inventario de este pedido no había sido descontado previamente. Se eliminará el registro sin afectar el stock.
              </p>
            )}
          </div>
        </div>

        {/* Alerta de Anticipo Cobrado (50% / Pagos Registrados) */}
        {pedido.anticipo_pagado > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-sm">
            <DollarSign className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-950 flex items-center justify-between">
                <span>Anticipo Cobrado: {formatCurrency(pedido.anticipo_pagado)}</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {pedido.pagos.length} PAGO{pedido.pagos.length > 1 ? 'S' : ''} REGISTRADO{pedido.pagos.length > 1 ? 'S' : ''}
                </span>
              </p>
              <p className="text-amber-800 leading-relaxed">
                Al <b>eliminar</b> el pedido, este registro de pago se borrará de la base de datos y de los reportes.
                Si la pastelería retiene el 50% por política de cancelación o necesitas mantener el historial contable del ingreso, te recomendamos <b>Cancelar</b> el pedido en lugar de eliminarlo.
              </p>
            </div>
          </div>
        )}

        {/* Resumen de Insumos que regresarán al stock */}
        {pedido.inventario_descontado && insumosADevolver.length > 0 && (
          <div className="bg-canvas border border-trigo-200 rounded-2xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-chocolate-800 uppercase tracking-wider block">
              Insumos que regresarán al almacén ({insumosADevolver.length}):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {insumosADevolver.map((ins) => (
                <div
                  key={ins.insumoId}
                  className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-xl border border-trigo-100"
                >
                  <span className="font-medium text-chocolate-900">{ins.nombre}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-700 font-bold">
                      +{formatUnit(ins.cantidad, ins.unidad)}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      ({formatCurrency(ins.costoEstimado)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de Autorización RBAC */}
        <div className="p-4 rounded-2xl border border-chocolate-200 bg-crema/40 space-y-3">
          <div className="flex items-center gap-2 text-chocolate-900 font-bold text-xs uppercase tracking-wider">
            {isCurrentAdminOrCoadmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autorización de Seguridad: Concedida</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Autorización de Supervisor Requerida</span>
              </>
            )}
          </div>

          {isCurrentAdminOrCoadmin ? (
            <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-950">
                    {currentUser.nombre_completo}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Rol: {currentUser.rol === 'admin' ? 'Administrador Maestro' : 'Co-Administrador'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                Sesión Activa
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-chocolate-700">
                Tu rol actual requiere la aprobación de un <b>Administrador</b> o <b>Co-Administrador</b> para eliminar pedidos y alterar el stock.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                  Supervisor (Admin / Co-Admin)
                </label>
                <select
                  value={supervisorUsername}
                  onChange={(e) => setSupervisorUsername(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-trigo-300 bg-white font-medium focus:ring-2 focus:ring-frambuesa-400 focus:outline-none"
                >
                  <option value="">-- Seleccionar supervisor autorizado --</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.nombre_completo} ({u.rol.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-chocolate-800 mb-1">
                  Contraseña de Autorización
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Ingresa la clave del supervisor..."
                    value={supervisorPassword}
                    onChange={(e) => setSupervisorPassword(e.target.value)}
                    className="w-full text-xs p-2.5 pl-8 rounded-xl border border-trigo-300 bg-white focus:ring-2 focus:ring-frambuesa-400 focus:outline-none font-mono"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>
          )}

          {authError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{authError}</span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="pt-3 border-t border-trigo-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAuthorizing}
            className="px-4 py-2 text-xs font-bold text-chocolate-700 hover:bg-crema rounded-xl transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isAuthorizing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isAuthorizing ? 'Autorizando y Eliminando...' : 'Autorizar y Devolver a Inventario'}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
