import { Plus, Download, RotateCcw, Building2, LogOut } from 'lucide-react';
import { formatBRL } from '../utils';

interface HeaderProps {
  onAddClick: () => void;
  onExportClick: () => void;
  onResetClick: () => void;
  lucroRealizado: number;
  user: any;
  onLogout: () => void;
}

export default function Header({ onAddClick, onExportClick, onResetClick, lucroRealizado, user, onLogout }: HeaderProps) {
  const isLoss = lucroRealizado < 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-4 md:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Title and Identification */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/15 text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight" id="header-app-title">
              Gestão de <span className="text-indigo-400">Casinhas</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Controle de Slots, Faturamentos, Custos e Lucro Líquido Realizado
            </p>
          </div>
        </div>

        {/* Indicador financeiro, Conta e Botões de Ação */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 w-full md:w-auto">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Lucro / Saldo Realizado do Profissional Polish */}
            <div className="text-left sm:text-right px-4 py-2 border border-slate-800/60 bg-slate-900/40 rounded-xl shrink-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Lucro Líquido Realizado</p>
              <p className={`text-base font-bold font-mono tracking-tight ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatBRL(lucroRealizado)}
              </p>
            </div>

            {/* Caixa de Usuário Autenticado */}
            {user && (
              <div className="flex items-center gap-2.5 pl-3 py-1.5 pr-2.5 border border-slate-800/60 bg-slate-900/40 rounded-xl shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuário'}
                    className="w-7 h-7 rounded-lg border border-slate-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20 uppercase">
                    {(user.displayName || user.email || 'U').substring(0, 2)}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-[9px] text-slate-500 font-mono tracking-tight font-semibold">PAINEL SESSÃO</p>
                  <p className="text-[11px] font-bold text-slate-300 max-w-[100px] sm:max-w-[120px] truncate" title={user.displayName || user.email || ''}>
                    {user.displayName || user.email?.split('@')[0] || 'Usuário'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Sair da Conta Google"
                  id="btn-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial">
            {/* Zerar Banco */}
            <button
              onClick={onResetClick}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-all cursor-pointer flex-1 sm:flex-initial"
              title="Apagar todos os dados e começar do zero"
              id="btn-reset-db"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Zerar Banco
            </button>

            {/* Exportar CSV */}
            <button
              onClick={onExportClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all cursor-pointer flex-1 sm:flex-initial"
              title="Exportar dados para Excel (.CSV)"
              id="btn-export-csv"
            >
              <Download className="w-3.5 h-3.5" />
              Backup CSV
            </button>

            {/* Cadastrar Revenda */}
            <button
              onClick={onAddClick}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-slate-950 bg-indigo-500 hover:bg-indigo-400 text-slate-950 bg-gradient-to-r from-indigo-400 to-indigo-500 hover:from-indigo-300 hover:to-indigo-400 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer w-full sm:w-auto text-[slate-950] font-bold"
              id="btn-add-partner"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              Nova Revenda
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
