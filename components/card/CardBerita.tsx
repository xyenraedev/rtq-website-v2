'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconEye, IconClock, IconCalendarEvent } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'

interface BeritaItem {
  slug: any
  id: string
  gambar: string
  judul: string
  views: number
  kategori: { nama: string }
  waktu_baca: number
  ringkasan: string
  created_at: string
}

interface CardBeritaProps {
  item?: BeritaItem
  loading?: boolean
}

const formatTanggal = (date: string, short = false) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(new Date(date))

export function CardBeritaSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden h-full flex flex-row md:flex-col">
      <Skeleton className="shrink-0 w-28 self-stretch md:w-full md:h-48 rounded-none" />
      <div className="flex flex-col flex-1 p-3 md:p-4 gap-2.5">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <div className="hidden md:block space-y-1.5 flex-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="mt-auto flex gap-3 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

const CardBerita: React.FC<CardBeritaProps> = ({ item, loading }) => {
  if (loading || !item) return <CardBeritaSkeleton />

  return (
    <article className="group overflow-hidden hover:border-border hover:shadow-md transition-all duration-300 h-full">
      <Link href={`/berita/${item.slug}`} className="flex flex-row md:flex-col h-full">
        <div className="relative shrink-0 w-28 self-stretch md:w-full md:h-48 overflow-hidden">
          <Image
            src={item.gambar}
            alt={item.judul}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 rounded"
            sizes="(max-width: 768px) 112px, 400px"
          />

        </div>

        <div className="flex flex-col flex-1 p-3 md:p-4 min-w-0 gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-30">
              {item.kategori.nama}
            </span>
          </div>

          <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-xs sm:text-sm md:text-base">
            {item.judul}
          </h3>

          <p className="hidden md:block text-xs text-muted-foreground line-clamp-2 flex-1">
            {item.ringkasan}
          </p>

          <div className="mt-auto flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <IconCalendarEvent size={10} />
              <span className="hidden sm:inline">{formatTanggal(item.created_at)}</span>
              <span className="sm:hidden">{formatTanggal(item.created_at, true)}</span>
            </span>
            <span className="flex items-center gap-1">
              <IconClock size={10} />
              {item.waktu_baca} min
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default CardBerita
