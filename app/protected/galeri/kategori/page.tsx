'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconBadge,
  IconLoader2,
  IconAlertCircle,
  IconRefresh,
  IconHash,
  IconLayoutGrid,
  IconFileDescription,
  IconTag,
} from '@tabler/icons-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { toast } from 'sonner'
import {
  fetchGaleriKategori,
  deleteBulkGaleriKategori,
  type GaleriKategori,
} from '@/lib/galeri-kategori'
import { createClient } from '@/lib/supabase/client'
import { ModalTambahGaleriKategori } from '@/components/protected/galeri-kategori/modal-tambah-galeri'
import { ModalEditGaleriKategori } from '@/components/protected/galeri-kategori/modal-edit-kategori'
import { ModalHapusGaleriKategori } from '@/components/protected/galeri-kategori/modal-hapus-kategori'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface GaleriKategoriWithCount extends GaleriKategori {
  galeriCount: number
}

async function fetchGaleriCountPerKategori(): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data, error } = await supabase.from('galeri').select('galeri_kategori_id')

  if (error) throw error

  const countMap: Record<string, number> = {}
  ;(data ?? []).forEach((row: { galeri_kategori_id: string | null }) => {
    if (row.galeri_kategori_id) {
      countMap[row.galeri_kategori_id] = (countMap[row.galeri_kategori_id] ?? 0) + 1
    }
  })

  return countMap
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  accent: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="hidden sm:flex items-start gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>

          <div className="h-8 flex items-center">
            <p
              className={cn(
                'font-bold text-foreground leading-tight truncate',
                typeof value === 'number' ? 'text-2xl' : 'text-lg'
              )}
              title={String(value)}
            >
              {value}
            </p>
          </div>

          <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
        </div>
      </div>

      <div className="flex sm:hidden flex-col gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}
          >
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">
              {label}
            </p>

            <div className="h-6.5 flex items-center">
              <p
                className={cn(
                  'font-bold text-foreground leading-tight truncate',
                  typeof value === 'number' ? 'text-lg' : 'text-sm'
                )}
                title={String(value)}
              >
                {value}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
      </div>
    </div>
  )
}

