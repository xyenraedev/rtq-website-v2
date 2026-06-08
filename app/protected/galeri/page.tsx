'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconLoader2,
  IconAlertCircle,
  IconRefresh,
  IconLayoutGrid,
  IconTag,
  IconDimensions,
  IconCalendar,
  IconStack2,
} from '@tabler/icons-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toast } from 'sonner'
import {
  fetchGaleri,
  deleteBulkGaleri,
  formatDimensions,
  type GaleriWithKategori,
  type GaleriImage,
} from '@/lib/galeri'
import { fetchGaleriKategori, type GaleriKategori } from '@/lib/galeri-kategori'
import { DataTable, type ColumnDef } from '@/components/data-table'
import { ModalEditGaleri } from '@/components/protected/galeri/modal-edit-galeri'
import { ModalHapusGaleri } from '@/components/protected/galeri/modal-hapus-galeri'
import { ModalTambahGaleri } from '@/components/protected/galeri/modal-tambah-galeri'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

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
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${accent}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>

          <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>

          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  )
}

function ThumbnailCell({ images, alt }: { images: GaleriImage[]; alt: string }) {
  const [error, setError] = useState(false)

  const firstImage = images?.[0]

  if (!firstImage) {
    return (
      <div className="relative w-14 h-10 rounded-lg border border-border bg-muted/50 overflow-hidden flex items-center justify-center shrink-0">
        <IconPhoto size={16} className="text-muted-foreground opacity-40" />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative w-14 h-10 rounded-lg border border-border bg-muted/50 overflow-hidden flex items-center justify-center shrink-0">
        {!error ? (
          <Image
            src={firstImage.url}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <IconPhoto size={16} className="text-muted-foreground opacity-40" />
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow">
          {images.length}
        </div>
      )}
    </div>
  )
}

export default function GaleriPage() {
  const [galeris, setGaleris] = useState<GaleriWithKategori[]>([])
  const [kategoris, setKategoris] = useState<GaleriKategori[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAdmin, setIsAdmin] = useState(false)

  const [modalTambahOpen, setModalTambahOpen] = useState(false)
  const [editGaleri, setEditGaleri] = useState<GaleriWithKategori | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GaleriWithKategori | null>(null)

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

      const [galeriList, kategoriList] = await Promise.all([fetchGaleri(), fetchGaleriKategori()])

      setGaleris(galeriList)
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

  const totalAlbum = galeris.length
  const totalFoto = galeris.reduce((acc, item) => acc + item.images.length, 0)
  const albumBerkategori = galeris.filter((g) => g.galeri_kategori_id !== null).length
  const totalFotoBerdimensi = galeris.reduce((acc, item) => {
    return acc + item.images.filter((img) => img.width && img.height).length
  }, 0)

  function handleSave(galeri: GaleriWithKategori) {
    setGaleris((prev) => [galeri, ...prev])
  }

  function handleUpdate(updated: GaleriWithKategori) {
    setGaleris((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
  }

  function handleDeleted(id: string) {
    setGaleris((prev) => prev.filter((g) => g.id !== id))
    setDeleteTarget(null)
  }

  async function handleBulkDelete(keys: string[]) {
    const items = galeris
      .filter((g) => keys.includes(g.id))
      .map((g) => ({ id: g.id, images: g.images }))

    try {
      await deleteBulkGaleri(items)

      setGaleris((prev) => prev.filter((g) => !keys.includes(g.id)))

      toast.success(`${keys.length} album berhasil dihapus`, {
        description: 'Semua file storage ikut terhapus.',
      })
    } catch (e: unknown) {
      toast.error('Gagal menghapus data', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const columns: ColumnDef<GaleriWithKategori>[] = [
    {
      key: 'thumbnail',
      header: 'Thumbnail',
      cell: (row) => <ThumbnailCell images={row.images} alt={row.judul || 'foto'} />,
    },

    {
      key: 'judul',
      header: 'Album',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col min-w-0 max-w-xs">
          <span className="font-semibold text-foreground truncate">
            {row.judul || (
              <span className="text-muted-foreground italic font-normal text-xs">Tanpa judul</span>
            )}
          </span>

          {row.deskripsi && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={row.deskripsi}>
              {row.deskripsi}
            </p>
          )}
        </div>
      ),
    },

    {
      key: 'jumlah_foto',
      header: 'Jumlah',
      sortable: true,
      cell: (row) => (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium">
          <IconStack2 size={14} />
          {row.images.length} foto
        </div>
      ),
    },

    {
      key: 'galeri_kategori',
      header: 'Kategori',
      sortable: true,
      cell: (row) => {
        if (!row.galeri_kategori) {
          return <span className="text-xs text-muted-foreground italic">—</span>
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{row.galeri_kategori.nama}</span>
          </span>
        )
      },
    },

    {
      key: 'dimensi',
      header: 'Dimensi',
      cell: (row) => {
        const first = row.images?.[0]
        const dim = formatDimensions(first?.width ?? null, first?.height ?? null)

        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {dim !== '-' ? (
              <>
                <IconDimensions size={12} />
                {dim}
              </>
            ) : (
              <span className="italic">—</span>
            )}
          </span>
        )
      },
    },

    {
      key: 'created_at',
      header: 'Tanggal',
      sortable: true,
      cell: (row) => {
        if (!row.created_at) {
          return <span className="text-xs text-muted-foreground italic">—</span>
        }

        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <IconCalendar size={12} />
            {new Date(row.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )
      },
    },

    ...(isAdmin
      ? [
          {
            key: 'aksi' as keyof GaleriWithKategori,
            header: 'Aksi',
            align: 'center' as const,
            cell: (row: GaleriWithKategori) => (
              <div
                className="flex items-center justify-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setEditGaleri(row)}
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

            <h1 className="text-2xl font-bold text-foreground">Galeri Foto</h1>
          </div>

          <p className="text-sm text-muted-foreground pl-11">Manajemen album galeri website</p>
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
              Tambah Album
            </button>
          )}
        </div>
      </div>

      <hr className="my-4" />

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3">
          <IconAlertCircle size={18} className="shrink-0" />

          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={
            loading ? (
              <IconLoader2 size={18} className="text-primary animate-spin" />
            ) : (
              <IconLayoutGrid size={18} className="text-primary" />
            )
          }
          label="Total Album"
          value={loading ? '—' : totalAlbum}
          sub={`${totalFoto} total foto`}
          accent="bg-primary/10"
        />

        <StatCard
          icon={<IconTag size={18} className="text-violet-600" />}
          label="Album Berkategori"
          value={loading ? '—' : albumBerkategori}
          sub={`${totalAlbum - albumBerkategori} tanpa kategori`}
          accent="bg-violet-100 dark:bg-violet-950"
        />

        <StatCard
          icon={<IconDimensions size={18} className="text-sky-600" />}
          label="Foto Berdimensi"
          value={loading ? '—' : totalFotoBerdimensi}
          sub="Foto memiliki ukuran"
          accent="bg-sky-100 dark:bg-sky-950"
        />

        <StatCard
          icon={<IconLayoutGrid size={18} className="text-emerald-600" />}
          label="Kategori"
          value={loading ? '—' : kategoris.length}
          sub="Kategori tersedia"
          accent="bg-emerald-100 dark:bg-emerald-950"
        />
      </div>

      <DataTable<GaleriWithKategori>
        data={galeris}
        columns={columns}
        rowKey="id"
        pageSize={10}
        defaultSort={{ key: 'created_at', direction: 'desc' }}
        searchFields={['judul', 'deskripsi']}
        searchPlaceholder="Cari album..."
        selectable={isAdmin}
        onBulkDelete={isAdmin ? (keys) => handleBulkDelete(keys as string[]) : undefined}
        emptyMessage="Tidak ada album ditemukan."
      />

      {isAdmin && (
        <>
          <ModalTambahGaleri
            open={modalTambahOpen}
            onClose={() => setModalTambahOpen(false)}
            onSave={handleSave}
            kategoris={kategoris}
          />

          {editGaleri && (
            <ModalEditGaleri
              open={!!editGaleri}
              onClose={() => setEditGaleri(null)}
              galeri={editGaleri}
              onUpdate={handleUpdate}
              kategoris={kategoris}
            />
          )}

          {deleteTarget && (
            <ModalHapusGaleri
              open={!!deleteTarget}
              onClose={() => setDeleteTarget(null)}
              galeri={deleteTarget}
              onDeleted={handleDeleted}
            />
          )}
        </>
      )}
    </div>
  )
}
