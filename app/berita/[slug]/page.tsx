'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import {
  IconCalendar,
  IconChevronLeft,
  IconClock,
  IconAlertTriangle,
  IconArrowRight,
  IconBrandWhatsapp,
  IconBrandFacebook,
} from '@tabler/icons-react'

import { useKategori } from '@/hooks/santri/berita/useBeritaKategori'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import CardRelatedBerita from '@/components/card/CardRelatedBerita'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Berita {
  id: string
  slug: string
  judul: string
  created_at: string
  konten: string
  gambar?: string
  kategori_id: string
  ringkasan?: string
  waktu_baca?: number
  kategori?: { nama: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(dateString))

const estimateReadTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonLoader = () => (
  <div className="container mx-auto max-w-5xl space-y-6 px-4 py-12">
    <Skeleton className="h-4 w-20 rounded-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-48" />
    <Skeleton className="aspect-video w-full rounded-2xl" />

    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
)

// ─── Error ────────────────────────────────────────────────────────────────────

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <Card className="w-full max-w-md border-destructive/20 bg-destructive/5 p-8 text-center">
      <IconAlertTriangle size={40} className="mx-auto mb-4 text-destructive" />

      <h3 className="mb-2 text-base font-semibold">{message}</h3>

      <p className="mb-6 text-sm text-muted-foreground">
        Mungkin berita telah dihapus atau tautan tidak valid.
      </p>

      <div className="flex justify-center gap-3">
        <Button size="sm" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>

        <Button size="sm" variant="outline" asChild>
          <Link href="/berita">Ke Berita</Link>
        </Button>
      </div>
    </Card>
  </div>
)

// ─── Main Content ─────────────────────────────────────────────────────────────

