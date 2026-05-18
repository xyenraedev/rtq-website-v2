'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'

import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconPhoto,
  IconShare3,
  IconX,
} from '@tabler/icons-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'

import SkeletonGaleri from '@/components/skeleton/galeri/SkeletonGaleri'

import { fetchGaleri, type GaleriImage, type GaleriWithKategori } from '@/lib/galeri'

import { fetchGaleriKategori, type GaleriKategori } from '@/lib/galeri-kategori'

function LoadMoreSpinner() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground/60" />
      <span className="text-xs text-muted-foreground">Memuat lebih banyak…</span>
    </div>
  )
}

function GalleryCard({
  image,
  galeri,
  priority,
  onClick,
}: {
  image: GaleriImage
  galeri: GaleriWithKategori
  priority: boolean
  onClick: (data: SelectedImage) => void
}) {
  const [error, setError] = useState(false)

  const ratio = image.width && image.height ? image.width / image.height : 4 / 3

  const tall = ratio < 0.85

  if (error) return null

  return (
    <div
      onClick={() =>
        onClick({
          galeriId: galeri.id,
          image,
          judul: galeri.judul,
          deskripsi: galeri.deskripsi,
          created_at: galeri.created_at,
        })
      }
      className={`group relative cursor-pointer overflow-hidden rounded-xl bg-muted ${
        tall ? 'row-span-2' : ''
      }`}
    >
      <Image
        fill
        quality={75}
        src={image.url}
        alt={galeri.judul ?? 'Foto galeri'}
        loading={priority ? 'eager' : 'lazy'}
        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        onError={() => setError(true)}
      />

      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/40" />

      {galeri.judul && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
          <p className="line-clamp-2 text-xs font-medium text-white md:text-sm">{galeri.judul}</p>
        </div>
      )}
    </div>
  )
}

interface SelectedImage {
  galeriId: string
  image: GaleriImage
  judul: string | null
  deskripsi: string | null
  created_at: string | null
}

