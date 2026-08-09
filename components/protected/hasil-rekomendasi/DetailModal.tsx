import { useRef } from 'react'
import {
  IconX,
  IconBrain,
  IconCalendar,
  IconUser,
  IconBook,
  IconClock,
  IconRepeat,
  IconPercentage,
  IconActivity,
  IconSchool,
} from '@tabler/icons-react'
import { StatusBadge, StatusAktifBadge, StatusKelulusanBadge } from './badges'
import { formatDate, formatDurasiBulan, jilidLabel } from '@/lib/hasil-rekomendasi/helpers'
import type { RekomendasiRow } from '@/lib/ml-services/hasil-rekomendasi'

export function DetailModal({ row, onClose }: { row: RekomendasiRow; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const detailItems: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    { icon: <IconUser size={14} />, label: 'Nama', value: row.nama },
    { icon: <IconUser size={14} />, label: 'Jenis Kelamin', value: row.jenis_kelamin ?? '—' },
    {
      icon: <IconActivity size={14} />,
      label: 'Status Aktif',
      value: <StatusAktifBadge statusAktif={row.status_aktif} />,
    },
    {
      icon: <IconSchool size={14} />,
      label: 'Status Kelulusan',
      value: <StatusKelulusanBadge status={row.status_kelulusan} />,
    },
    {
      icon: <IconBook size={14} />,
      label: 'Jilid Saat Ini',
      value: jilidLabel(row.jilid_saat_ini),
    },
    {
      icon: <IconClock size={14} />,
      label: 'Durasi Jilid Aktif',
      value: row.durasi_jilid_aktif != null ? formatDurasiBulan(row.durasi_jilid_aktif) : '—',
    },
    {
      icon: <IconRepeat size={14} />,
      label: 'Taskih Aktif',
      value: row.taskih_aktif != null ? `${row.taskih_aktif}x` : '—',
    },
    {
      icon: <IconPercentage size={14} />,
      label: 'Probabilitas',
      value: row.probabilitas != null ? `${Math.round(row.probabilitas * 100)}%` : '—',
    },
    {
      icon: <IconCalendar size={14} />,
      label: 'Tanggal Klasifikasi',
      value: formatDate(row.classified_at),
    },
    {
      icon: <IconBrain size={14} />,
      label: 'Sumber Klasifikasi',
      value: row.sumber_rekomendasi ?? '—',
    },
  ]

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
              {row.nama.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{row.nama}</h3>
              <p className="text-xs text-muted-foreground">Detail Keputusan Klasifikasi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={row.status_rekomendasi} />
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <IconX size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {detailItems.map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                  {item.icon}
                  {item.label}
                </div>
                <div className="text-sm font-semibold text-foreground">{item.value}</div>
              </div>
            ))}
          </div>

          {row.alasan_rekomendasi ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <IconBrain size={13} />
                ALASAN KEPUTUSAN MODEL
              </div>
              <pre className="whitespace-pre-wrap rounded-xl bg-muted/40 border border-border/60 p-4 font-mono text-xs leading-relaxed text-foreground/80">
                {row.alasan_rekomendasi}
              </pre>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-4">
              Tidak ada alasan tersedia
            </p>
          )}
        </div>

        <div className="border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