function BeritaDetailContent() {
  const params = useParams()
  const slug = params?.slug as string

  const [beritaDetail, setBeritaDetail] = useState<Berita | null>(null)
  const [latestBerita, setLatestBerita] = useState<Berita[]>([])
  const [relatedBerita, setRelatedBerita] = useState<Berita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const { kategori } = useKategori()

  useEffect(() => {
    if (!slug) return

    const fetchAllData = async () => {
      try {
        const [detailRes, latestRes] = await Promise.all([
          supabase.from('berita').select('*').eq('slug', slug).single(),

          supabase
            .from('berita')
            .select('*')
            .order('created_at', {
              ascending: false,
            })
            .limit(5),
        ])

        if (detailRes.error) throw detailRes.error

        setBeritaDetail(detailRes.data)
        setLatestBerita(latestRes.data ?? [])

        if (detailRes.data?.kategori_id) {
          const relatedRes = await supabase
            .from('berita')
            .select('*, kategori:berita_kategori(nama)')
            .eq('kategori_id', detailRes.data.kategori_id)
            .neq('id', detailRes.data.id)
            .limit(5)

          setRelatedBerita(relatedRes.data ?? [])
        }

        await supabase.rpc('increment_views', {
          row_id: detailRes.data.id,
        })
      } catch (err) {
        console.error(err)
        setError('Berita tidak ditemukan atau terjadi kesalahan.')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchAllData()
  }, [slug, supabase])

  if (isLoading) return <SkeletonLoader />
  if (error) return <ErrorMessage message={error} />
  if (!beritaDetail) return null

  const namaKategori = kategori.find((k) => k.id === beritaDetail.kategori_id)?.nama ?? 'Umum'

  const readTime = estimateReadTime(beritaDetail.konten)

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${beritaDetail.judul}\n${currentUrl}`
  )}`

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    currentUrl
  )}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Sticky Nav ── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild className="group gap-1.5 text-sm">
            <Link href="/berita">
              <IconChevronLeft
                size={16}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Kembali
            </Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 lg:py-8">
        <div className="grid grid-cols-12 gap-6 xl:gap-14">
          {/* ── Article ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="col-span-12 min-w-0 space-y-0 lg:col-span-8"
          >
            {/* Title */}
            <h1 className="mb-6 text-2xl font-semibold leading-snug tracking-tight md:text-3xl mt-4 lg:mt-0">
              {beritaDetail.judul}
            </h1>

            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-2.5 lg:hidden">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
              >
                {namaKategori}
              </Badge>

              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconCalendar size={13} />
                {formatDate(beritaDetail.created_at)}
              </span>

              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconClock size={13} />
                {readTime} menit baca
              </span>
            </div>

            {/* Cover */}
            {beritaDetail.gambar && (
              <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl">
                <Image
                  src={beritaDetail.gambar}
                  alt={beritaDetail.judul}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            )}

            {/* Meta + Share */}
            <div className="mb-4">
              <div className="hidden items-center justify-between lg:flex">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
                  >
                    {namaKategori}
                  </Badge>

                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconCalendar size={13} />
                    {formatDate(beritaDetail.created_at)}
                  </span>

                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconClock size={13} />
                    {readTime} menit baca
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <p className="mr-1 text-xs text-muted-foreground">Bagikan:</p>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 gap-1 rounded-full px-3 text-xs"
                  >
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <IconBrandWhatsapp size={15} />
                      WhatsApp
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 gap-1 rounded-full px-3 text-xs"
                  >
                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                      <IconBrandFacebook size={15} />
                      Facebook
                    </a>
                  </Button>
                </div>
              </div>

              {/* Share Mobile */}
              <div className="flex items-center gap-2 lg:hidden">
                <p className="mr-1 text-xs text-muted-foreground">Bagikan:</p>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 gap-1 rounded-full px-3 text-xs"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <IconBrandWhatsapp size={15} />
                    WhatsApp
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 gap-1 rounded-full px-3 text-xs"
                >
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                    <IconBrandFacebook size={15} />
                    Facebook
                  </a>
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4">
              {beritaDetail.konten.split('\n').map((para, i) =>
                para.trim() ? (
                  <p key={i} className="text-sm leading-relaxed text-foreground/80 md:text-base">
                    {para}
                  </p>
                ) : null
              )}
            </div>

            {/* ── RELATED MOBILE ── */}
            <section className="mt-16 block lg:hidden">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h2 className="text-sm font-semibold">Berita Terkait</h2>
                </div>

                <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary">
                  <Link href="/berita">
                    Lihat Semua
                    <IconArrowRight size={13} />
                  </Link>
                </Button>
              </div>

              {relatedBerita.length > 0 ? (
                <div
                  className="
                    flex gap-4 overflow-x-auto pb-2
                    snap-x snap-mandatory
                    scrollbar-hide
                  "
                >
                  {relatedBerita.map((item) => (
                    <div
                      key={item.id}
                      className="
                        min-w-70
                        snap-start
                      "
                    >
                      <CardRelatedBerita item={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Belum ada berita terkait untuk kategori ini.
                </p>
              )}
            </section>
          </motion.div>

          {/* ── Sidebar Desktop ── */}
          <aside className="col-span-12 min-w-0 lg:col-span-4">
            <div className="sticky top-20 hidden lg:block">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-primary" />
                <h2 className="text-sm font-semibold">Berita Terbaru</h2>
              </div>

              <div className="space-y-4">
                {latestBerita.map((item) => (
                  <Link key={item.id} href={`/berita/${item.slug}`} className="group block">
                    <div className="flex gap-3">
                      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.gambar ?? '/placeholder.jpg'}
                          alt={item.judul}
                          fill
                          className="
                            object-cover
                            transition-transform duration-300
                            group-hover:scale-105
                            rounded
                          "
                        />
                      </div>

                      <div className="min-w-0 space-y-1 my-auto">
                        <p
                          className="
                            line-clamp-2 font-medium leading-snug
                            transition-colors
                            group-hover:text-primary
                          "
                        >
                          {item.judul}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* ── RELATED DESKTOP ── */}
        <section className="mt-16 hidden lg:block">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-sm font-semibold">Berita Terkait</h2>
            </div>

            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary">
              <Link href="/berita">
                Lihat Semua
                <IconArrowRight size={13} />
              </Link>
            </Button>
          </div>

          {relatedBerita.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {relatedBerita.map((item) => (
                <CardRelatedBerita key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Belum ada berita terkait untuk kategori ini.
            </p>
          )}
        </section>

        {/* ── LATEST MOBILE ── */}
        <section className="mt-8 block lg:hidden">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold">Berita Terbaru</h2>
          </div>

          <div className="space-y-4">
            {latestBerita.map((item) => (
              <Link key={item.id} href={`/berita/${item.slug}`} className="group block">
                <div className="flex gap-3">
                  <div className="relative h-18 w-24 shrink-0 overflow-hidden">
                    <Image
                      src={item.gambar ?? '/placeholder.jpg'}
                      alt={item.judul}
                      fill
                      className="
                        object-cover
                        transition-transform duration-300
                        group-hover:scale-105
                        rounded
                      "
                    />
                  </div>

                  <div className="min-w-0 space-y-1 my-auto">
                    <p
                      className="
                        line-clamp-2
                        font-medium leading-snug
                        transition-colors
                        group-hover:text-primary
                        text-sm
                      "
                    >
                      {item.judul}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function BeritaDetailPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <BeritaDetailContent />
    </Suspense>
  )
}
