import { IconUsers } from '@tabler/icons-react'
import { SortIcon } from './badges'
import { SantriRow } from './SantriRow'
import { TablePagination } from './TablePagination'
import type { MonitoringSantriState } from '@/hooks/protected/monitoring-santri/useMonitoringSantri'

const thBase = 'px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap'
const thClass = `${thBase} select-none cursor-pointer hover:text-foreground transition-colors`
const thInner = 'flex items-center gap-1.5'

export function MonitoringSantriTable({ state }: { state: MonitoringSantriState }) {
  const {
    paginated,
    page,
    pageSize,
    loading,
    isAdmin,
    sortKey,
    sortDir,
    handleSort,
    isFiltered,
    resetFilters,
    setDetailSantri,
    openEdit,
    setConfirmReklas,
  } = state

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className={`${thBase} w-10`}>No</th>
              <th className={thClass} onClick={() => handleSort('nomor_induk')}>
                <div className={thInner}>
                  No. Induk
                  <SortIcon
                    active={sortKey === 'nomor_induk'}
                    dir={sortKey === 'nomor_induk' ? sortDir : null}
                  />
                </div>
              </th>
              <th className={thClass} onClick={() => handleSort('nama')}>
                <div className={thInner}>
                  Nama
                  <SortIcon active={sortKey === 'nama'} dir={sortKey === 'nama' ? sortDir : null} />
                </div>
              </th>
              <th className={thBase}>Gender</th>
              <th className={thBase}>Tanggal Lahir</th>
              <th className={thClass} onClick={() => handleSort('usia')}>
                <div className={thInner}>
                  Usia
                  <SortIcon active={sortKey === 'usia'} dir={sortKey === 'usia' ? sortDir : null} />
                </div>
              </th>
              <th className={thBase}>Alamat</th>
              <th className={thClass} onClick={() => handleSort('jilid_saat_ini')}>
                <div className={thInner}>
                  Jilid
                  <SortIcon
                    active={sortKey === 'jilid_saat_ini'}
                    dir={sortKey === 'jilid_saat_ini' ? sortDir : null}
                  />
                </div>
              </th>
              <th className={thClass} onClick={() => handleSort('lama_belajar')}>
                <div className={thInner}>
                  Lama Belajar
                  <SortIcon
                    active={sortKey === 'lama_belajar'}
                    dir={sortKey === 'lama_belajar' ? sortDir : null}
                  />
                </div>
              </th>
              <th className={thBase}>Status</th>
              <th className={thClass} onClick={() => handleSort('created_at')}>
                <div className={thInner}>
                  Terdaftar
                  <SortIcon
                    active={sortKey === 'created_at'}
                    dir={sortKey === 'created_at' ? sortDir : null}
                  />
                </div>
              </th>
              <th className={`${thBase} text-center`}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 12 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <IconUsers size={32} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">
                      {isFiltered
                        ? 'Tidak ada santri yang cocok dengan filter'
                        : 'Belum ada data santri'}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={resetFilters}
                        className="text-primary text-xs underline mt-1"
                      >
                        Reset filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <SantriRow
                  key={row.id}
                  row={row}
                  index={(page - 1) * pageSize + idx}
                  isAdmin={isAdmin}
                  onDetail={setDetailSantri}
                  onEdit={openEdit}
                  onReklas={setConfirmReklas}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination state={state} />
    </div>
  )
}
