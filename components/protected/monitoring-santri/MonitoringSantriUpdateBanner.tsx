'use client'

import { useRouter } from 'next/navigation'
import { IconX, IconChevronRight, IconSparkles } from '@tabler/icons-react'
import type { LastUpdatedSantriInfo } from '@/lib/monitoring-santri/types'

function StatusPill({ status }: { status: string | null }) {
  if (status === 'BBK') {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
        BBK
      </span>
    )
  }

  if (status === 'TBBK') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        TBBK
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Belum diklasifikasi
    </span>
  )
}

export function MonitoringSantriUpdateBanner({
  info,
  onDismiss,
}: {
  info: LastUpdatedSantriInfo | null
  onDismiss: () => void
}) {
  const router = useRouter()

  if (!info) return null

  function handleClick() {
    router.push(`/protected/hasil-rekomendasi?highlight=${info!.id}`)
    onDismiss()
  }

  const aksiLabel = info.aksi === 'reklasifikasi' ? 'direklasifikasi ulang' : 'diperbarui'

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 animate-in fade-in slide-in-from-top-2 duration-300 sm:flex-row sm:items-center sm:gap-3 sm:py-3">
      <button
        onClick={handleClick}
        className="flex flex-1 items-center gap-3 rounded-lg text-left transition-colors hover:bg-primary/5 sm:-mx-2 sm:px-2 sm:py-1"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconSparkles size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Data santri <span className="font-semibold">{info.nama}</span> baru saja {aksiLabel}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Status klasifikasi:</span>
            <StatusPill status={info.statusRekomendasi} />
          </div>
        </div>

        <IconChevronRight size={18} className="hidden shrink-0 text-primary/60 sm:block" />
      </button>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-xs text-muted-foreground sm:hidden">
          Ketuk untuk lihat detail rekomendasi
        </span>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted"
          aria-label="Tutup notifikasi"
        >
          <IconX size={14} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
