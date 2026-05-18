'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import {
  IconEdit,
  IconX,
  IconCheck,
  IconLoader2,
  IconTag,
  IconAlertCircle,
  IconFileDescription,
  IconPhoto,
} from '@tabler/icons-react'

import * as DialogPrimitive from '@radix-ui/react-dialog'

import { updateGaleri, type GaleriWithKategori } from '@/lib/galeri'

import { MultiImageUploader } from '@/components/multi-image-uploader'

function FieldLabel({
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean
}) {
  return (
    <label {...props} className={cn('text-xs font-semibold text-foreground', props.className)}>
      {children}

      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
      <IconAlertCircle size={11} />
      {message}
    </p>
  )
}

const inputBase = cn(
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground',
  'placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20',
  'focus:border-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'
)

const textareaBase = cn(inputBase, 'min-h-[80px] max-h-[120px] resize-y leading-relaxed')

interface GaleriKategoriOption {
  id: string
  nama: string
}

export interface ModalEditGaleriProps {
  open: boolean
  onClose: () => void
  galeri: GaleriWithKategori
  onUpdate: (galeri: GaleriWithKategori) => void
  kategoris: GaleriKategoriOption[]
}

export function ModalEditGaleri({
  open,
  onClose,
  galeri,
  onUpdate,
  kategoris,
}: ModalEditGaleriProps) {
  // ─── Images ───────────────────────────────────────────────────────────────

  const [files, setFiles] = useState<File[]>([])

  // ─── Form ─────────────────────────────────────────────────────────────────

  const [judul, setJudul] = useState(galeri.judul ?? '')

  const [deskripsi, setDeskripsi] = useState(galeri.deskripsi ?? '')

  const [kategoriId, setKategoriId] = useState(galeri.galeri_kategori_id ?? '')

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<Record<string, string>>({})

  const [createdAt, setCreatedAt] = useState(
    galeri.created_at ? new Date(galeri.created_at).toISOString().slice(0, 16) : ''
  )

  // ─── Reset ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setFiles([])

      setJudul(galeri.judul ?? '')
      setDeskripsi(galeri.deskripsi ?? '')
      setKategoriId(galeri.galeri_kategori_id ?? '')

      setCreatedAt(galeri.created_at ? new Date(galeri.created_at).toISOString().slice(0, 16) : '')

      setSaving(false)
      setError({})
    }
  }, [open, galeri])

  // ─── Dirty State ──────────────────────────────────────────────────────────

  const isDirty = useMemo(() => {
    return (
      files.length > 0 ||
      judul.trim() !== (galeri.judul ?? '') ||
      deskripsi.trim() !== (galeri.deskripsi ?? '') ||
      kategoriId !== (galeri.galeri_kategori_id ?? '') ||
      createdAt !==
        (galeri.created_at ? new Date(galeri.created_at).toISOString().slice(0, 16) : '')
    )
  }, [files, judul, deskripsi, kategoriId, createdAt, galeri])

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate() {
    const newErr: Record<string, string> = {}

    if (!judul.trim()) {
      newErr.judul = 'Judul wajib diisi'
    } else if (judul.trim().length > 100) {
      newErr.judul = 'Judul maksimal 100 karakter'
    }

    if (!deskripsi.trim()) {
      newErr.deskripsi = 'Deskripsi wajib diisi'
    } else if (deskripsi.length > 500) {
      newErr.deskripsi = 'Deskripsi maksimal 500 karakter'
    }

    if (!kategoriId) {
      newErr.kategoriId = 'Kategori wajib dipilih'
    }

    return newErr
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    const errs = validate()

    if (Object.keys(errs).length > 0) {
      setError(errs)
      return
    }

    if (!isDirty) {
      onClose()
      return
    }

    setSaving(true)
    setError({})

    try {
      const result = await updateGaleri(
        galeri.id,
        {
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          galeri_kategori_id: kategoriId,
          created_at: new Date(createdAt).toISOString(),
        },
        files.length > 0 ? files : undefined,
        galeri.images
      )

      onUpdate(result)

      toast.success('Galeri berhasil diperbarui', {
        description:
          files.length > 0
            ? `${files.length} gambar berhasil diperbarui`
            : 'Data galeri berhasil diperbarui',
        duration: 3000,
      })

      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan pada server.'

      setError({
        images: msg,
      })

      toast.error('Gagal memperbarui galeri', {
        description: msg,
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedKategori = kategoris.find((k) => k.id === kategoriId)

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && open) {
          onClose()
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in',
            'data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0',
            'data-[state=open]:fade-in-0',
            'duration-200'
          )}
        />

        <DialogPrimitive.Content
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
          className={cn(
            'fixed left-[50%] top-[50%] z-50',
            'translate-x-[-50%] translate-y-[-50%]',
            'flex max-h-[90vh] w-full max-w-2xl flex-col',
            'rounded-2xl border border-border bg-card shadow-2xl',
            'data-[state=open]:animate-in',
            'data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0',
            'data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95',
            'data-[state=open]:zoom-in-95',
            'duration-200'
          )}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-border px-6 pb-4 pt-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <IconEdit size={16} className="text-primary" />
              </div>

              <div>
                <DialogPrimitive.Title className="text-base font-bold text-foreground">
                  Edit Galeri
                </DialogPrimitive.Title>

                <p className="mt-0.5 max-w-55 truncate text-xs text-muted-foreground">
                  {galeri.judul || galeri.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  Ada perubahan
                </span>
              )}

              <DialogPrimitive.Close
                onClick={onClose}
                disabled={saving}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <IconX size={16} />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* CURRENT IMAGES */}
            <div>
              <FieldLabel className="mb-2 block">Gambar Saat Ini</FieldLabel>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galeri.images.map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    className="overflow-hidden rounded-xl border border-border bg-muted/20"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.url}
                        alt={`Galeri ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="border-t border-border p-2">
                      <p className="truncate text-[10px] text-muted-foreground">
                        {image.width && image.height
                          ? `${image.width} × ${image.height}`
                          : 'Tanpa dimensi'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REPLACE IMAGES */}
            <div>
              <FieldLabel className="mb-2 block">Ganti Gambar</FieldLabel>

              <MultiImageUploader
                files={files}
                onChange={(newFiles) => {
                  setFiles(newFiles)

                  setError((p) => ({
                    ...p,
                    images: '',
                  }))
                }}
                disabled={saving}
                maxFiles={20}
              />

              <FieldError message={error.images} />

              {files.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <IconPhoto size={12} />
                  Gambar lama akan digantikan dengan gambar baru
                </p>
              )}
            </div>

            {/* JUDUL */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <FieldLabel required htmlFor="edit-judul">
                  Judul
                </FieldLabel>

                <span
                  className={cn(
                    'text-xs tabular-nums',
                    judul.length > 90 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {judul.length}/100
                </span>
              </div>

              <input
                id="edit-judul"
                maxLength={100}
                placeholder="Masukkan judul galeri..."
                value={judul}
                disabled={saving}
                onChange={(e) => {
                  setJudul(e.target.value)

                  setError((p) => ({
                    ...p,
                    judul: '',
                  }))
                }}
                className={cn(
                  inputBase,
                  error.judul ? 'border-destructive focus:ring-destructive/20' : ''
                )}
              />

              <FieldError message={error.judul} />
            </div>

            {/* DESKRIPSI */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <FieldLabel required htmlFor="edit-deskripsi">
                  Deskripsi
                </FieldLabel>

                <span
                  className={cn(
                    'text-xs tabular-nums',
                    deskripsi.length > 480 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {deskripsi.length}/500
                </span>
              </div>

              <textarea
                id="edit-deskripsi"
                maxLength={500}
                placeholder="Masukkan deskripsi galeri..."
                value={deskripsi}
                disabled={saving}
                onChange={(e) => {
                  setDeskripsi(e.target.value)

                  setError((p) => ({
                    ...p,
                    deskripsi: '',
                  }))
                }}
                className={cn(
                  textareaBase,
                  error.deskripsi ? 'border-destructive focus:ring-destructive/20' : ''
                )}
              />

              <FieldError message={error.deskripsi} />
            </div>

            {/* TANGGAL */}
            <div>
              <FieldLabel className="mb-1.5 block">Tanggal Upload</FieldLabel>

              <input
                type="datetime-local"
                value={createdAt}
                disabled={saving}
                onChange={(e) => setCreatedAt(e.target.value)}
                className={inputBase}
              />
            </div>

            {/* KATEGORI */}
            <div>
              <FieldLabel required htmlFor="edit-kategori" className="mb-1.5 flex">
                <span className="flex items-center gap-1.5">
                  <IconTag size={12} />
                  Kategori
                </span>
              </FieldLabel>

              <select
                id="edit-kategori"
                value={kategoriId}
                disabled={saving}
                onChange={(e) => {
                  setKategoriId(e.target.value)

                  setError((p) => ({
                    ...p,
                    kategoriId: '',
                  }))
                }}
                className={cn(
                  inputBase,
                  'cursor-pointer',
                  error.kategoriId ? 'border-destructive focus:ring-destructive/20' : ''
                )}
              >
                <option value="">— Pilih Kategori —</option>

                {kategoris.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>

              <FieldError message={error.kategoriId} />

              {selectedKategori && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />

                    <span>{selectedKategori.nama}</span>
                  </span>
                </div>
              )}
            </div>

            {/* CHANGES */}
            {isDirty && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Perubahan
                </p>

                {files.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <IconPhoto size={11} className="shrink-0 text-muted-foreground" />

                    <span className="text-muted-foreground">Gambar baru:</span>

                    <span className="font-medium text-foreground">{files.length} file</span>
                  </div>
                )}

                {judul.trim() !== (galeri.judul ?? '') && (
                  <div className="flex items-center gap-2 text-xs">
                    <IconFileDescription size={11} className="shrink-0 text-muted-foreground" />

                    <span className="line-through opacity-60">{galeri.judul || '(kosong)'}</span>

                    <span className="text-muted-foreground">→</span>

                    <span className="font-medium text-foreground">{judul.trim()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconCheck size={15} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