export default function GaleriPage() {
  const [galeri, setGaleri] = useState<GaleriWithKategori[]>([])
  const [kategori, setKategori] = useState<GaleriKategori[]>([])

  const [loading, setLoading] = useState(true)

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)

  const [activeKategoriId, setActiveKategoriId] = useState<string | null>(null)

  const [heroError, setHeroError] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const [galeriData, kategoriData] = await Promise.all([fetchGaleri(), fetchGaleriKategori()])

        setGaleri(galeriData)
        setKategori(kategoriData)
      } catch (error) {
        console.error(error)

        toast.error('Gagal memuat galeri')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredGaleri = useMemo(() => {
    if (!activeKategoriId) return galeri

    return galeri.filter((item) => item.galeri_kategori_id === activeKategoriId)
  }, [galeri, activeKategoriId])

  const flattenedImages = useMemo(() => {
    return filteredGaleri.flatMap((item) =>
      item.images.map((image) => ({
        galeriId: item.id,
        image,
        judul: item.judul,
        deskripsi: item.deskripsi,
        created_at: item.created_at,
      }))
    )
  }, [filteredGaleri])

  const currentIndex = useMemo(() => {
    return flattenedImages.findIndex(
      (item) =>
        item.galeriId === selectedImage?.galeriId && item.image.url === selectedImage?.image.url
    )
  }, [flattenedImages, selectedImage])

  const goNext = useCallback(() => {
    if (currentIndex < flattenedImages.length - 1) {
      setSelectedImage(flattenedImages[currentIndex + 1])
    }
  }, [currentIndex, flattenedImages])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedImage(flattenedImages[currentIndex - 1])
    }
  }, [currentIndex, flattenedImages])

  useEffect(() => {
    if (!selectedImage) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goNext()
      }

      if (e.key === 'ArrowLeft') {
        goPrev()
      }
    }

    window.addEventListener('keydown', handler)

    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [selectedImage, goNext, goPrev])

  const heroImage = useMemo(() => {
    const allImages = filteredGaleri.flatMap((item) =>
      item.images.map((image) => ({
        ...image,
        created_at: item.created_at,
      }))
    )

    return (
      [...allImages]
        .sort((a, b) => {
          return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
        })
        .find((img) => {
          if (!img.width || !img.height) return false

          return img.width / img.height > 1.1
        }) ?? null
    )
  }, [filteredGaleri])

  const handleDownload = useCallback(async () => {
    if (!selectedImage) return

    try {
      const res = await fetch(selectedImage.image.url)

      const blob = await res.blob()

      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')

      a.href = url
      a.download = `galeri-${selectedImage.galeriId}.jpg`

      a.click()

      URL.revokeObjectURL(url)

      toast.success('Foto berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh foto')
    }
  }, [selectedImage])

  const handleShare = useCallback(async () => {
    if (!selectedImage) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedImage.judul ?? 'Galeri',
          text: selectedImage.deskripsi ?? 'Lihat dokumentasi kegiatan kami.',
          url: selectedImage.image.url,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(selectedImage.image.url)

      toast.success('Link berhasil disalin')
    }
  }, [selectedImage])

  if (loading) {
    return <SkeletonGaleri />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative flex min-h-85 items-center justify-center md:min-h-[60vh]">
          <div className="absolute inset-0">
            {heroImage?.url && !heroError ? (
              <Image
                fill
                priority
                quality={60}
                src={heroImage.url}
                alt="Hero Galeri"
                sizes="100vw"
                className="object-cover object-center"
                onError={() => setHeroError(true)}
              />
            ) : (
              <div className="h-full w-full bg-linear-to-br from-muted to-muted/60" />
            )}

            <div className="absolute inset-0 bg-black/65" />
          </div>

          <div className="relative z-10 w-full max-w-3xl space-y-3 px-4 py-16 text-center md:space-y-4 md:py-0">
            <Badge
              variant="outline"
              className="border-white/30 px-3 py-1 text-[10px] text-white md:text-xs"
            >
              Dokumentasi Lembaga
            </Badge>

            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-6xl">
              Galeri Kegiatan
            </h1>

            <p className="mx-auto max-w-2xl text-xs leading-relaxed text-gray-300 md:text-xl">
              Jejak kenangan dan cerita inspiratif setiap momen berharga santri.
            </p>

            <div className="pt-1 md:pt-2">
              <Button
                size="sm"
                className="rounded-full px-5 md:size-lg md:px-8"
                onClick={() =>
                  document.getElementById('gallery-grid')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
              >
                Jelajahi Momen
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery-grid" className="container mx-auto px-4 py-8 md:py-12">
        {/* FILTER */}
        <div className="mb-8">
          <div className="overflow-x-auto scrollbar-none md:hidden">
            <div className="flex w-max gap-1.5 pb-1">
              {[{ id: null, nama: 'Semua' }, ...kategori].map((cat) => (
                <button
                  key={cat.id ?? '__all__'}
                  onClick={() => setActiveKategoriId(cat.id)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activeKategoriId === cat.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {cat.nama}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden flex-wrap gap-2 md:flex">
            {[{ id: null, nama: 'Semua' }, ...kategori].map((cat) => (
              <button
                key={cat.id ?? '__all__'}
                onClick={() => setActiveKategoriId(cat.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeKategoriId === cat.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary'
                }`}
              >
                {cat.nama}
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY */}
        {flattenedImages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <IconPhoto size={36} strokeWidth={1.2} />

            <p className="text-sm md:text-base">Belum ada foto di kategori ini.</p>
          </div>
        ) : (
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-3 lg:grid-cols-4">
            {filteredGaleri.flatMap((item) =>
              item.images.map((image, index) => (
                <GalleryCard
                  key={`${item.id}-${image.url}`}
                  image={image}
                  galeri={item}
                  priority={index < 8}
                  onClick={setSelectedImage}
                />
              ))
            )}
          </div>
        )}

        <div ref={sentinelRef} className="mt-10 flex min-h-15 justify-center">
          <LoadMoreSpinner />
        </div>
      </section>

      {/* LIGHTBOX */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedImage(null)
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="mx-4 flex max-h-[88dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-2xl sm:mx-auto sm:w-full sm:max-w-4xl"
        >
          {selectedImage && (
            <>
              <DialogTitle className="sr-only">
                {selectedImage.judul ?? 'Preview Gambar'}
              </DialogTitle>

              <LightboxImage
                src={selectedImage.image.url}
                alt={selectedImage.judul ?? 'Preview'}
                currentIndex={currentIndex}
                total={flattenedImages.length}
                onNext={goNext}
                onPrev={goPrev}
              />

              <div className="flex flex-col gap-3 px-5 py-4">
                {selectedImage.judul ? (
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug md:text-base">
                    {selectedImage.judul}
                  </h3>
                ) : (
                  <p className="text-xs italic text-muted-foreground">Tanpa judul</p>
                )}

                {selectedImage.deskripsi && (
                  <ScrollArea className="max-h-20">
                    <p className="pr-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {selectedImage.deskripsi}
                    </p>
                  </ScrollArea>
                )}

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconCalendar size={13} />

                    {selectedImage.created_at
                      ? new Date(selectedImage.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShare}
                      className="h-8 gap-1.5 rounded-full px-4 text-xs"
                    >
                      <IconShare3 size={13} />
                      Bagikan
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="h-8 gap-1.5 rounded-full px-4 text-xs"
                    >
                      <IconDownload size={13} />
                      Unduh
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LightboxImage({
  src,
  alt,
  currentIndex,
  total,
  onNext,
  onPrev,
}: {
  src: string
  alt: string
  currentIndex: number
  total: number
  onNext: () => void
  onPrev: () => void
}) {
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
  }, [src])

  return (
    <div className="relative overflow-hidden bg-black">
      <div className="relative aspect-4/3 w-full sm:aspect-video md:aspect-16/8">
        {error ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40">
            <IconPhoto size={36} strokeWidth={1.2} />

            <p className="text-xs">Gambar tidak tersedia</p>
          </div>
        ) : (
          <Image
            fill
            priority
            quality={85}
            src={src}
            alt={alt}
            sizes="(max-width:768px) 95vw, 80vw"
            className="object-contain"
            onError={() => setError(true)}
          />
        )}
      </div>

      <DialogClose asChild>
        <button className="absolute top-3 right-3 z-20 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70">
          <IconX size={15} />
        </button>
      </DialogClose>

      {currentIndex > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/65"
        >
          <IconChevronLeft size={18} />
        </button>
      )}

      {currentIndex < total - 1 && (
        <button
          onClick={onNext}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/65"
        >
          <IconChevronRight size={18} />
        </button>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-0.5 text-[10px] text-white/70 md:text-xs">
        {currentIndex + 1} / {total}
      </div>
    </div>
  )
}
