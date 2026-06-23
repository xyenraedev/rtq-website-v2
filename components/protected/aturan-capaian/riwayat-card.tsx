'use client'

import { IconEye, IconPlayerPlay } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AturanCapaian } from './types'
import { namaModel, formatPersen } from './helpers'

interface RiwayatCardProps {
  r: AturanCapaian
  index: number
  onDetail: (r: AturanCapaian) => void
  onSetAktif: (r: AturanCapaian) => void
}

export function RiwayatCard({ r, index, onDetail, onSetAktif }: RiwayatCardProps) {
  const isAktif = r.is_active
  const nama = namaModel(r.model_versi)

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-2 transition-colors',
        isAktif ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
      )}
    >
      {/* Header: nama model + tanggal, badge status di kanan */}
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

      {/* Parameter aturan */}
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

      {/* Metrik */}
      {r.model_f1 != null ? (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
          <span className="text-muted-foreground">
            Akurasi:{' '}
            <span className="font-semibold text-emerald-600">{formatPersen(r.model_akurasi)}</span>
          </span>
          <span className="text-muted-foreground">
            F1: <span className="font-semibold text-amber-600">{formatPersen(r.model_f1)}</span>
          </span>
        </div>
      ) : (
        <p className="text-[10px] text-amber-600">Belum pernah dilatih</p>
      )}

      {/* Aksi */}
      <div className="flex items-center gap-1.5 pt-0.5 justify-between">
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
      </div>
    </div>
  )
}
