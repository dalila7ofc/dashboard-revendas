import { motion } from 'motion/react';
import { 
  Check, 
  Edit2, 
  Trash2, 
  User, 
  Coins, 
  Calendar, 
  CircleDollarSign,
  Briefcase,
  AlertCircle,
  Undo
} from 'lucide-react';
import { Revenda } from '../types';
import { formatBRL, formatDateBR, formatNumber } from '../utils';

interface ResellerTableProps {
  revendas: Revenda[];
  onEdit: (revenda: Revenda) => void;
  onDeleteRequest: (revenda: Revenda) => void;
  onQuickPay: (id: string) => void;
}

export default function ResellerTable({
  revendas,
  onEdit,
  onDeleteRequest,
  onQuickPay,
}: ResellerTableProps) {
  
  if (revendas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-lg"
        id="table-empty-state"
      >
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-full text-slate-500 mb-4">
          <AlertCircle className="w-8 h-8 text-indigo-400" />
        </div>
        <h4 className="text-base font-semibold text-slate-200">Nenhuma revenda encontrada</h4>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Comece cadastrando um revendedor clicando no botão "Cadastrar Revendedor" acima ou limpe os filtros para visualizar os dados.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* VISTA DESKTOP - Tabela elegante e bem estruturada */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl" id="desktop-table-container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <th className="py-4 px-5">Revendedor</th>
              <th className="py-4 px-4 text-center">Vencimento</th>
              <th className="py-4 px-4 text-center">Cxs (Slots)</th>
              <th className="py-4 px-4 text-right">Preço Un / Custo Un</th>
              <th className="py-4 px-4 text-right">Faturamento Total</th>
              <th className="py-4 px-4 text-right">Custo Infra.</th>
              <th className="py-4 px-4 text-right">Valor Pago</th>
              <th className="py-4 px-4 text-right">Lucro Realizado</th>
              <th className="py-4 px-4 text-center">Status</th>
              <th className="py-4 px-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {revendas.map((item, idx) => {
              const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
              const slots = item.quantidadeCasinhas || 0;
              const precoVenda = item.precoVendaUnitario || 0;
              const custoUnitario = item.meuCustoUnitario || 0;
              const faturamentoTotal = isSlots ? (slots * precoVenda) : precoVenda;
              const custoTotal = isSlots ? (slots * custoUnitario) : custoUnitario;
              const lucroLíquido = precoVenda === 0 ? -custoTotal : (faturamentoTotal - custoTotal);

              // Calcular Status
              let statusText = 'Pendente';
              let statusStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              if (precoVenda === 0) {
                statusText = 'Cortesia / Isento';
                statusStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
              } else if (item.valorPago >= faturamentoTotal && faturamentoTotal > 0) {
                statusText = 'Pago';
                statusStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              } else if (item.valorPago > 0) {
                statusText = 'Parcial';
                statusStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              }

              const isLoss = lucroLíquido < 0;

              // Render Plan badge helper
              const renderPlanBadge = (tipo?: 'normal' | 'mensalista' | 'ilimitado') => {
                if (tipo === 'mensalista') {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      📆 Mensalista
                    </span>
                  );
                }
                if (tipo === 'ilimitado') {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      ♾️ Ilimitado
                    </span>
                  );
                }
                return null;
              };

              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="hover:bg-slate-900/60 transition-colors group"
                  id={`row-${item.id}`}
                >
                  {/* Revendedor */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 text-slate-400 flex items-center justify-center font-bold text-xs uppercase border border-slate-800">
                        {item.nomeRevendedor.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors flex items-center gap-2 flex-wrap">
                          <span>{item.nomeRevendedor}</span>
                          {renderPlanBadge(item.tipoPlano)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {item.id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Vencimento */}
                  <td className="py-4 px-4 text-center text-xs text-slate-300 font-mono">
                    {formatDateBR(item.dataVencimento)}
                  </td>

                  {/* Slots de casinhas */}
                  <td className="py-4 px-4 text-center text-sm font-semibold text-slate-200 font-mono">
                    {item.quantidadeCasinhas > 0 ? formatNumber(item.quantidadeCasinhas) : '0'}
                    {!isSlots && (
                      <span className="block text-[8px] text-slate-500 font-sans font-normal mt-0.5">Ref (Fixo)</span>
                    )}
                  </td>

                  {/* Preços Unitários */}
                  <td className="py-4 px-4 text-right">
                    <div className="text-xs font-medium text-slate-300 font-mono">
                      V: {formatBRL(item.precoVendaUnitario)} {!isSlots && <span className="text-[9px] text-blue-400 font-sans font-medium">(Fixo)</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      C: {formatBRL(item.meuCustoUnitario)} {!isSlots && <span className="text-[9px] text-rose-400 font-sans font-medium">(Fixo)</span>}
                    </div>
                  </td>

                  {/* Faturamento esperado */}
                  <td className="py-4 px-4 text-right text-sm font-bold text-purple-300 font-mono">
                    {formatBRL(faturamentoTotal)}
                  </td>

                  {/* Custo Total */}
                  <td className="py-4 px-4 text-right text-xs text-slate-400 font-mono">
                    {formatBRL(custoTotal)}
                  </td>

                  {/* Valor Pago */}
                  <td className="py-4 px-4 text-right">
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {formatBRL(item.valorPago)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      de {formatBRL(faturamentoTotal)}
                    </div>
                  </td>

                  {/* Lucro Realizado */}
                  <td className="py-4 px-4 text-right font-mono">
                    <span className={`text-sm font-bold ${isLoss ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {formatBRL(lucroLíquido)}
                    </span>
                    {isLoss && (
                      <span className="block text-[9px] text-rose-500/70 mt-0.5">prejuízo</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${statusStyle}`}>
                      {statusText}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {precoVenda > 0 && (
                        <button
                          onClick={() => onQuickPay(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.valorPago >= faturamentoTotal
                              ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                          }`}
                          title={item.valorPago >= faturamentoTotal ? "Desfazer Baixa (Marcar como Pendente)" : "Dar baixa total (Definir como Pago)"}
                          id={`pay-btn-${item.id}`}
                        >
                          {item.valorPago >= faturamentoTotal ? (
                            <Undo className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Editar revendedor"
                        id={`edit-btn-${item.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRequest(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Deletar revendedor"
                        id={`del-btn-${item.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VISTA MOBILE - Lista de cards confortáveis para celular */}
      <div className="block lg:hidden space-y-3" id="mobile-cards-container">
        {revendas.map((item, idx) => {
          const isSlots = !item.tipoPlano || item.tipoPlano === 'normal';
          const slots = item.quantidadeCasinhas || 0;
          const precoVenda = item.precoVendaUnitario || 0;
          const custoUnitario = item.meuCustoUnitario || 0;
          const faturamentoTotal = isSlots ? (slots * precoVenda) : precoVenda;
          const custoTotal = isSlots ? (slots * custoUnitario) : custoUnitario;
          const lucroLíquido = precoVenda === 0 ? -custoTotal : (faturamentoTotal - custoTotal);

          let statusText = 'Pendente';
          let statusStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          if (precoVenda === 0) {
            statusText = 'Cortesia / Isento';
            statusStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
          } else if (item.valorPago >= faturamentoTotal && faturamentoTotal > 0) {
            statusText = 'Pago';
            statusStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          } else if (item.valorPago > 0) {
            statusText = 'Parcial';
            statusStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          }

          const isLoss = lucroLíquido < 0;

          // Render Plan badge helper for mobile
          const renderPlanBadge = (tipo?: 'normal' | 'mensalista' | 'ilimitado') => {
            if (tipo === 'mensalista') {
              return (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  📆 Mensal
                </span>
              );
            }
            if (tipo === 'ilimitado') {
              return (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  ♾️ Ilimitado
                </span>
              );
            }
            return null;
          };

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md"
              id={`card-mobile-${item.id}`}
            >
              {/* Header card */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-800 uppercase">
                    {item.nomeRevendedor.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{item.nomeRevendedor}</span>
                      {renderPlanBadge(item.tipoPlano)}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {item.id.slice(-6)}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusStyle}`}>
                  {statusText}
                </span>
              </div>

              {/* Informações de negócio */}
              <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/30 text-xs text-slate-400">
                <div className="flex gap-1.5 items-center">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-505 uppercase tracking-wide">Vencimento</span>
                    <span className="font-mono text-slate-200">{formatDateBR(item.dataVencimento)}</span>
                  </div>
                </div>

                <div className="flex gap-1.5 items-center">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-505 uppercase tracking-wide">{isSlots ? 'Slots (Casinhas)' : 'Slots de Ref.'}</span>
                    <span className="font-mono text-slate-200">{item.quantidadeCasinhas > 0 ? formatNumber(item.quantidadeCasinhas) : '0'}</span>
                  </div>
                </div>

                <div className="flex gap-1.5 items-center">
                  <CircleDollarSign className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-505 uppercase tracking-wide">{isSlots ? 'Pric. Venda un.' : 'Faturamento Fixo'}</span>
                    <span className="font-mono text-slate-200">{formatBRL(item.precoVendaUnitario)}</span>
                  </div>
                </div>

                <div className="flex gap-1.5 items-center">
                  <Coins className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] text-slate-505 uppercase tracking-wide">{isSlots ? 'Custo un.' : 'Custo Fixo'}</span>
                    <span className="font-mono text-slate-200">{formatBRL(item.meuCustoUnitario)}</span>
                  </div>
                </div>
              </div>

              {/* Sumário Monetário */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">{isSlots ? 'Faturamento' : 'Faturamento Fixo'}</span>
                  <div className="font-mono font-bold text-slate-200">{formatBRL(faturamentoTotal)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">{isSlots ? 'Custo Infra' : 'Custo Infra Fixo'}</span>
                  <div className="font-mono font-bold text-slate-400">{formatBRL(custoTotal)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase">Lucro Líquido</span>
                  <span className={`font-mono font-bold block ${isLoss ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {formatBRL(lucroLíquido)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/20 rounded-xl border border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium font-sans">Valor Pago: <strong className="text-emerald-400 font-bold ml-1">{formatBRL(item.valorPago)}</strong> <span className="text-slate-400 text-[10px] opacity-70 font-mono font-medium">de {formatBRL(faturamentoTotal)}</span></span>

                {/* Ações */}
                <div className="flex gap-1.5">
                  {precoVenda > 0 && (
                    <button
                      onClick={() => onQuickPay(item.id)}
                      className={`px-2 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer py-1.5 ${
                        item.valorPago >= faturamentoTotal
                          ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                      id={`card-pay-btn-${item.id}`}
                    >
                      {item.valorPago >= faturamentoTotal ? 'Estornar' : 'Dar Baixa'}
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1 px-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    id={`card-edit-btn-${item.id}`}
                    aria-label="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteRequest(item)}
                    className="p-1 px-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    id={`card-del-btn-${item.id}`}
                    aria-label="Deletar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
