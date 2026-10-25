import React from 'react';
import { ShieldCheck, AlertCircle, CalendarClock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface QuotePaymentTermsProps {
  esContraEntrega?: boolean;
  className?: string;
  compact?: boolean;
}

export const QuotePaymentTerms: React.FC<QuotePaymentTermsProps> = ({
  esContraEntrega = false,
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 space-y-4 print:bg-white print:border-gray-300 print:text-black print:p-3 print:break-inside-avoid ${className}`}
    >
      {/* Encabezado */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 print:border-gray-200">
        <ShieldCheck className="w-4 h-4 text-chocolate-700 print:text-black flex-shrink-0" />
        <h4 className="font-bold text-chocolate-900 print:text-black uppercase tracking-wider text-[11px] sm:text-xs">
          Condiciones de Pago y Políticas del Pedido
        </h4>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-4`}>
        {/* Sección 1: Confirmación y Reserva */}
        <div className={compact ? 'space-y-2' : 'lg:col-span-5 space-y-2'}>
          <div className="flex items-center gap-1.5 text-chocolate-800 font-bold">
            <span className="w-5 h-5 rounded-full bg-chocolate-100 text-chocolate-800 text-[10px] flex items-center justify-center font-bold">
              1
            </span>
            <span>Confirmación y Reserva (50%)</span>
          </div>

          {esContraEntrega ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-950 space-y-1">
              <p className="font-semibold text-emerald-900">
                • Modalidad especial: 100% Contra Entrega (Sin anticipo previo).
              </p>
              <p className="text-slate-600 text-[10.5px]">
                El valor total se liquida al recibir el pedido. En caso de cancelación no notificada con al menos 24h de anticipación, se inhabilitará la opción de contra entrega para futuros pedidos.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-600">
              <p>
                • La orden se confirma y entra a programación de taller únicamente tras validar el pago del{' '}
                <strong className="text-slate-900 font-semibold">50% de anticipo</strong>, el cual{' '}
                <strong className="text-frambuesa-700 font-semibold underline decoration-frambuesa-300">
                  no es reembolsable en dinero en efectivo
                </strong>{' '}
                debido a la adquisición inmediata de insumos perecederos y reserva de cupo artesanal.
              </p>
              <p>
                • El <strong className="text-slate-900 font-semibold">50% restante</strong> debe ser liquidado en su totalidad contra entrega o previo al despacho del producto.
              </p>
            </div>
          )}
        </div>

        {/* Sección 2: Políticas de Reprogramación */}
        <div className={compact ? 'space-y-2 pt-2 border-t border-slate-200' : 'lg:col-span-7 space-y-2'}>
          <div className="flex items-center gap-1.5 text-chocolate-800 font-bold">
            <span className="w-5 h-5 rounded-full bg-chocolate-100 text-chocolate-800 text-[10px] flex items-center justify-center font-bold">
              2
            </span>
            <div className="flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-chocolate-600" />
              <span>Políticas de Cambio de Fecha y Reprogramación</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-tight">
            Cualquier modificación de fecha debe notificarse por escrito y está sujeta a disponibilidad de agenda bajo la siguiente escala:
          </p>

          {/* Mini Tabla / Grid de Escala de Reprogramación */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white print:border-gray-300">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 print:bg-gray-100">
                <tr>
                  <th className="py-1.5 px-2.5">Anticipación Notificada</th>
                  <th className="py-1.5 px-2.5 text-center">Crédito a Favor</th>
                  <th className="py-1.5 px-2.5">Retención / Justificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Con 5 o más días hábiles</span>
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                      100% Anticipo
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-[10.5px] text-slate-600">
                    Se transfiere el 100% como crédito para la nueva fecha.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>De 4 a 2 días hábiles</span>
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                      10% Crédito
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-[10.5px] text-slate-600">
                    Retención del 90% por cupo bloqueado y preparación de insumos.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span>Con 1 día o menos (≤ 24h)</span>
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-700 border border-rose-200 text-[10px]">
                      0% Crédito
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-[10.5px] text-slate-600">
                    Retención del 100% por producción iniciada, horneado y gastos operativos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Nota legal al pie */}
      <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic pt-1 border-t border-slate-200 print:text-gray-600">
        <AlertCircle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>
          Las solicitudes de reprogramación están sujetas a la disponibilidad de agenda del taller en la nueva fecha deseada. El crédito otorgado tiene una vigencia máxima de 30 días calendario.
        </span>
      </div>
    </div>
  );
};
