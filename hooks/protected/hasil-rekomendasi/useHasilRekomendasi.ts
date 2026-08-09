'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import {
  type RekomendasiRow,
  type StatistikRekomendasi,
  fetchHasilRekomendasiList,
  fetchStatistikRekomendasi,
  reklasifikasiSemua,
} from '@/lib/ml-services/hasil-rekomendasi'

import type { StatusRekomendasi } from '@/lib/types'
import type { SortKey, SortDir } from '@/lib/hasil-rekomendasi/types'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 25

type FilterProbabilitas = '' | 'tinggi' | 'sedang' | 'rendah'

/**
 * Normalisasi probabilitas ke skala 0-100.
 *
 * Menangani kemungkinan data probabilitas disimpan
 * sebagai pecahan (0-1) maupun persentase (0-100).
 */
function toPersenProbabilitas(value: number | null): number | null {
  if (value == null) return null
  return value <= 1 ? value * 100 : value
}

/**
 * Mengelompokkan probabilitas menjadi kategori.
 *
 * Tinggi  : >= 80%
 * Sedang  : 50% - 79%
 * Rendah  : < 50%
 */
function kategoriProbabilitas(value: number | null): FilterProbabilitas | null {
  const persen = toPersenProbabilitas(value)
  if (persen == null) return null
  if (persen >= 80) return 'tinggi'
  if (persen >= 50) return 'sedang'
  return 'rendah'
}

