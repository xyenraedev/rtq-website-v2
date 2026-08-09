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
import { AturanCapaian } from '../../../lib/aturan-capaian/types'
import { namaModel, formatPersen } from '../../../lib/aturan-capaian/helpers'

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
  const sudahPernahDilatih = !!selectedRiwayat.model_trained_at

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPlayerPlay size={18} className="text-primary" />
            {sudahPernahDilatih ? 'Aktifkan Model Ini?' : 'Aktifkan & Latih Model Ini?'}
          </DialogTitle>
          <DialogDescription>
            {sudahPernahDilatih
              ? 'Model ini sudah pernah dilatih sebelumnya dan akan langsung dipakai tanpa training ulang. Seluruh santri akan diklasifikasi ulang memakai model ini. Model aktif saat ini akan dinonaktifkan.'
              : 'Model ini belum pernah dilatih. Model akan dijadikan aktif, dilatih untuk pertama kali, dan seluruh santri akan diklasifikasi ulang. Model aktif saat ini akan dinonaktifkan.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Model yang akan diaktifkan:</p>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <p className="text-xs font-mono font-semibold text-primary break-all">
                {namaModel(selectedRiwayat.model_versi)}
              </p>
              <p className="text-xs text-muted-foreground">
                Jilid 0–4: <strong>{selectedRiwayat.batas_durasi_jilid_0_4} bln</strong> · Jilid
                5–6: <strong>{selectedRiwayat.batas_durasi_jilid_5_6} bln</strong> · Taskih:{' '}
                <strong>{selectedRiwayat.batas_pengulangan_taskih}×</strong>
              </p>
              {selectedRiwayat.model_trained_at && (
                <p className="text-xs text-muted-foreground">
                  Terakhir dilatih:{' '}
                  <strong>
                    {new Date(selectedRiwayat.model_trained_at).toLocaleString('id-ID')}
                  </strong>
                </p>
              )}
              {selectedRiwayat.model_f1 != null ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Akurasi:{' '}
                    <strong className="text-emerald-600">
                      {formatPersen(selectedRiwayat.model_akurasi)}
                    </strong>
                  </span>
                  <span>
                    Presisi:{' '}
                    <strong className="text-foreground">
                      {formatPersen(selectedRiwayat.model_precision)}
                    </strong>
                  </span>
                  <span>
                    Recall:{' '}
                    <strong className="text-foreground">
                      {formatPersen(selectedRiwayat.model_recall)}
                    </strong>
                  </span>
                  <span>
                    F1:{' '}
                    <strong className="text-foreground">
                      {formatPersen(selectedRiwayat.model_f1)}
                    </strong>
                  </span>
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
                  {namaModel(aturan.model_versi)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground">
            <IconNetwork size={14} className="shrink-0 mt-0.5 text-primary" />
            <span>
              Proses berjalan dalam{' '}
              <strong className="text-foreground">
                {sudahPernahDilatih ? '5 langkah' : '6 langkah'}
              </strong>
              : ambil data → nonaktifkan lama → aktifkan baru
              {sudahPernahDilatih ? '' : ' → latih model'} → reklasifikasi santri → refresh.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onConfirm} >
            <IconPlayerPlay size={14} className="mr-1.5" />
            Aktifkan Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
