'use client'

import { IconCheck, IconPlayerPlay, IconBrain, IconNetwork } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DiffRow } from './diff-row'
import { AturanCapaian, FormValues } from './types'
import { buatNamaModel } from './helpers'

interface ModalSimpanProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  aturan: AturanCapaian | null
  formValues: FormValues
}

export function ModalSimpan({ open, onClose, onConfirm, aturan, formValues }: ModalSimpanProps) {
  const diffJilid04 =
    aturan != null && aturan.batas_durasi_jilid_0_4 !== formValues.batas_durasi_jilid_0_4
  const diffJilid56 =
    aturan != null && aturan.batas_durasi_jilid_5_6 !== formValues.batas_durasi_jilid_5_6
  const diffTaskih =
    aturan != null && aturan.batas_pengulangan_taskih !== formValues.batas_pengulangan_taskih

  const namaModelBaru = buatNamaModel(
    formValues.batas_durasi_jilid_0_4,
    formValues.batas_durasi_jilid_5_6,
    formValues.batas_pengulangan_taskih
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onConfirm}>
            <IconPlayerPlay size={14} className="mr-1.5" />
            Ya, Simpan & Lihat Proses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
