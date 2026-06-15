'use client'

import {
  IconEye,
  IconAlertTriangle,
  IconBrain,
  IconDatabase,
  IconChartPie,
  IconRefresh,
  IconWand,
  IconPlayerPlay,
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
import { cn } from '@/lib/utils'
import { AturanCapaian, EvaluasiResult, ProcessStep } from './types'
import { namaModel } from './helpers'
import { latihUlangModel, setAturanAktif } from '@/lib/ml-services/aturan-capaian'
import { reklasifikasiSemua } from '@/lib/ml-services/hasil-rekomendasi'
import { toast } from 'sonner'

interface ModalDetailProps {
  open: boolean
  selectedRiwayat: AturanCapaian | null
  onClose: () => void
  onInitProcess: (config: { title: string; subtitle: string; steps: ProcessStep[] }) => void
  onUpdateStep: (stepId: string, patch: Partial<ProcessStep>) => void
  onSetEvaluasi: (result: EvaluasiResult) => void
  onSetNeedsRetrain: (v: boolean) => void
  onLoadData: () => Promise<void>
  processStepsRef: React.MutableRefObject<ProcessStep[]>
}

export function ModalDetail({
  open,
  selectedRiwayat,
  onClose,
  onInitProcess,
  onUpdateStep,
  onSetEvaluasi,
  onSetNeedsRetrain,
  onLoadData,
  processStepsRef,
}: ModalDetailProps) {
  async function handleLatihUlang() {
    if (!selectedRiwayat) return
    const target = selectedRiwayat
    onClose()

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

    onInitProcess({
      title: 'Latih Ulang Model dari Detail',
      subtitle: `Mengaktifkan dan melatih ${namaModel(target.batas_durasi_jilid_0_4, target.batas_durasi_jilid_5_6, target.batas_pengulangan_taskih)}.`,
      steps,
    })

    try {
      if (!target.is_active) {
        onUpdateStep('aktifkan', { status: 'running' })
        await setAturanAktif(target.id)
        onUpdateStep('aktifkan', { status: 'done', result: 'Model berhasil diaktifkan' })
      }

      onUpdateStep('fetch-aturan', { status: 'running' })
      await new Promise((r) => setTimeout(r, 300))
      onUpdateStep('fetch-aturan', { status: 'done', result: 'Konfigurasi aturan berhasil dibaca' })

      onUpdateStep('fetch-training', { status: 'running' })
      await new Promise((r) => setTimeout(r, 400))
      onUpdateStep('fetch-training', { status: 'done', result: 'Data training siap dikirim' })

      onUpdateStep('latih', { status: 'running' })
      const hasil = await latihUlangModel(target.id)
      onUpdateStep('latih', { status: 'done', result: `Model ${hasil.versi} selesai` })

      onUpdateStep('evaluasi', { status: 'running' })
      await new Promise((r) => setTimeout(r, 300))
      onUpdateStep('evaluasi', {
        status: 'done',
        result: `Akurasi: ${Math.round(hasil.akurasi * 100)}% | F1: ${Math.round(hasil.f1 * 100)}%`,
      })

      onUpdateStep('reklasifikasi', { status: 'running' })
      await reklasifikasiSemua()
      onUpdateStep('reklasifikasi', {
        status: 'done',
        result: `${hasil.berhasil} santri diklasifikasi ulang`,
      })

      onUpdateStep('reload', { status: 'running' })
      onSetEvaluasi(hasil)
      onSetNeedsRetrain(false)
      await onLoadData()
      onUpdateStep('reload', { status: 'done', result: 'Halaman diperbarui' })

      toast.success(`Model berhasil dilatih ulang! Akurasi: ${Math.round(hasil.akurasi * 100)}%`, {
        description: `${hasil.berhasil} santri berhasil diklasifikasi ulang`,
      })
    } catch (err: unknown) {
      const step = processStepsRef.current.find((s) => s.status === 'running')
      if (step) onUpdateStep(step.id, { status: 'error', result: (err as Error).message })
      toast.error((err as Error).message ?? 'Gagal melatih ulang model')
    }
  }

  if (!selectedRiwayat) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
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
                  <div key={label} className="p-3 bg-muted/30 rounded-xl border border-border">
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
                Model ini belum pernah dilatih. Aktifkan dan latih ulang untuk mendapatkan data
                performa.
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
          <Button onClick={handleLatihUlang} className="mr-auto">
            <IconBrain size={14} className="mr-1.5" />
            Latih Ulang Model Ini
          </Button>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
