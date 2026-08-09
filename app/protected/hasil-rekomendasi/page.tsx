'use client'

import dynamic from 'next/dynamic'
import { IconBrain } from '@tabler/icons-react'
import { useHasilRekomendasi } from '@/hooks/protected/hasil-rekomendasi/useHasilRekomendasi'
import { HasilRekomendasiHeader } from '@/components/protected/hasil-rekomendasi/HasilRekomendasiHeader'
import { HasilRekomendasiFilterBar } from '@/components/protected/hasil-rekomendasi/HasilRekomendasiFilterBar'
import { HasilRekomendasiTable } from '@/components/protected/hasil-rekomendasi/HasilRekomendasiTable'
import { ChartsSkeleton } from '@/components/protected/hasil-rekomendasi/ChartsSkeleton'
import { exportHasilRekomendasiExcel } from '@/lib/hasil-rekomendasi/export'
import { toast } from 'sonner'

// recharts berat — di-split dari initial bundle, hanya di-load saat statistik ada.
const HasilRekomendasiCharts = dynamic(
  () => import('@/components/protected/hasil-rekomendasi/HasilRekomendasiCharts'),
  { ssr: false, loading: () => <ChartsSkeleton /> }
)

// Modal hanya dibutuhkan setelah interaksi user.
const ConfirmModal = dynamic(
  () => import('@/components/shared/ConfirmModal').then((m) => m.ConfirmModal),
  { ssr: false }
)
const DetailModal = dynamic(
  () => import('@/components/protected/hasil-rekomendasi/DetailModal').then((m) => m.DetailModal),
  { ssr: false }
)

export default function HasilRekomendasiPage() {
  const state = useHasilRekomendasi()
  const {
    statistik,
    isAdmin,
    reklasLoading,
    sortedData,
    detailRow,
    setDetailRow,
    confirmReklas,
    setConfirmReklas,
    handleReklasifikasiSemua,
  } = state

  async function handleExport() {
    try {
      await exportHasilRekomendasiExcel(sortedData, statistik)
      toast.success('Laporan Excel berhasil diekspor')
    } catch {
      toast.error('Gagal mengekspor laporan')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        <HasilRekomendasiHeader
          isAdmin={isAdmin}
          reklasLoading={reklasLoading}
          onExport={handleExport}
          onReklasClick={() => setConfirmReklas(true)}
        />

        {statistik ? <HasilRekomendasiCharts statistik={statistik} /> : <ChartsSkeleton />}

        <HasilRekomendasiFilterBar state={state} />

        <HasilRekomendasiTable state={state} />
      </div>

      {isAdmin && confirmReklas && (
        <ConfirmModal
          title="Jalankan Ulang Klasifikasi?"
          description="Proses ini akan mengklasifikasi ulang semua santri aktif menggunakan model Decision Tree. Data rekomendasi sebelumnya akan diperbarui."
          confirmLabel="Ya, Jalankan"
          confirmClassName="bg-primary hover:bg-primary/90"
          icon={<IconBrain size={24} className="text-amber-600 dark:text-amber-400" />}
          onConfirm={handleReklasifikasiSemua}
          onCancel={() => setConfirmReklas(false)}
        />
      )}

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}
