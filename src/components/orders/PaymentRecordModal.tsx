import React, { useState } from 'react';
import { Pedido, MetodoPago, TipoPago, BancoRD } from '../../types';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import { CreditCard, Building2, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  onSavePayment: (
    pedidoId: number,
    monto: number,
    metodo: MetodoPago,
    referencia: string,
    tipoPago: TipoPago,
    banco?: BancoRD,
    comprobanteUrl?: string
  ) => void;
}

export const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({
  isOpen,
  onClose,
  pedido,
  onSavePayment,
}) => {
  const [monto, setMonto] = useState<number | ''>(pedido ? pedido.saldo_pendiente : 0);
  const [metodo, setMetodo] = useState<MetodoPago>('transferencia');
  const [banco, setBanco] = useState<BancoRD>('Banco Popular');
  const [referencia, setReferencia] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [tipoPago, setTipoPago] = useState<TipoPago>('saldo_50');

  if (!pedido) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) return;

    onSavePayment(
      pedido.id,
      montoNum,
      metodo,
      referencia.trim(),
      tipoPago,
      metodo === 'efectivo' ? 'Efectivo' : banco,
      comprobanteUrl.trim() || undefined
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago / Conciliación Bancaria"
      subtitle={`Factura: ${pedido.numero_factura} • Cliente: ${pedido.cliente_nombre}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Resumen Actual */}
        <div className="bg-crema p-3.5 rounded-2xl border border-trigo-200 text-xs space-y-1 text-chocolate-800">
          <div className="flex justify-between">
            <span>Total Factura:</span>
            <span className="font-bold">{formatCurrency(pedido.total)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Anticipos / Pagos Recibidos:</span>
            <span className="font-bold">{formatCurrency(pedido.anticipo_pagado)}</span>
          </div>
          <div className="flex justify-between text-frambuesa-600 font-extrabold pt-1 border-t border-trigo-300">
            <span>Saldo Pendiente Actual:</span>
            <span className="text-sm">{formatCurrency(pedido.saldo_pendiente)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Monto a Registrar (RD$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={pedido.saldo_pendiente}
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm font-bold text-chocolate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Tipo de Concepto
            </label>
            <select
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value as TipoPago)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm bg-white"
            >
              <option value="saldo_50">Saldo 50% Contra Entrega</option>
              <option value="anticipo_50">Anticipo Inicial 50%</option>
              <option value="pago_completo">Pago Completo 100%</option>
              <option value="abono">Abono Parcial</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
              Método de Pago *
            </label>
            <select
              value={metodo}
              onChange={(e) => {
                const nextMetodo = e.target.value as MetodoPago;
                setMetodo(nextMetodo);
                if (nextMetodo === 'efectivo') setBanco('Efectivo');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm bg-white"
            >
              <option value="transferencia">Transferencia Bancaria / App</option>
              <option value="efectivo">Efectivo en Caja / Taller</option>
              <option value="tarjeta">Tarjeta (Datafono)</option>
              <option value="sinpe_zelle">Zelle / Remesa / Digital</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-chocolate-500" />
              <span>Banco Receptor (Rep. Dom.)</span>
            </label>
            <select
              disabled={metodo === 'efectivo'}
              value={metodo === 'efectivo' ? 'Efectivo' : banco}
              onChange={(e) => setBanco(e.target.value as BancoRD)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 font-medium"
            >
              <option value="Banco Popular">Banco Popular Dominicano</option>
              <option value="Banreservas">Banco de Reservas (Banreservas)</option>
              <option value="BHD">Banco BHD</option>
              <option value="Efectivo">Efectivo / Caja Chica</option>
              <option value="Otro">Otro Banco / Cuenta</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1">
            N° de Referencia / Comprobante
          </label>
          <input
            type="text"
            placeholder="Ej. REF-POPULAR-984210"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-chocolate-500" />
            <span>URL Foto Comprobante (Opcional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://ejemplo.com/comprobante.jpg"
              value={comprobanteUrl}
              onChange={(e) => setComprobanteUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-trigo-300 focus:outline-none focus:ring-2 focus:ring-frambuesa-400 text-sm"
            />
            {comprobanteUrl && (
              <a
                href={comprobanteUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-trigo-100 text-chocolate-700 hover:bg-trigo-200 flex items-center justify-center transition-colors"
                title="Ver comprobante"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-trigo-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-trigo-300 text-chocolate-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-warm transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Registrar Pago</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
