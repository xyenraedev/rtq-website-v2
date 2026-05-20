'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { motion } from 'motion/react'
import { IconArrowRight } from '@tabler/icons-react'

import { useBerita } from '@/hooks/santri/berita/useBerita'

import CardRelatedBerita from '@/components/card/CardRelatedBerita'

export default function Berita() {
  const [isMobile, setIsMobile] = useState(false)

  const { berita, isLoading } = useBerita('')

  // CACHE DATA
  const [cachedBerita, setCachedBerita] = useState<typeof berita>([])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()

    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // SIMPAN DATA AGAR TIDAK HILANG SAAT REFRESH / REFETCH
  useEffect(() => {
    if (berita && berita.length > 0) {
      setCachedBerita(berita)
    }
  }, [berita])

  const displayedBerita = useMemo(() => {
    return cachedBerita.slice(0, isMobile ? 4 : 6)
  }, [cachedBerita, isMobile])

  // LOADING HANYA SAAT BELUM ADA CACHE
  if (isLoading && cachedBerita.length === 0) {
    return <SkeletonLoader />
  }

  return (
    <div className="container mx-auto px-4 pb-14 md:pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start space-y-3 md:mb-10">
        <Badge
          variant="outline"
          className="border-primary/50 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary md:text-xs"
        >
          Update Informasi
        </Badge>

        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Berita <span className="text-primary">Terbaru</span>
        </h2>

        <div className="h-1 w-16 rounded-full bg-accent" />

        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Kami menyediakan berita terkini tentang program belajar, kegiatan sehari-hari, pengumuman
          penting, dan pencapaian dari Santri RTQ Al-Hikmah.
        </p>
      </div>

      {/* MOBILE / TABLET */}
      <div className="block lg:hidden">
        <div
          className="
            flex gap-4 overflow-x-auto pb-2
            snap-x snap-mandatory
            scrollbar-hide
          "
        >
          {displayedBerita.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="
                min-w-70
                snap-start
              "
            >
              <CardRelatedBerita item={item} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4">
        {displayedBerita.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <CardRelatedBerita item={item} />
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-start">
        <Button
          asChild
          size="sm"
          className="group gap-2 rounded-full bg-primary px-6 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
        >
          <Link href="/berita">
            Lihat Semua Berita
            <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

const SkeletonLoader = () => (
  <div className="container mx-auto px-4 pb-14 md:pb-20">
    <div className="mb-8 animate-pulse space-y-3">
      <div className="h-5 w-28 rounded-full bg-muted" />
      <div className="h-8 w-52 rounded-md bg-muted" />
      <div className="h-3 w-80 rounded-md bg-muted opacity-50" />
    </div>

    {/* MOBILE */}
    <div className="flex gap-4 overflow-hidden lg:hidden">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="min-w-70 space-y-3">
          <div className="aspect-video w-full animate-pulse rounded bg-muted" />

          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>

            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>

    {/* DESKTOP */}
    <div className="hidden gap-4 lg:grid lg:grid-cols-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="aspect-video w-full animate-pulse rounded bg-muted" />

          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>

            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
