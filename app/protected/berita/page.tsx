'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconClock,
  IconCalendar,
  IconNews,
  IconBookmark,
  IconLoader2,
  IconAlertCircle,
  IconRefresh,
  IconFileText,
  IconHourglass,
  IconCircleCheck,
} from '@tabler/icons-react'

import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { DataTable, type ColumnDef, type DataTableFilter } from '@/components/data-table'

import { ModalTambahBerita } from '@/components/protected/berita/modal-tambah-berita'
import { ModalEditBerita } from '@/components/protected/berita/modal-edit-berita'
import { ModalDeleteBerita } from '@/components/protected/berita/modal-delete-berita'

import { fetchBerita, deleteBulkBerita, type Berita, type BeritaKategori } from '@/lib/berita'

import { fetchKategori } from '@/lib/berita-kategori'
import { createClient } from '@/lib/supabase/client'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>

            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>

            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BeritaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<Berita[]>([])
  const [kategoris, setKategoris] = useState<BeritaKategori[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAdmin, setIsAdmin] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editBerita, setEditBerita] = useState<Berita | null>(null)
  const [deleteBeritaTarget, setDeleteBeritaTarget] = useState<Berita | null>(null)

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletingBulk, setDeletingBulk] = useState(false)

  const [externalFilter, setExternalFilter] = useState<Record<string, string>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const role = user?.app_metadata?.role ?? null
      setIsAdmin(role === 'admin')

      const [beritaList, kategoriList] = await Promise.all([fetchBerita(), fetchKategori()])

      setData(beritaList)
      setKategoris(kategoriList)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const editId = searchParams.get('edit')

    if (!editId || data.length === 0 || !isAdmin) return

    const target = data.find((b) => b.id === editId)

    if (!target) return

    setEditBerita(target)

    router.replace('/protected/berita', { scroll: false })
  }, [searchParams, data, router, isAdmin])

  const publishedCount = data.filter((b) => b.status === 'published').length
  const draftCount = data.filter((b) => b.status === 'draft').length
  const avgWaktuBaca = data.length
    ? Math.round(data.reduce((acc, item) => acc + item.waktu_baca, 0) / data.length)
    : 0
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentCount = data.filter((b) => new Date(b.created_at) >= sevenDaysAgo).length

  function handleManageDraft() {
    setExternalFilter({ status: 'draft' })
  }

  function handleSave(berita: Berita) {
    setData((prev) => [berita, ...prev])
  }

  function handleUpdate(updated: Berita) {
    setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  function handleDeleted(id: string) {
    setData((prev) => prev.filter((item) => item.id !== id))
  }

  function handleBulkDelete(ids: string[]) {
    setSelectedIds(ids)
    setBulkDeleteOpen(true)
  }

  async function confirmBulkDelete() {
    try {
      setDeletingBulk(true)

      await deleteBulkBerita(selectedIds)

      setData((prev) => prev.filter((item) => !selectedIds.includes(item.id)))

      toast.success('Berhasil menghapus berita', {
        description: `${selectedIds.length} berita berhasil dihapus`,
      })

      setBulkDeleteOpen(false)
      setSelectedIds([])
    } catch (e: unknown) {
      toast.error('Gagal menghapus berita', {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setDeletingBulk(false)
    }
  }

  const tableFilters: DataTableFilter<Berita>[] = [
    {
      key: 'kategori_id',
      label: 'Kategori',
      options: kategoris.map((k) => ({ label: k.nama, value: k.id })),
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
      ],
    },
  ]

  const columns: ColumnDef<Berita>[] = [
    {
      key: 'judul',
      header: 'Judul',
      sortable: true,
      cell: (row) => (
        <div className="min-w-60 space-y-1">
          <p className="line-clamp-1 font-semibold text-foreground">{row.judul}</p>

          {row.ringkasan && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{row.ringkasan}</p>
          )}
        </div>
      ),
    },

    {
      key: 'kategori_id',
      header: 'Kategori',
      cell: (row) => (
        <Badge variant="secondary" className="rounded-full">
          {row.berita_kategori?.nama ?? '-'}
        </Badge>
      ),
    },

    {
      key: 'created_at',
      header: 'Tanggal',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <IconCalendar size={14} />
          {formatTanggal(row.created_at)}
        </div>
      ),
    },

    {
      key: 'waktu_baca',
      header: 'Baca',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <IconClock size={14} />
          {row.waktu_baca} menit
        </div>
      ),
    },

    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={row.status === 'published' ? 'default' : 'secondary'}
          className="rounded-full"
        >
          {row.status === 'published' ? 'Published' : 'Draft'}
        </Badge>
      ),
    },

    ...(isAdmin
      ? [
          {
            key: 'id' as keyof Berita,
            header: 'Aksi',
            align: 'center' as const,
            cell: (row: Berita) => (
              <div
                className="flex items-center justify-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setEditBerita(row)}
                  className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                >
                  <IconEdit size={16} />
                </button>

                <button
                  onClick={() => setDeleteBeritaTarget(row)}
                  className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <IconNews size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kelola Berita</h1>

              <p className="text-sm text-muted-foreground">Manajemen berita & artikel pesantren</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <IconRefresh size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <IconPlus size={16} />
              Tambah
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <IconAlertCircle size={18} />

          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Berita"
          value={loading ? '—' : data.length}
          description="Semua artikel"
          icon={
            loading ? (
              <IconLoader2 size={18} className="animate-spin" />
            ) : (
              <IconFileText size={18} />
            )
          }
        />

        <StatCard
          title="Published"
          value={loading ? '—' : publishedCount}
          description={`${publishedCount} artikel aktif`}
          icon={<IconCircleCheck size={18} />}
        />

        <StatCard
          title="Draft"
          value={loading ? '—' : draftCount}
          description={`${draftCount} belum diterbitkan`}
          icon={<IconBookmark size={18} />}
        />

        <StatCard
          title="Rata-rata Baca"
          value={loading ? '—' : `${avgWaktuBaca} menit`}
          description={`${recentCount} artikel minggu ini`}
          icon={<IconHourglass size={18} />}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Daftar Berita</CardTitle>

              <CardDescription>Total {data.length} berita tersedia</CardDescription>
            </div>

            {isAdmin && (
              <button
                onClick={handleManageDraft}
                className="hidden rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted md:block"
              >
                Lihat Draft
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && data.length === 0 ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <IconLoader2 size={18} className="animate-spin" />

              <span className="text-sm">Memuat data...</span>
            </div>
          ) : (
            <DataTable<Berita>
              data={data}
              columns={columns}
              rowKey="id"
              pageSize={10}
              selectable={isAdmin}
              filters={tableFilters}
              searchFields={['judul', 'ringkasan']}
              searchPlaceholder="Cari berita..."
              externalFilter={externalFilter}
              emptyMessage="Tidak ada berita ditemukan."
              onBulkDelete={isAdmin ? (keys) => handleBulkDelete(keys as string[]) : undefined}
            />
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <ModalTambahBerita
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
            kategoris={kategoris}
          />

          {editBerita && (
            <ModalEditBerita
              open={!!editBerita}
              onClose={() => setEditBerita(null)}
              onUpdate={handleUpdate}
              berita={editBerita}
              kategoris={kategoris}
            />
          )}

          {deleteBeritaTarget && (
            <ModalDeleteBerita
              open={!!deleteBeritaTarget}
              onClose={() => setDeleteBeritaTarget(null)}
              onDeleted={handleDeleted}
              berita={deleteBeritaTarget}
            />
          )}

          <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus beberapa berita?</AlertDialogTitle>

                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan.{' '}
                  <span className="font-semibold text-foreground">{selectedIds.length} berita</span>{' '}
                  akan dihapus permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingBulk}>Batal</AlertDialogCancel>

                <AlertDialogAction
                  onClick={confirmBulkDelete}
                  disabled={deletingBulk}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletingBulk ? (
                    <>
                      <IconLoader2 size={16} className="mr-2 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <IconTrash size={16} className="mr-2" />
                      Hapus
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
