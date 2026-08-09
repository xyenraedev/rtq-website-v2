import { IconChartBar } from '@tabler/icons-react'
import { SortIcon } from './badges'
import { RekomendasiRow } from './RekomendasiRow'
import { TablePagination } from '@/components/shared/TablePagination'
import type { HasilRekomendasiState } from '@/hooks/protected/hasil-rekomendasi/useHasilRekomendasi'

const thClass =
  'px-4 py-3 text-left text-xs font-semibold text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors group'
const thInner = 'flex items-center gap-1'
const thStatic = 'px-4 py-3 text-left text-xs font-semibold text-muted-foreground'

const COLUMN_COUNT = 10 // No, No.Induk, Nama, Jilid, Durasi, Taskih, Status, Probabilitas, Klasifikasi, Detail

export function HasilRekomendasiTable({ state }: { state: HasilRekomendasiState }) {
  const {
    paginated,
    page,
    pageSize,
    totalPages,
    goToPage,
    changePageSize,
    pageSizeOptions,
    sortedData,
    loading,
    sortKey,
    sortDir,
    handleSort,
    setDetailRow,
  } = state

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className={`${thStatic} w-10`}>No</th>

              <th className={thClass} onClick={() => handleSort('nomor_induk')}>
                <div className={thInner}>
                  No. Induk
                  <SortIcon col="nomor_induk" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('nama')}>
                <div className={thInner}>
                  Nama
                  <SortIcon col="nama" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('jilid_saat_ini')}>
                <div className={thInner}>
                  Jilid
                  <SortIcon col="jilid_saat_ini" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('durasi_jilid_aktif')}>
                <div className={thInner}>
                  Durasi Aktif
                  <SortIcon col="durasi_jilid_aktif" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('total_pengulangan_taskih')}>
                <div className={thInner}>
                  Taskih
                  <SortIcon col="total_pengulangan_taskih" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('status_rekomendasi')}>
                <div className={thInner}>
                  Status
                  <SortIcon col="status_rekomendasi" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('probabilitas')}>
                <div className={thInner}>
                  Probabilitas
                  <SortIcon col="probabilitas" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thClass} onClick={() => handleSort('classified_at')}>
                <div className={thInner}>
                  Klasifikasi
                  <SortIcon col="classified_at" sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>

              <th className={thStatic}>Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <IconChartBar size={32} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">Belum ada data rekomendasi</p>
                    <p className="text-muted-foreground text-xs">
                      Klik &quot;Jalankan Ulang Klasifikasi&quot; untuk memulai
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <RekomendasiRow
                  key={row.id}
                  row={row}
                  index={(page - 1) * pageSize + idx}
                  onDetail={setDetailRow}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        totalItems={sortedData.length}
        goToPage={goToPage}
        changePageSize={changePageSize}
        itemLabel="santri"
      />
    </div>
  )
}
