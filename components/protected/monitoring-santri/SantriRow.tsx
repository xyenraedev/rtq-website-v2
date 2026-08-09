import { memo } from 'react'
import { IconEye, IconEdit, IconRotateClockwise } from '@tabler/icons-react'
import { GenderBadge, JilidBadge, StatusAktifBadge } from './badges'
import { formatDate, formatDurasiBulan } from '@/lib/monitoring-santri/helpers'
import type { SantriEnriched } from '@/lib/monitoring-santri/types'

type SantriRowProps = {
  row: SantriEnriched
  index: number
  isAdmin: boolean
  onDetail: (row: SantriEnriched) => void
  onEdit: (row: SantriEnriched) => void
  onReklas: (target: { id: string; nama: string }) => void
}

function SantriRowComponent({ row, index, isAdmin, onDetail, onEdit, onReklas }: SantriRowProps) {
  return (
    <tr className="transition-colors hover:bg-muted/30">
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{index + 1}</td>

      <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {row.nomor_induk ?? '—'}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {row.nama.charAt(0)}
          </div>
          <span className="font-medium text-foreground">{row.nama}</span>
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <GenderBadge jk={row.jenis_kelamin as 'Laki-laki' | 'Perempuan' | null} />
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(row.tanggal_lahir)}
      </td>

      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
        {row._usia != null ? `${row._usia} th` : '—'}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground max-w-45 truncate">
        {row.alamat || '—'}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <JilidBadge jilid={row.jilid_saat_ini} />
      </td>

      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
        {row._lamaBelajar != null ? formatDurasiBulan(row._lamaBelajar) : '—'}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <StatusAktifBadge aktif={row.status_aktif ?? true} />
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(row.created_at)}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
          <button
            onClick={() => onDetail(row)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Lihat detail"
          >
            <IconEye size={15} />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(row)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="Edit identitas"
              >
                <IconEdit size={15} />
              </button>
              <button
                onClick={() => onReklas({ id: row.id, nama: row.nama })}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title="Klasifikasi ulang"
              >
                <IconRotateClockwise size={15} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export const SantriRow = memo(SantriRowComponent)
