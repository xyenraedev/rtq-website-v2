import { IconSearch, IconFilter, IconRotateClockwise, IconRefresh } from '@tabler/icons-react'
import { jilidLabel } from '@/lib/monitoring-santri/helpers'
import type { StatusRekomendasi } from '@/lib/types'
import type { HasilRekomendasiState } from '@/hooks/protected/hasil-rekomendasi/useHasilRekomendasi'

export function HasilRekomendasiFilterBar({ state }: { state: HasilRekomendasiState }) {
  const {
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterJilid,
    setFilterJilid,
    filterProbabilitas,
    setFilterProbabilitas,
    jilidOptions,
    isFiltered,
    resetAll,
    loadData,
    sortedData,
    data,
  } = state

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <IconSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama santri..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <IconFilter size={14} className="text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusRekomendasi | '')}
              className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Semua Status</option>
              <option value="BBK">BBK</option>
              <option value="TBBK">TBBK</option>
            </select>
          </div>

          <select
            value={filterJilid}
            onChange={(e) => setFilterJilid(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Jilid</option>
            {jilidOptions.map((j) => (
              <option key={j} value={j}>
                {jilidLabel(j)}
              </option>
            ))}
          </select>

          <select
            value={filterProbabilitas}
            onChange={(e) => setFilterProbabilitas(e.target.value as typeof filterProbabilitas)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Probabilitas</option>
            <option value="tinggi">Probabilitas Tinggi (≥80%)</option>
            <option value="sedang">Probabilitas Sedang (50–79%)</option>
            <option value="rendah">Probabilitas Rendah (&lt;50%)</option>
          </select>

          {isFiltered && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconRotateClockwise size={14} />
              Reset
            </button>
          )}

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <IconRefresh size={15} />
            Refresh
          </button>
        </div>
      </div>

      {isFiltered && (
        <p className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{sortedData.length}</span>{' '}
          dari {data.length} santri
        </p>
      )}
    </div>
  )
}
