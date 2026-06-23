'use client'

import { IconEye, IconAlertTriangle, IconPlayerPlay, IconBrain, IconTrash } from '@tabler/icons-react'
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
import { AturanCapaian } from './types'
import { namaModel, formatPersen } from './helpers'

interface ModalDetailProps {
  open: boolean
  selectedRiwayat: AturanCapaian | null
  onClose: () => void
  onSetAktif: (r: AturanCapaian) => void
  onLatihUlang: (r: AturanCapaian) => void
  onDelete: (r: AturanCapaian) => void
}

export function ModalDetail({
  open,
  selectedRiwayat,
  onClose,
  onSetAktif,
  onLatihUlang,
  onDelete,
}: ModalDetailProps) {
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
              {namaModel(selectedRiwayat.model_versi)}
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
                    color: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    label: 'Presisi',
                    value: selectedRiwayat.model_precision,
                    color: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'Recall',
                    value: selectedRiwayat.model_recall,
                    color: 'text-purple-600 dark:text-purple-400',
                  },
                  {
                    label: 'F1-Score',
                    value: selectedRiwayat.model_f1,
                    color: 'text-amber-600 dark:text-amber-400',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 bg-muted/30 rounded-xl border border-border">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className={cn('text-xl font-bold mt-0.5', color)}>
                      {formatPersen(value)}
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
                {selectedRiwayat.is_active
                  ? 'Model ini belum pernah dilatih. Klik "Latih Ulang Model" untuk mendapatkan data performa.'
                  : 'Model ini belum pernah dilatih. Aktifkan model ini untuk melatih & mendapatkan data performa.'}
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
          {selectedRiwayat.is_active && (
            <Button onClick={() => onLatihUlang(selectedRiwayat)} className="mr-auto">
              <IconBrain size={14} className="mr-1.5" />
              Latih Ulang Model
            </Button>
          )}
          {!selectedRiwayat.is_active && (
            <div className="flex items-center gap-2 w-full justify-between">
              <Button
                variant="outline"
                onClick={() => onDelete(selectedRiwayat)}
                className="mr-auto text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700"
              >
                <IconTrash size={14} className="mr-1.5" />
                Hapus Model
              </Button>
              <Button onClick={() => onSetAktif(selectedRiwayat)}>
                <IconPlayerPlay size={14} className="mr-1.5" />
                Aktifkan Model Ini
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
