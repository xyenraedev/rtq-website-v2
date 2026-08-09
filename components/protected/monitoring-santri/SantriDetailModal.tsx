import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconX,
  IconId,
  IconUserCheck,
  IconCalendar,
  IconCake,
  IconMapPin,
  IconStepInto,
  IconHourglass,
  IconBook,
  IconClock,
  IconCheck,
  IconHistory,
  IconTrash,
} from '@tabler/icons-react'
import { fetchRiwayatRekomendasi, fetchRiwayatProgress } from '@/lib/ml-services/monitoring-santri'
import type { SantriDenganRekomendasi, SantriProgress } from '@/lib/types'
import { StatusAktifBadge, StatusKelulusanBadge } from './badges'
import {
  formatDate,
  formatDurasiBulan,
  hitungUsia,
  hitungLamaBelajarBulan,
  jilidLabel,
} from '@/lib/monitoring-santri/helpers'
import type { DurasiKey, StatusKelulusan } from '@/lib/monitoring-santri/types'

type RiwayatItem = {
  id: string
  status: 'BBK' | 'TBBK'
  classified_at: string
  probabilitas: number | null
  sumber: string | null
  alasan: string | null
}

export function SantriDetailModal({
  santri,
  isAdmin,
  onClose,
  onRequestDelete,
}: {
  santri: SantriDenganRekomendasi
  isAdmin: boolean
  onClose: () => void
  onRequestDelete: () => void
}) {
  const router = useRouter()
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [progressList, setProgressList] = useState<SantriProgress[]>([])
  const [loadingDetail, setLoadingDetail] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      santri.status_aktif ? fetchRiwayatRekomendasi(santri.id) : Promise.resolve([]),
      fetchRiwayatProgress(santri.id),
    ])
      .then(([rek, prog]) => {
        setRiwayat((rek as RiwayatItem[]).slice(0, 5))
        setProgressList(prog as SantriProgress[])
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [santri.id, santri.status_aktif])

  const progressByJilid: Record<number, SantriProgress> = {}
  for (const p of progressList) {
    progressByJilid[p.jilid] = p
  }

  const currentJilid = santri.jilid_saat_ini
  const jilidRows = Array.from({ length: currentJilid + 1 }, (_, i) => i)
  const usia = hitungUsia(santri.tanggal_lahir)
  const lamaBelajar = hitungLamaBelajarBulan(santri)

  function handleLihatRekomendasi() {
    onClose()
    router.push(`/protected/hasil-rekomendasi?highlight=${santri.id}`)
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {santri.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">{santri.nama}</h2>
              <p className="text-xs text-muted-foreground">
                {jilidLabel(santri.jilid_saat_ini)} ·{' '}
                {santri.jenis_kelamin === 'Laki-laki'
                  ? 'Laki-laki'
                  : santri.jenis_kelamin === 'Perempuan'
                    ? 'Perempuan'
                    : '—'}{' '}
                · No. {santri.nomor_induk ?? '—'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <IconX size={15} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/40 px-3 py-2.5 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <IconId size={13} />
                Nomor Induk
              </div>
              <p className="text-sm font-semibold text-foreground font-mono">
                {santri.nomor_induk ?? '—'}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <IconUserCheck size={13} />
                Status
              </div>
              <div className="flex flex-wrap gap-1.5">
                <StatusAktifBadge aktif={santri.status_aktif ?? true} />
                <StatusKelulusanBadge status={santri.status_kelulusan as StatusKelulusan | null} />
              </div>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <IconCalendar size={13} />
                Tanggal Lahir
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(santri.tanggal_lahir)}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <IconCake size={13} />
                Usia
              </div>
              <p className="text-sm font-semibold text-foreground">
                {usia != null ? `${usia} tahun` : '—'}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5 col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <IconMapPin size={13} />
                Alamat
              </div>
              <p className="text-sm font-semibold text-foreground">{santri.alamat || '—'}</p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <IconStepInto size={13} />
                Taskih Aktif
              </div>
              <p className="text-sm font-semibold text-foreground">
                {santri.total_pengulangan_taskih}x
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <IconHourglass size={13} />
                Lama Belajar
              </div>
              <p className="text-sm font-semibold text-foreground">{lamaBelajar} bln</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <IconBook size={13} />
              Riwayat Progres Jilid (0 — {jilidLabel(currentJilid)})
            </h3>
            {loadingDetail ? (
              <div className="space-y-2">
                {jilidRows.map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Jilid
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Durasi
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Mulai
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Selesai
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {jilidRows.map((j) => {
                      const prog = progressByJilid[j]
                      const isActive = j === currentJilid
                      const durasiKey = `durasi_jilid_${j}` as DurasiKey
                      const durasi = prog?.durasi_bulan ?? (santri[durasiKey] as number | null)

                      return (
                        <tr
                          key={j}
                          className={`transition-colors ${isActive ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}
                              >
                                {jilidLabel(j)}
                              </span>
                              {isActive && (
                                <span className="text-[8px] bg-primary text-primary-foreground px-1 py-0.5 rounded-full font-bold">
                                  AKTIF
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-foreground font-medium">
                            {durasi != null ? formatDurasiBulan(durasi) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {formatDate(prog?.tanggal_mulai)}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {isActive ? (
                              <span className="text-primary italic">Sedang berjalan</span>
                            ) : (
                              formatDate(prog?.tanggal_selesai)
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                                <IconClock size={9} />
                                Aktif
                              </span>
                            ) : prog ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-semibold">
                                <IconCheck size={9} />
                                Selesai
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {santri.status_aktif && riwayat.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <IconHistory size={13} />
                Klasifikasi Terakhir
              </h3>
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {riwayat[0].status === 'BBK'
                      ? 'Butuh Bimbingan Khusus'
                      : 'Tidak Butuh Bimbingan Khusus'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(riwayat[0].classified_at, true)}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    riwayat[0].status === 'BBK'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}
                >
                  {riwayat[0].status}
                </span>
              </div>
              <button
                onClick={handleLihatRekomendasi}
                className="mt-1.5 text-[11px] text-primary hover:underline font-medium"
              >
                Lihat detail probabilitas & alasan klasifikasi lengkap di halaman Hasil Rekomendasi
                →
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border px-5 py-3 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Tutup
          </button>
          {isAdmin && (
            <button
              onClick={onRequestDelete}
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <IconTrash size={14} />
              Hapus Santri
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
