'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  Clock,
  Eye,
  Tag,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { useState } from 'react'
import { deleteBerita, deleteBeritaWithCleanup, type Berita } from '@/lib/berita'
import { toast } from 'sonner'
import Image from 'next/image'

// ─── Utils ────────────────────────────────────────────────────────────────────

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModalDeleteBeritaProps {
  open: boolean
  onClose: () => void
  berita: Berita
  /** Dipanggil setelah delete sukses — parent hapus item dari list */
  onDeleted: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModalDeleteBerita({ open, onClose, berita, onDeleted }: ModalDeleteBeritaProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleClose = () => {
    if (deleting) return
    setConfirmed(false)
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteBeritaWithCleanup(berita.id)
      onDeleted(berita.id)
      toast.success('Berita berhasil dihapus', {
        description: `"${berita.judul}" telah dihapus secara permanen.`,
        duration: 4000,
      })
      setConfirmed(false)
      onClose()
    } catch (e: unknown) {
      toast.error('Gagal menghapus berita', {
        description:
          e instanceof Error ? e.message : 'Terjadi kesalahan pada server. Silakan coba lagi.',
        duration: 5000,
      })
    } finally {
      setDeleting(false)
    }
  }

  const kategoriNama = berita.berita_kategori?.nama ?? '-'

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && open) handleClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

        <DialogPrimitive.Content
          onInteractOutside={(e) => {
            e.preventDefault()
            handleClose()
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            handleClose()
          }}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-full max-w-md flex flex-col',
            'bg-card border border-border rounded-2xl shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'duration-200'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-base font-bold text-foreground">
                  Hapus Berita
                </DialogPrimitive.Title>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
            <DialogPrimitive.Close
              onClick={handleClose}
              disabled={deleting}
              className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-1.5 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Tutup</span>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Warning banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-relaxed">
                Berita yang dihapus <span className="font-semibold">tidak dapat dipulihkan</span>.
                Pastikan Anda yakin sebelum melanjutkan.
              </p>
            </div>

            {/* Berita detail card */}
            <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
              {/* Thumbnail strip jika ada */}
              {berita.gambar && (
                <div className="relative h-28 bg-muted overflow-hidden">
                  <Image
                    src={berita.gambar}
                    alt={berita.judul}
                    fill
                    className="object-cover opacity-80"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-card/80 to-transparent" />
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* Judul */}
                <div>
                  <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                    {berita.judul}
                  </p>
                  {berita.ringkasan && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {berita.ringkasan}
                    </p>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3 shrink-0" />
                    {kategoriNama}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3 shrink-0" />
                    {berita.views.toLocaleString('id')} views
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {berita.waktu_baca} menit baca
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 shrink-0" />
                    {formatTanggal(berita.created_at)}
                  </span>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border',
                    berita.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-muted text-muted-foreground border-border'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      berita.status === 'published' ? 'bg-emerald-500' : 'bg-muted-foreground'
                    )}
                  />
                  {berita.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Konfirmasi checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={deleting}
                  className="peer sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center',
                    confirmed
                      ? 'bg-destructive border-destructive'
                      : 'bg-background border-border group-hover:border-destructive/50'
                  )}
                >
                  {confirmed && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                Saya mengerti bahwa berita{' '}
                <span className="font-semibold text-foreground">"{berita.judul}"</span> akan dihapus
                secara permanen dan tidak bisa dipulihkan.
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
            <button
              type="button"
              onClick={handleClose}
              disabled={deleting}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                confirmed && !deleting
                  ? 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm'
                  : 'bg-destructive/30 text-destructive-foreground/50 cursor-not-allowed'
              )}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus Permanen
                </>
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
