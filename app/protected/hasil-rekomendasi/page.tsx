'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  IconChartBar,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconX,
  IconDownload,
  IconBrain,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconAlertCircle,
  IconCalendar,
  IconUser,
  IconBook,
  IconClock,
  IconRepeat,
  IconPercentage,
  IconRotateClockwise,
} from '@tabler/icons-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import * as XLSX from 'xlsx'

import type { StatusRekomendasi } from '@/lib/types'
import {
  type RekomendasiRow,
  type StatistikRekomendasi,
  fetchHasilRekomendasiList,
  fetchStatistikRekomendasi,
  reklasifikasiSemua,
} from '@/lib/ml-services/hasil-rekomendasi'
import { createClient } from '@/lib/supabase/client'

// ─── Types ─────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<
  RekomendasiRow,
  | 'nama'
  | 'jilid_saat_ini'
  | 'durasi_jilid_aktif'
  | 'total_pengulangan_taskih'
  | 'status_rekomendasi'
  | 'probabilitas'
  | 'classified_at'
>
type SortDir = 'asc' | 'desc' | null

// ─── Helpers ───────────────────────────────────────────────────────────────

function jilidLabel(n: number) {
  return n === 7 ? 'Al-Quran' : `Jilid ${n}`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDurasiBulan(durasi: number): string {
  const totalHari = Math.round(durasi * 30)

  const tahun = Math.floor(totalHari / 360)
  const sisaHari = totalHari % 360

  const bulan = Math.floor(sisaHari / 30)
  const hari = sisaHari % 30

  const parts: string[] = []

  if (tahun > 0) parts.push(`${tahun} th`)
  if (bulan > 0) parts.push(`${bulan} bln`)
  if (hari > 0) parts.push(`${hari} hr`)

  return parts.length ? parts.join(' ') : '0 hr'
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusRekomendasi | null }) {
  if (!status)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Belum
      </span>
    )
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey
  sortKey: SortKey | null
  sortDir: SortDir
}) {
  if (sortKey !== col) return <IconSelector size={13} className="text-muted-foreground/40" />
  if (sortDir === 'asc') return <IconChevronUp size={13} className="text-primary" />
  if (sortDir === 'desc') return <IconChevronDown size={13} className="text-primary" />
  return <IconSelector size={13} className="text-muted-foreground/40" />
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="font-medium" style={{ color: item.fill }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  )
}

// ─── Confirm Modal ──────────────────────────────────────────────────────────

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel()
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

// ─── Detail Modal ───────────────────────────────────────────────────────────

