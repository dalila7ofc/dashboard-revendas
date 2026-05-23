import { Search, SlidersHorizontal, Trash2, X } from 'lucide-react';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  onClearFilters: () => void;
  counts: {
    todos: number;
    pago: number;
    parcial: number;
    pendente: number;
  };
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onClearFilters,
  counts,
}: FiltersProps) {
  const filterTabs = [
    { label: 'Todos', value: 'todos', count: counts.todos, iconBg: 'bg-slate-800 text-slate-300' },
    { label: 'Pago', value: 'pago', count: counts.pago, iconBg: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Parcial', value: 'parcial', count: counts.parcial, iconBg: 'bg-amber-500/10 text-amber-400' },
    { label: 'Pendente', value: 'pendente', count: counts.pendente, iconBg: 'bg-rose-500/10 text-rose-400' },
  ];

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'todos';

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl mb-6 flex flex-col gap-4 shadow-md" id="filter-panel">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Real-time Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Buscar por nome do revendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800/50 transition-colors"
              title="Limpar busca"
              id="clear-search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick status counters summary */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg border border-indigo-500/10 transition-colors"
              id="btn-clear-filters"
            >
              Limpar Filtros
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-800/50 bg-slate-950/30 px-3 py-1.5 rounded-lg font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Mais filtros e relatórios disponíveis</span>
          </div>
        </div>
      </div>

      {/* Responsive Segmented control tabs */}
      <div className="border-t border-slate-800/30 pt-3 flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-slate-100 border-indigo-500/50 shadow-sm shadow-indigo-500/5'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:bg-slate-950/80 hover:text-slate-200'
              }`}
              id={`filter-${tab.value}`}
            >
              <span>{tab.label}</span>
              <span className={`inline-flex px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                isActive ? 'bg-indigo-500 text-white font-bold' : tab.iconBg
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
