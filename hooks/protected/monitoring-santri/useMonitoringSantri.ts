'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  fetchSantriList,
  fetchMonitoringStats,
  fetchRiwayatProgress,
  deleteSantri,
  reklasifikasiSantri,
} from '@/lib/ml-services/monitoring-santri'
import type {
  SantriDenganRekomendasi,
  MonitoringStats,
  SantriProgress,
  Santri,
  KlasifikasiResult,
} from '@/lib/types'
import {
  hitungUsia,
  hitungLamaBelajarBulan,
  kategoriUsia,
  generateNomorIndukBerikutnya,
} from '@/lib/monitoring-santri/helpers'
import type {
  JenisKelaminFilter,
  UsiaFilter,
  StatusAktifFilter,
  StatusKelulusanFilter,
  SortKey,
  SortDir,
  SantriEnriched,
  LastUpdatedSantriInfo,
} from '@/lib/monitoring-santri/types'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 25

export function useMonitoringSantri() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [santriList, setSantriList] = useState<SantriDenganRekomendasi[]>([])
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editSantri, setEditSantri] = useState<SantriDenganRekomendasi | null>(null)
  const [editProgressList, setEditProgressList] = useState<SantriProgress[]>([])
  const [detailSantri, setDetailSantri] = useState<SantriDenganRekomendasi | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null)
  const [confirmReklas, setConfirmReklas] = useState<{ id: string; nama: string } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<LastUpdatedSantriInfo | null>(null)

  const [search, setSearch] = useState('')
  const [filterJilid, setFilterJilid] = useState<number | ''>('')
  const [filterJenisKelamin, setFilterJenisKelamin] = useState<JenisKelaminFilter>('')
  const [filterUsia, setFilterUsia] = useState<UsiaFilter>('')
  const [filterStatusAktif, setFilterStatusAktif] = useState<StatusAktifFilter>('')
  const [filterStatusKelulusan, setFilterStatusKelulusan] = useState<StatusKelulusanFilter>('')
  const [sortKey, setSortKey] = useState<SortKey | null>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAdmin(user?.app_metadata?.role === 'admin')

      const { error: syncError } = await supabase.rpc('sync_durasi_semua_santri')
      if (syncError) throw syncError

      const [list, statsData] = await Promise.all([fetchSantriList(), fetchMonitoringStats()])
      setSantriList(list)
      setStats(statsData)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openEdit = useCallback(async (santri: SantriDenganRekomendasi) => {
    setEditSantri(santri)
    try {
      const prog = await fetchRiwayatProgress(santri.id)
      setEditProgressList(prog)
    } catch {
      setEditProgressList([])
    }
    setShowForm(true)
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId || santriList.length === 0 || !isAdmin) return
    const target = santriList.find((s) => s.id === editId)
    if (!target) return
    openEdit(target)
    router.replace('/protected/monitoring-santri', { scroll: false })
  }, [searchParams, santriList, isAdmin, openEdit, router])

  function openCreate() {
    setEditSantri(null)
    setEditProgressList([])
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditSantri(null)
    setEditProgressList([])
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const { id, nama } = confirmDelete
    setConfirmDelete(null)
    try {
      await deleteSantri(id)
      toast.success(`Santri "${nama}" berhasil dihapus`)
      setDetailSantri(null)
      loadData()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal menghapus')
    }
  }

  async function handleReklasifikasi() {
    if (!confirmReklas) return
    const { id, nama } = confirmReklas
    setConfirmReklas(null)
    try {
      const hasil = await reklasifikasiSantri(id)
      toast.success(`Reklasifikasi "${nama}" selesai: ${hasil.status}`)
      setLastUpdated({
        id,
        nama,
        statusRekomendasi: hasil.status,
        aksi: 'reklasifikasi',
      })
      loadData()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Gagal reklasifikasi')
    }
  }

  function handleFormSaved({
    santri,
    klasifikasi,
  }: {
    santri: Santri
    klasifikasi: KlasifikasiResult
  }) {
    if (editSantri) {
      setLastUpdated({
        id: santri.id,
        nama: santri.nama,
        statusRekomendasi: klasifikasi.status,
        aksi: 'update',
      })
    }
    loadData()
  }

  function dismissLastUpdated() {
    setLastUpdated(null)
  }

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortKey(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
  }

  function resetFilters() {
    setSearch('')
    setFilterJilid('')
    setFilterJenisKelamin('')
    setFilterUsia('')
    setFilterStatusAktif('')
    setFilterStatusKelulusan('')
  setSortKey('created_at')
  setSortDir('desc')
  }

  const isFiltered =
    search !== '' ||
    filterJilid !== '' ||
    filterJenisKelamin !== '' ||
    filterUsia !== '' ||
    filterStatusAktif !== '' ||
    filterStatusKelulusan !== '' ||
    (sortKey !== 'created_at' && sortKey !== null) ||
    sortDir !== 'desc'

  const enriched: SantriEnriched[] = useMemo(
    () =>
      santriList.map((s) => ({
        ...s,
        _usia: hitungUsia(s.tanggal_lahir),
        _lamaBelajar: hitungLamaBelajarBulan(s),
      })),
    [santriList]
  )

  const filtered = useMemo(() => {
    return enriched.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        const cocokNama = String(s.nama ?? '')
          .toLowerCase()
          .includes(q)
        const cocokNomor = String(s.nomor_induk ?? '')
          .toLowerCase()
          .includes(q)
        if (!cocokNama && !cocokNomor) return false
      }
      if (filterJilid !== '' && s.jilid_saat_ini !== filterJilid) return false
      if (filterJenisKelamin && s.jenis_kelamin !== filterJenisKelamin) return false
      if (filterUsia && kategoriUsia(s._usia) !== filterUsia) return false
      if (filterStatusAktif === 'aktif' && !s.status_aktif) return false
      if (filterStatusAktif === 'nonaktif' && s.status_aktif) return false
      if (filterStatusKelulusan && s.status_kelulusan !== filterStatusKelulusan) return false
      return true
    })
  }, [
    enriched,
    search,
    filterJilid,
    filterJenisKelamin,
    filterUsia,
    filterStatusAktif,
    filterStatusKelulusan,
  ])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => {
      let va: string | number | null = null
      let vb: string | number | null = null
      switch (sortKey) {
        case 'nomor_induk':
          va = a.nomor_induk ?? ''
          vb = b.nomor_induk ?? ''
          break
        case 'nama':
          va = a.nama
          vb = b.nama
          break
        case 'jilid_saat_ini':
          va = a.jilid_saat_ini
          vb = b.jilid_saat_ini
          break
        case 'usia':
          va = a._usia
          vb = b._usia
          break
        case 'lama_belajar':
          va = a._lamaBelajar
          vb = b._lamaBelajar
          break
        case 'created_at':
          va = a.created_at ? new Date(a.created_at).getTime() : 0
          vb = b.created_at ? new Date(b.created_at).getTime() : 0
          break
      }
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return arr
  }, [filtered, sortKey, sortDir])

  // Reset ke halaman 1 tiap kali hasil filter/sort berubah, biar tidak
  // nyangkut di halaman kosong.
  useEffect(() => {
    setPage(1)
  }, [
    search,
    filterJilid,
    filterJenisKelamin,
    filterUsia,
    filterStatusAktif,
    filterStatusKelulusan,
    sortKey,
    sortDir,
  ])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))

  // Clamp kalau halaman saat ini jadi out-of-range (misal data berkurang
  // setelah delete).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  function goToPage(target: number) {
    setPage(Math.min(Math.max(1, target), totalPages))
  }

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  const jilidOptions = useMemo(() => {
    const set = new Set(santriList.map((s) => s.jilid_saat_ini))
    return Array.from(set).sort((a, b) => a - b)
  }, [santriList])

  const existingNomorIndukList = useMemo(
    () => santriList.map((s) => String(s.nomor_induk ?? '')).filter((n): n is string => !!n),
    [santriList]
  )

  const suggestedNomorInduk = useMemo(() => generateNomorIndukBerikutnya(santriList), [santriList])

  return {
    santriList,
    stats,
    loading,
    isAdmin,
    loadData,

    showForm,
    editSantri,
    editProgressList,
    openEdit,
    openCreate,
    closeForm,

    detailSantri,
    setDetailSantri,

    confirmDelete,
    setConfirmDelete,
    handleDelete,

    confirmReklas,
    setConfirmReklas,
    handleReklasifikasi,

    lastUpdated,
    handleFormSaved,
    dismissLastUpdated,

    search,
    setSearch,
    filterJilid,
    setFilterJilid,
    filterJenisKelamin,
    setFilterJenisKelamin,
    filterUsia,
    setFilterUsia,
    filterStatusAktif,
    setFilterStatusAktif,
    filterStatusKelulusan,
    setFilterStatusKelulusan,
    sortKey,
    sortDir,
    handleSort,
    resetFilters,
    isFiltered,

    sorted,
    paginated,
    page,
    pageSize,
    totalPages,
    goToPage,
    changePageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,

    jilidOptions,
    existingNomorIndukList,
    suggestedNomorInduk,
  }
}

export type MonitoringSantriState = ReturnType<typeof useMonitoringSantri>
