import { useState, useEffect, useCallback, useRef } from 'react'

import { fetchGaleriPaginated, GALERI_PAGE_SIZE, type GaleriWithKategori } from '@/lib/galeri'

interface UseInfiniteGaleriOptions {
  kategoriId: string | null
  pageSize?: number
}

interface UseInfiniteGaleriResult {
  galeri: GaleriWithKategori[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  total: number
  error: string | null
  loadMore: () => void
  reset: () => void
  sentinelRef: React.RefObject<HTMLDivElement | null>
}

export function useInfiniteGaleri({
  kategoriId,
  pageSize = GALERI_PAGE_SIZE,
}: UseInfiniteGaleriOptions): UseInfiniteGaleriResult {
  const [galeri, setGaleri] = useState<GaleriWithKategori[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isFetchingRef = useRef(false)

  // ─── Initial / kategori-change fetch ──────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError(null)
      setGaleri([])
      setPage(1)
      setHasMore(false)
      isFetchingRef.current = false

      try {
        const result = await fetchGaleriPaginated({
          page: 1,
          pageSize,
          kategoriId,
        })

        if (cancelled) return

        setGaleri(result.data)
        setHasMore(result.hasMore)
        setTotal(result.total)
        setPage(2)
      } catch (err) {
        if (cancelled) return
        console.error(err)
        setError('Gagal memuat galeri')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInitial()

    return () => {
      cancelled = true
    }
  }, [kategoriId, pageSize])

  // ─── Load more ────────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || loadingMore || !hasMore) return

    isFetchingRef.current = true
    setLoadingMore(true)

    try {
      const result = await fetchGaleriPaginated({
        page,
        pageSize,
        kategoriId,
      })

      setGaleri((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
      setTotal(result.total)
      setPage((prev) => prev + 1)
    } catch (err) {
      console.error(err)
      setError('Gagal memuat lebih banyak')
    } finally {
      setLoadingMore(false)
      isFetchingRef.current = false
    }
  }, [page, pageSize, kategoriId, hasMore, loadingMore])

  // ─── IntersectionObserver ─────────────────────────────────────────────────

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && hasMore && !isFetchingRef.current) {
          void loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const sentinel = sentinelRef.current
    if (sentinel) {
      observerRef.current.observe(sentinel)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [hasMore, loadMore])

  // ─── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setGaleri([])
    setPage(1)
    setHasMore(false)
    setTotal(0)
    setError(null)
    isFetchingRef.current = false
  }, [])

  return {
    galeri,
    loading,
    loadingMore,
    hasMore,
    total,
    error,
    loadMore,
    reset,
    sentinelRef,
  }
}
