'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  IconUsers,
  IconUserPlus,
  IconBook,
  IconRefresh,
  IconTrash,
  IconEdit,
  IconSearch,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconEye,
  IconBookmark,
  IconTrendingUp,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconAlertCircle,
  IconCalendar,
  IconMapPin,
  IconBrain,
  IconClock,
  IconRotateClockwise,
  IconFilter,
  IconStepInto,
  IconHistory,
} from '@tabler/icons-react'
import {
  fetchSantriList,
  fetchMonitoringStats,
  fetchRiwayatRekomendasi,
  fetchRiwayatProgress,
  insertSantri,
  updateSantri,
  deleteSantri,
  reklasifikasiSantri,
} from '@/lib/ml-services/monitoring-santri'
import type {
  SantriDenganRekomendasi,
  SantriFormData,
  MonitoringStats,
  SantriProgress,
} from '@/lib/types'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Constants & Types ────────────────────────────────────────────────────────

type SortField =
  | 'nama'
  | 'jilid_saat_ini'
  | 'total_pengulangan_taskih'
  | 'status_rekomendasi'
  | 'created_at'

type SortDir = 'asc' | 'desc' | null

type DurasiKey =
  | 'durasi_jilid_0'
  | 'durasi_jilid_1'
  | 'durasi_jilid_2'
  | 'durasi_jilid_3'
  | 'durasi_jilid_4'
  | 'durasi_jilid_5'
  | 'durasi_jilid_6'

const DURASI_KEYS: DurasiKey[] = [
  'durasi_jilid_0',
  'durasi_jilid_1',
  'durasi_jilid_2',
  'durasi_jilid_3',
  'durasi_jilid_4',
  'durasi_jilid_5',
  'durasi_jilid_6',
]

const EMPTY_FORM: SantriFormData = {
  nama: '',
  tanggal_lahir: '',
  alamat: '',
  jenis_kelamin: 'L',
  jilid_saat_ini: 1,
  total_pengulangan_taskih: 0,
  durasi_jilid_0: '',
  durasi_jilid_1: '',
  durasi_jilid_2: '',
  durasi_jilid_3: '',
  durasi_jilid_4: '',
  durasi_jilid_5: '',
  durasi_jilid_6: '',
}

function jilidLabel(n: number) {
  return n === 7 ? 'Al-Quran' : `Jilid ${n}`
}

