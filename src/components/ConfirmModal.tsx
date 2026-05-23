import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-10"
            id="confirmation-modal"
          >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full ${isDestructive ? 'bg-rose-500' : 'bg-amber-500'}`} />

            <div className="p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                id="btn-close-confirm"
                aria-label="Close confirmation"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-xl shrink-0 ${isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-100 tracking-tight" id="confirm-modal-title">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed" id="confirm-modal-message">
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-colors"
                  id="btn-cancel-confirm"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-5 py-2 text-sm font-medium rounded-xl text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                    isDestructive
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-950/20'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-950/20'
                  }`}
                  id="btn-submit-confirm"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
