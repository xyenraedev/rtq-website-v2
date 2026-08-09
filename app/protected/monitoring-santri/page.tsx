'use client'

import dynamic from 'next/dynamic'
import { IconTrash, IconUserCheck } from '@tabler/icons-react'
import { useMonitoringSantri } from '@/hooks/protected/monitoring-santri/useMonitoringSantri'
import { MonitoringSantriHeader } from '@/components/protected/monitoring-santri/MonitoringSantriHeader'
import { MonitoringSantriStats } from '@/components/protected/monitoring-santri/MonitoringSantriStats'
import { MonitoringSantriFilterBar } from '@/components/protected/monitoring-santri/MonitoringSantriFilterBar'
import { MonitoringSantriTable } from '@/components/protected/monitoring-santri/MonitoringSantriTable'
import { MonitoringSantriUpdateBanner } from '@/components/protected/monitoring-santri/MonitoringSantriUpdateBanner'

const SantriForm = dynamic(
  () => import('@/components/protected/monitoring-santri/SantriForm').then((m) => m.SantriForm),
  { ssr: false }
)
const SantriDetailModal = dynamic(
  () =>
    import('@/components/protected/monitoring-santri/SantriDetailModal').then(
      (m) => m.SantriDetailModal
    ),
  { ssr: false }
)
const ConfirmModal = dynamic(
  () => import('@/components/protected/monitoring-santri/ConfirmModal').then((m) => m.ConfirmModal),
  { ssr: false }
)

export default function MonitoringSantriPage() {
  const state = useMonitoringSantri()
  const {
    santriList,
    stats,
    loading,
    isAdmin,
    loadData,
    showForm,
    editSantri,
    editProgressList,
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
    existingNomorIndukList,
    suggestedNomorInduk,
    lastUpdated,
    handleFormSaved,
    dismissLastUpdated,
  } = state

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 space-y-6">
      <MonitoringSantriHeader
        loading={loading}
        isAdmin={isAdmin}
        onRefresh={loadData}
        onTambah={openCreate}
      />

      <MonitoringSantriStats stats={stats} santriList={santriList} loading={loading} />

      <MonitoringSantriFilterBar state={state} />

      <MonitoringSantriUpdateBanner info={lastUpdated} onDismiss={dismissLastUpdated} />

      <MonitoringSantriTable state={state} />

      {isAdmin && showForm && (
        <SantriForm
          initial={editSantri}
          progressList={editProgressList}
          existingNomorIndukList={existingNomorIndukList}
          suggestedNomorInduk={suggestedNomorInduk}
          onClose={closeForm}
          onSaved={handleFormSaved}
        />
      )}

      {detailSantri && (
        <SantriDetailModal
          santri={detailSantri}
          isAdmin={isAdmin}
          onClose={() => setDetailSantri(null)}
          onRequestDelete={() => setConfirmDelete({ id: detailSantri.id, nama: detailSantri.nama })}
        />
      )}

      {isAdmin && confirmDelete && (
        <ConfirmModal
          title={`Hapus santri "${confirmDelete.nama}"?`}
          description="Tindakan ini tidak dapat dibatalkan. Seluruh data progress dan riwayat klasifikasi santri ini akan ikut terhapus."
          confirmLabel="Ya, Hapus"
          confirmClassName="bg-red-500 hover:bg-red-600"
          icon={<IconTrash size={22} className="text-red-500" />}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {isAdmin && confirmReklas && (
        <ConfirmModal
          title={`Klasifikasi ulang "${confirmReklas.nama}"?`}
          description="Model akan menjalankan ulang klasifikasi BBK/TBBK berdasarkan data progress aktif santri ini."
          confirmLabel="Ya, Jalankan"
          confirmClassName="bg-primary hover:bg-primary/90"
          icon={<IconUserCheck size={22} className="text-amber-600 dark:text-amber-400" />}
          onConfirm={handleReklasifikasi}
          onCancel={() => setConfirmReklas(null)}
        />
      )}
    </div>
  )
}
