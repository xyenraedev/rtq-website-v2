'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  IconPhoto,
  IconUpload,
  IconX,
  IconLoader2,
  IconPhotoPlus,
  IconAlertCircle,
} from '@tabler/icons-react'

interface MultiImageUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  maxSizeMB?: number
  className?: string
}

interface PreviewItem {
  file: File
  preview: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MultiImageUploader({
  files,
  onChange,
  disabled = false,
  maxFiles = 20,
  maxSizeMB = 5,
  className,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [dragging, setDragging] = useState(false)

  const [error, setError] = useState<string>('')

  // ─── Preview ──────────────────────────────────────────────────────────────

  const previews: PreviewItem[] = useMemo(() => {
    return files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
  }, [files])

  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        URL.revokeObjectURL(p.preview)
      })
    }
  }, [previews])

  // ─── Handle Files ─────────────────────────────────────────────────────────

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      const nextFiles = [...files]

      const incomingArray = Array.from(incoming)

      setError('')

      for (const file of incomingArray) {
        if (!file.type.startsWith('image/')) {
          setError('Hanya file gambar yang diperbolehkan')
          continue
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`Ukuran maksimal ${maxSizeMB}MB per gambar`)
          continue
        }

        const duplicate = nextFiles.some(
          (f) =>
            f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
        )

        if (duplicate) continue

        if (nextFiles.length >= maxFiles) {
          setError(`Maksimal ${maxFiles} gambar`)
          break
        }

        nextFiles.push(file)
      }

      onChange(nextFiles)
    },
    [files, maxFiles, maxSizeMB, onChange]
  )

  // ─── Remove ───────────────────────────────────────────────────────────────

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index)

    onChange(next)
  }

  // ─── Drag ─────────────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()

    if (disabled) return

    setDragging(false)

    if (e.dataTransfer.files?.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-4', className)}>
      {/* DROPZONE */}
      <div
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()

          if (!disabled) {
            setDragging(true)
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center text-center',
          'px-6 py-10 cursor-pointer overflow-hidden',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-muted/30',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(e.target.files)
            }

            e.target.value = ''
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          {disabled ? (
            <IconLoader2 size={26} className="animate-spin text-primary" />
          ) : (
            <IconUpload size={26} className="text-primary" />
          )}
        </div>

        <h3 className="text-sm font-semibold text-foreground">Upload Banyak Gambar</h3>

        <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm">
          Klik atau drag &amp; drop gambar ke area ini
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-muted-foreground border border-border">
            Maks {maxFiles} gambar
          </span>

          <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-muted-foreground border border-border">
            Maks {maxSizeMB}MB/file
          </span>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive">
          <IconAlertCircle size={16} className="shrink-0 mt-0.5" />

          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* EMPTY */}
      {files.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/20 py-8 px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <IconPhotoPlus size={22} className="text-muted-foreground" />
            </div>

            <p className="text-sm font-medium text-foreground">Belum ada gambar dipilih</p>

            <p className="text-xs text-muted-foreground mt-1">
              Tambahkan satu atau banyak gambar sekaligus
            </p>
          </div>
        </div>
      )}

      {/* PREVIEW GRID */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconPhoto size={16} className="text-primary" />

              <span className="text-sm font-semibold text-foreground">Preview Gambar</span>
            </div>

            <span className="text-xs text-muted-foreground">{files.length} file</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="group relative rounded-xl overflow-hidden border border-border bg-muted/20"
              >
                {/* IMAGE */}
                <div className="relative aspect-square">
                  <Image src={item.preview} alt={item.file.name} fill className="object-cover" />
                </div>

                {/* REMOVE */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation()

                    removeFile(index)
                  }}
                  className={cn(
                    'absolute top-2 right-2',
                    'w-7 h-7 rounded-full',
                    'bg-black/70 text-white',
                    'flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity disabled:opacity-40'
                  )}
                >
                  <IconX size={14} />
                </button>

                {/* FOOTER */}
                <div className="p-2.5 border-t border-border bg-background/90 backdrop-blur">
                  <p
                    className="text-[11px] font-medium text-foreground truncate"
                    title={item.file.name}
                  >
                    {item.file.name}
                  </p>

                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
