'use client'

import { IconPlayerPlay, IconAlertTriangle, IconNetwork } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AturanCapaian } from './types'
import { namaModel } from './helpers'

interface ModalSetAktifProps {
  open: boolean
  selectedRiwayat: AturanCapaian | null
  aturan: AturanCapaian | null
  onClose: () => void
  onConfirm: () => void
}

export function ModalSetAktif({
  open,
  selectedRiwayat,
  aturan,
  onClose,
  onConfirm,
}: ModalSetAktifProps) {
  if (!selectedRiwayat) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
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
            <p className="text-xs text-muted-foreground mb-1.5">Model yang akan diaktifkan:</p>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <p className="text-xs font-mono font-semibold text-primary break-all">
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
              <p className="text-xs text-muted-foreground mb-1.5">Menggantikan model aktif:</p>
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
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onConfirm}>
            <IconPlayerPlay size={14} className="mr-1.5" />
            Aktifkan & Lihat Proses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
