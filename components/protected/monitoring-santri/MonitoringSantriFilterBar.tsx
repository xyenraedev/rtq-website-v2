import { IconSearch, IconFilter, IconRotateClockwise } from '@tabler/icons-react'
import { STATUS_KELULUSAN_OPTIONS } from '@/lib/monitoring-santri/types'
import { kategoriUsiaLabel, jilidLabel } from '@/lib/monitoring-santri/helpers'
import type { MonitoringSantriState } from '@/hooks/protected/monitoring-santri/useMonitoringSantri'

export function MonitoringSantriFilterBar({ state }: { state: MonitoringSantriState }) {
  const {
    search,
    setSearch,
    filterJilid,
    setFilterJilid,
    filterJenisKelamin,
    setFilterJenisKelamin,
    filterUsia,
    setFilterUsia,
    filterStatusAktif,
    setFilterStatusAktif,
    filterStatusKelulusan,
    setFilterStatusKelulusan,
    isFiltered,
    resetFilters,
    jilidOptions,
    sorted,
    santriList,
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
            placeholder="Cari nama atau nomor induk..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <IconFilter size={14} className="text-muted-foreground" />
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
          </div>

          <select
            value={filterJenisKelamin}
            onChange={(e) => setFilterJenisKelamin(e.target.value as typeof filterJenisKelamin)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>

          <select
            value={filterUsia}
            onChange={(e) => setFilterUsia(e.target.value as typeof filterUsia)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Usia</option>
            <option value="anak">{kategoriUsiaLabel('anak')}</option>
            <option value="remaja">{kategoriUsiaLabel('remaja')}</option>
            <option value="dewasa">{kategoriUsiaLabel('dewasa')}</option>
          </select>

          <select
            value={filterStatusAktif}
            onChange={(e) => setFilterStatusAktif(e.target.value as typeof filterStatusAktif)}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Keaktifan</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          <select
            value={filterStatusKelulusan}
            onChange={(e) =>
              setFilterStatusKelulusan(e.target.value as typeof filterStatusKelulusan)
            }
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Kelulusan</option>
            {STATUS_KELULUSAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconRotateClockwise size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {isFiltered && (
        <p className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{sorted.length}</span> dari{' '}
          {santriList.length} santri
        </p>
      )}
    </div>
  )
}
