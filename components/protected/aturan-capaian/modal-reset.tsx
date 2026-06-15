'use client'

import { IconRotateClockwise } from '@tabler/icons-react'
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
import { AturanCapaian } from './types'

interface ModalResetProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  aturan: AturanCapaian | null
}

export function ModalReset({ open, onClose, onConfirm, aturan }: ModalResetProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <IconRotateClockwise size={14} className="mr-1.5" />
            Ya, Reset ke Default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
