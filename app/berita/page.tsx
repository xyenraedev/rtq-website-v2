'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'

import { IconNews, IconRefresh, IconAlertCircle, IconSearch, IconX } from '@tabler/icons-react'

import { useBerita } from '@/hooks/santri/berita/useBerita'
import { useKategori } from '@/hooks/santri/berita/useBeritaKategori'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

import CardBerita, { CardBeritaSkeleton } from '@/components/card/CardBerita'

const SKELETON_COUNT = 6

export default function BeritaPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')

  const { berita, isLoading, hasMore, error, loadMore, retry } = useBerita(selectedCategory)

  const { kategori, isLoading: kategoriLoading } = useKategori()

  const observerTarget = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // CACHE DATA
  const [cachedBerita, setCachedBerita] = useState<typeof berita>([])

  useEffect(() => {
    if (berita.length > 0) {
      setCachedBerita(berita)
    }
  }, [berita])

  // INFINITE SCROLL
  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!hasMore || isLoading || error) return

    const target = observerTarget.current

    if (!target) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    )

    observerRef.current.observe(target)

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [hasMore, isLoading, error, loadMore])

  const categories = [{ id: '', nama: 'Semua' }, ...kategori]

  // SEARCH FILTER
  const filteredBerita = useMemo(() => {
    const keyword = search.toLowerCase()

    return cachedBerita.filter((item) => {
      const judul = item.judul?.toLowerCase() || ''
      const ringkasan = item.ringkasan?.toLowerCase() || ''
      const kategori = item.kategori?.nama?.toLowerCase() || ''

      return judul.includes(keyword) || ringkasan.includes(keyword) || kategori.includes(keyword)
    })
  }, [cachedBerita, search])

  const isInitialLoad = isLoading && cachedBerita.length === 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-card/30 backdrop-blur-sm">
        <div className="container relative z-10 mx-auto px-4 py-14 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <Badge
              variant="outline"
              className="mb-4 border-primary bg-primary/5 px-3 py-1 text-[10px] uppercase tracking-wider text-primary md:text-xs"
            >
              Warta Al-Hikmah
            </Badge>

            <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:mb-6 md:text-6xl">
              Berita & <span className="text-primary">Informasi</span>
            </h1>

            <p className="text-sm leading-relaxed text-muted-foreground md:text-xl">
              Temukan informasi terbaru seputar kegiatan, prestasi santri, program belajar, dan
              pengumuman penting lainnya secara cepat dan akurat.
            </p>
          </motion.div>
        </div>

        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/4 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl md:h-96 md:w-96" />
      </section>

      {/* CONTENT */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* FILTER + SEARCH */}
        <div className="mb-8 space-y-5 md:mb-10 lg:flex justify-between items-center">
          {/* SEARCH */}
          <div className="relative lg:min-w-xl">
            <IconSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berita..."
              className="h-11 rounded-full border-border/70 bg-background pl-10 pr-10 shadow-sm focus-visible:ring-1 text-xs lg:text-sm"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <IconX size={16} />
              </button>
            )}
          </div>

          {/* CATEGORY */}
          <div className="flex overflow-x-auto scrollbar-none pb-4">
            <div className="flex gap-2">
              {kategoriLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
                  ))
                : categories.map((category) => (
                    <Button
                      key={category.id}
                      size="sm"
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                        shrink-0 rounded-full transition-all text-xs lg:text-sm
                        ${
                          selectedCategory === category.id
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:border-primary/40 hover:bg-primary/5'
                        }
                      `}
                    >
                      {category.nama}
                    </Button>
                  ))}
            </div>
          </div>
        </div>

        <Separator className="mb-8 opacity-50 md:mb-12" />

        {/* GRID */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {isInitialLoad
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <CardBeritaSkeleton key={i} />)
            : filteredBerita.map((item) => <CardBerita key={item.id} item={item} />)}
        </div>

        {/* EMPTY */}
        {!isLoading && !error && filteredBerita.length === 0 && (
          <div className="py-16 text-center">
            <IconNews size={40} className="mx-auto mb-3 text-muted-foreground/30" />

            <h3 className="text-base font-medium text-muted-foreground md:text-xl">
              Berita tidak ditemukan
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">Coba gunakan kata kunci lain.</p>

            {(search || selectedCategory) && (
              <Button
                variant="link"
                className="mt-2 text-primary"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('')
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex items-center gap-2 text-destructive">
              <IconAlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <IconRefresh size={14} />
              Coba Lagi
            </Button>
          </div>
        )}

        {/* LOAD MORE SKELETON */}
        {isLoading && cachedBerita.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardBeritaSkeleton key={i} />
            ))}
          </div>
        )}

        {/* OBSERVER */}
        <div ref={observerTarget} className="flex w-full justify-center py-10">
          {!isLoading && !error && !hasMore && filteredBerita.length > 0 && (
            <p className="text-xs italic text-muted-foreground">Semua berita telah dimuat.</p>
          )}
        </div>
      </div>
    </div>
  )
}
