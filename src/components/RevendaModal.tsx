import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, TrendingUp, AlertTriangle } from 'lucide-react';
import { Revenda } from '../types';
import { formatBRL } from '../utils';

interface RevendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Revenda, 'id' | 'userId'> & { id?: string }) => void;
  editingRevenda: Revenda | null;
  selectedMonth?: string;
}

export default function RevendaModal({
  isOpen,
  onClose,
  onSave,
  editingRevenda,
  selectedMonth,
}: RevendaModalProps) {
  const [nome, setNome] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [quantidadeCasinhas, setQuantidadeCasinhas] = useState<number | ''>('');
  const [precoVendaUnitario, setPrecoVendaUnitario] = useState<number | ''>('');
  const [meuCustoUnitario, setMeuCustoUnitario] = useState<number | ''>('');
  const [valorPago, setValorPago] = useState<number | ''>('');
  const [tipoPlano, setTipoPlano] = useState<'normal' | 'mensalista' | 'ilimitado'>('normal');
  const [validationError, setValidationError] = useState('');

  // Sincronizar dados quando o modal abre ou é editado
  useEffect(() => {
    if (editingRevenda) {
      setNome(editingRevenda.nomeRevendedor);
      setDataVencimento(editingRevenda.dataVencimento);
      setQuantidadeCasinhas(editingRevenda.quantidadeCasinhas);
      setPrecoVendaUnitario(editingRevenda.precoVendaUnitario);
      setMeuCustoUnitario(editingRevenda.meuCustoUnitario);
      setValorPago(editingRevenda.valorPago);
      setTipoPlano(editingRevenda.tipoPlano || 'normal');
    } else {
      // Valor padrão inteligente para novos cadastros de acordo com o mês selecionado no painel
      let defaultDate = new Date().toISOString().split('T')[0];
      if (selectedMonth) {
        const today = new Date();
        const [selYear, selMonth] = selectedMonth.split('-');
        const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        if (selectedMonth !== currentYearMonth) {
          const day = String(today.getDate()).padStart(2, '0');
          defaultDate = `${selYear}-${selMonth}-${day}`;
        }
      }

      setNome('');
      setDataVencimento(defaultDate);
      setQuantidadeCasinhas('');
      setPrecoVendaUnitario('');
      setMeuCustoUnitario('');
      setValorPago('');
      setTipoPlano('normal');
    }
    setValidationError('');
  }, [editingRevenda, isOpen, selectedMonth]);

  // Cálculos matemáticos em tempo real para a prévia:
  const qtd = Number(quantidadeCasinhas) || 0;
  const pVenda = Number(precoVendaUnitario) || 0;
  const pCusto = Number(meuCustoUnitario) || 0;
  const vPago = Number(valorPago) || 0;

  const isSlots = tipoPlano === 'normal';
  const faturamentoTotalPrevisto = isSlots ? (qtd * pVenda) : pVenda;
  const custoTotalPrevisto = isSlots ? (qtd * pCusto) : pCusto;
  const margemLucroPrevista = faturamentoTotalPrevisto - custoTotalPrevisto;
  const percentualMargem = faturamentoTotalPrevisto > 0 
    ? (margemLucroPrevista / faturamentoTotalPrevisto) * 100 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setValidationError('O nome do revendedor é obrigatório.');
      return;
    }
    if (!dataVencimento) {
      setValidationError('Defina uma data de vencimento.');
      return;
    }
    if (qtd < 0) {
      setValidationError('A quantidade de casinhas não pode ser negativa.');
      return;
    }
    if (pVenda < 0 || pCusto < 0 || vPago < 0) {
      setValidationError('Os valores monetários não podem ser negativos.');
      return;
    }

    onSave({
      id: editingRevenda?.id,
      nomeRevendedor: nome.trim(),
      dataVencimento,
      quantidadeCasinhas: isSlots ? qtd : (qtd || 0),
      precoVendaUnitario: pVenda,
      meuCustoUnitario: pCusto,
      valorPago: vPago,
      tipoPlano,
    });
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 my-8"
            id="revenda-form-modal"
          >
            {/* Top Accent line */}
            <div className={`h-1 text-center w-full ${editingRevenda ? 'bg-indigo-500' : 'bg-emerald-500'}`} />

            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 tracking-tight" id="modal-title">
                  {editingRevenda ? 'Editar Revendedor' : 'Novo Cadastro de Revenda'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure o ciclo atual de cobrança e slots (casinhas).
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-100 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                id="btn-close-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {validationError && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs flex gap-2 items-center" id="form-error">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Nome do Revendedor */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  Nome do Revendedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  id="input-nome"
                />
              </div>

              {/* Data Vencimento */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  Data de Vencimento / Ciclo
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  id="input-vencimento"
                />
              </div>

              {/* Tipo de Plano de Cobrança */}
              <div className="bg-slate-950/20 border border-slate-805/85 p-3 rounded-xl space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Tipo de Cobrança / Plano
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoPlano('normal');
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      tipoPlano === 'normal'
                        ? 'bg-indigo-505 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    id="btn-plan-normal"
                  >
                    📋 Slots
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoPlano('mensalista');
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      tipoPlano === 'mensalista'
                        ? 'bg-blue-505 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    id="btn-plan-monthly"
                  >
                    📆 Mensalista
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoPlano('ilimitado');
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      tipoPlano === 'ilimitado'
                        ? 'bg-teal-505 bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                    id="btn-plan-unlimited"
                  >
                    ♾️ Ilimitado
                  </button>
                </div>
              </div>

              {/* PREDEFINIÇÕES DE SERVIDOR / VALORES */}
              {tipoPlano === 'normal' && (
                <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl space-y-2.5 shadow-inner">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Predefinição de Cobrança / Servidor (Para Planos por Slots)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMeuCustoUnitario(2.50);
                        setPrecoVendaUnitario(3.50);
                      }}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center text-center leading-tight ${
                        meuCustoUnitario === 2.50 && precoVendaUnitario === 3.50
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/55 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:bg-slate-850 hover:text-slate-200'
                      }`}
                      id="preset-starplay"
                    >
                      <span>🚀 Starplay</span>
                      <span className="text-[9px] font-mono opacity-80 mt-1">V: R$3,50 • C: R$2,50</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMeuCustoUnitario(2.50);
                        setPrecoVendaUnitario(0);
                      }}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center text-center leading-tight ${
                        meuCustoUnitario === 2.50 && precoVendaUnitario === 0
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/55 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:bg-slate-850 hover:text-slate-200'
                      }`}
                      id="preset-cortesia"
                    >
                      <span>🎁 Pago Tudo</span>
                      <span className="text-[9px] font-mono opacity-80 mt-1">V: R$0,00 • C: R$2,50</span>
                    </button>

                    <button
                      type="button"
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center justify-center text-center leading-tight ${
                        (meuCustoUnitario !== 2.50 || (precoVendaUnitario !== 3.50 && precoVendaUnitario !== 0))
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/55 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800/80 cursor-default'
                      }`}
                      id="preset-custom"
                    >
                      <span>✏️ Customizado</span>
                      <span className="text-[9px] font-mono opacity-80 mt-1">Configura Manual</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de Inputs Numéricos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantidade de Casinhas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 text-ellipsis overflow-hidden whitespace-nowrap">
                    {tipoPlano === 'normal' ? 'Cxs. (Casinhas/Slots)' : 'Slots de Ref. (Opcional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    value={quantidadeCasinhas}
                    onChange={(e) => setQuantidadeCasinhas(e.target.value === '' ? '' : parseInt(e.target.value))}
                    id="input-casinhas"
                  />
                </div>

                {/* Valor Pago */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    Valor Pago Atual (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    id="input-pago"
                  />
                </div>

                {/* Preço de Venda */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 text-ellipsis overflow-hidden whitespace-nowrap">
                    {tipoPlano === 'normal' ? 'Preço de Venda Unitário' : 'Valor de Cobrança Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    value={precoVendaUnitario}
                    onChange={(e) => setPrecoVendaUnitario(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    id="input-venda-un"
                  />
                </div>

                {/* Seu Custo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 text-ellipsis overflow-hidden whitespace-nowrap">
                    {tipoPlano === 'normal' ? 'Seu Custo Unitário' : 'Custo de Infra Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors font-mono"
                    value={meuCustoUnitario}
                    onChange={(e) => setMeuCustoUnitario(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    id="input-custo-un"
                  />
                </div>
              </div>

              {/* PRÉVIA MATEMÁTICA EM TEMPO REAL NO RODAPÉ */}
              <div className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5" id="realtime-math-preview">
                <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-900 text-slate-400">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Cálculo Prévia do Ciclo
                  </span>
                  <span className="font-mono text-[10px]">Realtime Calc</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Cobrado (Faturamento):</span>
                  <span className="font-mono font-medium text-slate-200">{formatBRL(faturamentoTotalPrevisto)}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Custo Estimado de Infraestrutura:</span>
                  <span className="font-mono font-medium text-slate-200">{formatBRL(custoTotalPrevisto)}</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-900">
                  <span className="font-semibold text-slate-300">Margem Esperada:</span>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${margemLucroPrevista >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatBRL(margemLucroPrevista)}
                    </span>
                    {faturamentoTotalPrevisto > 0 && (
                      <span className={`block text-[10px] font-mono mt-0.5 ${margemLucroPrevista >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                        ({percentualMargem.toFixed(1)}% Margem)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  id="btn-cancel-modal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-sm font-semibold rounded-xl text-white shadow-lg flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    editingRevenda
                      ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-950/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-950/20'
                  }`}
                  id="btn-submit-modal"
                >
                  <Save className="w-4 h-4" />
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
