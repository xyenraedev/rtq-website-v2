import { useRef } from 'react'
import { IconAlertCircle } from '@tabler/icons-react'

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClassName,
  icon,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClassName?: string
  icon?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              {icon ?? <IconAlertCircle size={24} className="text-amber-600 dark:text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
              confirmClassName ?? 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
