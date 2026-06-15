'use client'

import { IconTrash, IconNetwork } from '@tabler/icons-react'
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

interface ModalDeleteProps {
  open: boolean
  selectedRiwayat: AturanCapaian | null
  onClose: () => void
  onConfirm: () => void
}

export function ModalDelete({ open, selectedRiwayat, onClose, onConfirm }: ModalDeleteProps) {
  if (!selectedRiwayat) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <IconTrash size={18} />
            Hapus Model
          </DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Data model berikut akan dihapus secara permanen.
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
            Jilid 0–4: <strong>{selectedRiwayat.batas_durasi_jilid_0_4} bln</strong> · Jilid 5–6:{' '}
            <strong>{selectedRiwayat.batas_durasi_jilid_5_6} bln</strong> · Taskih:{' '}
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
            Proses berjalan dalam <strong className="text-foreground">4 langkah</strong>: verifikasi
            → hapus data training → hapus aturan → refresh.
          </span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <IconTrash size={14} className="mr-1.5" />
            Ya, Hapus & Lihat Proses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
