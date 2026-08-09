import { IconUsers, IconGenderBigender, IconUserCheck } from '@tabler/icons-react'
import { StatCard, StatCardSkeleton } from './badges'
import type { SantriDenganRekomendasi, MonitoringStats } from '@/lib/types'

export function MonitoringSantriStats({
  stats,
  santriList,
  loading,
}: {
  stats: MonitoringStats | null
  santriList: SantriDenganRekomendasi[]
  loading: boolean
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Santri"
        value={stats.total_santri}
        icon={IconUsers}
        color="bg-primary"
      />
      <StatCard
        label="Laki-laki"
        value={santriList.filter((s) => s.jenis_kelamin === 'Laki-laki').length}
        icon={IconGenderBigender}
        color="bg-blue-500"
      />
      <StatCard
        label="Perempuan"
        value={santriList.filter((s) => s.jenis_kelamin === 'Perempuan').length}
        icon={IconGenderBigender}
        color="bg-pink-500"
      />
      <StatCard
        label="Santri Aktif"
        value={santriList.filter((s) => s.status_aktif).length}
        icon={IconUserCheck}
        color="bg-emerald-500"
      />
    </div>
  )
}
