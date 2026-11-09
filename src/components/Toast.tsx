import {
  useCallback,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { ToastContext } from './toast-context'
import type { ToastKind } from './toast-context'

type ToastMessage = {
  id: number
  message: string
  kind: ToastKind
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const showToast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, message, kind }])
      window.setTimeout(
        () => setToasts((current) => current.filter((toast) => toast.id !== id)),
        3800,
      )
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-3 border border-[#d8cdbc] bg-[#fffdf9] px-4 py-3 text-sm shadow-[0_12px_36px_rgba(48,45,41,0.12)]"
              role="status"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eee8df] text-[#776248]">
                {toast.kind === 'success' ? <Check size={15} /> : <X size={15} />}
              </span>
              <span className="flex-1 text-[#454039]">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id),
                  )
                }
                className="text-[#8b8175] hover:text-[#302d29]"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
