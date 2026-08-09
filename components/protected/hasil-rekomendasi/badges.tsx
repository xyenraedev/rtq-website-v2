import {
  IconAlertTriangle,
  IconCheck,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react'
import type { StatusRekomendasi } from '@/lib/types'
import type { SortKey, SortDir } from '@/lib/hasil-rekomendasi/types'

export function StatusBadge({ status }: { status: StatusRekomendasi | null }) {
  if (!status)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Belum
      </span>
    )
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        status === 'BBK'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      }`}
    >
      {status === 'BBK' ? <IconAlertTriangle size={10} /> : <IconCheck size={10} />}
      {status}
    </span>
  )
}

// Badge status aktif santri (aktif / tidak aktif)
export function StatusAktifBadge({ statusAktif }: { statusAktif: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        statusAktif
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {statusAktif ? <IconCircleCheck size={10} /> : <IconCircleX size={10} />}
      {statusAktif ? 'Aktif' : 'Nonaktif'}
    </span>
  )
}

// Badge status kelulusan santri — teks generik, disesuaikan dengan nilai
// enum status_kelulusan yang tersimpan di DB.
export function StatusKelulusanBadge({ status }: { status: string }) {
  const isLulus = status.toLowerCase() === 'lulus'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        isLulus
          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}
    >
      {status}
    </span>
  )
}

export function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey
  sortKey: SortKey | null
  sortDir: SortDir
}) {
  if (sortKey !== col) return <IconSelector size={13} className="text-muted-foreground/40" />
  if (sortDir === 'asc') return <IconChevronUp size={13} className="text-primary" />
  if (sortDir === 'desc') return <IconChevronDown size={13} className="text-primary" />
  return <IconSelector size={13} className="text-muted-foreground/40" />
}
