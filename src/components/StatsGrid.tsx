import { motion } from 'motion/react';
import { Home, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { formatBRL, formatNumber } from '../utils';

interface StatsGridProps {
  totalCasinhas: number;
  faturamentoCobrado: number;
  custoTotal: number;
  lucroRealizado: number;
}

export default function StatsGrid({
  totalCasinhas,
  faturamentoCobrado,
  custoTotal,
  lucroRealizado,
}: StatsGridProps) {
  const isProfitPositive = lucroRealizado >= 0;

  const cards = [
    {
      id: 'stat-casinhas',
      title: 'Total de Casinhas (Slots)',
      value: formatNumber(totalCasinhas),
      subtitle: 'Usuários ativos geridos',
      icon: <Home className="w-5 h-5 text-indigo-400" />,
      bgIcon: 'bg-indigo-500/10 border-indigo-500/20',
      borderAccent: 'hover:border-indigo-500/30',
      cardClass: 'bg-slate-900 border-slate-800/80',
    },
    {
      id: 'stat-faturamento',
      title: 'Faturamento Cobrado',
      value: formatBRL(faturamentoCobrado),
      subtitle: 'Soma total dos ciclos',
      icon: <DollarSign className="w-5 h-5 text-purple-400" />,
      bgIcon: 'bg-purple-500/10 border-purple-500/20',
      borderAccent: 'hover:border-purple-500/30',
      cardClass: 'bg-slate-900 border-slate-800/80',
    },
    {
      id: 'stat-custo',
      title: 'Seu Custo de Infraestrutura',
      value: formatBRL(custoTotal),
      subtitle: 'Obrigações e despesas de slots',
      icon: <Activity className="w-5 h-5 text-rose-400" />,
      bgIcon: 'bg-rose-500/10 border-rose-500/20',
      borderAccent: 'hover:border-rose-500/30',
      cardClass: 'bg-slate-900 border-slate-800/80',
    },
    {
      id: 'stat-lucro',
      title: 'Lucro Realizado',
      value: formatBRL(lucroRealizado),
      subtitle: isProfitPositive ? 'Retorno financeiro real' : 'Prejuízo parcial registrado',
      icon: <TrendingUp className={`w-5 h-5 ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`} />,
      bgIcon: isProfitPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20',
      borderAccent: isProfitPositive ? 'hover:border-emerald-500/30' : 'hover:border-rose-500/30',
      valueColor: isProfitPositive ? 'text-emerald-400' : 'text-rose-400',
      cardClass: isProfitPositive 
        ? 'bg-gradient-to-br from-slate-900 to-emerald-950/20 border-emerald-500/20 shadow-emerald-500/5'
        : 'bg-gradient-to-br from-slate-900 to-rose-950/20 border-rose-500/20 shadow-rose-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className={`border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-lg ${card.cardClass} ${card.borderAccent}`}
          id={card.id}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="text-xs font-medium text-slate-400 tracking-wider uppercase">
                {card.title}
              </p>
              <h3 className={`text-2xl font-bold tracking-tight mt-1.5 ${card.valueColor || 'text-slate-100'}`}>
                {card.value}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl border ${card.bgIcon} shrink-0`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-500">
            <span>{card.subtitle}</span>
            <span className="font-mono text-[10px] text-slate-600">ID: {(idx + 1).toString().padStart(2, '0')}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
