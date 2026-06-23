'use client'

import {
  IconCheck,
  IconAlertTriangle,
  IconLoader2,
  IconCircleCheck,
  IconChartBar,
  IconX,
} from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ProcessConfig, EvaluasiResult } from './types'
import { formatPersen } from './helpers'

interface ProcessDialogProps {
  open: boolean
  config: ProcessConfig | null
  evaluasi?: EvaluasiResult | null
  onClose: () => void
  onAction?: () => void
  actionLabel?: string
  actionDisabled?: boolean
}

export function ProcessDialog({
  open,
  config,
  evaluasi,
  onClose,
  onAction,
  actionLabel,
  actionDisabled,
}: ProcessDialogProps) {
  if (!config) return null

  const allDone = config.steps.every((s) => s.status === 'done')
  const hasError = config.steps.some((s) => s.status === 'error')
  const running = config.steps.find((s) => s.status === 'running')
  const currentIdx = config.steps.findIndex((s) => s.status === 'running')
  const doneCount = config.steps.filter((s) => s.status === 'done').length
  const progress = Math.round((doneCount / config.steps.length) * 100)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && allDone && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {allDone ? (
              <IconCircleCheck size={18} className="text-emerald-500" />
            ) : hasError ? (
              <IconAlertTriangle size={18} className="text-red-500" />
            ) : (
              <IconLoader2 size={18} className="animate-spin text-primary" />
            )}
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-xs">{config.subtitle}</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              {allDone
                ? 'Selesai'
                : hasError
                  ? 'Terjadi kesalahan'
                  : running
                    ? running.label
                    : 'Memulai...'}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Steps list */}
        <div className="space-y-1 py-1">
          {config.steps.map((step, idx) => {
            const isActive = step.status === 'running'
            const isDone = step.status === 'done'
            const isIdle = step.status === 'idle'
            const isError = step.status === 'error'
            const isPast = idx < currentIdx

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300',
                  isActive && 'border-primary/30 bg-primary/5',
                  isDone &&
                    'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10',
                  isError && 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10',
                  isIdle && !isPast && 'border-border bg-card opacity-40',
                  isIdle && isPast && 'border-border bg-card opacity-40'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    isActive && 'bg-primary/10 text-primary',
                    isDone && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
                    isError && 'bg-red-100 dark:bg-red-900/40 text-red-600',
                    isIdle && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isActive ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : isDone ? (
                    <IconCheck size={14} />
                  ) : isError ? (
                    <IconX size={14} />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      isActive && 'text-primary',
                      isDone && 'text-emerald-700 dark:text-emerald-400',
                      isError && 'text-red-700 dark:text-red-400',
                      isIdle && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                  {step.result && (
                    <p
                      className={cn(
                        'text-[10px] font-medium mt-1 font-mono',
                        isDone && 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {step.result}
                    </p>
                  )}
                </div>

                {/* Step number */}
                <span
                  className={cn(
                    'text-[10px] tabular-nums shrink-0 mt-1',
                    isActive && 'text-primary font-semibold',
                    isDone && 'text-emerald-600 dark:text-emerald-400',
                    isIdle && 'text-muted-foreground'
                  )}
                >
                  {idx + 1}/{config.steps.length}
                </span>
              </div>
            )
          })}
        </div>

        {/* Evaluasi result setelah latih */}
        {allDone && evaluasi && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IconChartBar size={12} />
                Hasil Evaluasi Model
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: 'Akurasi',
                    value: evaluasi.akurasi,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                  },
                  {
                    label: 'Precision',
                    value: evaluasi.precision,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50 dark:bg-blue-950/20',
                  },
                  {
                    label: 'Recall',
                    value: evaluasi.recall,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50 dark:bg-purple-950/20',
                  },
                  {
                    label: 'F1-Score',
                    value: evaluasi.f1,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50 dark:bg-amber-950/20',
                  },
                ].map(({ label, value, color, bg }) => (
                  <div
                    key={label}
                    className={cn('p-2.5 rounded-xl border border-border text-center', bg)}
                  >
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className={cn('text-lg font-bold', color)}>{formatPersen(value)}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                {evaluasi.berhasil} santri berhasil diklasifikasi ulang
              </p>
            </div>
          </>
        )}

        <DialogFooter>
          {allDone ? (
            <Button onClick={onClose} className="w-full">
              <IconCheck size={14} className="mr-1.5" />
              Selesai
            </Button>
          ) : hasError ? (
            <Button variant="outline" onClick={onClose} className="w-full">
              Tutup
            </Button>
          ) : onAction && actionLabel ? (
            <Button onClick={onAction} disabled={actionDisabled} className="w-full">
              {actionDisabled ? <IconLoader2 size={14} className="mr-1.5 animate-spin" /> : null}
              {actionLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