export default function GaleriKategoriPage() {
  const [kategoris, setKategoris] = useState<GaleriKategoriWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAdmin, setIsAdmin] = useState(false)

  const [modalTambahOpen, setModalTambahOpen] = useState(false)
  const [editKategori, setEditKategori] = useState<GaleriKategoriWithCount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GaleriKategoriWithCount | null>(null)

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

      const [kategoriList, countMap] = await Promise.all([
        fetchGaleriKategori(),
        fetchGaleriCountPerKategori(),
      ])

      const enriched: GaleriKategoriWithCount[] = kategoriList.map((k) => ({
        ...k,
        galeriCount: countMap[k.id] ?? 0,
      }))

      setKategoris(enriched)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalGaleri = kategoris.reduce((a, k) => a + k.galeriCount, 0)
  const kategoriTerpakai = kategoris.filter((k) => k.galeriCount > 0).length
  const kategoriTerbanyak = [...kategoris].sort((a, b) => b.galeriCount - a.galeriCount)[0]

  function handleSave(kategori: GaleriKategori) {
    setKategoris((prev) => [{ ...kategori, galeriCount: 0 }, ...prev])
  }

  function handleUpdate(updated: GaleriKategori) {
    setKategoris((prev) => prev.map((k) => (k.id === updated.id ? { ...k, ...updated } : k)))
  }

  function handleDeleted(id: string) {
    setKategoris((prev) => prev.filter((k) => k.id !== id))
    setDeleteTarget(null)
  }

  async function handleBulkDelete(keys: string[]) {
    try {
      await deleteBulkGaleriKategori(keys)
      setKategoris((prev) => prev.filter((k) => !keys.includes(k.id)))
      toast.success(`${keys.length} kategori galeri berhasil dihapus`)
    } catch (e: unknown) {
      toast.error('Gagal menghapus beberapa kategori', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const columns: ColumnDef<GaleriKategoriWithCount>[] = [
    {
      key: 'nama',
      header: 'Nama Kategori',
      sortable: true,
      cell: (row) => {
        const hasDeskripsi = row.deskripsi && row.deskripsi.trim()

        return (
          <div className="flex items-start gap-3 min-w-0 max-w-xl">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border bg-muted/40">
              <IconPhoto size={14} className="text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">{row.nama}</span>

                {hasDeskripsi && (
                  <span className="text-muted-foreground/60" title={row.deskripsi || undefined}>
                    <IconFileDescription size={12} />
                  </span>
                )}
              </div>

              {hasDeskripsi && (
                <p
                  className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
                  title={row.deskripsi || undefined}
                >
                  {row.deskripsi}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'galeriCount',
      header: 'Jumlah Foto',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            <IconTag size={11} className="mr-1.5 text-muted-foreground" />
            {row.nama}
          </span>

          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconBadge size={13} />
            {row.galeriCount} foto
          </span>
        </div>
      ),
    },
    {
      key: 'proporsi',
      header: 'Proporsi',
      cell: (row) => {
        const pct = totalGaleri > 0 ? Math.round((row.galeriCount / totalGaleri) * 100) : 0

        return (
          <div className="flex items-center gap-2 min-w-30 md:min-w-60">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
              {pct}%
            </span>
          </div>
        )
      },
    },
    ...(isAdmin
      ? [
          {
            key: 'aksi' as keyof GaleriKategoriWithCount,
            header: 'Aksi',
            align: 'center' as const,
            cell: (row: GaleriKategoriWithCount) => (
              <div
                className="flex items-center justify-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setEditKategori(row)}
                  className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  title="Edit"
                >
                  <IconEdit size={15} />
                </button>
                <button
                  onClick={() => setDeleteTarget(row)}
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  title="Hapus"
                >
                  <IconTrash size={15} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <IconPhoto size={18} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Kategori Galeri</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Manajemen kategori untuk pengelompokan foto &amp; album galeri
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <IconRefresh size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {isAdmin && (
            <button
              onClick={() => setModalTambahOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <IconPlus size={17} />
              Tambah Kategori
            </button>
          )}
        </div>
      </div>

      <hr className="my-4" />

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3">
          <IconAlertCircle size={18} className="shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={loadData} className="ml-auto text-xs underline hover:no-underline">
            Coba lagi
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={
            loading ? (
              <IconLoader2 size={18} className="text-primary animate-spin" />
            ) : (
              <IconPhoto size={18} className="text-primary" />
            )
          }
          label="Total Kategori"
          value={loading ? '—' : kategoris.length}
          sub="Semua kategori tersedia"
          accent="bg-primary/10"
        />
        <StatCard
          icon={<IconLayoutGrid size={18} className="text-violet-600" />}
          label="Kategori Terpakai"
          value={loading ? '—' : kategoriTerpakai}
          sub={loading ? '' : `${kategoris.length - kategoriTerpakai} kategori kosong`}
          accent="bg-violet-100 dark:bg-violet-950"
        />
        <StatCard
          icon={<IconBadge size={18} className="text-sky-600" />}
          label="Total Foto"
          value={loading ? '—' : totalGaleri}
          sub="Terdistribusi antar kategori"
          accent="bg-sky-100 dark:bg-sky-950"
        />
        <StatCard
          icon={<IconHash size={18} className="text-emerald-600" />}
          label="Kategori Terbanyak"
          value={loading ? '—' : (kategoriTerbanyak?.nama ?? '-')}
          sub={
            loading
              ? ''
              : kategoriTerbanyak
                ? `${kategoriTerbanyak.galeriCount} foto`
                : 'Belum ada foto'
          }
          accent="bg-emerald-100 dark:bg-emerald-950"
        />
      </div>

      {loading && kategoris.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <IconLoader2 size={20} className="animate-spin" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : (
        <DataTable<GaleriKategoriWithCount>
          data={kategoris}
          columns={columns}
          rowKey="id"
          pageSize={10}
          defaultSort={{ key: 'galeriCount', direction: 'desc' }}
          searchFields={['nama']}
          searchPlaceholder="Cari kategori galeri..."
          selectable={isAdmin}
          onBulkDelete={isAdmin ? (keys) => handleBulkDelete(keys as string[]) : undefined}
          emptyMessage="Tidak ada kategori galeri ditemukan."
          toolbarExtra={
            <span className="text-xs text-muted-foreground">
              Total <span className="font-semibold text-foreground">{kategoris.length}</span>{' '}
              kategori
            </span>
          }
        />
      )}

      {isAdmin && (
        <>
          <ModalTambahGaleriKategori
            open={modalTambahOpen}
            onClose={() => setModalTambahOpen(false)}
            onSave={handleSave}
          />

          {editKategori && (
            <ModalEditGaleriKategori
              open={!!editKategori}
              onClose={() => setEditKategori(null)}
              kategori={editKategori}
              onUpdate={handleUpdate}
            />
          )}

          {deleteTarget && (
            <ModalHapusGaleriKategori
              open={!!deleteTarget}
              onClose={() => setDeleteTarget(null)}
              kategori={deleteTarget}
              galeriCount={deleteTarget.galeriCount}
              onDeleted={handleDeleted}
            />
          )}
        </>
      )}
    </div>
  )
}
