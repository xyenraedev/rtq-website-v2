'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useBerita } from '@/hooks/santri/berita/useBerita'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { IconCalendarEvent, IconArrowRight } from '@tabler/icons-react'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(date)
}

export default function Berita() {
  const [isMobile, setIsMobile] = useState(false)
  const { berita, isLoading } = useBerita('')

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  if (isLoading) return <SkeletonLoader />

  return (
    <div className="container mx-auto px-4 pb-14 md:pb-20">
      {/* Header */}
      <div className="flex flex-col items-start mb-8 md:mb-10 space-y-3">
        <Badge
          variant="outline"
          className="text-primary border-primary/50 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest font-semibold md:text-xs"
        >
          Update Informasi
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Berita <span className="text-primary">Terbaru</span>
        </h2>
        <div className="h-1 w-16 bg-accent rounded-full" />
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Kami menyediakan berita terkini tentang program belajar, kegiatan sehari-hari, pengumuman
          penting, dan pencapaian dari Santri RTQ Al-Hikmah.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {berita.slice(0, isMobile ? 3 : 6).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Link href={`/berita/${item.slug}`} className="group block h-full">
              <Card className="h-full flex flex-col overflow-hidden border border-border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/40 gap-0 py-0">
                {/* Image */}
                <div className="relative w-full h-40 sm:h-44 overflow-hidden">
                  <Image
                    src={item.gambar || '/placeholder.jpg'}
                    alt={item.judul}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/10 to-transparent" />
                </div>

                {/* Content */}
                <CardContent className="flex flex-col flex-1 p-3 gap-2 md:p-4">
                  <div className="space-y-1.5">
                    {item.kategori && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.kategori.nama}
                      </span>
                    )}
                    <h3 className="text-xs font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors md:text-sm">
                      {item.judul}
                    </h3>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-border/50 text-[10px] text-muted-foreground md:text-xs">
                    <div className="flex items-center gap-1">
                      <IconCalendarEvent size={12} />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <IconArrowRight
                      size={14}
                      className="text-primary opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-start">
        <Button
          asChild
          size="sm"
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all px-6 gap-2 group"
        >
          <Link href="/berita">
            Lihat Semua Berita
            <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

const SkeletonLoader = () => (
  <div className="container mx-auto px-4 pb-14 md:pb-20">
    <div className="animate-pulse space-y-3 mb-8">
      <div className="h-5 w-28 bg-muted rounded-full" />
      <div className="h-8 w-52 bg-muted rounded-md" />
      <div className="h-3 w-80 bg-muted rounded-md opacity-50" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
        >
          <div className="w-full h-40 bg-muted animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-14 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
