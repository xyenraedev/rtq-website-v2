'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import {
  type EvaluasiResult,
  fetchAturanAktif,
  fetchRiwayatAturan,
  simpanAturan,
  resetAturanDefault,
  latihUlangModel,
  deleteAturan,
  setAturanAktif,
} from '@/lib/ml-services/aturan-capaian'
import { reklasifikasiSemua } from '@/lib/ml-services/hasil-rekomendasi'
import type { AturanCapaian } from '@/lib/types'
import type { FormValues, ModalType, ProcessStep, ProcessConfig } from '@/lib/aturan-capaian/types'
import { isDuplikat, namaModel, formatPersen } from '@/lib/aturan-capaian/helpers'

const DEFAULT_FORM_VALUES: FormValues = {
  batas_durasi_jilid_0_4: 6,
  batas_durasi_jilid_5_6: 8,
  batas_pengulangan_taskih: 3,
}

export function useAturanCapaian() {
  const [aturan, setAturan] = useState<AturanCapaian | null>(null)
  const [riwayat, setRiwayat] = useState<AturanCapaian[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluasi, setEvaluasi] = useState<EvaluasiResult | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedRiwayat, setSelectedRiwayat] = useState<AturanCapaian | null>(null)

  const [processOpen, setProcessOpen] = useState(false)
  const [processConfig, setProcessConfig] = useState<ProcessConfig | null>(null)
  const [processEvaluasi, setProcessEvaluasi] = useState<EvaluasiResult | null>(null)
  const processStepsRef = useRef<ProcessStep[]>([])
  const [showAllModels, setShowAllModels] = useState(false)

  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_FORM_VALUES)
  const [hasChanges, setHasChanges] = useState(false)

  const sortedRiwayat = useMemo(() => {
    return [...riwayat].sort((a, b) => {
      if (a.is_active && !b.is_active) return -1
      if (!a.is_active && b.is_active) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [riwayat])

  const displayedRiwayat = showAllModels ? sortedRiwayat : sortedRiwayat.slice(0, 3)

  // ── Process helpers ──────────────────────────────────────────────────────

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

  const closeProcess = useCallback(() => {
    setProcessOpen(false)
    setProcessConfig(null)
    setProcessEvaluasi(null)
  }, [])

  // ── Load data ────────────────────────────────────────────────────────────

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
    void loadData()
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
      aturan?.batas_durasi_jilid_0_4 === 6 &&
      aturan?.batas_durasi_jilid_5_6 === 8 &&
      aturan?.batas_pengulangan_taskih === 3
    )
  }, [aturan])

  const canSimpan = hasChanges && !formIsDuplikat && formBerbedaDariAktif

  const handleSliderChange = useCallback((name: string, value: number) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }, [])

  // ── Simpan (sekaligus latih ulang & reklasifikasi dalam satu alur) ────────

  async function eksekusiSimpan() {
    setActiveModal(null)
    setEvaluasi(null)
    initProcess({
      title: 'Menyimpan & Melatih Ulang Model',
      subtitle:
        'Simpan konfigurasi baru, latih Decision Tree, dan klasifikasi ulang seluruh santri.',
      steps: [
        {
          id: 'nonaktif',
          label: 'Nonaktifkan model lama',
          description: 'Menonaktifkan semua aturan aktif di database',
          icon: 'database',
          status: 'idle',
        },
        {
          id: 'insert',
          label: 'Simpan aturan baru',
          description: 'Menyimpan konfigurasi parameter ke tabel aturan_capaian',
          icon: 'check',
          status: 'idle',
        },
        {
          id: 'trigger',
          label: 'Generate data training',
          description: 'Trigger database otomatis membuat data di training_master',
          icon: 'brain',
          status: 'idle',
        },
        {
          id: 'latih',
          label: 'Melatih model ML',
          description: 'Mengirim data ke ML Service Flask dan melatih Decision Tree',
          icon: 'brain',
          status: 'idle',
        },
        {
          id: 'reklasifikasi',
          label: 'Reklasifikasi semua santri',
          description: 'Memperbarui hasil rekomendasi seluruh santri menggunakan model baru',
          icon: 'wand',
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang daftar model dan model aktif',
          icon: 'refresh',
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

      updateStep('latih', { status: 'running' })
      const hasil = await latihUlangModel(newAturan.id)
      updateStep('latih', { status: 'done', result: `Model ${hasil.versi} selesai dilatih` })

      updateStep('reklasifikasi', { status: 'running' })
      await reklasifikasiSemua()
      updateStep('reklasifikasi', {
        status: 'done',
        result: `Santri berhasil diklasifikasi ulang`,
      })

      updateStep('reload', { status: 'running' })
      setHasChanges(false)
      setEvaluasi(hasil)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Data halaman diperbarui' })

      setProcessEvaluasi(hasil)
      toast.success(`Aturan disimpan & model dilatih! Akurasi: ${formatPersen(hasil.akurasi)}`, {
        description: `Santri berhasil diklasifikasi ulang`,
      })
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal menyimpan & melatih aturan')
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────

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
          icon: 'database',
          status: 'idle',
        },
        {
          id: 'aktifkan',
          label: 'Aktifkan / buat model default',
          description: 'Mengaktifkan model default atau membuat baru jika belum ada',
          icon: 'check',
          status: 'idle',
        },
        {
          id: 'latih',
          label: 'Melatih model ML',
          description: 'Mengirim data ke ML Service Flask dan melatih Decision Tree',
          icon: 'brain',
          status: 'idle',
        },
        {
          id: 'reklasifikasi',
          label: 'Reklasifikasi semua santri',
          description: 'Memperbarui hasil rekomendasi seluruh santri menggunakan model default',
          icon: 'wand',
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang daftar model dan model aktif',
          icon: 'refresh',
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

      updateStep('latih', { status: 'running' })
      const hasil = await latihUlangModel(newAturan.id)
      updateStep('latih', { status: 'done', result: `Model ${hasil.versi} selesai dilatih` })

      updateStep('reklasifikasi', { status: 'running' })
      await reklasifikasiSemua()
      updateStep('reklasifikasi', {
        status: 'done',
        result: `Santri berhasil diklasifikasi ulang`,
      })

      updateStep('reload', { status: 'running' })
      setFormValues(DEFAULT_FORM_VALUES)
      setHasChanges(false)
      setEvaluasi(hasil)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

      setProcessEvaluasi(hasil)
      toast.success('Aturan default dipulihkan & model dilatih ulang', {
        description: `Santri berhasil diklasifikasi ulang`,
      })
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal reset aturan')
    }
  }

  // ── Hapus ──────────────────────────────────────────────────────────────

  async function eksekusiDelete() {
    if (!selectedRiwayat) return
    setActiveModal(null)

    initProcess({
      title: 'Menghapus Model',
      subtitle: `Menghapus model ${namaModel(selectedRiwayat.model_versi)} secara permanen.`,
      steps: [
        {
          id: 'cek',
          label: 'Verifikasi model',
          description: 'Memastikan model bukan model aktif dan ada di database',
          icon: 'database',
          status: 'idle',
        },
        {
          id: 'hapus-training',
          label: 'Hapus data training',
          description: 'Menghapus semua data training_master terkait model ini',
          icon: 'trash',
          status: 'idle',
        },
        {
          id: 'hapus-aturan',
          label: 'Hapus record aturan',
          description: 'Menghapus record dari tabel aturan_capaian',
          icon: 'trash',
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh daftar model',
          description: 'Memperbarui tampilan riwayat model',
          icon: 'refresh',
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

  // ── Set aktif (selalu melatih ulang model + reklasifikasi) ───────────────

  async function eksekusiSetAktif() {
    if (!selectedRiwayat) return
    setActiveModal(null)

    const target = selectedRiwayat
    const namaTarget = namaModel(target.model_versi)
    const sudahPernahDilatih = !!target.model_trained_at

    setSelectedRiwayat(null)
    setEvaluasi(null)

    const steps: ProcessStep[] = [
      {
        id: 'ambil',
        label: 'Ambil data model',
        description: 'Membaca detail model dari tabel aturan_capaian',
        icon: 'database',
        status: 'idle',
      },
      {
        id: 'nonaktif',
        label: 'Nonaktifkan model saat ini',
        description: 'Mengubah is_active = false pada semua model aktif',
        icon: 'x',
        status: 'idle',
      },
      {
        id: 'aktifkan',
        label: `Aktifkan ${namaTarget}`,
        description: 'Mengubah is_active = true pada model terpilih',
        icon: 'check',
        status: 'idle',
      },
      ...(sudahPernahDilatih
        ? []
        : [
            {
              id: 'latih',
              label: 'Melatih model ML',
              description: 'Mengirim data ke ML Service Flask dan melatih Decision Tree',
              icon: 'brain',
              status: 'idle',
            } satisfies ProcessStep,
          ]),
      {
        id: 'reklasifikasi',
        label: 'Reklasifikasi semua santri',
        description: 'Memperbarui hasil rekomendasi menggunakan model ini',
        icon: 'wand',
        status: 'idle',
      },
      {
        id: 'reload',
        label: 'Refresh data halaman',
        description: 'Memuat ulang model aktif dan daftar riwayat',
        icon: 'refresh',
        status: 'idle',
      },
    ]

    initProcess({
      title: sudahPernahDilatih ? 'Mengaktifkan Model' : 'Mengaktifkan & Melatih Model',
      subtitle: sudahPernahDilatih
        ? `Mengganti model aktif ke ${namaTarget} menggunakan model yang sudah tersimpan (tanpa training ulang).`
        : `Mengganti model aktif ke ${namaTarget}, melatih untuk pertama kali, dan reklasifikasi seluruh santri.`,
      steps,
    })

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

      let hasil: EvaluasiResult
      if (sudahPernahDilatih) {
        // Model untuk aturan ini sudah pernah dilatih & tersimpan di Storage —
        // tidak perlu training ulang, cukup dipakai lagi apa adanya.
        hasil = {
          akurasi: target.model_akurasi ?? 0,
          precision: target.model_precision ?? 0,
          recall: target.model_recall ?? 0,
          f1: target.model_f1 ?? 0,
          versi: target.model_versi ?? namaTarget,
          berhasil: 0,
        } as EvaluasiResult
      } else {
        updateStep('latih', { status: 'running' })
        hasil = await latihUlangModel(target.id)
        updateStep('latih', { status: 'done', result: `Model ${hasil.versi} selesai dilatih` })
      }

      updateStep('reklasifikasi', { status: 'running' })
      await reklasifikasiSemua()
      updateStep('reklasifikasi', { status: 'done', result: `Santri berhasil diklasifikasi ulang` })

      updateStep('reload', { status: 'running' })
      setEvaluasi(hasil)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

      setProcessEvaluasi(hasil)
      toast.success(
        sudahPernahDilatih
          ? `${namaTarget} aktif (pakai model tersimpan)`
          : `${namaTarget} aktif & model dilatih`,
        { description: `Santri berhasil diklasifikasi ulang` }
      )
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal mengaktifkan model')
    }
  }

  // ── Latih ulang model aktif saja (tanpa nonaktif/aktifkan ulang) ─────────

  async function eksekusiLatihUlangSaja(target: AturanCapaian) {
    setActiveModal(null)
    setSelectedRiwayat(null)
    setEvaluasi(null)

    const namaTarget = namaModel(target.model_versi)

    initProcess({
      title: 'Melatih Ulang Model Aktif',
      subtitle: `Melatih ulang ${namaTarget} dan reklasifikasi seluruh santri.`,
      steps: [
        {
          id: 'latih',
          label: 'Melatih model ML',
          description: 'Mengirim data ke ML Service Flask dan melatih Decision Tree',
          icon: 'brain',
          status: 'idle',
        },
        {
          id: 'reklasifikasi',
          label: 'Reklasifikasi semua santri',
          description: 'Memperbarui hasil rekomendasi menggunakan model ini',
          icon: 'wand',
          status: 'idle',
        },
        {
          id: 'reload',
          label: 'Refresh data halaman',
          description: 'Memuat ulang model aktif dan daftar riwayat',
          icon: 'refresh',
          status: 'idle',
        },
      ],
    })

    try {
      updateStep('latih', { status: 'running' })
      const hasil = await latihUlangModel(target.id)
      updateStep('latih', { status: 'done', result: `Model ${hasil.versi} selesai dilatih` })

      updateStep('reklasifikasi', { status: 'running' })
      await reklasifikasiSemua()
      updateStep('reklasifikasi', {
        status: 'done',
        result: `Santri berhasil diklasifikasi ulang`,
      })

      updateStep('reload', { status: 'running' })
      setEvaluasi(hasil)
      await loadData()
      updateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

      setProcessEvaluasi(hasil)
      toast.success(`Model berhasil dilatih ulang! Akurasi: ${formatPersen(hasil.akurasi)}`, {
        description: `Santri berhasil diklasifikasi ulang`,
      })
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) updateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal melatih ulang model')
    }
  }

  // ── Callback stabil untuk kartu riwayat (memo-friendly) ───────────────────

  const openDetail = useCallback((item: AturanCapaian) => {
    setSelectedRiwayat(item)
    setActiveModal('detail')
  }, [])

  const openSetAktif = useCallback((item: AturanCapaian) => {
    setSelectedRiwayat(item)
    setActiveModal('set-aktif')
  }, [])

  const openDeleteFromDetail = useCallback((item: AturanCapaian) => {
    setSelectedRiwayat(item)
    setActiveModal('delete')
  }, [])

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setSelectedRiwayat(null)
  }, [])

  const toggleShowAllModels = useCallback(() => {
    setShowAllModels((prev) => !prev)
  }, [])

  return {
    aturan,
    riwayat,
    loading,
    evaluasi,
    activeModal,
    setActiveModal,
    selectedRiwayat,
    setSelectedRiwayat,
    closeModal,

    processOpen,
    processConfig,
    processEvaluasi,
    closeProcess,

    showAllModels,
    toggleShowAllModels,
    sortedRiwayat,
    displayedRiwayat,

    formValues,
    hasChanges,
    formIsDuplikat,
    canSimpan,
    isDefaultConfig,
    handleSliderChange,

    eksekusiSimpan,
    eksekusiReset,
    eksekusiDelete,
    eksekusiSetAktif,
    eksekusiLatihUlangSaja,

    openDetail,
    openSetAktif,
    openDeleteFromDetail,
  }
}

export type UseAturanCapaianReturn = ReturnType<typeof useAturanCapaian>