function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function santriToForm(s: SantriDenganRekomendasi): SantriFormData {
  return {
    nama: s.nama,
    tanggal_lahir: s.tanggal_lahir ?? '',
    alamat: s.alamat ?? '',
    jenis_kelamin: s.jenis_kelamin ?? 'L',
    jilid_saat_ini: s.jilid_saat_ini,
    total_pengulangan_taskih: s.total_pengulangan_taskih,
    durasi_jilid_0: s.durasi_jilid_0?.toString() ?? '',
    durasi_jilid_1: s.durasi_jilid_1?.toString() ?? '',
    durasi_jilid_2: s.durasi_jilid_2?.toString() ?? '',
    durasi_jilid_3: s.durasi_jilid_3?.toString() ?? '',
    durasi_jilid_4: s.durasi_jilid_4?.toString() ?? '',
    durasi_jilid_5: s.durasi_jilid_5?.toString() ?? '',
    durasi_jilid_6: s.durasi_jilid_6?.toString() ?? '',
  }
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'BBK' | 'TBBK' | null }) {
  if (!status)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        Belum
      </span>
    )
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        status === 'BBK'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      }`}
    >
      {status === 'BBK' ? <IconAlertTriangle size={10} /> : <IconCheck size={10} />}
      {status}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortField
  sortKey: SortField | null
  sortDir: SortDir
}) {
  if (sortKey !== col) return <IconSelector size={13} className="text-muted-foreground/40" />
  if (sortDir === 'asc') return <IconChevronUp size={13} className="text-primary" />
  if (sortDir === 'desc') return <IconChevronDown size={13} className="text-primary" />
  return <IconSelector size={13} className="text-muted-foreground/40" />
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClassName,
  icon,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClassName?: string
  icon?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              {icon ?? <IconAlertCircle size={24} className="text-amber-600 dark:text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
              confirmClassName ?? 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function SantriForm({
  initial,
  progressList,
  onClose,
  onSaved,
}: {
  initial?: SantriDenganRekomendasi | null
  progressList?: SantriProgress[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SantriFormData>(initial ? santriToForm(initial) : EMPTY_FORM)
  const overlayRef = useRef<HTMLDivElement>(null)

  const jilid = Number(form.jilid_saat_ini)

  // Build a map from progress records so we can pre-fill historical jilid durations
  const progressByJilid: Record<number, SantriProgress> = {}
  for (const p of progressList ?? []) {
    progressByJilid[p.jilid] = p
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim()) {
      toast.error('Nama santri wajib diisi')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        const { klasifikasi } = await updateSantri(initial!.id, form)
        toast.success(`Data diperbarui. Status: ${klasifikasi.status}`, {
          description: 'Klasifikasi ulang telah dijalankan.',
        })
      } else {
        const { klasifikasi } = await insertSantri(form)
        toast.success(`Santri ditambahkan. Status: ${klasifikasi.status}`, {
          description: 'Klasifikasi otomatis berhasil dijalankan.',
        })
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isEdit ? (
                <IconEdit size={18} className="text-primary" />
              ) : (
                <IconUserPlus size={18} className="text-primary" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {isEdit ? 'Edit Data Santri' : 'Tambah Santri Baru'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Klasifikasi BBK/TBBK otomatis setelah disimpan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <IconX size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Identitas */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                1
              </span>
              Identitas Santri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={form.tanggal_lahir}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Jenis Kelamin
                </label>
                <select
                  name="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Alamat tinggal santri"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Capaian */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                2
              </span>
              Capaian Pembelajaran
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Jilid Saat Ini <span className="text-red-500">*</span>
                </label>

                <select
                  name="jilid_saat_ini"
                  value={form.jilid_saat_ini}
                  onChange={(e) => {
                    const nextJilid = Number(e.target.value)

                    if (isEdit && initial) {
                      const currentJilid = initial.jilid_saat_ini

                      if (nextJilid < currentJilid) {
                        toast.error('Tidak boleh turun jilid')
                        return
                      }

                      if (nextJilid > currentJilid + 1) {
                        toast.error('Jilid harus naik satu per satu')
                        return
                      }
                    }

                    setForm((prev) => ({
                      ...prev,
                      jilid_saat_ini: nextJilid,

                      total_pengulangan_taskih: 0,
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7]
                    .filter((j) => {
                      if (!isEdit || !initial) return true

                      const currentJilid = initial.jilid_saat_ini

                      return j === currentJilid || j === currentJilid + 1
                    })
                    .map((j) => (
                      <option key={j} value={j}>
                        {j === 7 ? 'Al-Quran' : `Jilid ${j}`}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Pengulangan Taskih (Jilid Aktif)
                </label>

                <input
                  type="number"
                  name="total_pengulangan_taskih"
                  value={form.total_pengulangan_taskih}
                  onChange={handleChange}
                  min={0}
                  disabled={jilid === 7}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />

                {jilid === 7 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Al-Quran tidak memiliki taskih
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Progress Jilid */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                3
              </span>
              Progress & Durasi per Jilid (bulan)
            </h3>

            <p className="text-xs text-muted-foreground mb-3 ml-7">
              Jilid yang sudah selesai hanya dapat dilihat. Yang dapat diedit hanya jilid aktif.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: jilid + 1 }, (_, j) => {
                const fieldKey = `durasi_jilid_${j}` as DurasiKey

                const isActive = j === jilid
                const isCompleted = j < jilid

                const progressRecord = progressByJilid[j]

                // ambil data existing
                const existingValue = progressRecord?.durasi_bulan ?? Number(form[fieldKey]) ?? ''

                return (
                  <div
                    key={j}
                    className={`rounded-xl border p-3 ${
                      isActive
                        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                        : isCompleted
                          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                          : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className={`text-xs font-semibold ${
                          isActive
                            ? 'text-primary'
                            : isCompleted
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {jilidLabel(j)}
                      </label>

                      {isActive && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                          AKTIF
                        </span>
                      )}

                      {isCompleted && (
                        <IconCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>

                    <input
                      type="number"
                      name={fieldKey}
                      value={existingValue}
                      min={0}
                      step={0.5}
                      disabled
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed text-sm"
                    />

                    {progressRecord && (
                      <div className="mt-2 space-y-0.5">
                        {progressRecord.tanggal_mulai && (
                          <p className="text-[10px] text-muted-foreground">
                            Mulai: {formatDate(progressRecord.tanggal_mulai)}
                          </p>
                        )}

                        {progressRecord.tanggal_selesai && (
                          <p className="text-[10px] text-muted-foreground">
                            Selesai: {formatDate(progressRecord.tanggal_selesai)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isEdit && progressList && progressList.some((p) => p.jilid > jilid) && (
              <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <IconAlertTriangle size={12} className="inline mr-1" />
                  Ada progress jilid di atas jilid saat ini. Mengubah jilid ke angka lebih tinggi
                  akan membuat record progress baru.
                </p>
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <IconRefresh size={14} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconCheck size={14} />
                  Simpan & Klasifikasi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  santri,
  onClose,
}: {
  santri: SantriDenganRekomendasi
  onClose: () => void
}) {
  type RiwayatItem = {
    id: string
    status: 'BBK' | 'TBBK'
    classified_at: string
    probabilitas: number | null
    sumber: string | null
    alasan: string | null
  }

  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [progressList, setProgressList] = useState<SantriProgress[]>([])
  const [loadingDetail, setLoadingDetail] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetchRiwayatRekomendasi(santri.id), fetchRiwayatProgress(santri.id)])
      .then(([rek, prog]) => {
        setRiwayat((rek as RiwayatItem[]).slice(0, 8))
        setProgressList(prog as SantriProgress[])
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [santri.id])

  // Build progress map by jilid
  const progressByJilid: Record<number, SantriProgress> = {}
  for (const p of progressList) {
    progressByJilid[p.jilid] = p
  }

  const currentJilid = santri.jilid_saat_ini

  // Jilid rows: 0 through currentJilid inclusive
  const jilidRows = Array.from({ length: currentJilid + 1 }, (_, i) => i)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {santri.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">{santri.nama}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {jilidLabel(santri.jilid_saat_ini)} ·{' '}
                  {santri.jenis_kelamin === 'L'
                    ? 'Laki-laki'
                    : santri.jenis_kelamin === 'P'
                      ? 'Perempuan'
                      : '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={santri.status_rekomendasi} />
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <IconX size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
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
                <IconMapPin size={13} />
                Alamat
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {santri.alamat || '—'}
              </p>
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
                <IconCalendar size={13} />
                Terdaftar
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(santri.created_at)}
              </p>
            </div>
          </div>

          {/* Probabilitas bar */}
          {santri.probabilitas != null && (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  Probabilitas Klasifikasi
                </span>
                <span className="text-sm font-bold text-foreground">
                  {Math.round(santri.probabilitas * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    santri.status_rekomendasi === 'BBK' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.round(santri.probabilitas * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Progress Jilid Table ─────────────────────────────────── */}
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
                        Taskih
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
                      // Fallback to santri table durasi columns if progress not fetched yet
                      const durasiKey = `durasi_jilid_${j}` as DurasiKey
                      const durasi = prog?.durasi_bulan ?? (santri[durasiKey] as number | null)

                      return (
                        <tr
                          key={j}
                          className={`transition-colors ${
                            isActive ? 'bg-primary/5' : 'hover:bg-muted/30'
                          }`}
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
                            {durasi != null ? `${durasi} bln` : '—'}
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
                          <td className="px-3 py-2.5 text-foreground">
                            {prog?.pengulangan_taskih != null
                              ? `${prog.pengulangan_taskih}x`
                              : isActive
                                ? `${santri.total_pengulangan_taskih}x`
                                : '—'}
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

          {/* Alasan keputusan */}
          {santri.alasan_rekomendasi && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <IconBrain size={13} />
                Alasan Keputusan Model
              </h3>
              <pre className="text-xs text-foreground/80 bg-muted/40 border border-border/60 rounded-xl p-4 whitespace-pre-wrap font-mono leading-relaxed">
                {santri.alasan_rekomendasi}
              </pre>
            </div>
          )}

          {/* Riwayat klasifikasi */}
          {riwayat.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <IconHistory size={13} />
                Riwayat Klasifikasi
              </h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Tanggal
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Prob.
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">
                        Sumber
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {riwayat.map((r, i) => (
                      <tr key={r.id ?? i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {formatDate(r.classified_at, true)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-3 py-2.5 text-foreground font-medium">
                          {r.probabilitas != null ? `${Math.round(r.probabilitas * 100)}%` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{r.sumber ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MonitoringSantriPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [santriList, setSantriList] = useState<SantriDenganRekomendasi[]>([])
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJilid, setFilterJilid] = useState('')
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [editSantri, setEditSantri] = useState<SantriDenganRekomendasi | null>(null)
  const [editProgressList, setEditProgressList] = useState<SantriProgress[]>([])
  const [detailSantri, setDetailSantri] = useState<SantriDenganRekomendasi | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null)
  const [confirmReklas, setConfirmReklas] = useState<{ id: string; nama: string } | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [list, statsData] = await Promise.all([fetchSantriList(), fetchMonitoringStats()])
      setSantriList(list)
      setStats(statsData)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle ?edit=<id> query param
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId || santriList.length === 0) return
    const target = santriList.find((s) => s.id === editId)
    if (!target) return
    openEdit(target)
    router.replace('/protected/monitoring-santri', { scroll: false })
  }, [searchParams, santriList]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edit helpers ──────────────────────────────────────────────────────────

  async function openEdit(santri: SantriDenganRekomendasi) {
    setEditSantri(santri)
    try {
      const prog = await fetchRiwayatProgress(santri.id)
      setEditProgressList(prog as SantriProgress[])
    } catch {
      setEditProgressList([])
    }
    setShowForm(true)
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField !== field) {
      setSortField(field)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortField(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirmDelete) return
    const { id, nama } = confirmDelete
    setConfirmDelete(null)
    try {
      await deleteSantri(id)
      toast.success(`Santri "${nama}" berhasil dihapus`)
      loadData()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal menghapus')
    }
  }

  async function handleReklasifikasi() {
    if (!confirmReklas) return
    const { id, nama } = confirmReklas
    setConfirmReklas(null)
    try {
      const hasil = await reklasifikasiSantri(id)
      toast.success(`Reklasifikasi "${nama}" selesai: ${hasil.status}`)
      loadData()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal reklasifikasi')
    }
  }

  // ── Reset filter ──────────────────────────────────────────────────────────

  function resetAll() {
    setSearch('')
    setFilterJilid('')
    setSortField(null)
    setSortDir(null)
  }

  const isFiltered = search || filterJilid || sortField

  // ── Filter + Sort data ────────────────────────────────────────────────────

  const filtered = [...santriList]
    .filter((s) => {
      const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase())
      const matchJilid = filterJilid === '' || s.jilid_saat_ini === Number(filterJilid)
      return matchSearch && matchJilid
    })
    .sort((a, b) => {
      if (!sortField || !sortDir) return 0

      const va = a[sortField as keyof SantriDenganRekomendasi]
      const vb = b[sortField as keyof SantriDenganRekomendasi]

      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1

      let cmp = 0

      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb
      } else {
        cmp = String(va).localeCompare(String(vb), 'id')
      }

      return sortDir === 'asc' ? cmp : -cmp
    })

  // ── TH helper class ───────────────────────────────────────────────────────

  const thClass =
    'text-left px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none'

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <IconUsers size={24} className="text-primary" />
              Monitoring Santri
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola data santri dan klasifikasi BBK/TBBK otomatis
            </p>
          </div>
          <button
            onClick={() => {
              setEditSantri(null)
              setEditProgressList([])
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <IconUserPlus size={16} />
            Tambah Santri
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Santri"
              value={stats.total_santri}
              icon={IconUsers}
              color="bg-primary"
            />
            <StatCard
              label="BBK"
              value={stats.bbk_count}
              icon={IconAlertTriangle}
              color="bg-red-500"
            />
            <StatCard
              label="TBBK"
              value={stats.tbbk_count}
              icon={IconCheck}
              color="bg-emerald-500"
            />
            <StatCard
              label="Rata-rata Durasi"
              value={`${stats.rata_rata_durasi} bln`}
              icon={IconTrendingUp}
              color="bg-amber-500"
            />
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
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
            <div className="flex items-center gap-2">
              <IconFilter size={15} className="text-muted-foreground" />
              <select
                value={filterJilid}
                onChange={(e) => setFilterJilid(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm min-w-35 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Semua Jilid</option>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <option key={j} value={j}>
                    {j === 7 ? 'Al-Quran' : `Jilid ${j}`}
                  </option>
                ))}
              </select>
            </div>
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

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-10">
                    No
                  </th>

                  <th className={thClass} onClick={() => handleSort('nama')}>
                    <span className="flex items-center gap-1">
                      Nama
                      <SortIcon col="nama" sortKey={sortField} sortDir={sortDir} />
                    </span>
                  </th>

                  <th className={thClass} onClick={() => handleSort('jilid_saat_ini')}>
                    <span className="flex items-center gap-1">
                      Jilid
                      <SortIcon col="jilid_saat_ini" sortKey={sortField} sortDir={sortDir} />
                    </span>
                  </th>

                  <th className={thClass} onClick={() => handleSort('total_pengulangan_taskih')}>
                    <span className="flex items-center gap-1">
                      Taskih
                      <SortIcon
                        col="total_pengulangan_taskih"
                        sortKey={sortField}
                        sortDir={sortDir}
                      />
                    </span>
                  </th>

                  <th className={thClass} onClick={() => handleSort('status_rekomendasi')}>
                    <span className="flex items-center gap-1">
                      Status
                      <SortIcon col="status_rekomendasi" sortKey={sortField} sortDir={sortDir} />
                    </span>
                  </th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Probabilitas
                  </th>

                  <th className={thClass} onClick={() => handleSort('created_at')}>
                    <span className="flex items-center gap-1">
                      Terdaftar
                      <SortIcon col="created_at" sortKey={sortField} sortDir={sortDir} />
                    </span>
                  </th>

                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <IconBook size={32} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">
                          {search ? 'Tidak ada santri yang cocok' : 'Belum ada data santri'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((santri, idx) => (
                    <tr key={santri.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {santri.nama.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{santri.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              {santri.jenis_kelamin === 'L'
                                ? 'Laki-laki'
                                : santri.jenis_kelamin === 'P'
                                  ? 'Perempuan'
                                  : '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                          <IconBookmark size={10} />
                          {jilidLabel(santri.jilid_saat_ini)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-foreground text-sm font-medium">
                        {santri.total_pengulangan_taskih}x
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={santri.status_rekomendasi} />
                      </td>

                      <td className="px-4 py-3">
                        {santri.probabilitas != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  santri.status_rekomendasi === 'BBK'
                                    ? 'bg-red-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.round((santri.probabilitas ?? 0) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((santri.probabilitas ?? 0) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(santri.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailSantri(santri)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Lihat detail"
                          >
                            <IconEye size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(santri)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <IconEdit size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmReklas({ id: santri.id, nama: santri.nama })}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            title="Klasifikasi ulang"
                          >
                            <IconRefresh size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ id: santri.id, nama: santri.nama })}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                            title="Hapus"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan {filtered.length} dari {santriList.length} santri
            </p>
            {isFiltered && (
              <button onClick={resetAll} className="text-xs text-primary hover:underline">
                Reset semua filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {showForm && (
        <SantriForm
          initial={editSantri}
          progressList={editProgressList}
          onClose={() => {
            setShowForm(false)
            setEditSantri(null)
            setEditProgressList([])
          }}
          onSaved={loadData}
        />
      )}

      {detailSantri && <DetailModal santri={detailSantri} onClose={() => setDetailSantri(null)} />}

      {confirmDelete && (
        <ConfirmModal
          title={`Hapus santri "${confirmDelete.nama}"?`}
          description="Tindakan ini tidak dapat dibatalkan. Seluruh data progress dan riwayat klasifikasi santri ini akan ikut terhapus."
          confirmLabel="Ya, Hapus"
          confirmClassName="bg-red-500 hover:bg-red-600"
          icon={<IconTrash size={22} className="text-red-500" />}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmReklas && (
        <ConfirmModal
          title={`Klasifikasi ulang "${confirmReklas.nama}"?`}
          description="Model akan menjalankan ulang klasifikasi BBK/TBBK berdasarkan data progress aktif santri ini."
          confirmLabel="Ya, Jalankan"
          confirmClassName="bg-primary hover:bg-primary/90"
          icon={<IconBrain size={22} className="text-amber-600 dark:text-amber-400" />}
          onConfirm={handleReklasifikasi}
          onCancel={() => setConfirmReklas(null)}
        />
      )}
    </div>
  )
}
