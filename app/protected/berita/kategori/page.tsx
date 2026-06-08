'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTag,
  IconNews,
  IconLoader2,
  IconAlertCircle,
  IconRefresh,
  IconHash,
  IconLayoutGrid,
  IconFileDescription,
} from '@tabler/icons-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { deleteBulkKategori, fetchKategori, type BeritaKategori } from '@/lib/berita-kategori'
import { fetchBerita, type Berita } from '@/lib/berita'
import { toast } from 'sonner'
import { ModalDeleteKategori } from '@/components/protected/berita-kategori/modal-delete-kategori'
import { ModalTambahKategori } from '@/components/protected/berita-kategori/modal-tambah-kategori'
import { ModalEditKategori } from '@/components/protected/berita-kategori/modal-edit-kategori'
import { createClient } from '@/lib/supabase/client'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="hidden sm:flex items-start gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground leading-tight wrap-break-word">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>

      <div className="flex sm:hidden flex-col gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">
              {label}
            </p>
            <p className="text-lg font-bold text-foreground leading-tight wrap-break-word">
              {value}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  )
}

interface KategoriWithCount extends BeritaKategori {
  beritaCount: number
}

export default function BeritaKategoriPage() {
  const [kategoris, setKategoris] = useState<KategoriWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAdmin, setIsAdmin] = useState(false)

  const [modalTambahOpen, setModalTambahOpen] = useState(false)
  const [editKategori, setEditKategori] = useState<KategoriWithCount | null>(null)
  const [deleteKategoriTarget, setDeleteKategoriTarget] = useState<KategoriWithCount | null>(null)

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

      const [kategoriList, beritaList] = await Promise.all([fetchKategori(), fetchBerita()])

      const countMap: Record<string, number> = {}
      beritaList.forEach((b: Berita) => {
        if (b.kategori_id) {
          countMap[b.kategori_id] = (countMap[b.kategori_id] ?? 0) + 1
        }
      })

      const enriched: KategoriWithCount[] = kategoriList.map((k) => ({
        ...k,
        beritaCount: countMap[k.id] ?? 0,
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

  const totalBerita = kategoris.reduce((a, k) => a + k.beritaCount, 0)
  const kategoriTerpakai = kategoris.filter((k) => k.beritaCount > 0).length
  const kategoriTerbanyak = [...kategoris].sort((a, b) => b.beritaCount - a.beritaCount)[0]

  function handleSave(kategori: BeritaKategori) {
    setKategoris((prev) => [{ ...kategori, beritaCount: 0 }, ...prev])
  }

  function handleUpdate(updated: BeritaKategori) {
    setKategoris((prev) => prev.map((k) => (k.id === updated.id ? { ...k, ...updated } : k)))
  }

  async function handleBulkDelete(keys: string[]) {
    try {
      await deleteBulkKategori(keys)
      setKategoris((prev) => prev.filter((k) => !keys.includes(k.id)))
      toast.success(`${keys.length} kategori berhasil dihapus`)
    } catch (e: unknown) {
      toast.error('Gagal menghapus beberapa kategori', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const columns: ColumnDef<KategoriWithCount>[] = [
    {
      key: 'nama',
      header: 'Nama Kategori',
      sortable: true,
      cell: (row) => {
        const hasDeskripsi = row.deskripsi && row.deskripsi.trim()
        return (
          <div className="flex items-start gap-3 min-w-0 max-w-xl">
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
      key: 'beritaCount',
      header: 'Jumlah Berita',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-secondary/50 border-border text-foreground dark:bg-white/5 dark:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{row.nama}</span>
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconNews size={13} />
            {row.beritaCount} berita
          </span>
        </div>
      ),
    },
    {
      key: 'proporsi',
      header: 'Proporsi',
      cell: (row) => {
        const pct = totalBerita > 0 ? Math.round((row.beritaCount / totalBerita) * 100) : 0
        return (
          <div className="flex items-center gap-2 min-w-30 md:min-w-60">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500 bg-primary')}
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
            key: 'aksi' as keyof KategoriWithCount,
            header: 'Aksi',
            align: 'center' as const,
            cell: (row: KategoriWithCount) => (
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
                  onClick={() => setDeleteKategoriTarget(row)}
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
              <IconTag size={18} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Kategori Berita</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Manajemen kategori untuk pengelompokan berita & artikel
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
              <IconTag size={18} className="text-primary" />
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
          icon={<IconNews size={18} className="text-sky-600" />}
          label="Total Berita"
          value={loading ? '—' : totalBerita}
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
                ? `${kategoriTerbanyak.beritaCount} berita`
                : 'Belum ada berita'
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
        <DataTable<KategoriWithCount>
          data={kategoris}
          columns={columns}
          rowKey="id"
          pageSize={10}
          defaultSort={{ key: 'beritaCount', direction: 'desc' }}
          searchFields={['nama']}
          searchPlaceholder="Cari kategori..."
          selectable={isAdmin}
          onBulkDelete={isAdmin ? (keys) => handleBulkDelete(keys as string[]) : undefined}
          emptyMessage="Tidak ada kategori ditemukan."
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
          <ModalTambahKategori
            open={modalTambahOpen}
            onClose={() => setModalTambahOpen(false)}
            onSave={handleSave}
          />

          {editKategori && (
            <ModalEditKategori
              open={!!editKategori}
              onClose={() => setEditKategori(null)}
              kategori={editKategori}
              onUpdate={handleUpdate}
            />
          )}

          {deleteKategoriTarget && (
            <ModalDeleteKategori
              open={!!deleteKategoriTarget}
              onClose={() => setDeleteKategoriTarget(null)}
              kategori={deleteKategoriTarget}
              beritaCount={deleteKategoriTarget.beritaCount}
              onDeleted={(id) => {
                setKategoris((prev) => prev.filter((k) => k.id !== id))
                setDeleteKategoriTarget(null)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
