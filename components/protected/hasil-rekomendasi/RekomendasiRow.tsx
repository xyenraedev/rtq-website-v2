import { memo } from 'react'
import { IconInfoCircle } from '@tabler/icons-react'
import { StatusBadge } from './badges'
import { formatDate, formatDurasiBulan, jilidLabel } from '@/lib/hasil-rekomendasi/helpers'
import type { RekomendasiRow as RekomendasiRowType } from '@/lib/ml-services/hasil-rekomendasi'

type RekomendasiRowProps = {
  row: RekomendasiRowType
  index: number
  onDetail: (row: RekomendasiRowType) => void
}

function RekomendasiRowComponent({ row, index, onDetail }: RekomendasiRowProps) {
  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-4 py-3 text-xs text-muted-foreground">{index + 1}</td>

      <td className="px-4 py-3 text-sm text-muted-foreground">{row.nomor_induk ?? '—'}</td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
            {row.nama.charAt(0)}
          </div>
          <span className="font-medium text-foreground">{row.nama}</span>
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-foreground">{jilidLabel(row.jilid_saat_ini)}</td>

      <td className="px-4 py-3 text-sm text-foreground">
        {row.durasi_jilid_aktif == null ? '—' : formatDurasiBulan(row.durasi_jilid_aktif)}
      </td>

      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {row.taskih_aktif ?? row.total_pengulangan_taskih}x
      </td>

      <td className="px-4 py-3">
        <StatusBadge status={row.status_rekomendasi} />
      </td>

      <td className="px-4 py-3 text-sm text-foreground">
        {row.probabilitas != null ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  row.status_rekomendasi === 'BBK' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.round(row.probabilitas * 100)}%` }}
              />
            </div>
            <span className="text-xs">{Math.round(row.probabilitas * 100)}%</span>
          </div>
        ) : (
          '—'
        )}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(row.classified_at)}</td>

      <td className="px-4 py-3">
        <button
          onClick={() => onDetail(row)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <IconInfoCircle size={13} />
          Lihat
        </button>
      </td>
    </tr>
  )
}

export const RekomendasiRow = memo(RekomendasiRowComponent)
