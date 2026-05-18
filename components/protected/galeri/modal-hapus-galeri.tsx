'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { formatDimensions, type GaleriWithKategori } from '@/lib/galeri'
import { toast } from 'sonner'
import {
  IconTrash,
  IconX,
  IconAlertTriangle,
  IconPhoto,
  IconCheck,
  IconLoader2,
  IconLink,
  IconDimensions,
  IconCalendar,
  IconPhotoOff,
} from '@tabler/icons-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { deleteGaleri } from '@/lib/galeri'

export interface ModalHapusGaleriProps {
  open: boolean
  onClose: () => void
  galeri: GaleriWithKategori
  onDeleted: (id: string) => void
}

export function ModalHapusGaleri({ open, onClose, galeri, onDeleted }: ModalHapusGaleriProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const images = useMemo(() => galeri.images ?? [], [galeri.images])

  const handleClose = () => {
    if (deleting) return

    setConfirmed(false)
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      await deleteGaleri(galeri.id, images)

      onDeleted(galeri.id)

      toast.success('Galeri berhasil dihapus', {
        description: galeri.judul
          ? `"${galeri.judul}" dan seluruh file storage berhasil dihapus.`
          : 'Data galeri dan seluruh file storage berhasil dihapus.',
        duration: 4000,
      })

      setConfirmed(false)
      onClose()
    } catch (e: unknown) {
      toast.error('Gagal menghapus galeri', {
        description:
          e instanceof Error ? e.message : 'Terjadi kesalahan pada server. Silakan coba lagi.',
        duration: 5000,
      })
    } finally {
      setDeleting(false)
    }
  }

  const formattedDate = galeri.created_at
    ? new Date(galeri.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

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
            'flex max-h-[90vh] w-full max-w-2xl flex-col',
            'rounded-2xl border border-border bg-card shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'duration-200'
          )}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-border px-6 pb-4 pt-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <IconTrash size={18} className="text-destructive" />
              </div>

              <div>
                <DialogPrimitive.Title className="text-base font-bold text-foreground">
                  Hapus Galeri
                </DialogPrimitive.Title>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Seluruh gambar dan file storage akan dihapus permanen
                </p>
              </div>
            </div>

            <DialogPrimitive.Close
              onClick={handleClose}
              disabled={deleting}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <IconX size={16} />
            </DialogPrimitive.Close>
          </div>

          {/* CONTENT */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <IconAlertTriangle size={15} className="mt-0.5 shrink-0 text-destructive" />

              <p className="text-xs leading-relaxed text-destructive">
                Data galeri beserta seluruh file gambar di storage akan dihapus secara permanen dan
                tidak dapat dipulihkan kembali.
              </p>
            </div>

            {/* PREVIEW */}
            <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
                {images.length > 0 ? (
                  images.map((img, index) => (
                    <PreviewCard key={`${img.url}-${index}`} image={img} index={index} />
                  ))
                ) : (
                  <div className="col-span-full flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <IconPhotoOff size={32} className="opacity-40" />
                    <span className="text-xs">Tidak ada gambar</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border p-4">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {galeri.judul || (
                      <span className="italic font-normal text-muted-foreground">Tanpa judul</span>
                    )}
                  </p>

                  {galeri.deskripsi && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {galeri.deskripsi}
                    </p>
                  )}
                </div>

                {galeri.galeri_kategori && (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />

                      {galeri.galeri_kategori.nama}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconPhoto size={11} />
                    {images.length} gambar
                  </span>

                  {formattedDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconCalendar size={11} />

                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* URLS */}
            {images.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  File Storage
                </p>

                <div className="space-y-2">
                  {images.map((img, index) => (
                    <div
                      key={`${img.url}-${index}`}
                      className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <IconLink size={12} className="mt-0.5 shrink-0 text-muted-foreground" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-foreground">{img.url}</p>

                        {(img.width || img.height) && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <IconDimensions size={10} />

                            {formatDimensions(img.width, img.height)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONFIRM */}
            <label className="group flex cursor-pointer items-start gap-3 select-none">
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
                    'flex h-4 w-4 items-center justify-center rounded border-2 transition-all duration-200',
                    confirmed
                      ? 'border-destructive bg-destructive'
                      : 'border-border bg-background group-hover:border-destructive/50'
                  )}
                >
                  {confirmed && <IconCheck size={11} className="text-white" />}
                </div>
              </div>

              <span className="text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
                Saya mengerti bahwa seluruh gambar dan file storage akan dihapus secara permanen dan
                tidak dapat dipulihkan kembali.
              </span>
            </label>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={deleting}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200',
                confirmed && !deleting
                  ? 'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm'
                  : 'cursor-not-allowed bg-destructive/30 text-destructive-foreground/50'
              )}
            >
              {deleting ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <IconTrash size={15} />
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

function PreviewCard({
  image,
  index,
}: {
  image: {
    url: string
    width: number | null
    height: number | null
  }
  index: number
}) {
  const [error, setError] = useState(false)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {!error ? (
          <Image
            src={image.url}
            alt={`gambar-${index + 1}`}
            fill
            className="object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <IconPhoto size={20} className="opacity-40" />
            <span className="text-[10px]">Gagal memuat</span>
          </div>
        )}
      </div>

      <div className="space-y-1 p-2">
        <p className="truncate text-[11px] font-medium text-foreground">Gambar {index + 1}</p>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <IconDimensions size={10} />

          {formatDimensions(image.width, image.height)}
        </div>
      </div>
    </div>
  )
}
