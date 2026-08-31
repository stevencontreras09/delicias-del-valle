import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Usuario, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Mail,
  Phone,
  UserCheck,
  ChefHat,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const UserManager: React.FC = () => {
  const {
    usuarios,
    currentUser,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    toggleUsuarioEstado,
    resetPasswordUsuario,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState<Usuario | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Form State para Crear/Editar
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    nombre_completo: string;
    email: string;
    telefono: string;
    rol: UserRole;
    activo: boolean;
  }>({
    username: '',
    password: '',
    nombre_completo: '',
    email: '',
    telefono: '',
    rol: 'pastelero',
    activo: true,
  });

  // Filtrado
  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const matchSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'todos' || user.rol === roleFilter;
      return matchSearch && matchRole;
    });
  }, [usuarios, searchTerm, roleFilter]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      nombre_completo: '',
      email: '',
      telefono: '',
      rol: 'pastelero',
      activo: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      nombre_completo: user.nombre_completo,
      email: user.email,
      telefono: user.telefono || '',
      rol: user.rol,
      activo: user.activo,
    });
    setIsModalOpen(true);
  };

  const openResetPasswordModal = (user: Usuario) => {
    setTargetUserForPassword(user);
    setNewPasswordInput('');
    setIsPasswordModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.nombre_completo.trim() || !formData.email.trim()) {
      showToast('warning', 'Campos Incompletos', 'Completa los campos obligatorios.');
      return;
    }

    if (editingUser) {
      updateUsuario(editingUser.id, {
        username: formData.username.trim(),
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        rol: formData.rol,
        activo: formData.activo,
      });
      setIsModalOpen(false);
    } else {
      if (!formData.password.trim()) {
        showToast('warning', 'Contraseña Requerida', 'Ingresa una contraseña para el nuevo usuario.');
        return;
      }
      addUsuario({
        username: formData.username.trim(),
        password: formData.password.trim(),
        nombre_completo: formData.nombre_completo.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        rol: formData.rol,
        activo: formData.activo,
      });
      setIsModalOpen(false);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPassword || !newPasswordInput.trim()) return;

    resetPasswordUsuario(targetUserForPassword.id, newPasswordInput.trim());
    setIsPasswordModalOpen(false);
  };

  const getRoleBadge = (rol: UserRole) => {
    switch (rol) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-frambuesa-100 text-frambuesa-700 border border-frambuesa-300">
            <Shield className="w-3 h-3" />
            <span>Administrador Maestro</span>
          </span>
        );
      case 'coadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>Co-Administrador</span>
          </span>
        );
      case 'pastelero':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <ChefHat className="w-3 h-3" />
            <span>Pastelero / Chef</span>
          </span>
        );
      case 'cajero':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Receipt className="w-3 h-3" />
            <span>Ventas & Caja</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <UserCheck className="w-3 h-3" />
            <span>Operador</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-chocolate-700 font-serif">
              Gestión de Usuarios del Taller
            </h1>
            <span className="bg-frambuesa-100 text-frambuesa-700 text-xs font-bold px-3 py-1 rounded-full border border-frambuesa-300">
              Panel Exclusivo Admin
            </span>
          </div>
          <p className="text-xs text-chocolate-500 mt-1">
            Administra los roles, accesos y permisos del equipo de pastelería, panadería y atención al cliente.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-frambuesa-500 hover:bg-frambuesa-600 text-white font-bold text-xs shadow-frambuesa-glow hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* Métricas de Usuarios */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm">
          <span className="text-xs text-gray-400 font-bold uppercase block">Total Usuarios</span>
          <span className="text-2xl font-black text-chocolate-800">{usuarios.length}</span>
          <span className="text-[10px] text-gray-500 block">registrados en el sistema</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm">
          <span className="text-xs text-gray-400 font-bold uppercase block">Administradores</span>
          <span className="text-2xl font-black text-frambuesa-600">
            {usuarios.filter((u) => u.rol === 'admin').length}
          </span>
          <span className="text-[10px] text-gray-500 block">acceso total + SQL + Sync</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm">
          <span className="text-xs text-gray-400 font-bold uppercase block">Pasteleros & Taller</span>
          <span className="text-2xl font-black text-amber-600">
            {usuarios.filter((u) => u.rol === 'pastelero').length}
          </span>
          <span className="text-[10px] text-gray-500 block">cocina & pesaje BOM</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-trigo-200 shadow-sm">
          <span className="text-xs text-gray-400 font-bold uppercase block">Ventas & Caja</span>
          <span className="text-2xl font-black text-emerald-600">
            {usuarios.filter((u) => u.rol === 'cajero').length}
          </span>
          <span className="text-[10px] text-gray-500 block">cotizaciones y cobros</span>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-3xl border border-trigo-200 shadow-warm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por usuario, nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/40"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <span className="text-gray-400 font-bold text-[11px] uppercase">Rol:</span>
          {['todos', 'admin', 'pastelero', 'cajero'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                roleFilter === r
                  ? 'bg-chocolate-700 text-white shadow-sm'
                  : 'bg-canvas text-chocolate-600 hover:bg-crema'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-3xl border border-trigo-200 shadow-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-crema text-chocolate-800 font-bold border-b border-trigo-200">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Rol & Permisos</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trigo-100">
              {filteredUsers.map((u) => {
                const isMasterAdmin = u.username === 'Steven9909' || u.id === 1;
                const isCurrent = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-crema/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-chocolate-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {u.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-chocolate-900 block font-mono">
                            {u.username}
                          </span>
                          {isMasterAdmin && (
                            <span className="text-[10px] text-frambuesa-600 font-bold">
                              ★ Administrador Maestro
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] text-emerald-600 font-bold block">
                              (Sesión Activa)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-chocolate-800">
                      {u.nombre_completo}
                    </td>

                    <td className="py-3 px-4">{getRoleBadge(u.rol)}</td>

                    <td className="py-3 px-4 text-gray-600">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.telefono && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{u.telefono}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleUsuarioEstado(u.id)}
                        disabled={isMasterAdmin}
                        title={isMasterAdmin ? 'El Admin Maestro siempre está activo' : 'Clic para alternar estado'}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 mx-auto ${
                          u.activo
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        } ${isMasterAdmin ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105'}`}
                      >
                        {u.activo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {u.ultimo_acceso ? formatDate(u.ultimo_acceso) : 'Sin registro'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openResetPasswordModal(u)}
                          title="Cambiar Contraseña"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(u)}
                          title="Editar Datos"
                          className="p-1.5 bg-crema hover:bg-trigo-200 text-chocolate-700 rounded-xl border border-trigo-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => deleteUsuario(u.id)}
                          disabled={isMasterAdmin || isCurrent}
                          title={isMasterAdmin ? 'No puedes eliminar al Admin Maestro' : isCurrent ? 'No puedes eliminar tu propia cuenta' : 'Eliminar Usuario'}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-trigo-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trigo-200 pb-3">
              <h3 className="text-lg font-bold text-chocolate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-frambuesa-600" />
                <span>{editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-chocolate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    Nombre de Usuario (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ej: reposterocarlos"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/30 font-mono"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold text-chocolate-700 mb-1">
                      Contraseña Inicial *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-chocolate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  placeholder="Ej: Carlos Méndez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="carlos@deliciasdelvalle.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+1 (809) 555-0142"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    Rol en el Taller
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
                    disabled={editingUser?.username === 'Steven9909'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-white font-semibold text-chocolate-900"
                  >
                    <option value="coadmin">Co-Administrador (Operativo Total sin BD/Usuarios)</option>
                    <option value="pastelero">Pastelero / Chef (Taller & Cocina)</option>
                    <option value="cajero">Cajero / Ventas (Cotizaciones & Cobros)</option>
                    <option value="admin">Administrador Maestro (Acceso Total + SQL)</option>
                    <option value="operador">Operador General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-chocolate-700 mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={formData.activo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                    disabled={editingUser?.username === 'Steven9909'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-white font-semibold text-chocolate-900"
                  >
                    <option value="true">Activo (Puede Iniciar Sesión)</option>
                    <option value="false">Inactivo (Acceso Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-trigo-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-chocolate-600 hover:bg-crema"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-frambuesa-500 hover:bg-frambuesa-600 text-white shadow-sm"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset de Contraseña */}
      {isPasswordModalOpen && targetUserForPassword && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-trigo-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-trigo-200 pb-3">
              <h3 className="text-base font-bold text-chocolate-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Restablecer Contraseña</span>
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-chocolate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-chocolate-600">
              Establece una nueva clave para <b>{targetUserForPassword.nombre_completo}</b> (<code>{targetUserForPassword.username}</code>).
            </p>

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-chocolate-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Escribe la nueva contraseña"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 text-xs focus:ring-2 focus:ring-frambuesa-500 outline-none bg-canvas/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-trigo-200">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-chocolate-600 hover:bg-crema"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
