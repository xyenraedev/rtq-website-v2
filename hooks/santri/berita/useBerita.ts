'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Kategori {
  id: string
  nama: string
}

interface Berita {
  slug: any
  id: string
  judul: string
  konten: string
  gambar: string
  views: number
  kategori_id: string
  ringkasan: string
  waktu_baca: number
  created_at: string
  updated_at: string
  kategori: Kategori
}

const PAGE_SIZE = 6

export function useBerita(selectedCategory: string = '') {
  const [berita, setBerita] = useState<Berita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Referensi internal untuk kontrol pagination dan status fetch
  const pageRef = useRef(1)
  const isFetchingRef = useRef(false)
  const categoryRef = useRef(selectedCategory)
  const supabaseRef = useRef(createClient())

  /**
   * Mengambil data berita berdasarkan halaman dan kategori aktif.
   */
  const fetchBerita = useCallback(async (isReset = false) => {
    if (isFetchingRef.current) return

    const currentPage = isReset ? 1 : pageRef.current

    isFetchingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      let query = supabaseRef.current
        .from('berita')
        .select('*, kategori:kategori_id (id, nama)')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

      if (categoryRef.current) {
        query = query.eq('kategori_id', categoryRef.current)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        setBerita((prev) => (currentPage === 1 ? data : [...prev, ...data]))
        setHasMore(data.length === PAGE_SIZE)
        pageRef.current = currentPage
      }
    } catch (err) {
      console.error('Error fetching berita:', err)
      setError('Gagal memuat berita. Silakan coba lagi.')
      setHasMore(false)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  /**
   * Memuat ulang data saat kategori berubah.
   */
  useEffect(() => {
    categoryRef.current = selectedCategory
    pageRef.current = 1

    setBerita([])
    setHasMore(true)
    setError(null)

    fetchBerita(true)
  }, [selectedCategory, fetchBerita])

  /**
   * Memuat halaman berikutnya jika data masih tersedia.
   */
  const loadMore = useCallback(() => {
    if (isFetchingRef.current || !hasMore) return

    pageRef.current += 1
    fetchBerita()
  }, [hasMore, fetchBerita])

  /**
   * Mencoba kembali proses pengambilan data setelah gagal.
   */
  const retry = useCallback(() => {
    setError(null)
    setHasMore(true)
    fetchBerita()
  }, [fetchBerita])

  return {
    berita,
    isLoading,
    hasMore,
    error,
    loadMore,
    retry,
  }
}
