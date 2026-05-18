'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  IconPlus,
  IconX,
  IconCheck,
  IconLoader2,
  IconTag,
  IconPhoto,
  IconAlertCircle,
} from '@tabler/icons-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

import { insertGaleri, type GaleriWithKategori } from '@/lib/galeri'

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

      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
      <IconAlertCircle size={11} />
      {message}
    </p>
  )
}

const inputBase = cn(
  'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground',
  'placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20',
  'focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
)

const textareaBase = cn(inputBase, 'min-h-[80px] max-h-[120px] resize-y leading-relaxed')

interface GaleriKategoriOption {
  id: string
  nama: string
}

export interface ModalTambahGaleriProps {
  open: boolean
  onClose: () => void
  onSave: (galeri: GaleriWithKategori) => void
  kategoris: GaleriKategoriOption[]
}

export function ModalTambahGaleri({ open, onClose, onSave, kategoris }: ModalTambahGaleriProps) {
  const [files, setFiles] = useState<File[]>([])

  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategoriId, setKategoriId] = useState('')

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<Record<string, string>>({})

  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 16))

  useEffect(() => {
    if (open) {
      setFiles([])

      setJudul('')
      setDeskripsi('')
      setKategoriId('')

      setCreatedAt(new Date().toISOString().slice(0, 16))

      setSaving(false)
      setError({})
    }
  }, [open])

  // ─── Validation ───────────────────────────────────────────────────────────

  function validate() {
    const newErr: Record<string, string> = {}

    if (files.length === 0) {
      newErr.images = 'Minimal pilih 1 gambar'
    }

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

    setSaving(true)
    setError({})

    try {
      const result = await insertGaleri(
        {
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          galeri_kategori_id: kategoriId,
          created_at: new Date(createdAt).toISOString(),
        },
        files
      )

      onSave(result)

      toast.success('Album galeri berhasil ditambahkan', {
        description: `${files.length} gambar berhasil diupload.`,
        duration: 3000,
      })

      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan pada server.'

      setError({
        images: msg,
      })

      toast.error('Gagal menambahkan album galeri', {
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
            'data-[state=closed]:animate-out'
          )}
        />

        <DialogPrimitive.Content
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
          className={cn(
            'fixed left-[50%] top-[50%] z-50',
            'translate-x-[-50%] translate-y-[-50%]',
            'w-full max-w-2xl max-h-[90vh]',
            'bg-card border border-border rounded-2xl shadow-2xl',
            'flex flex-col overflow-hidden'
          )}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IconPlus size={18} className="text-primary" />
              </div>

              <div>
                <DialogPrimitive.Title className="text-base font-bold text-foreground">
                  Tambah Album Galeri
                </DialogPrimitive.Title>

                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload banyak gambar sekaligus
                </p>
              </div>
            </div>

            <DialogPrimitive.Close
              disabled={saving}
              className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-1.5 disabled:opacity-40"
            >
              <IconX size={16} />
            </DialogPrimitive.Close>
          </div>

          {/* CONTENT */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* UPLOADER */}
            <div>
              <FieldLabel required className="block mb-2">
                Upload Gambar
              </FieldLabel>

              <MultiImageUploader
                files={files}
                onChange={(newFiles) => {
                  setFiles(newFiles)

                  setError((prev) => ({
                    ...prev,
                    images: '',
                  }))
                }}
                disabled={saving}
                maxFiles={20}
              />

              <FieldError message={error.images} />

              {files.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconPhoto size={13} />
                  {files.length} gambar dipilih
                </div>
              )}
            </div>

            {/* JUDUL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel required htmlFor="judul">
                  Judul Album
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
                id="judul"
                value={judul}
                disabled={saving}
                maxLength={100}
                placeholder="Masukkan judul album..."
                onChange={(e) => {
                  setJudul(e.target.value)

                  setError((prev) => ({
                    ...prev,
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
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel required htmlFor="deskripsi">
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
                id="deskripsi"
                value={deskripsi}
                disabled={saving}
                maxLength={500}
                placeholder="Masukkan deskripsi album..."
                onChange={(e) => {
                  setDeskripsi(e.target.value)

                  setError((prev) => ({
                    ...prev,
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
              <FieldLabel className="block mb-1.5">Tanggal Upload</FieldLabel>

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
              <FieldLabel required htmlFor="kategori" className="flex mb-1.5">
                <span className="flex items-center gap-1.5">
                  <IconTag size={12} />
                  Kategori
                </span>
              </FieldLabel>

              <select
                id="kategori"
                value={kategoriId}
                disabled={saving}
                onChange={(e) => {
                  setKategoriId(e.target.value)

                  setError((prev) => ({
                    ...prev,
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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-secondary/50 border-border text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />

                    <span>{selectedKategori.nama}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving || files.length === 0 || !judul.trim() || !deskripsi.trim() || !kategoriId
              }
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconCheck size={15} />
                  Simpan Album
                </>
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
