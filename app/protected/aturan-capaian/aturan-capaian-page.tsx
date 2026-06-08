'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import {
  IconSettings,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconBrain,
  IconHistory,
  IconRotateClockwise,
  IconInfoCircle,
  IconChartPie,
  IconTrash,
  IconEye,
  IconPlayerPlay,
  IconX,
  IconDatabase,
  IconCircleCheck,
  IconLoader2,
  IconNetwork,
  IconArrowRight,
  IconEyeSpark,
  IconChartBar,
  IconCloudUpload,
  IconWand,
} from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  EvaluasiResult,
  fetchAturanAktif,
  fetchRiwayatAturan,
  simpanAturan,
  resetAturanDefault,
  latihUlangModel,
  deleteAturan,
  setAturanAktif,
} from '@/lib/ml-services/aturan-capaian'
import { AturanCapaian } from '@/lib/types'
import { reklasifikasiSemua } from '@/lib/ml-services/hasil-rekomendasi'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormValues = {
  batas_durasi_jilid_0_4: number
  batas_durasi_jilid_5_6: number
  batas_pengulangan_taskih: number
}

type ModalType =
  | 'simpan'
  | 'reset'
  | 'post-simpan'
  | 'latih'
  | 'detail'
  | 'delete'
  | 'set-aktif'
  | 'process'
  | null

type ProcessStep = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: 'idle' | 'running' | 'done' | 'error'
  result?: string
}

