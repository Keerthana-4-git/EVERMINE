import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function MemoryDialog({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
}: {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#24221f]/55 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} border border-[#d8cdbc] bg-[#fbf9f5] shadow-[0_24px_70px_rgba(27,25,22,0.28)]`}
      >
        <header className="flex items-start justify-between border-b border-[#302d29]/10 px-5 py-4 sm:px-7">
          <div>
            {eyebrow && <p className="eyebrow mb-1 text-[0.58rem]">{eyebrow}</p>}
            <h2 className="serif text-3xl leading-tight">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-full p-2 text-[#756d62] hover:bg-[#eee8df]"
          >
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <MemoryDialog title={title} eyebrow="Please confirm" onClose={onCancel}>
      <p className="text-sm leading-6 text-[#71685d]">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="auth-secondary" onClick={onCancel}>
          Keep it
        </button>
        <button
          type="button"
          className="inline-flex min-h-[2.8rem] items-center justify-center border border-[#805449] bg-[#805449] px-4 text-xs font-semibold text-white hover:bg-[#68443b] disabled:opacity-60"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </MemoryDialog>
  )
}
