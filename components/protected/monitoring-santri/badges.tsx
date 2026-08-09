import { IconBookmark, IconUserCheck, IconUserOff } from '@tabler/icons-react'
import type { StatusKelulusan } from '@/lib/monitoring-santri/types'
import type { SortDir } from '@/lib/monitoring-santri/types'
import { jilidLabel } from '@/lib/monitoring-santri/helpers'

export function GenderBadge({ jk }: { jk: 'Laki-laki' | 'Perempuan' | null }) {
  if (!jk) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium">
      {jk === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}
    </span>
  )
}

export function JilidBadge({ jilid }: { jilid: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap">
      <IconBookmark size={10} />
      {jilidLabel(jilid)}
    </span>
  )
}

export function StatusAktifBadge({ aktif }: { aktif: boolean }) {
  if (aktif) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap">
        <IconUserCheck size={10} />
        Aktif
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground whitespace-nowrap">
      <IconUserOff size={10} />
      Nonaktif
    </span>
  )
}

export function StatusKelulusanBadge({ status }: { status: StatusKelulusan | null | undefined }) {
  const map: Record<StatusKelulusan, { label: string; className: string }> = {
    belum_lulus: {
      label: 'Belum Lulus',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    lulus: {
      label: 'Lulus',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    keluar: {
      label: 'Keluar',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  }
  const item = status ? map[status] : null
  if (!item) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${item.className}`}
    >
      {item.label}
    </span>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-muted-foreground/30 text-[10px]">⇕</span>
  if (dir === 'asc') return <span className="text-primary text-[10px]">▲</span>
  if (dir === 'desc') return <span className="text-primary text-[10px]">▼</span>
  return <span className="text-muted-foreground/30 text-[10px]">⇕</span>
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-lg bg-muted animate-pulse w-9 h-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        <div className="h-6 w-10 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}