type ProcessConfig = {
  title: string
  subtitle: string
  steps: ProcessStep[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function namaModel(jilid04: number, jilid56: number, taskih: number): string {
  const gabung = [jilid04, jilid56, taskih].map((v) => String(Math.round(v))).join('')
  return `decision_tree_${gabung}`
}

function isDuplikat(formValues: FormValues, riwayat: AturanCapaian[], activeId?: string): boolean {
  return riwayat.some(
    (r) =>
      r.id !== activeId &&
      r.batas_durasi_jilid_0_4 === formValues.batas_durasi_jilid_0_4 &&
      r.batas_durasi_jilid_5_6 === formValues.batas_durasi_jilid_5_6 &&
      r.batas_pengulangan_taskih === formValues.batas_pengulangan_taskih
  )
}

// ─── Process Dialog ───────────────────────────────────────────────────────────

function ProcessDialog({
  open,
  config,
  evaluasi,
  onClose,
  onAction,
  actionLabel,
  actionDisabled,
}: {
  open: boolean
  config: ProcessConfig | null
  evaluasi?: EvaluasiResult | null
  onClose: () => void
  onAction?: () => void
  actionLabel?: string
  actionDisabled?: boolean
}) {
  if (!config) return null

  const allDone = config.steps.every((s) => s.status === 'done')
  const hasError = config.steps.some((s) => s.status === 'error')
  const running = config.steps.find((s) => s.status === 'running')
  const currentIdx = config.steps.findIndex((s) => s.status === 'running')
  const doneCount = config.steps.filter((s) => s.status === 'done').length
  const progress = Math.round((doneCount / config.steps.length) * 100)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && allDone && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {allDone ? (
              <IconCircleCheck size={18} className="text-emerald-500" />
            ) : hasError ? (
              <IconAlertTriangle size={18} className="text-red-500" />
            ) : (
              <IconLoader2 size={18} className="animate-spin text-primary" />
            )}
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-xs">{config.subtitle}</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>
              {allDone
                ? 'Selesai'
                : hasError
                  ? 'Terjadi kesalahan'
                  : running
                    ? running.label
                    : 'Memulai...'}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Steps list */}
        <div className="space-y-1 py-1">
          {config.steps.map((step, idx) => {
            const isActive = step.status === 'running'
            const isDone = step.status === 'done'
            const isIdle = step.status === 'idle'
            const isError = step.status === 'error'
            const isPast = idx < currentIdx

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300',
                  isActive && 'border-primary/30 bg-primary/5',
                  isDone &&
                    'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10',
                  isError && 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10',
                  isIdle && !isPast && 'border-border bg-card opacity-40',
                  isIdle && isPast && 'border-border bg-card opacity-40'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    isActive && 'bg-primary/10 text-primary',
                    isDone && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
                    isError && 'bg-red-100 dark:bg-red-900/40 text-red-600',
                    isIdle && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isActive ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : isDone ? (
                    <IconCheck size={14} />
                  ) : isError ? (
                    <IconX size={14} />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      isActive && 'text-primary',
                      isDone && 'text-emerald-700 dark:text-emerald-400',
                      isError && 'text-red-700 dark:text-red-400',
                      isIdle && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                  {step.result && (
                    <p
                      className={cn(
                        'text-[10px] font-medium mt-1 font-mono',
                        isDone && 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {step.result}
                    </p>
                  )}
                </div>

                {/* Step number */}
                <span
                  className={cn(
                    'text-[10px] tabular-nums shrink-0 mt-1',
                    isActive && 'text-primary font-semibold',
                    isDone && 'text-emerald-600 dark:text-emerald-400',
                    isIdle && 'text-muted-foreground'
                  )}
                >
                  {idx + 1}/{config.steps.length}
                </span>
              </div>
            )
          })}
        </div>

        {/* Evaluasi result setelah latih */}
        {allDone && evaluasi && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IconChartBar size={12} />
                Hasil Evaluasi Model
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: 'Akurasi',
                    value: evaluasi.akurasi,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                  },
                  {
                    label: 'Precision',
                    value: evaluasi.precision,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50 dark:bg-blue-950/20',
                  },
                  {
                    label: 'Recall',
                    value: evaluasi.recall,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50 dark:bg-purple-950/20',
                  },
                  {
                    label: 'F1-Score',
                    value: evaluasi.f1,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50 dark:bg-amber-950/20',
                  },
                ].map(({ label, value, color, bg }) => (
                  <div
                    key={label}
                    className={cn('p-2.5 rounded-xl border border-border text-center', bg)}
                  >
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className={cn('text-lg font-bold', color)}>{Math.round(value * 100)}%</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                {evaluasi.berhasil} santri berhasil diklasifikasi ulang
              </p>
            </div>
          </>
        )}

        <DialogFooter>
          {allDone ? (
            <Button onClick={onClose} className="w-full">
              <IconCheck size={14} className="mr-1.5" />
              Selesai
            </Button>
          ) : hasError ? (
            <Button variant="outline" onClick={onClose} className="w-full">
              Tutup
            </Button>
          ) : onAction && actionLabel ? (
            <Button onClick={onAction} disabled={actionDisabled} className="w-full">
              {actionDisabled ? <IconLoader2 size={14} className="mr-1.5 animate-spin" /> : null}
              {actionLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`text-lg font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── SliderInput ──────────────────────────────────────────────────────────────

function SliderInput({
  label,
  name,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
}: {
  label: string
  name: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  description: string
  onChange: (name: string, value: number) => void
}) {
  return (
    <div className="p-4 bg-card rounded-xl border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{value}</span>
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(name, Number(e.target.value))}
        className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  )
}

// ─── DiffRow ──────────────────────────────────────────────────────────────────

function DiffRow({
  label,
  before,
  after,
  changed,
}: {
  label: string
  before: string
  after: string
  changed: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground text-xs w-44">{label}</span>
      <div className="flex items-center gap-2">
        {changed ? (
          <>
            <span className="line-through text-muted-foreground text-xs">{before}</span>
            <IconArrowRight size={10} className="text-muted-foreground" />
            <span className="font-semibold text-primary text-xs">{after}</span>
          </>
        ) : (
          <span className="font-medium text-foreground text-xs">{after}</span>
        )}
      </div>
    </div>
  )
}

// ─── RiwayatCard ──────────────────────────────────────────────────────────────

function RiwayatCard({
  r,
  index,
  onDetail,
  onDelete,
  onSetAktif,
}: {
  r: AturanCapaian
  index: number
  onDetail: (r: AturanCapaian) => void
  onDelete: (r: AturanCapaian) => void
  onSetAktif: (r: AturanCapaian) => void
}) {
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AturanCapaianPage() {
  const [aturan, setAturan] = useState<AturanCapaian | null>(null)
  const [riwayat, setRiwayat] = useState<AturanCapaian[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluasi, setEvaluasi] = useState<EvaluasiResult | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedRiwayat, setSelectedRiwayat] = useState<AturanCapaian | null>(null)
  const [savedAturanId, setSavedAturanId] = useState<string | null>(null)
  const [needsRetrain, setNeedsRetrain] = useState(false)

  // Process dialog state
  const [processOpen, setProcessOpen] = useState(false)
  const [processConfig, setProcessConfig] = useState<ProcessConfig | null>(null)
  const [processEvaluasi, setProcessEvaluasi] = useState<EvaluasiResult | null>(null)
  const processStepsRef = useRef<ProcessStep[]>([])

  const sortedRiwayat = useMemo(() => {
    return [...riwayat].sort((a, b) => {
      if (a.is_active && !b.is_active) return -1
      if (!a.is_active && b.is_active) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [riwayat])

  const [formValues, setFormValues] = useState<FormValues>({
    batas_durasi_jilid_0_4: 3,
    batas_durasi_jilid_5_6: 4,
    batas_pengulangan_taskih: 2,
  })
  const [hasChanges, setHasChanges] = useState(false)

  // ── Process helpers ──────────────────────────────────────────────────────────

  function initProcess(config: ProcessConfig) {
    processStepsRef.current = config.steps
    setProcessConfig({ ...config })
    setProcessEvaluasi(null)
    setProcessOpen(true)
  }

  function updateStep(stepId: string, patch: Partial<ProcessStep>) {
    setProcessConfig((prev) => {
      if (!prev) return prev
      const steps = prev.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
      processStepsRef.current = steps
      return { ...prev, steps }
    })
  }

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [aktif, riwayatData] = await Promise.all([fetchAturanAktif(), fetchRiwayatAturan()])
      if (aktif) {
        setAturan(aktif)
        setFormValues({
          batas_durasi_jilid_0_4: aktif.batas_durasi_jilid_0_4,
          batas_durasi_jilid_5_6: aktif.batas_durasi_jilid_5_6,
          batas_pengulangan_taskih: aktif.batas_pengulangan_taskih,
        })
      }
      setRiwayat(riwayatData)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal memuat aturan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formIsDuplikat = useMemo(
    () => isDuplikat(formValues, riwayat, aturan?.id),
    [formValues, riwayat, aturan]
  )

  const formBerbedaDariAktif = useMemo(() => {
    if (!aturan) return true
    return (
      aturan.batas_durasi_jilid_0_4 !== formValues.batas_durasi_jilid_0_4 ||
      aturan.batas_durasi_jilid_5_6 !== formValues.batas_durasi_jilid_5_6 ||
      aturan.batas_pengulangan_taskih !== formValues.batas_pengulangan_taskih
    )
  }, [aturan, formValues])

  const isDefaultConfig = useMemo(() => {
    return (
      aturan?.batas_durasi_jilid_0_4 === 3 &&
      aturan?.batas_durasi_jilid_5_6 === 4 &&
      aturan?.batas_pengulangan_taskih === 2
    )
  }, [aturan])

  const canSimpan = hasChanges && !formIsDuplikat && formBerbedaDariAktif

  function handleSliderChange(name: string, value: number) {
    setFormValues((prev) => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }

  // ── Simpan ───────────────────────────────────────────────────────────────────

  async function eksekusiSimpan() {
    setActiveModal(null)

    initProcess({
      title: 'Menyimpan Aturan Capaian',
      subtitle: 'Proses nonaktifkan model lama dan simpan konfigurasi baru ke database.',
      steps: [
        {
          id: 'nonaktif',
          label: 'Nonaktifkan model lama',
          description: 'Menonaktifkan semua aturan aktif di database',
          icon: <IconDatabase size={14} />,
          status: 'idle',
        },
        {
          id: 'insert',
          label: 'Simpan aturan baru',
          description: 'Menyimpan konfigurasi parameter ke tabel aturan_capaian',
          icon: <IconCloudUpload size={14} />,
          status: 'idle',
        },
        {
          id: 'trigger',
          label: 'Generate data training',
          description: 'Trigger database otomatis membuat data di training_master',
          icon: <IconEyeSpark size={14} />,
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang daftar model dan model aktif',
          icon: <IconRefresh size={14} />,
          status: 'idle',
        },
      ],
    })

    try {
      // Step 1
      updateStep('nonaktif', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      updateStep('nonaktif', { status: 'done', result: 'Model lama dinonaktifkan' })

      // Step 2
      updateStep('insert', { status: 'running' })
      const newAturan = await simpanAturan(formValues)
      updateStep('insert', {
        status: 'done',
        result: `ID: ${newAturan.id.slice(0, 8)}…`,
      })

      // Step 3
      updateStep('trigger', { status: 'running' })
      await new Promise((r) => setTimeout(r, 600))
      updateStep('trigger', { status: 'done', result: 'training_master berhasil digenerate' })

      // Step 4
      updateStep('reload', { status: 'running' })
      setAturan(newAturan)
      setSavedAturanId(newAturan.id)
      setHasChanges(false)
      setNeedsRetrain(true)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Data halaman diperbarui' })

      toast.success('Aturan capaian berhasil disimpan')
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal menyimpan aturan')
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────

  async function eksekusiReset() {
    setActiveModal(null)

    initProcess({
      title: 'Reset ke Konfigurasi Default',
      subtitle: 'Mengembalikan semua parameter ke nilai bawaan sistem.',
      steps: [
        {
          id: 'cari',
          label: 'Cari model default',
          description: 'Mengecek apakah konfigurasi default sudah pernah disimpan',
          icon: <IconDatabase size={14} />,
          status: 'idle',
        },
        {
          id: 'aktifkan',
          label: 'Aktifkan / buat model default',
          description: 'Mengaktifkan model default atau membuat baru jika belum ada',
          icon: <IconPlayerPlay size={14} />,
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang daftar model dan model aktif',
          icon: <IconRefresh size={14} />,
          status: 'idle',
        },
      ],
    })

    try {
      updateStep('cari', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      updateStep('cari', { status: 'done', result: 'Query ke tabel aturan_capaian selesai' })

      updateStep('aktifkan', { status: 'running' })
      const newAturan = await resetAturanDefault()
      updateStep('aktifkan', {
        status: 'done',
        result: newAturan.model_versi
          ? 'Model default sudah pernah dilatih'
          : 'Model default dibuat baru',
      })

      updateStep('reload', { status: 'running' })
      setAturan(newAturan)
      setSavedAturanId(newAturan.id)
      setFormValues({
        batas_durasi_jilid_0_4: 3,
        batas_durasi_jilid_5_6: 4,
        batas_pengulangan_taskih: 2,
      })
      setHasChanges(false)
      setNeedsRetrain(!newAturan.model_versi)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

      toast.success(
        newAturan.model_versi
          ? 'Aturan berhasil dikembalikan ke default'
          : 'Aturan default berhasil dipulihkan'
      )
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal reset aturan')
    }
  }

  // ── Latih ulang ───────────────────────────────────────────────────────────────

  async function eksekusiLatihUlang(fromModal?: ModalType) {
    if (fromModal) setActiveModal(null)

    const targetId = savedAturanId ?? aturan?.id
    if (!targetId) {
      toast.error('Tidak ada aturan aktif')
      return
    }

    initProcess({
      title: 'Latih Ulang Decision Tree',
      subtitle: 'Melatih model dengan data training_master berdasarkan aturan aktif.',
      steps: [
        {
          id: 'fetch-aturan',
          label: 'Ambil konfigurasi aturan',
          description: 'Membaca parameter aturan aktif dari database',
          icon: <IconDatabase size={14} />,
          status: 'idle',
        },
        {
          id: 'fetch-training',
          label: 'Ambil data training',
          description: 'Mengambil data dari tabel training_master',
          icon: <IconDatabase size={14} />,
          status: 'idle',
        },
        {
          id: 'latih',
          label: 'Melatih model ML',
          description: 'Mengirim data ke ML Service Flask dan melatih Decision Tree',
          icon: <IconBrain size={14} />,
          status: 'idle',
        },
        {
          id: 'evaluasi',
          label: 'Simpan hasil evaluasi',
          description: 'Menyimpan akurasi, F1, precision, recall ke database',
          icon: <IconChartPie size={14} />,
          status: 'idle',
        },
        {
          id: 'reklasifikasi',
          label: 'Reklasifikasi semua santri',
          description: 'Memperbarui hasil rekomendasi seluruh santri menggunakan model baru',
          icon: <IconWand size={14} />,
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang data dan model aktif',
          icon: <IconRefresh size={14} />,
          status: 'idle',
        },
      ],
    })

    setEvaluasi(null)

    try {
      updateStep('fetch-aturan', { status: 'running' })
      await new Promise((r) => setTimeout(r, 300))
      updateStep('fetch-aturan', { status: 'done', result: 'Konfigurasi aturan berhasil dibaca' })

      updateStep('fetch-training', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      updateStep('fetch-training', { status: 'done', result: 'Data training siap dikirim' })

      updateStep('latih', { status: 'running' })
      const hasil = await latihUlangModel(targetId)
      updateStep('latih', { status: 'done', result: `Model ${hasil.versi} selesai dilatih` })

      updateStep('evaluasi', { status: 'running' })
      await new Promise((r) => setTimeout(r, 300))
      updateStep('evaluasi', {
        status: 'done',
        result: `Akurasi: ${Math.round(hasil.akurasi * 100)}% | F1: ${Math.round(hasil.f1 * 100)}%`,
      })

      updateStep('reklasifikasi', { status: 'running' })
      await reklasifikasiSemua()
      updateStep('reklasifikasi', {
        status: 'done',
        result: `${hasil.berhasil} santri berhasil diklasifikasi ulang`,
      })

      updateStep('reload', { status: 'running' })
      setEvaluasi(hasil)
      setNeedsRetrain(false)
      setSavedAturanId(null)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Data halaman diperbarui' })

      setProcessEvaluasi(hasil)
      toast.success(`Model berhasil dilatih! Akurasi: ${Math.round(hasil.akurasi * 100)}%`, {
        description: `${hasil.berhasil} santri berhasil diklasifikasi ulang`,
      })
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal melatih model')
    }
  }

  // ── Hapus ─────────────────────────────────────────────────────────────────────

  async function eksekusiDelete() {
    if (!selectedRiwayat) return
    setActiveModal(null)

    initProcess({
      title: 'Menghapus Model',
      subtitle: `Menghapus model ${namaModel(selectedRiwayat.batas_durasi_jilid_0_4, selectedRiwayat.batas_durasi_jilid_5_6, selectedRiwayat.batas_pengulangan_taskih)} secara permanen.`,
      steps: [
        {
          id: 'cek',
          label: 'Verifikasi model',
          description: 'Memastikan model bukan model aktif dan ada di database',
          icon: <IconDatabase size={14} />,
          status: 'idle',
        },
        {
          id: 'hapus-training',
          label: 'Hapus data training',
          description: 'Menghapus semua data training_master terkait model ini',
          icon: <IconTrash size={14} />,
          status: 'idle',
        },
        {
          id: 'hapus-aturan',
          label: 'Hapus record aturan',
          description: 'Menghapus record dari tabel aturan_capaian',
          icon: <IconTrash size={14} />,
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh daftar model',
          description: 'Memperbarui tampilan riwayat model',
          icon: <IconRefresh size={14} />,
          status: 'idle',
        },
      ],
    })

    const target = selectedRiwayat
    setSelectedRiwayat(null)

    try {
      updateStep('cek', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      updateStep('cek', { status: 'done', result: 'Model valid dan bukan model aktif' })

      updateStep('hapus-training', { status: 'running' })
      await new Promise((r) => setTimeout(r, 300))
      updateStep('hapus-training', { status: 'done', result: 'Data training berhasil dihapus' })

      updateStep('hapus-aturan', { status: 'running' })
      await deleteAturan(target.id)
      updateStep('hapus-aturan', { status: 'done', result: 'Record aturan berhasil dihapus' })

      updateStep('reload', { status: 'running' })
      await loadData()
      updateStep('reload', { status: 'done', result: 'Daftar model diperbarui' })

      toast.success('Model berhasil dihapus')
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal menghapus model')
    }
  }

  // ── Set aktif ─────────────────────────────────────────────────────────────────

  async function eksekusiSetAktif() {
    if (!selectedRiwayat) return
    setActiveModal(null)

    const target = selectedRiwayat
    const sudahDilatih = !!target.model_versi
    const namaTarget = namaModel(
      target.batas_durasi_jilid_0_4,
      target.batas_durasi_jilid_5_6,
      target.batas_pengulangan_taskih
    )

    initProcess({
      title: 'Mengaktifkan Model',
      subtitle: `Mengganti model aktif ke ${namaTarget}.`,
      steps: [
        {
          id: 'ambil',
          label: 'Ambil data model',
          description: 'Membaca detail model dari tabel aturan_capaian',
          icon: <IconDatabase size={14} />,
          status: 'idle',
        },
        {
          id: 'nonaktif',
          label: 'Nonaktifkan model saat ini',
          description: 'Mengubah is_active = false pada semua model aktif',
          icon: <IconX size={14} />,
          status: 'idle',
        },
        {
          id: 'aktifkan',
          label: `Aktifkan ${namaTarget}`,
          description: 'Mengubah is_active = true pada model terpilih',
          icon: <IconPlayerPlay size={14} />,
          status: 'idle',
        },
        ...(sudahDilatih
          ? [
              {
                id: 'reklasifikasi',
                label: 'Reklasifikasi semua santri',
                description: 'Memperbarui hasil rekomendasi menggunakan model ini',
                icon: <IconWand size={14} />,
                status: 'idle' as const,
              },
            ]
          : []),
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang model aktif dan daftar riwayat',
          icon: <IconRefresh size={14} />,
          status: 'idle',
        },
      ],
    })

    setSelectedRiwayat(null)

    try {
      updateStep('ambil', { status: 'running' })
      await new Promise((r) => setTimeout(r, 300))
      updateStep('ambil', { status: 'done', result: 'Data model ditemukan' })

      updateStep('nonaktif', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      updateStep('nonaktif', { status: 'done', result: 'Model lama dinonaktifkan' })

      updateStep('aktifkan', { status: 'running' })
      await setAturanAktif(target.id)
      updateStep('aktifkan', { status: 'done', result: `${namaTarget} kini aktif` })

      if (sudahDilatih) {
        updateStep('reklasifikasi', { status: 'running' })
        await reklasifikasiSemua()
        updateStep('reklasifikasi', {
          status: 'done',
          result: 'Santri berhasil diklasifikasi ulang',
        })
      }

      updateStep('reload', { status: 'running' })
      setSavedAturanId(target.id)
      setNeedsRetrain(!sudahDilatih)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

      toast.success(
        sudahDilatih
          ? `${namaTarget} berhasil diaktifkan & data diperbarui`
          : `${namaTarget} kini aktif`
      )
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal mengaktifkan model')
    }
  }

  // ── Diff helpers ──────────────────────────────────────────────────────────────

  const diffJilid04 =
    aturan != null && aturan.batas_durasi_jilid_0_4 !== formValues.batas_durasi_jilid_0_4
  const diffJilid56 =
    aturan != null && aturan.batas_durasi_jilid_5_6 !== formValues.batas_durasi_jilid_5_6
  const diffTaskih =
    aturan != null && aturan.batas_pengulangan_taskih !== formValues.batas_pengulangan_taskih

  const namaModelBaru = namaModel(
    formValues.batas_durasi_jilid_0_4,
    formValues.batas_durasi_jilid_5_6,
    formValues.batas_pengulangan_taskih
  )

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <IconSettings size={24} className="text-primary" />
            Aturan Capaian
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi parameter batas yang digunakan model Decision Tree untuk klasifikasi
            BBK/TBBK
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm">
          <IconInfoCircle size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Cara Kerja Aturan</p>
            <p className="text-muted-foreground text-xs mt-1">
              Santri diklasifikasikan sebagai <strong>BBK</strong> apabila durasi penyelesaian pada
              jilid manapun melebihi batas, atau total pengulangan taskih melebihi batas. Sebaliknya
              diklasifikasikan sebagai <strong>TBBK</strong>.
            </p>
          </div>
        </div>

        {/* Peringatan duplikat */}
        {hasChanges && formIsDuplikat && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
            <IconX size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Konfigurasi Ini Sudah Pernah Digunakan
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Nilai yang Anda masukkan sudah ada di riwayat. Ubah minimal satu parameter untuk
                dapat menyimpan aturan baru.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Form ──────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Parameter Batas</h2>
              {hasChanges && !formIsDuplikat && (
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Ada perubahan belum disimpan
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <SliderInput
                  label="Batas Durasi Jilid 0–4"
                  name="batas_durasi_jilid_0_4"
                  value={formValues.batas_durasi_jilid_0_4}
                  min={1}
                  max={12}
                  step={0.5}
                  unit="bulan"
                  description="Batas maksimal waktu penyelesaian untuk Jilid 0 sampai 4"
                  onChange={handleSliderChange}
                />
                <SliderInput
                  label="Batas Durasi Jilid 5–6"
                  name="batas_durasi_jilid_5_6"
                  value={formValues.batas_durasi_jilid_5_6}
                  min={1}
                  max={12}
                  step={0.5}
                  unit="bulan"
                  description="Batas maksimal untuk Jilid 5 dan 6 (lebih tinggi karena lebih sulit)"
                  onChange={handleSliderChange}
                />
                <SliderInput
                  label="Batas Pengulangan Taskih"
                  name="batas_pengulangan_taskih"
                  value={formValues.batas_pengulangan_taskih}
                  min={1}
                  max={10}
                  step={1}
                  unit="kali"
                  description="Batas maksimal pengulangan ujian taskih"
                  onChange={handleSliderChange}
                />
              </div>
            )}

            {hasChanges && !formIsDuplikat && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-xl border border-border">
                <IconBrain size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Nama model baru:</span>
                <span className="text-xs font-mono font-semibold text-primary">
                  {namaModelBaru}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveModal('reset')}
                disabled={loading || isDefaultConfig}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconRotateClockwise size={15} />
                Reset Default
              </button>

              {(needsRetrain || (aturan && !aturan.model_versi)) && (
                <button
                  onClick={() => setActiveModal('latih')}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
                >
                  <IconBrain size={15} />
                  Latih Ulang Model
                </button>
              )}

              <button
                onClick={() => setActiveModal('simpan')}
                disabled={loading || !canSimpan}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm ml-auto"
              >
                <IconCheck size={15} />
                Simpan Pengaturan
              </button>
            </div>

            {/* Hasil evaluasi */}
            {evaluasi && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <IconChartPie size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-foreground">Hasil Evaluasi Model</h3>
                  <span className="text-xs font-mono text-muted-foreground ml-auto">
                    {evaluasi.versi}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Akurasi" value={evaluasi.akurasi} color="text-emerald-600" />
                  <MetricCard label="Precision" value={evaluasi.precision} color="text-blue-600" />
                  <MetricCard label="Recall" value={evaluasi.recall} color="text-purple-600" />
                  <MetricCard label="F1-Score" value={evaluasi.f1} color="text-amber-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {evaluasi.berhasil} santri berhasil diklasifikasi ulang
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────── */}
          <div className="space-y-4">
            {aturan && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Model Aktif
                  </h3>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Sedang Digunakan
                  </Badge>
                </div>
                <p className="text-xs font-mono font-semibold text-foreground break-all">
                  {namaModel(
                    aturan.batas_durasi_jilid_0_4,
                    aturan.batas_durasi_jilid_5_6,
                    aturan.batas_pengulangan_taskih
                  )}
                </p>
                <div className="space-y-1.5 pt-1">
                  {[
                    { label: 'Batas Jilid 0–4', value: `${aturan.batas_durasi_jilid_0_4} bulan` },
                    { label: 'Batas Jilid 5–6', value: `${aturan.batas_durasi_jilid_5_6} bulan` },
                    { label: 'Batas Taskih', value: `${aturan.batas_pengulangan_taskih}×` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                {aturan.model_versi ? (
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      Performa Model
                    </h4>
                    {[
                      { label: 'Akurasi', value: aturan.model_akurasi, color: 'text-emerald-600' },
                      { label: 'Precision', value: aturan.model_precision, color: 'text-blue-600' },
                      { label: 'Recall', value: aturan.model_recall, color: 'text-purple-600' },
                      { label: 'F1-Score', value: aturan.model_f1, color: 'text-amber-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className={cn('text-xs font-semibold', color)}>
                          {value != null ? `${Math.round(value * 100)}%` : '—'}
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground pt-1">
                      Dilatih:{' '}
                      {aturan.model_trained_at
                        ? new Date(aturan.model_trained_at).toLocaleDateString('id-ID')
                        : '—'}
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <IconAlertTriangle size={12} />
                      Model ini belum pernah dilatih
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <IconHistory size={13} />
                Semua Model ({sortedRiwayat.length})
              </h3>
              {riwayat.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Belum ada riwayat</p>
              ) : (
                <ScrollArea className="max-h-120">
                  <div className="space-y-2 pr-2">
                    {sortedRiwayat.map((r, i) => (
                      <RiwayatCard
                        key={r.id}
                        r={r}
                        index={i}
                        onDetail={(item) => {
                          setSelectedRiwayat(item)
                          setActiveModal('detail')
                        }}
                        onDelete={(item) => {
                          setSelectedRiwayat(item)
                          setActiveModal('delete')
                        }}
                        onSetAktif={(item) => {
                          setSelectedRiwayat(item)
                          setActiveModal('set-aktif')
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <IconAlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Setiap aturan menghasilkan model baru. Pastikan melakukan{' '}
                <strong>Latih Ulang Model</strong> setelah menyimpan atau mengganti aturan aktif.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODAL — Process Dialog (shared) ══ */}
      <ProcessDialog
        open={processOpen}
        config={processConfig}
        evaluasi={processEvaluasi}
        onClose={() => {
          setProcessOpen(false)
          setProcessConfig(null)
          setProcessEvaluasi(null)
          if (needsRetrain) setActiveModal('post-simpan')
        }}
      />

      {/* ══ MODAL — Konfirmasi Simpan ══ */}
      <Dialog open={activeModal === 'simpan'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCheck size={18} className="text-primary" />
              Konfirmasi Simpan Aturan
            </DialogTitle>
            <DialogDescription>
              Periksa perubahan berikut. Aturan lama akan dinonaktifkan dan model baru akan dibuat.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border rounded-xl border border-border px-4 py-1 my-1">
            <DiffRow
              label="Batas Jilid 0–4"
              before={`${aturan?.batas_durasi_jilid_0_4 ?? '—'} bulan`}
              after={`${formValues.batas_durasi_jilid_0_4} bulan`}
              changed={diffJilid04}
            />
            <DiffRow
              label="Batas Jilid 5–6"
              before={`${aturan?.batas_durasi_jilid_5_6 ?? '—'} bulan`}
              after={`${formValues.batas_durasi_jilid_5_6} bulan`}
              changed={diffJilid56}
            />
            <DiffRow
              label="Batas Taskih"
              before={`${aturan?.batas_pengulangan_taskih ?? '—'}×`}
              after={`${formValues.batas_pengulangan_taskih}×`}
              changed={diffTaskih}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-xl border border-border">
            <IconBrain size={13} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Nama model baru:</span>
            <span className="text-xs font-mono font-semibold text-primary">{namaModelBaru}</span>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
            <IconNetwork size={14} className="shrink-0 mt-0.5 text-primary" />
            <span>
              Proses ini akan menjalankan <strong className="text-foreground">4 langkah</strong>:
              nonaktifkan model lama → simpan aturan → generate training data → refresh halaman.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button onClick={eksekusiSimpan}>
              <IconPlayerPlay size={14} className="mr-1.5" />
              Ya, Simpan & Lihat Proses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ MODAL — Konfirmasi Reset ══ */}
      <Dialog open={activeModal === 'reset'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconRotateClockwise size={18} className="text-amber-600" />
              Konfirmasi Reset ke Default
            </DialogTitle>
            <DialogDescription>
              Semua parameter akan dikembalikan ke nilai bawaan sistem. Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border rounded-xl border border-border px-4 py-1 my-1">
            <DiffRow
              label="Batas Jilid 0–4"
              before={`${aturan?.batas_durasi_jilid_0_4 ?? '—'} bulan`}
              after="3 bulan"
              changed={aturan?.batas_durasi_jilid_0_4 !== 3}
            />
            <DiffRow
              label="Batas Jilid 5–6"
              before={`${aturan?.batas_durasi_jilid_5_6 ?? '—'} bulan`}
              after="4 bulan"
              changed={aturan?.batas_durasi_jilid_5_6 !== 4}
            />
            <DiffRow
              label="Batas Taskih"
              before={`${aturan?.batas_pengulangan_taskih ?? '—'}×`}
              after="2×"
              changed={aturan?.batas_pengulangan_taskih !== 2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={eksekusiReset}>
              <IconRotateClockwise size={14} className="mr-1.5" />
              Ya, Reset ke Default
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ MODAL — Post-Simpan ══ */}
      <Dialog open={activeModal === 'post-simpan'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertTriangle size={18} className="text-amber-500" />
              Aturan Tersimpan — Model Perlu Dilatih
            </DialogTitle>
            <DialogDescription>
              Model Decision Tree saat ini <strong>masih menggunakan aturan lama</strong>. Latih
              ulang agar klasifikasi santri diperbarui.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Jika tidak segera dilatih ulang:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-700 dark:text-amber-400">
              <li>Klasifikasi BBK/TBBK santri tidak akan berubah</li>
              <li>Hasil prediksi tidak mencerminkan aturan baru</li>
              <li>
                Tombol <strong>Latih Ulang Model</strong> akan tetap tersedia di halaman
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
            <IconNetwork size={14} className="shrink-0 mt-0.5 text-primary" />
            <span>
              Latih ulang akan menjalankan <strong className="text-foreground">6 langkah</strong>{' '}
              otomatis lengkap dengan progress real-time.
            </span>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setActiveModal(null)} className="sm:flex-none">
              Nanti Saja
            </Button>
            <Button
              onClick={() => eksekusiLatihUlang('post-simpan')}
              className="flex-1 sm:flex-none gap-2"
            >
              <IconBrain size={14} />
              Latih Ulang Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ MODAL — Konfirmasi Latih Ulang ══ */}
      <Dialog open={activeModal === 'latih'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBrain size={18} className="text-primary" />
              Konfirmasi Latih Ulang Model
            </DialogTitle>
            <DialogDescription>
              Model akan dilatih ulang menggunakan aturan aktif saat ini dan semua santri akan
              diklasifikasi ulang.
            </DialogDescription>
          </DialogHeader>

          {aturan && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-mono font-semibold text-foreground break-all">
                {namaModel(
                  aturan.batas_durasi_jilid_0_4,
                  aturan.batas_durasi_jilid_5_6,
                  aturan.batas_pengulangan_taskih
                )}
              </p>
              {[
                { label: 'Batas Jilid 0–4', value: `${aturan.batas_durasi_jilid_0_4} bulan` },
                { label: 'Batas Jilid 5–6', value: `${aturan.batas_durasi_jilid_5_6} bulan` },
                { label: 'Batas Taskih', value: `${aturan.batas_pengulangan_taskih}×` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
            <IconNetwork size={14} className="shrink-0 mt-0.5 text-primary" />
            <span>
              Proses ini akan berjalan dalam <strong className="text-foreground">6 langkah</strong>:
              ambil data → kirim ke ML Service → evaluasi → simpan → reklasifikasi santri → refresh.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button onClick={() => eksekusiLatihUlang('latih')}>
              <IconBrain size={14} className="mr-1.5" />
              Mulai Latih Ulang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ MODAL — Detail Aturan ══ */}
      <Dialog
        open={activeModal === 'detail' && selectedRiwayat != null}
        onOpenChange={(o) => {
          if (!o) {
            setActiveModal(null)
            setSelectedRiwayat(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          {selectedRiwayat && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconEye size={18} className="text-primary" />
                  Detail Model
                </DialogTitle>
                <DialogDescription>
                  Informasi lengkap aturan dan performa model Decision Tree ini.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border gap-2">
                  <span className="text-xs font-mono font-semibold text-foreground break-all">
                    {namaModel(
                      selectedRiwayat.batas_durasi_jilid_0_4,
                      selectedRiwayat.batas_durasi_jilid_5_6,
                      selectedRiwayat.batas_pengulangan_taskih
                    )}
                  </span>
                  {selectedRiwayat.is_active ? (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                      Nonaktif
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Parameter Aturan
                  </p>
                  <div className="divide-y divide-border rounded-xl border border-border px-4 py-1">
                    {[
                      {
                        label: 'Batas Jilid 0–4',
                        value: `${selectedRiwayat.batas_durasi_jilid_0_4} bulan`,
                      },
                      {
                        label: 'Batas Jilid 5–6',
                        value: `${selectedRiwayat.batas_durasi_jilid_5_6} bulan`,
                      },
                      {
                        label: 'Batas Pengulangan Taskih',
                        value: `${selectedRiwayat.batas_pengulangan_taskih}×`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRiwayat.model_versi ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Performa Model
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: 'Akurasi',
                          value: selectedRiwayat.model_akurasi,
                          color: 'text-emerald-600',
                        },
                        {
                          label: 'Precision',
                          value: selectedRiwayat.model_precision,
                          color: 'text-blue-600',
                        },
                        {
                          label: 'Recall',
                          value: selectedRiwayat.model_recall,
                          color: 'text-purple-600',
                        },
                        {
                          label: 'F1-Score',
                          value: selectedRiwayat.model_f1,
                          color: 'text-amber-600',
                        },
                      ].map(({ label, value, color }) => (
                        <div
                          key={label}
                          className="p-3 bg-muted/30 rounded-xl border border-border"
                        >
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className={cn('text-xl font-bold mt-0.5', color)}>
                            {value != null ? `${Math.round(value * 100)}%` : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Versi: <span className="font-mono">{selectedRiwayat.model_versi}</span>
                      {selectedRiwayat.model_trained_at && (
                        <>
                          {' '}
                          · Dilatih:{' '}
                          {new Date(selectedRiwayat.model_trained_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <IconAlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Model ini belum pernah dilatih. Aktifkan dan latih ulang untuk mendapatkan
                      data performa.
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Dibuat:{' '}
                  {new Date(selectedRiwayat.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <DialogFooter>
                <Button
                  onClick={async () => {
                    if (!selectedRiwayat) return
                    const target = selectedRiwayat
                    setActiveModal(null)
                    setSelectedRiwayat(null)

                    const targetId = target.id
                    const steps: ProcessStep[] = [
                      {
                        id: 'aktifkan',
                        label: 'Aktifkan model',
                        description: 'Mengatur model ini sebagai aktif',
                        icon: <IconPlayerPlay size={14} />,
                        status: target.is_active ? 'done' : 'idle',
                        result: target.is_active ? 'Sudah aktif' : undefined,
                      },
                      {
                        id: 'fetch-aturan',
                        label: 'Ambil konfigurasi aturan',
                        description: 'Membaca parameter aturan aktif',
                        icon: <IconDatabase size={14} />,
                        status: 'idle',
                      },
                      {
                        id: 'fetch-training',
                        label: 'Ambil data training',
                        description: 'Mengambil data dari training_master',
                        icon: <IconDatabase size={14} />,
                        status: 'idle',
                      },
                      {
                        id: 'latih',
                        label: 'Melatih model ML',
                        description: 'Mengirim data ke ML Service Flask',
                        icon: <IconBrain size={14} />,
                        status: 'idle',
                      },
                      {
                        id: 'evaluasi',
                        label: 'Simpan hasil evaluasi',
                        description: 'Menyimpan metrik ke database',
                        icon: <IconChartPie size={14} />,
                        status: 'idle',
                      },
                      {
                        id: 'reklasifikasi',
                        label: 'Reklasifikasi semua santri',
                        description: 'Memperbarui hasil rekomendasi',
                        icon: <IconWand size={14} />,
                        status: 'idle',
                      },
                      {
                        id: 'reload',
                        label: 'Refresh data halaman',
                        description: 'Memuat ulang data aktif',
                        icon: <IconRefresh size={14} />,
                        status: 'idle',
                      },
                    ]

                    initProcess({
                      title: 'Latih Ulang Model dari Detail',
                      subtitle: `Mengaktifkan dan melatih ${namaModel(target.batas_durasi_jilid_0_4, target.batas_durasi_jilid_5_6, target.batas_pengulangan_taskih)}.`,
                      steps,
                    })

                    try {
                      if (!target.is_active) {
                        updateStep('aktifkan', { status: 'running' })
                        await setAturanAktif(targetId)
                        updateStep('aktifkan', {
                          status: 'done',
                          result: 'Model berhasil diaktifkan',
                        })
                      }

                      updateStep('fetch-aturan', { status: 'running' })
                      await new Promise((r) => setTimeout(r, 300))
                      updateStep('fetch-aturan', {
                        status: 'done',
                        result: 'Konfigurasi aturan berhasil dibaca',
                      })

                      updateStep('fetch-training', { status: 'running' })
                      await new Promise((r) => setTimeout(r, 400))
                      updateStep('fetch-training', {
                        status: 'done',
                        result: 'Data training siap dikirim',
                      })

                      updateStep('latih', { status: 'running' })
                      const hasil = await latihUlangModel(targetId)
                      updateStep('latih', {
                        status: 'done',
                        result: `Model ${hasil.versi} selesai`,
                      })

                      updateStep('evaluasi', { status: 'running' })
                      await new Promise((r) => setTimeout(r, 300))
                      updateStep('evaluasi', {
                        status: 'done',
                        result: `Akurasi: ${Math.round(hasil.akurasi * 100)}% | F1: ${Math.round(hasil.f1 * 100)}%`,
                      })

                      updateStep('reklasifikasi', { status: 'running' })
                      await reklasifikasiSemua()
                      updateStep('reklasifikasi', {
                        status: 'done',
                        result: `${hasil.berhasil} santri diklasifikasi ulang`,
                      })

                      updateStep('reload', { status: 'running' })
                      setEvaluasi(hasil)
                      setNeedsRetrain(false)
                      await loadData()
                      updateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

                      setProcessEvaluasi(hasil)
                      toast.success(
                        `Model berhasil dilatih ulang! Akurasi: ${Math.round(hasil.akurasi * 100)}%`,
                        {
                          description: `${hasil.berhasil} santri berhasil diklasifikasi ulang`,
                        }
                      )
                    } catch (err: unknown) {
                      const step = processStepsRef.current.find((s) => s.status === 'running')
                      if (step)
                        updateStep(step.id, { status: 'error', result: (err as Error).message })
                      toast.error((err as Error).message ?? 'Gagal melatih ulang model')
                    }
                  }}
                  className="mr-auto"
                >
                  <IconBrain size={14} className="mr-1.5" />
                  Latih Ulang Model Ini
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveModal(null)
                    setSelectedRiwayat(null)
                  }}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ MODAL — Konfirmasi Hapus ══ */}
      <Dialog
        open={activeModal === 'delete' && selectedRiwayat != null}
        onOpenChange={(o) => {
          if (!o) {
            setActiveModal(null)
            setSelectedRiwayat(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          {selectedRiwayat && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <IconTrash size={18} />
                  Hapus Model
                </DialogTitle>
                <DialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Data model berikut akan dihapus secara
                  permanen.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl space-y-2">
                <p className="text-xs font-mono font-semibold text-foreground break-all">
                  {namaModel(
                    selectedRiwayat.batas_durasi_jilid_0_4,
                    selectedRiwayat.batas_durasi_jilid_5_6,
                    selectedRiwayat.batas_pengulangan_taskih
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Jilid 0–4: <strong>{selectedRiwayat.batas_durasi_jilid_0_4} bln</strong> · Jilid
                  5–6: <strong>{selectedRiwayat.batas_durasi_jilid_5_6} bln</strong> · Taskih:{' '}
                  <strong>{selectedRiwayat.batas_pengulangan_taskih}×</strong>
                </p>
                {selectedRiwayat.model_f1 != null && (
                  <p className="text-xs text-muted-foreground">
                    F1-Score:{' '}
                    <strong className="text-amber-600">
                      {Math.round(selectedRiwayat.model_f1 * 100)}%
                    </strong>{' '}
                    · Akurasi:{' '}
                    <strong className="text-emerald-600">
                      {Math.round((selectedRiwayat.model_akurasi ?? 0) * 100)}%
                    </strong>
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
                <IconNetwork size={14} className="shrink-0 mt-0.5 text-primary" />
                <span>
                  Proses berjalan dalam <strong className="text-foreground">4 langkah</strong>:
                  verifikasi → hapus data training → hapus aturan → refresh.
                </span>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveModal(null)
                    setSelectedRiwayat(null)
                  }}
                >
                  Batal
                </Button>
                <Button variant="destructive" onClick={eksekusiDelete}>
                  <IconTrash size={14} className="mr-1.5" />
                  Ya, Hapus & Lihat Proses
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ MODAL — Konfirmasi Set Aktif ══ */}
      <Dialog
        open={activeModal === 'set-aktif' && selectedRiwayat != null}
        onOpenChange={(o) => {
          if (!o) {
            setActiveModal(null)
            setSelectedRiwayat(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          {selectedRiwayat && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconPlayerPlay size={18} className="text-primary" />
                  Aktifkan Model Ini?
                </DialogTitle>
                <DialogDescription>
                  Model berikut akan dijadikan aktif. Model aktif saat ini akan dinonaktifkan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Model yang akan diaktifkan:
                  </p>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                    <p className="text-xs font-mono font-semibold text-primary break-all">
                      {namaModel(
                        selectedRiwayat.batas_durasi_jilid_0_4,
                        selectedRiwayat.batas_durasi_jilid_5_6,
                        selectedRiwayat.batas_pengulangan_taskih
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Jilid 0–4: <strong>{selectedRiwayat.batas_durasi_jilid_0_4} bln</strong> ·{' '}
                      Jilid 5–6: <strong>{selectedRiwayat.batas_durasi_jilid_5_6} bln</strong> ·{' '}
                      Taskih: <strong>{selectedRiwayat.batas_pengulangan_taskih}×</strong>
                    </p>
                    {selectedRiwayat.model_f1 != null ? (
                      <div className="flex flex-wrap gap-x-3 text-xs">
                        <span>
                          F1:{' '}
                          <strong className="text-amber-600">
                            {Math.round(selectedRiwayat.model_f1 * 100)}%
                          </strong>
                        </span>
                        {selectedRiwayat.model_akurasi != null && (
                          <span>
                            Akurasi:{' '}
                            <strong className="text-emerald-600">
                              {Math.round(selectedRiwayat.model_akurasi * 100)}%
                            </strong>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <IconAlertTriangle size={11} />
                        Belum pernah dilatih — performa belum diketahui
                      </p>
                    )}
                  </div>
                </div>

                {aturan && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      Menggantikan model aktif:
                    </p>
                    <div className="p-3 bg-muted/30 border border-border rounded-xl">
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {namaModel(
                          aturan.batas_durasi_jilid_0_4,
                          aturan.batas_durasi_jilid_5_6,
                          aturan.batas_pengulangan_taskih
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
                  <IconNetwork size={14} className="shrink-0 mt-0.5 text-primary" />
                  <span>
                    Proses berjalan dalam{' '}
                    <strong className="text-foreground">
                      {selectedRiwayat.model_versi ? '5' : '4'} langkah
                    </strong>
                    {selectedRiwayat.model_versi
                      ? ': ambil data → nonaktifkan lama → aktifkan baru → reklasifikasi santri → refresh.'
                      : ': ambil data → nonaktifkan lama → aktifkan baru → refresh.'}
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveModal(null)
                    setSelectedRiwayat(null)
                  }}
                >
                  Batal
                </Button>
                <Button onClick={eksekusiSetAktif}>
                  <IconPlayerPlay size={14} className="mr-1.5" />
                  Aktifkan & Lihat Proses
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
