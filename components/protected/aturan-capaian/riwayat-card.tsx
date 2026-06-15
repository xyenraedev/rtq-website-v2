'use client'

import { IconEye, IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AturanCapaian } from './types'
import { namaModel } from './helpers'

interface RiwayatCardProps {
  r: AturanCapaian
  index: number
  onDetail: (r: AturanCapaian) => void
  onDelete: (r: AturanCapaian) => void
  onSetAktif: (r: AturanCapaian) => void
}

export function RiwayatCard({ r, index, onDetail, onDelete, onSetAktif }: RiwayatCardProps) {
  const isAktif = r.is_active
  const nama = namaModel(
    r.batas_durasi_jilid_0_4,
    r.batas_durasi_jilid_5_6,
    r.batas_pengulangan_taskih
  )

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-2 transition-colors',
        isAktif ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-mono font-semibold text-foreground truncate">{nama}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {new Date(r.created_at).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        {isAktif ? (
          <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border-primary/20 shrink-0">
            Aktif
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 text-muted-foreground shrink-0"
          >
            #{index + 1}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span>
          J0–4: <strong className="text-foreground">{r.batas_durasi_jilid_0_4} bln</strong>
        </span>
        <span>
          J5–6: <strong className="text-foreground">{r.batas_durasi_jilid_5_6} bln</strong>
        </span>
        <span>
          Taskih: <strong className="text-foreground">{r.batas_pengulangan_taskih}×</strong>
        </span>
      </div>

      {r.model_f1 != null && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
          <span className="text-muted-foreground">
            F1:{' '}
            <span className="font-semibold text-amber-600">{Math.round(r.model_f1 * 100)}%</span>
          </span>
          {r.model_akurasi != null && (
            <span className="text-muted-foreground">
              Akurasi:{' '}
              <span className="font-semibold text-emerald-600">
                {Math.round(r.model_akurasi * 100)}%
              </span>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
        <button
          onClick={() => onDetail(r)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border bg-background hover:bg-muted transition-colors"
        >
          <IconEye size={12} />
          Detail
        </button>
        {!isAktif && (
          <button
            onClick={() => onSetAktif(r)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
          >
            <IconPlayerPlay size={12} />
            Aktifkan
          </button>
        )}
        {!isAktif && (
          <button
            onClick={() => onDelete(r)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors ml-auto"
          >
            <IconTrash size={12} />
            Hapus
          </button>
        )}
      </div>
    </div>
  )
}
