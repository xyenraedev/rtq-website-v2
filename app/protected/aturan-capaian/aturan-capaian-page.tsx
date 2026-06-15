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
  IconDatabase,
  IconWand,
  IconX,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

// ── Sub-components ────────────────────────────────────────────────────────────

import type {
  FormValues,
  ModalType,
  ProcessStep,
  ProcessConfig,
} from '@/components/protected/aturan-capaian/types'
import { isDuplikat, namaModel } from '@/components/protected/aturan-capaian/helpers'
import { MetricCard } from '@/components/protected/aturan-capaian/metric-card'
import { ModalDelete } from '@/components/protected/aturan-capaian/modal-delete'
import { ModalDetail } from '@/components/protected/aturan-capaian/modal-detail'
import { ModalLatih } from '@/components/protected/aturan-capaian/modal-latih'
import { ModalPostSimpan } from '@/components/protected/aturan-capaian/modal-post-simpan'
import { ModalReset } from '@/components/protected/aturan-capaian/modal-reset'
import { ModalSetAktif } from '@/components/protected/aturan-capaian/modal-set-aktif'
import { ModalSimpan } from '@/components/protected/aturan-capaian/modal-simpan'
import { ProcessDialog } from '@/components/protected/aturan-capaian/process-dialog'
import { SliderInput } from '@/components/protected/aturan-capaian/slider-input'
import { RiwayatCard } from '@/components/protected/aturan-capaian/riwayat-card'

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

  const namaModelBaru = namaModel(
    formValues.batas_durasi_jilid_0_4,
    formValues.batas_durasi_jilid_5_6,
    formValues.batas_pengulangan_taskih
  )

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
          icon: <IconCheck size={14} />,
          status: 'idle',
        },
        {
          id: 'trigger',
          label: 'Generate data training',
          description: 'Trigger database otomatis membuat data di training_master',
          icon: <IconBrain size={14} />,
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
      updateStep('nonaktif', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      updateStep('nonaktif', { status: 'done', result: 'Model lama dinonaktifkan' })

      updateStep('insert', { status: 'running' })
      const newAturan = await simpanAturan(formValues)
      updateStep('insert', { status: 'done', result: `ID: ${newAturan.id.slice(0, 8)}…` })

      updateStep('trigger', { status: 'running' })
      await new Promise((r) => setTimeout(r, 600))
      updateStep('trigger', { status: 'done', result: 'training_master berhasil digenerate' })

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
          icon: <IconCheck size={14} />,
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
          icon: <IconCheck size={14} />,
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
                      {
                        label: 'Precision',
                        value: aturan.model_precision,
                        color: 'text-blue-600',
                      },
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

      {/* ══ Process Dialog (shared) ══ */}
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

      {/* ══ Modals ══ */}
      <ModalSimpan
        open={activeModal === 'simpan'}
        onClose={() => setActiveModal(null)}
        onConfirm={eksekusiSimpan}
        aturan={aturan}
        formValues={formValues}
      />

      <ModalReset
        open={activeModal === 'reset'}
        onClose={() => setActiveModal(null)}
        onConfirm={eksekusiReset}
        aturan={aturan}
      />

      <ModalPostSimpan
        open={activeModal === 'post-simpan'}
        onClose={() => setActiveModal(null)}
        onLatihUlang={() => eksekusiLatihUlang('post-simpan')}
      />

      <ModalLatih
        open={activeModal === 'latih'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => eksekusiLatihUlang('latih')}
        aturan={aturan}
      />

      <ModalDetail
        open={activeModal === 'detail' && selectedRiwayat != null}
        selectedRiwayat={selectedRiwayat}
        onClose={() => {
          setActiveModal(null)
          setSelectedRiwayat(null)
        }}
        onInitProcess={initProcess}
        onUpdateStep={updateStep}
        onSetEvaluasi={setEvaluasi}
        onSetNeedsRetrain={setNeedsRetrain}
        onLoadData={loadData}
        processStepsRef={processStepsRef}
      />

      <ModalDelete
        open={activeModal === 'delete' && selectedRiwayat != null}
        selectedRiwayat={selectedRiwayat}
        onClose={() => {
          setActiveModal(null)
          setSelectedRiwayat(null)
        }}
        onConfirm={eksekusiDelete}
      />

      <ModalSetAktif
        open={activeModal === 'set-aktif' && selectedRiwayat != null}
        selectedRiwayat={selectedRiwayat}
        aturan={aturan}
        onClose={() => {
          setActiveModal(null)
          setSelectedRiwayat(null)
        }}
        onConfirm={eksekusiSetAktif}
      />
    </div>
  )
}
