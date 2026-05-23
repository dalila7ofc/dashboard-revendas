import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Toast } from '../types';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = {
            success: {
              bg: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300',
              icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
            },
            error: {
              bg: 'bg-rose-950/90 border-rose-500/30 text-rose-300',
              icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
            },
            warning: {
              bg: 'bg-amber-950/90 border-amber-500/30 text-amber-300',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
            },
            info: {
              bg: 'bg-slate-900/95 border-slate-700/50 text-slate-300',
              icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
            },
          }[toast.type];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl ${config.bg}`}
              id={`toast-${toast.id}`}
            >
              {config.icon}
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-100 transition-colors p-0.5 rounded-lg hover:bg-slate-800/50"
                aria-label="Close notification"
                id={`close-toast-${toast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
