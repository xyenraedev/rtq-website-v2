'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconAlertCircle,
  IconRefresh,
  IconChevronRight,
  IconUsers,
  IconUserCheck,
  IconBriefcase,
  IconCalendar,
  IconUser,
  IconFilter,
} from '@tabler/icons-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toast } from 'sonner'
import Image from 'next/image'

import { fetchGuru, deleteBulkGuru, type Guru } from '@/lib/guru'

import { DataTable, type ColumnDef } from '@/components/data-table'
import { ModalEditGuru } from '@/components/protected/guru/modal-edit-guru'
import { ModalHapusGuru } from '@/components/protected/guru/modal-hapus-guru'
import { ModalTambahGuru } from '@/components/protected/guru/modal-tambah-guru'

// ─── Utils ────────────────────────────────────────────────────────────────────

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Avatar Cell ──────────────────────────────────────────────────────────────

function AvatarCell({ src, name }: { src: string | null; name: string | null }) {
  const [error, setError] = useState(false)

  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="relative w-10 h-10 rounded-full border-2 border-border bg-muted/50 overflow-hidden flex items-center justify-center shrink-0">
      {src && !error ? (
        <Image
          src={src}
          alt={name ?? 'foto guru'}
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-xs font-bold text-muted-foreground">{initials}</span>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  ctaLabel,
  onCtaClick,
  ctaVariant = 'ghost',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  accent: string
  ctaLabel?: string
  onCtaClick?: () => void
  ctaVariant?: 'ghost' | 'outline' | 'default'
}) {
  const ctaStyles = {
    ghost: 'text-primary hover:bg-primary/10',
    outline: 'border border-input hover:bg-muted text-foreground',
    default: 'bg-primary text-primary-foreground hover:opacity-90',
  }

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

          <p className="text-2xl font-bold text-foreground leading-tight wrap-break-word">{value}</p>

          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>

        {ctaLabel && onCtaClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCtaClick()
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 mt-1 ${ctaStyles[ctaVariant]}`}
          >
            {ctaLabel}

            <IconChevronRight
              size={14}
              className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            />
          </button>
        )}
      </div>

      {/* Mobile */}
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

            <p className="text-lg font-bold text-foreground leading-tight wrap-break-word">{value}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">{sub}</p>

          {ctaLabel && onCtaClick && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCtaClick()
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors shrink-0 ${ctaStyles[ctaVariant]}`}
            >
              {ctaLabel}
              <IconChevronRight size={12} className="opacity-70" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuruPage() {
  const [gurus, setGurus] = useState<Guru[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter jabatan
  const [filterJabatan, setFilterJabatan] = useState<string>('all')

  // Modals
  const [modalTambahOpen, setModalTambahOpen] = useState(false)
  const [editGuru, setEditGuru] = useState<Guru | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Guru | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const list = await fetchGuru()

      // Urutkan berdasarkan ID terkecil → terbesar
      const sorted = [...list].sort((a, b) => a.id - b.id)

      setGurus(sorted)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalGuru = gurus.length
  const guruWithFoto = gurus.filter((g) => g.image_url).length
  const guruWithJabatan = gurus.filter((g) => g.jabatan).length

  // Unique jabatan list
  const jabatanList = Array.from(
    new Set(gurus.map((g) => g.jabatan).filter(Boolean) as string[])
  ).sort()

  // ── Filtered Data ───────────────────────────────────────────────────────────

  const filteredGurus =
    filterJabatan === 'all'
      ? gurus
      : filterJabatan === 'no-jabatan'
        ? gurus.filter((g) => !g.jabatan)
        : gurus.filter((g) => g.jabatan === filterJabatan)

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleSave(guru: Guru) {
    setGurus((prev) => [...prev, guru].sort((a, b) => a.id - b.id))
  }

  function handleUpdate(updated: Guru) {
    setGurus((prev) =>
      prev.map((g) => (g.id === updated.id ? updated : g)).sort((a, b) => a.id - b.id)
    )
  }

  function handleDeleted(id: number) {
    setGurus((prev) => prev.filter((g) => g.id !== id))
    setDeleteTarget(null)
  }

  async function handleBulkDelete(keys: (string | number)[]) {
    try {
      const selected = gurus.filter((g) => keys.includes(g.id))

      await deleteBulkGuru(
        selected.map((g) => ({
          id: g.id,
          imageUrl: g.image_url,
        }))
      )

      setGurus((prev) => prev.filter((g) => !keys.includes(g.id)))

      toast.success(`${keys.length} guru berhasil dihapus`)
    } catch (e: unknown) {
      toast.error('Gagal menghapus beberapa guru', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: ColumnDef<Guru>[] = [
    {
      key: 'avatar',
      header: 'Foto',
      cell: (row) => <AvatarCell src={row.image_url} name={row.nama} />,
    },

    {
      key: 'nama',
      header: 'Nama Guru',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-foreground truncate">{row.nama}</span>
        </div>
      ),
    },

    {
      key: 'jabatan',
      header: 'Jabatan',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-secondary/50 border-border dark:bg-white/5 dark:border-white/10">
          {row.jabatan}
        </span>
      ),
    },

    {
      key: 'created_at',
      header: 'Tgl Dibuat',
      sortable: true,
      cell: (row) => {
        const date = new Date(row.created_at)

        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <IconCalendar size={12} />

            {date.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )
      },
    },

    {
      key: 'updated_at',
      header: 'Tgl Diperbarui',
      sortable: true,
      cell: (row) => {
        if (!row.updated_at) {
          return <span className="text-xs text-muted-foreground italic">—</span>
        }

        const date = new Date(row.updated_at)

        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <IconCalendar size={12} />

            {date.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        )
      },
    },

    {
      key: 'aksi',
      header: 'Aksi',
      align: 'center',
      cell: (row) => (
        <div
          className="flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditGuru(row)}
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <IconUsers size={18} className="text-primary-foreground" />
            </div>

            <h1 className="text-2xl font-bold text-foreground">Data Guru</h1>
          </div>

          <p className="text-sm text-muted-foreground pl-11">
            Manajemen data guru &amp; tenaga pendidik sekolah
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

          <button
            onClick={() => setModalTambahOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <IconPlus size={17} />
            Tambah Guru
          </button>
        </div>
      </div>

      <hr className="my-4" />

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3">
          <IconAlertCircle size={18} className="shrink-0" />

          <span className="text-sm font-medium">{error}</span>

          <button onClick={loadData} className="ml-auto text-xs underline hover:no-underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={
            loading ? (
              <IconLoader2 size={18} className="text-primary animate-spin" />
            ) : (
              <IconUsers size={18} className="text-primary" />
            )
          }
          label="Total Guru"
          value={loading ? '—' : totalGuru}
          sub="Semua tenaga pendidik"
          accent="bg-primary/10"
        />

        <StatCard
          icon={<IconBriefcase size={18} className="text-violet-600" />}
          label="Punya Jabatan"
          value={loading ? '—' : guruWithJabatan}
          sub={loading ? '' : 'Semua guru memiliki jabatan'}
          accent="bg-violet-100 dark:bg-violet-950"
        />

        <StatCard
          icon={<IconUserCheck size={18} className="text-emerald-600" />}
          label="Punya Foto"
          value={loading ? '—' : guruWithFoto}
          sub={loading ? '' : 'Semua guru memiliki foto'}
          accent="bg-emerald-100 dark:bg-emerald-950"
        />

        <StatCard
          icon={<IconUser size={18} className="text-sky-600" />}
          label="Jabatan Unik"
          value={loading ? '—' : jabatanList.length}
          sub="Total jenis jabatan"
          accent="bg-sky-100 dark:bg-sky-950"
        />
      </div>

      {/* Table */}
      {loading && gurus.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <IconLoader2 size={20} className="animate-spin" />

          <span className="text-sm">Memuat data guru...</span>
        </div>
      ) : (
        <DataTable<Guru>
          data={filteredGurus}
          columns={columns}
          rowKey="id"
          pageSize={10}
          defaultSort={{ key: 'id', direction: 'asc' }}
          searchFields={['nama', 'jabatan']}
          searchPlaceholder="Cari guru berdasarkan nama atau jabatan..."
          selectable
          onBulkDelete={(keys) => handleBulkDelete(keys as number[])}
          emptyMessage="Tidak ada data guru ditemukan."
          toolbarExtra={
            <span className="text-xs text-muted-foreground">
              Menampilkan{' '}
              <span className="font-semibold text-foreground">{filteredGurus.length}</span> dari{' '}
              <span className="font-semibold text-foreground">{totalGuru}</span> guru
            </span>
          }
        />
      )}

      {/* Modals */}
      <ModalTambahGuru
        open={modalTambahOpen}
        onClose={() => setModalTambahOpen(false)}
        onSave={handleSave}
      />

      {editGuru && (
        <ModalEditGuru
          open={!!editGuru}
          onClose={() => setEditGuru(null)}
          guru={editGuru}
          onUpdate={handleUpdate}
        />
      )}

      {deleteTarget && (
        <ModalHapusGuru
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          guru={deleteTarget}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
