import { IconUsers, IconRefresh, IconUserPlus } from '@tabler/icons-react'

export function MonitoringSantriHeader({
  loading,
  isAdmin,
  onRefresh,
  onTambah,
}: {
  loading: boolean
  isAdmin: boolean
  onRefresh: () => void
  onTambah: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <IconUsers size={24} className="text-primary" />
          Monitoring Santri
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Data identitas, capaian jilid, dan progress belajar seluruh santri
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          <IconRefresh size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        {isAdmin && (
          <button
            onClick={onTambah}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <IconUserPlus size={16} />
            Tambah Santri
          </button>
        )}
      </div>
    </div>
  )
}
