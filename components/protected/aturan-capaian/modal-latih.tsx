'use client'

import { IconBrain, IconNetwork } from '@tabler/icons-react'
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

interface ModalLatihProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  aturan: AturanCapaian | null
}

export function ModalLatih({ open, onClose, onConfirm, aturan }: ModalLatihProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onConfirm}>
            <IconBrain size={14} className="mr-1.5" />
            Mulai Latih Ulang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
