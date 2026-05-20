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
  IconChevronRight,
  IconFileText,
  IconHourglass,
  IconCircleCheck,
} from '@tabler/icons-react'
import { DataTable, type ColumnDef, type DataTableFilter } from '@/components/data-table'
import { ModalTambahBerita } from '@/components/protected/berita/modal-tambah-berita'
import { ModalEditBerita } from '@/components/protected/berita/modal-edit-berita'
import { ModalDeleteBerita } from '@/components/protected/berita/modal-delete-berita'
import { fetchBerita, deleteBulkBerita, type Berita, type BeritaKategori } from '@/lib/berita'
import { toast } from 'sonner'
import { fetchKategori } from '@/lib/berita-kategori'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  accent: string
  ctaLabel?: string
  onCtaClick?: () => void
  ctaVariant?: 'ghost' | 'outline' | 'default'
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  ctaLabel,
  onCtaClick,
  ctaVariant = 'ghost',
}: StatCardProps) {
  const ctaStyles: Record<string, string> = {
    ghost: 'text-primary hover:bg-primary/10',
    outline: 'border border-input hover:bg-muted text-foreground',
    default: 'bg-primary text-primary-foreground hover:opacity-90',
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
      {/* ── Desktop Layout ── */}
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

      {/* ── Mobile Layout ── */}
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

export default function BeritaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<Berita[]>([])
  const [kategoris, setKategoris] = useState<BeritaKategori[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editBerita, setEditBerita] = useState<Berita | null>(null)
  const [deleteBeritaTarget, setDeleteBeritaTarget] = useState<Berita | null>(null)
  const [externalFilter, setExternalFilter] = useState<Record<string, string>>({})

  const handleManageDraft = () => {
    setExternalFilter({ status: 'draft' })
  }

  function handleUpdate(updated: Berita) {
    setData((d) => d.map((b) => (b.id === updated.id ? updated : b)))
  }

  function handleDeleted(id: string) {
    setData((d) => d.filter((b) => b.id !== id))
  }

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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
    if (!editId || data.length === 0) return

    const target = data.find((b) => b.id === editId)
    if (!target) return

    setEditBerita(target)
    router.replace('/protected/berita', { scroll: false })
  }, [searchParams, data, router])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const publishedCount = data.filter((b) => b.status === 'published').length
  const draftCount = data.length - publishedCount
  const avgWaktuBaca = data.length
    ? Math.round(data.reduce((a, b) => a + b.waktu_baca, 0) / data.length)
    : 0

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentCount = data.filter((b) => new Date(b.created_at) >= sevenDaysAgo).length

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleBulkDelete(keys: string[]) {
    try {
      await deleteBulkBerita(keys)
      setData((d) => d.filter((b) => !keys.includes(b.id)))
      toast.success(`${keys.length} berita berhasil dihapus`)
    } catch (e: unknown) {
      toast.error('Gagal menghapus beberapa berita', {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  function handleSave(berita: Berita) {
    setData((d) => [berita, ...d])
  }

  // ── Dynamic filter options ─────────────────────────────────────────────────

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

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: ColumnDef<Berita>[] = [
    {
      key: 'judul',
      header: 'Judul',
      sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <span className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
            {row.judul}
          </span>
          {row.ringkasan && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{row.ringkasan}</p>
          )}
        </div>
      ),
    },
    {
      key: 'kategori_id',
      header: 'Kategori',
      cell: (row) => {
        const nama = row.berita_kategori?.nama ?? '-'
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-secondary/50 border-border text-foreground dark:bg-white/5 dark:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{nama}</span>
          </span>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Tanggal Dibuat',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
          <IconCalendar size={13} />
          {formatTanggal(row.created_at)}
        </span>
      ),
    },
    {
      key: 'waktu_baca',
      header: 'Waktu Baca',
      sortable: true,
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
          <IconClock size={13} />
          {row.waktu_baca} menit
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            row.status === 'published'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-secondary text-muted-foreground border-border'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.status === 'published' ? 'bg-emerald-500' : 'bg-muted-foreground'
            }`}
          />
          {row.status === 'published' ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Aksi',
      align: 'center',
      cell: (row) => (
        <div
          className="flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditBerita(row)}
            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            title="Edit"
          >
            <IconEdit size={15} />
          </button>
          <button
            onClick={() => setDeleteBeritaTarget(row)}
            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            title="Hapus"
          >
            <IconTrash size={15} />
          </button>
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <IconNews size={18} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Kelola Berita</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-11">
            Manajemen konten berita &amp; artikel pesantren
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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <IconPlus size={17} />
            Tambah Baru
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
              <IconFileText size={18} className="text-primary" />
            )
          }
          label="Total Berita"
          value={loading ? '—' : data.length}
          sub="Semua kategori"
          accent="bg-primary/10"
        />
        <StatCard
          icon={<IconCircleCheck size={18} className="text-emerald-600" />}
          label="Published"
          value={loading ? '—' : publishedCount}
          sub={loading ? '' : `dari ${data.length} total berita`}
          accent="bg-emerald-100 dark:bg-emerald-950"
        />
        <StatCard
          icon={<IconBookmark size={18} className="text-amber-600" />}
          label="Draft"
          value={loading ? '—' : draftCount}
          sub={loading ? '' : `${draftCount} belum diterbitkan`}
          accent="bg-amber-100 dark:bg-amber-950"
          ctaLabel="Kelola"
          onCtaClick={handleManageDraft}
          ctaVariant="outline"
        />
        <StatCard
          icon={<IconHourglass size={18} className="text-sky-600" />}
          label="Rata-rata Baca"
          value={loading ? '—' : `${avgWaktuBaca} mnt`}
          sub={loading ? '' : `${recentCount} artikel baru minggu ini`}
          accent="bg-sky-100 dark:bg-sky-950"
        />
      </div>

      {/* Table */}
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <IconLoader2 size={20} className="animate-spin" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : (
        <DataTable<Berita>
          data={data}
          columns={columns}
          rowKey="id"
          pageSize={10}
          searchFields={['judul', 'ringkasan']}
          searchPlaceholder="Cari berita..."
          filters={tableFilters}
          selectable
          onBulkDelete={(keys) => handleBulkDelete(keys as string[])}
          emptyMessage="Tidak ada berita ditemukan."
          toolbarExtra={
            <span className="text-xs text-muted-foreground">
              Total <span className="font-semibold text-foreground">{data.length}</span> berita
            </span>
          }
          externalFilter={externalFilter}
        />
      )}

      {/* Modals */}
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
    </div>
  )
}
