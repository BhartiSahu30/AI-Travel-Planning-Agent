import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-4"
          >
            <div className="mt-0.5">
              {t.variant === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : t.variant === 'error' ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Info className="h-5 w-5 text-brand-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
