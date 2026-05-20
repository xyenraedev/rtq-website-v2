'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { IconClock, IconCalendarEvent } from '@tabler/icons-react'

type RelatedNewsCardProps = {
  item: {
    id: string
    slug: string
    gambar?: string
    judul: string
    kategori_id?: string
    kategori?: { nama: string }
    konten: string
    ringkasan?: string
    waktu_baca?: number
    created_at: string
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
}

const formatTanggal = (date: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

const CardRelatedBerita: React.FC<RelatedNewsCardProps> = ({ item }) => {
  return (
    <motion.article
      variants={fadeInUp}
      className="
    flex h-full flex-col overflow-hidden
    transition-all duration-300
    hover:-translate-y-1
  "
    >
      <Link href={`/berita/${item.slug}`} className="flex h-full flex-col">
        {/* IMAGE */}
        <div className="relative aspect-video w-full min-w-full shrink-0 overflow-hidden rounded">
          {item.gambar ? (
            <Image
              src={item.gambar}
              alt={item.judul}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">No Image</span>
            </div>
          )}
          {/* OVERLAY */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          {/* KATEGORI */}
          {item.kategori?.nama && (
            <div className="absolute left-3 top-3 z-10">
              <span
                className="
          rounded-full bg-white/90 px-3 py-1
          text-[11px] font-medium text-primary
          backdrop-blur-sm
        "
              >
                {item.kategori.nama}
              </span>
            </div>
          )}
        </div>
        {/* CONTENT */}
        <div className="flex flex-1 flex-col space-y-3 mt-4">
          {/* META */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <IconCalendarEvent size={15} />
              <span>{formatTanggal(item.created_at)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <IconClock size={15} />
              <span>{item.waktu_baca ?? 0} min</span>
            </div>
          </div>
          {/* TITLE */}
          <h3
            className="
              line-clamp-2
              text-md font-medium leading-snug text-foreground
              transition-colors hover:text-primary
            "
          >
            {item.judul}
          </h3>
        </div>
      </Link>
    </motion.article>
  )
}

export default CardRelatedBerita