export function useHasilRekomendasi() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<RekomendasiRow[]>([])
  const [statistik, setStatistik] = useState<StatistikRekomendasi | null>(null)

  const [loading, setLoading] = useState(true)
  const [reklasLoading, setReklasLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusRekomendasi | ''>('')
  const [filterJilid, setFilterJilid] = useState<number | ''>('')
  const [filterProbabilitas, setFilterProbabilitas] = useState<FilterProbabilitas>('')

  const [sortKey, setSortKey] = useState<SortKey | null>('status_rekomendasi')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [detailRow, setDetailRow] = useState<RekomendasiRow | null>(null)

  const [confirmReklas, setConfirmReklas] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const isAdmin = role === 'admin'

  /**
   * Ambil role user yang sedang login.
   */
  useEffect(() => {
    async function loadRole() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      setRole(user?.app_metadata?.role ?? null)
    }

    loadRole()
  }, [])

  /**
   * Memuat data rekomendasi dan statistik.
   *
   * Seluruh data santri aktif yang sudah diklasifikasi diambil sekaligus;
   * filter/pencarian selanjutnya dijalankan di client agar kombinasi
   * banyak filter tidak perlu round-trip ke server setiap kali berubah.
   */
  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      const [list, stats] = await Promise.all([
        fetchHasilRekomendasiList(),
        fetchStatistikRekomendasi(),
      ])

      setData(list)
      setStatistik(stats)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Load data pertama kali.
   */
  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (!highlightId || data.length === 0) return

    const target = data.find((row) => row.id === highlightId)
    if (target) {
      setDetailRow(target)
    }
    router.replace('/protected/hasil-rekomendasi', { scroll: false })
  }, [searchParams, data, router])

  /**
   * Daftar opsi jilid, diturunkan dari data yang ada.
   */
  const jilidOptions = useMemo(() => {
    const set = new Set<number>()
    data.forEach((row) => set.add(row.jilid_saat_ini))
    return Array.from(set).sort((a, b) => a - b)
  }, [data])

  /**
   * Filter dijalankan di client (search, status, jilid, probabilitas).
   */
  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return data.filter((row) => {
      if (keyword && !row.nama.toLowerCase().includes(keyword)) {
        return false
      }

      if (filterStatus && row.status_rekomendasi !== filterStatus) {
        return false
      }

      if (filterJilid !== '' && row.jilid_saat_ini !== filterJilid) {
        return false
      }

      if (filterProbabilitas && kategoriProbabilitas(row.probabilitas) !== filterProbabilitas) {
        return false
      }

      return true
    })
  }, [data, search, filterStatus, filterJilid, filterProbabilitas])

  /**
   * Mengubah sorting.
   *
   * Klik pertama:
   *   asc
   *
   * Klik kedua:
   *   desc
   *
   * Klik ketiga:
   *   reset sorting
   */
  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
      return
    }

    if (sortDir === 'asc') {
      setSortDir('desc')
      return
    }

    if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
      return
    }

    setSortDir('asc')
  }

  /**
   * Sorting data hasil filter secara client-side.
   */
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) {
      return filteredData
    }

    const arr = [...filteredData]

    arr.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]

      /**
       * Nilai null/undefined ditempatkan di belakang.
       */
      if (va == null && vb == null) {
        return 0
      }

      if (va == null) {
        return 1
      }

      if (vb == null) {
        return -1
      }

      let comparison = 0

      /**
       * String
       */
      if (typeof va === 'string' && typeof vb === 'string') {
        comparison = va.localeCompare(vb)
      } else if (typeof va === 'number' && typeof vb === 'number') {
        /**
         * Number
         */
        comparison = va - vb
      } else {
        /**
         * Boolean / tipe lain.
         *
         * Tidak menggunakan `any`.
         */
        comparison = String(va).localeCompare(String(vb))
      }

      return sortDir === 'asc' ? comparison : -comparison
    })

    return arr
  }, [filteredData, sortKey, sortDir])

  /**
   * Reset filter dan sorting.
   */
  function resetAll() {
    setSearch('')
    setFilterStatus('')
    setFilterJilid('')
    setFilterProbabilitas('')
    setSortKey('status_rekomendasi')
    setSortDir('asc')
  }

  /**
   * Menentukan apakah saat ini terdapat filter/sorting custom.
   */
  const isFiltered =
    search !== '' ||
    filterStatus !== '' ||
    filterJilid !== '' ||
    filterProbabilitas !== '' ||
    sortKey !== 'status_rekomendasi' ||
    sortDir !== 'asc'

  /**
   * Set halaman kembali ke halaman pertama
   * ketika filter/search/sorting berubah.
   */
  useEffect(() => {
    setPage(1)
  }, [search, filterStatus, filterJilid, filterProbabilitas, sortKey, sortDir])

  /**
   * Total halaman berdasarkan hasil sorting.
   */
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))

  /**
   * Jika halaman aktif melebihi total halaman,
   * pindahkan ke halaman terakhir.
   */
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  /**
   * Data yang ditampilkan pada halaman aktif.
   */
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize

    return sortedData.slice(start, start + pageSize)
  }, [sortedData, page, pageSize])

  /**
   * Pindah halaman.
   */
  function goToPage(target: number) {
    setPage(Math.min(Math.max(1, target), totalPages))
  }

  /**
   * Mengubah jumlah data per halaman.
   */
  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  /**
   * Reklasifikasi seluruh santri.
   */
  async function handleReklasifikasiSemua() {
    if (!isAdmin) {
      toast.error('Anda tidak memiliki akses')
      return
    }

    setConfirmReklas(false)
    setReklasLoading(true)

    try {
      const { berhasil, gagal } = await reklasifikasiSemua()

      if (berhasil === 0 && gagal === 0) {
        toast.info('Tidak ada santri yang ditemukan')
      } else {
        toast.success(`Reklasifikasi selesai: ${berhasil} berhasil, ${gagal} gagal`)
      }

      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal reklasifikasi')
    } finally {
      setReklasLoading(false)
    }
  }

  return {
    // Data
    data,
    statistik,

    // Loading
    loading,
    reklasLoading,

    // Role
    isAdmin,

    // Reload
    loadData,

    // Search & filter
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterJilid,
    setFilterJilid,
    filterProbabilitas,
    setFilterProbabilitas,
    jilidOptions,

    // Sorting
    sortKey,
    sortDir,
    handleSort,
    resetAll,
    isFiltered,

    // Sorted & pagination
    sortedData,
    paginated,
    page,
    pageSize,
    totalPages,
    goToPage,
    changePageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,

    // Detail
    detailRow,
    setDetailRow,

    // Reklasifikasi
    confirmReklas,
    setConfirmReklas,
    handleReklasifikasiSemua,
  }
}

export type HasilRekomendasiState = ReturnType<typeof useHasilRekomendasi>