function DetailModal({ row, onClose }: { row: RekomendasiRow; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const detailItems = [
    {
      icon: <IconUser size={14} />,
      label: 'Nama',
      value: row.nama,
    },
    {
      icon: <IconUser size={14} />,
      label: 'Jenis Kelamin',
      value: row.jenis_kelamin ?? '—',
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
      icon: <IconRepeat size={14} />,
      label: 'Total Pengulangan Taskih',
      value: `${row.total_pengulangan_taskih}x`,
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
        {/* Header */}
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

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {detailItems.map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                  {item.icon}
                  {item.label}
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Alasan / reasoning */}
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

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function HasilRekomendasiPage() {
  const [data, setData] = useState<RekomendasiRow[]>([])
  const [statistik, setStatistik] = useState<StatistikRekomendasi | null>(null)
  const [loading, setLoading] = useState(true)
  const [reklasLoading, setReklasLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusRekomendasi | ''>('')
  const [sortKey, setSortKey] = useState<SortKey | null>('status_rekomendasi')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [detailRow, setDetailRow] = useState<RekomendasiRow | null>(null)
  const [confirmReklas, setConfirmReklas] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  const isAdmin = role === 'admin'

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      setRole(user?.app_metadata?.role ?? null)
    }

    loadRole()
  }, [])

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [list, stats] = await Promise.all([
        fetchHasilRekomendasiList(),
        fetchStatistikRekomendasi(),
      ])
      setData(list)
      setStatistik(stats)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (loading) return
    fetchHasilRekomendasiList({ status: filterStatus, search })
      .then(setData)
      .catch(() => {})
  }, [filterStatus, search, loading])

  // ── Sort logic ─────────────────────────────────────────────────────────────

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const va = a[sortKey]
    const vb = b[sortKey]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  // ── Reset filters ──────────────────────────────────────────────────────────

  function resetAll() {
    setSearch('')
    setFilterStatus('')
     setSortKey('status_rekomendasi')
     setSortDir('asc')
  }

const isFiltered =
  search !== '' || filterStatus !== '' || sortKey !== 'status_rekomendasi' || sortDir !== 'asc'
  // ── Reklasifikasi ──────────────────────────────────────────────────────────

  async function handleReklasifikasiSemua() {
    if (!isAdmin) {
      toast.error('Anda tidak memiliki akses')
      return
    }

    setConfirmReklas(false)
    setReklasLoading(true)

    try {
      const { berhasil, gagal } = await reklasifikasiSemua()

      if (berhasil === 0 && gagal === 0) {
        toast.info('Tidak ada santri yang ditemukan')
      } else {
        toast.success(`Reklasifikasi selesai: ${berhasil} berhasil, ${gagal} gagal`)
      }

      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal reklasifikasi')
    } finally {
      setReklasLoading(false)
    }
  }

  // ── Export XLSX ────────────────────────────────────────────────────────────

  function handleExport() {
    const wb = XLSX.utils.book_new()

    // ── Sheet 1: Data Santri ─────────────────────────────────────────────────
    const headerRow = [
      'No',
      'Nama',
      'Jenis Kelamin',
      'Jilid',
      'Durasi Aktif',
      'Taskih Aktif',
      'Total Taskih',
      'Status',
      'Probabilitas (%)',
      'Sumber Klasifikasi',
      'Tanggal Klasifikasi',
    ]

    const dataRows = sortedData.map((row, i) => [
      i + 1,
      row.nama,
      row.jenis_kelamin ?? '-',
      jilidLabel(row.jilid_saat_ini),
      row.durasi_jilid_aktif ?? '-',
      row.taskih_aktif ?? '-',
      row.total_pengulangan_taskih,
      row.status_rekomendasi ?? 'Belum',
      row.probabilitas != null ? Math.round(row.probabilitas * 100) : '-',
      row.sumber_rekomendasi ?? '-',
      row.classified_at ? new Date(row.classified_at).toLocaleDateString('id-ID') : '-',
    ])

    const wsData = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

    // Column widths
    wsData['!cols'] = [
      { wch: 5 }, // No
      { wch: 28 }, // Nama
      { wch: 14 }, // Jenis Kelamin
      { wch: 12 }, // Jilid
      { wch: 18 }, // Durasi
      { wch: 14 }, // Taskih Aktif
      { wch: 14 }, // Total Taskih
      { wch: 10 }, // Status
      { wch: 16 }, // Probabilitas
      { wch: 20 }, // Sumber
      { wch: 20 }, // Tanggal
    ]

    // Style header row cells
    const range = XLSX.utils.decode_range(wsData['!ref']!)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!wsData[cellAddr]) continue
      wsData[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1E3A5F' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          bottom: { style: 'medium', color: { rgb: 'FFFFFF' } },
        },
      }
    }

    // Style data rows (alternating)
    for (let R = 1; R <= dataRows.length; R++) {
      const isEven = R % 2 === 0
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
        if (!wsData[cellAddr]) wsData[cellAddr] = { t: 's', v: '' }
        const statusVal = wsData[XLSX.utils.encode_cell({ r: R, c: 7 })]?.v

        let fontColor = '111111'
        if (C === 7) {
          fontColor = statusVal === 'BBK' ? 'C0392B' : statusVal === 'TBBK' ? '27AE60' : '888888'
        }

        wsData[cellAddr].s = {
          font: { sz: 10, color: { rgb: fontColor }, bold: C === 7 },
          fill: { fgColor: { rgb: isEven ? 'F2F6FA' : 'FFFFFF' } },
          alignment: { horizontal: C === 0 || C >= 4 ? 'center' : 'left', vertical: 'center' },
          border: {
            bottom: { style: 'thin', color: { rgb: 'DDE3EC' } },
          },
        }
      }
    }

    // Freeze header row
    wsData['!freeze'] = { xSplit: 0, ySplit: 1 }
    wsData['!autofilter'] = { ref: wsData['!ref']! }

    XLSX.utils.book_append_sheet(wb, wsData, 'Data Santri')

    // ── Sheet 2: Ringkasan ───────────────────────────────────────────────────
    if (statistik) {
      const now = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const summaryAoa = [
        ['LAPORAN HASIL REKOMENDASI KLASIFIKASI SANTRI'],
        [`Digenerate: ${now}`],
        [],
        ['RINGKASAN KESELURUHAN'],
        ['Total Santri', statistik.total],
        ['Butuh Bimbingan Khusus (BBK)', statistik.bbk],
        ['Tidak Butuh Bimbingan Khusus (TBBK)', statistik.tbbk],
        ['Persentase BBK (%)', statistik.total > 0 ? `=B5/B4*100` : '0'],
        [],
        ['DISTRIBUSI PER JILID'],
        ['Jilid', 'BBK', 'TBBK', 'Total'],
        ...statistik.perJilid.map((j) => [j.jilid, j.bbk, j.tbbk, j.total]),
      ]

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa)
      wsSummary['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

      // Title style
      if (wsSummary['A1']) {
        wsSummary['A1'].s = {
          font: { bold: true, sz: 14, color: { rgb: '1E3A5F' } },
        }
      }
      if (wsSummary['A2']) {
        wsSummary['A2'].s = {
          font: { italic: true, sz: 10, color: { rgb: '888888' } },
        }
      }

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')
    }

    // ── Sheet 3: Alasan AI ───────────────────────────────────────────────────
    const withAlasan = sortedData.filter((r) => r.alasan_rekomendasi)
    if (withAlasan.length > 0) {
      const alasanAoa = [
        ['Nama', 'Status', 'Probabilitas (%)', 'Alasan Keputusan Model'],
        ...withAlasan.map((r) => [
          r.nama,
          r.status_rekomendasi ?? '-',
          r.probabilitas != null ? Math.round(r.probabilitas * 100) : '-',
          r.alasan_rekomendasi ?? '-',
        ]),
      ]
      const wsAlasan = XLSX.utils.aoa_to_sheet(alasanAoa)
      wsAlasan['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 80 }]
      XLSX.utils.book_append_sheet(wb, wsAlasan, 'Detail Alasan AI')
    }

    XLSX.writeFile(wb, `laporan-rekomendasi-${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Laporan Excel berhasil diekspor')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const pieData = statistik
    ? [
        { name: 'BBK', value: statistik.bbk, color: '#ef4444' },
        { name: 'TBBK', value: statistik.tbbk, color: '#10b981' },
      ]
    : []

  const thClass =
    'px-4 py-3 text-left text-xs font-semibold text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors group'
  const thInner = 'flex items-center gap-1'

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <IconChartBar size={24} className="text-primary" />
              Hasil Rekomendasi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hasil klasifikasi BBK/TBBK seluruh santri oleh model Decision Tree
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <IconDownload size={15} />
              Ekspor Excel
            </button>
            {isAdmin && (
              <button
                onClick={() => setConfirmReklas(true)}
                disabled={reklasLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {reklasLoading ? (
                  <IconRefresh size={15} className="animate-spin" />
                ) : (
                  <IconBrain size={15} />
                )}
                Jalankan Ulang Klasifikasi
              </button>
            )}
          </div>
        </div>

        {/* ── Charts ───────────────────────────────────────────────────── */}
        {statistik && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pie */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Distribusi Status</h3>
              {statistik.total > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                      />
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-xl font-bold text-red-600">{statistik.bbk}</p>
                      <p className="text-xs text-muted-foreground">BBK</p>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <p className="text-xl font-bold text-emerald-600">{statistik.tbbk}</p>
                      <p className="text-xs text-muted-foreground">TBBK</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  Belum ada data
                </div>
              )}
            </div>

            {/* Bar */}
            <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">Status per Jilid</h3>
              {statistik.perJilid.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statistik.perJilid} barSize={16} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="jilid"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                    <Bar dataKey="bbk" name="BBK" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="tbbk" name="TBBK" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Belum ada data statistik
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Filter bar ───────────────────────────────────────────────── */}
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusRekomendasi | '')}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Semua Status</option>
                <option value="BBK">BBK</option>
                <option value="TBBK">TBBK</option>
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

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-10">
                    No
                  </th>

                  {/* Nama */}
                  <th className={thClass} onClick={() => handleSort('nama')}>
                    <div className={thInner}>
                      Nama
                      <SortIcon col="nama" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>

                  {/* Jilid */}
                  <th className={thClass} onClick={() => handleSort('jilid_saat_ini')}>
                    <div className={thInner}>
                      Jilid
                      <SortIcon col="jilid_saat_ini" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>

                  {/* Durasi */}
                  <th className={thClass} onClick={() => handleSort('durasi_jilid_aktif')}>
                    <div className={thInner}>
                      Durasi Aktif
                      <SortIcon col="durasi_jilid_aktif" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>

                  {/* Taskih */}
                  <th className={thClass} onClick={() => handleSort('total_pengulangan_taskih')}>
                    <div className={thInner}>
                      Taskih
                      <SortIcon
                        col="total_pengulangan_taskih"
                        sortKey={sortKey}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>

                  {/* Status */}
                  <th className={thClass} onClick={() => handleSort('status_rekomendasi')}>
                    <div className={thInner}>
                      Status
                      <SortIcon col="status_rekomendasi" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>

                  {/* Probabilitas */}
                  <th className={thClass} onClick={() => handleSort('probabilitas')}>
                    <div className={thInner}>
                      Probabilitas
                      <SortIcon col="probabilitas" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>

                  {/* Klasifikasi */}
                  <th className={thClass} onClick={() => handleSort('classified_at')}>
                    <div className={thInner}>
                      Klasifikasi
                      <SortIcon col="classified_at" sortKey={sortKey} sortDir={sortDir} />
                    </div>
                  </th>

                  {/* Detail */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
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
                  sortedData.map((row, idx) => (
                    <tr key={row.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                            {row.nama.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{row.nama}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-foreground">
                        {jilidLabel(row.jilid_saat_ini)}
                      </td>

                      <td className="px-4 py-3 text-sm text-foreground">
                        {row.durasi_jilid_aktif == null
                          ? '—'
                          : formatDurasiBulan(row.durasi_jilid_aktif)}{' '}
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

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(row.classified_at)}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailRow(row)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          <IconInfoCircle size={13} />
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Menampilkan {sortedData.length} santri</p>
            {isFiltered && (
              <p className="text-xs text-muted-foreground">
                Filter/urutan aktif —{' '}
                <button onClick={resetAll} className="text-primary underline">
                  reset semua
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {isAdmin && confirmReklas && (
        <ConfirmModal
          title="Jalankan Ulang Klasifikasi?"
          description="Proses ini akan mengklasifikasi ulang semua santri aktif menggunakan model Decision Tree. Data rekomendasi sebelumnya akan diperbarui."
          confirmLabel="Ya, Jalankan"
          confirmClassName="bg-primary hover:bg-primary/90"
          icon={<IconBrain size={24} className="text-amber-600 dark:text-amber-400" />}
          onConfirm={handleReklasifikasiSemua}
          onCancel={() => setConfirmReklas(false)}
        />
      )}

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}
