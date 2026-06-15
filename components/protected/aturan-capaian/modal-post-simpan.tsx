'use client'

import { IconAlertTriangle, IconBrain, IconNetwork } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ModalPostSimpanProps {
  open: boolean
  onClose: () => void
  onLatihUlang: () => void
}

export function ModalPostSimpan({ open, onClose, onLatihUlang }: ModalPostSimpanProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-amber-500" />
            Aturan Tersimpan — Model Perlu Dilatih
          </DialogTitle>
          <DialogDescription>
            Model Decision Tree saat ini <strong>masih menggunakan aturan lama</strong>. Latih ulang
            agar klasifikasi santri diperbarui.
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
          <Button variant="outline" onClick={onClose} className="sm:flex-none">
            Nanti Saja
          </Button>
          <Button onClick={onLatihUlang} className="flex-1 sm:flex-none gap-2">
            <IconBrain size={14} />
            Latih Ulang Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
