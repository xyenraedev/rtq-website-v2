'use client'

import dynamic from 'next/dynamic'
import {
  IconSettings,
  IconRotateClockwise,
  IconCheck,
  IconAlertTriangle,
  IconBrain,
  IconHistory,
  IconInfoCircle,
  IconX,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { useAturanCapaian } from '@/hooks/protected/aturan-capaian/useAturanCapaian'
import { namaModel } from '@/lib/aturan-capaian/helpers'
import { SliderInput } from '@/components/protected/aturan-capaian/slider-input'
import { RiwayatCard } from '@/components/protected/aturan-capaian/riwayat-card'
import { ModelReportSkeleton } from '@/components/protected/aturan-capaian/ModelReportSkeleton'

// Modal & dialog proses hanya dibutuhkan setelah interaksi user — di-split
// dari initial bundle supaya initial JS lebih kecil.
const ModalSimpan = dynamic(
  () => import('@/components/protected/aturan-capaian/ModalSimpan').then((m) => m.ModalSimpan),
  { ssr: false }
)
const ModalReset = dynamic(
  () => import('@/components/protected/aturan-capaian/ModalReset').then((m) => m.ModalReset),
  { ssr: false }
)
const ModalDetail = dynamic(
  () => import('@/components/protected/aturan-capaian/ModalDetail').then((m) => m.ModalDetail),
  { ssr: false }
)
const ModalDelete = dynamic(
  () => import('@/components/protected/aturan-capaian/ModalDelete').then((m) => m.ModalDelete),
  { ssr: false }
)
const ModalSetAktif = dynamic(
  () => import('@/components/protected/aturan-capaian/ModalSetAktif').then((m) => m.ModalSetAktif),
  { ssr: false }
)
const ProcessDialog = dynamic(
  () => import('@/components/protected/aturan-capaian/process-dialog').then((m) => m.ProcessDialog),
  { ssr: false }
)

// Laporan model berat (banyak sub-tabel + next/image) — dipisah dari
// initial bundle, tidak butuh untuk First Contentful Paint.
const ModelReportSection = dynamic(
  () =>
    import('@/components/protected/aturan-capaian/ModelReportSection').then(
      (m) => m.ModelReportSection
    ),
  { ssr: false, loading: () => <ModelReportSkeleton /> }
)

export default function AturanCapaianPage() {
  const state = useAturanCapaian()
  const {
    aturan,
    riwayat,
    loading,
    evaluasi,
    activeModal,
    setActiveModal,
    selectedRiwayat,
    closeModal,

    processOpen,
    processConfig,
    processEvaluasi,
    closeProcess,

    showAllModels,
    toggleShowAllModels,
    sortedRiwayat,
    displayedRiwayat,

    formValues,
    hasChanges,
    formIsDuplikat,
    canSimpan,
    isDefaultConfig,
    handleSliderChange,

    eksekusiSimpan,
    eksekusiReset,
    eksekusiDelete,
    eksekusiSetAktif,
    eksekusiLatihUlangSaja,

    openDetail,
    openSetAktif,
    openDeleteFromDetail,
  } = state

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <IconSettings size={24} className="text-primary" />
            Aturan Capaian
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi parameter batas yang digunakan model Decision Tree untuk klasifikasi
            BBK/TBBK
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm">
          <IconInfoCircle size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Cara Kerja Aturan</p>
            <p className="text-muted-foreground text-xs mt-1">
              Santri diklasifikasikan sebagai <strong>BBK</strong> apabila durasi penyelesaian pada
              jilid aktif melebihi batas, atau pengulangan taskih aktif melebihi batas. Sebaliknya
              diklasifikasikan sebagai <strong>TBBK</strong>.
            </p>
          </div>
        </div>

        {/* Peringatan duplikat */}
        {hasChanges && formIsDuplikat && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
            <IconX size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Konfigurasi Ini Sudah Pernah Digunakan
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Nilai yang Anda masukkan sudah ada di riwayat. Ubah minimal satu parameter untuk
                dapat menyimpan aturan baru.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Form & Laporan ──────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Parameter Batas</h2>
              {hasChanges && !formIsDuplikat && (
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Ada perubahan belum disimpan
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <SliderInput
                  label="Batas Durasi Jilid 0–4"
                  name="batas_durasi_jilid_0_4"
                  value={formValues.batas_durasi_jilid_0_4}
                  min={1}
                  max={12}
                  step={0.5}
                  unit="bulan"
                  description="Batas maksimal waktu penyelesaian untuk Jilid 0 sampai 4"
                  onChange={handleSliderChange}
                />
                <SliderInput
                  label="Batas Durasi Jilid 5–6"
                  name="batas_durasi_jilid_5_6"
                  value={formValues.batas_durasi_jilid_5_6}
                  min={1}
                  max={12}
                  step={0.5}
                  unit="bulan"
                  description="Batas maksimal untuk Jilid 5 dan 6 (lebih tinggi karena lebih sulit)"
                  onChange={handleSliderChange}
                />
                <SliderInput
                  label="Batas Pengulangan Taskih"
                  name="batas_pengulangan_taskih"
                  value={formValues.batas_pengulangan_taskih}
                  min={1}
                  max={10}
                  step={1}
                  unit="kali"
                  description="Batas maksimal pengulangan ujian taskih"
                  onChange={handleSliderChange}
                />
              </div>
            )}

            {hasChanges && !formIsDuplikat && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-xl border border-border">
                <IconBrain size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Konfigurasi baru akan dilatih sebagai model baru saat disimpan.
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveModal('reset')}
                disabled={loading || isDefaultConfig}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconRotateClockwise size={15} />
                Reset Default
              </button>

              <button
                onClick={() => setActiveModal('simpan')}
                disabled={loading || !canSimpan}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm ml-auto"
              >
                <IconCheck size={15} />
                Simpan Pengaturan
              </button>
            </div>

            <ModelReportSection
              latestEvaluasi={evaluasi}
              modelVersi={aturan?.model_versi ?? undefined}
            />
          </div>

          {/* ── Sidebar ──────────────────── */}
          <div className="space-y-4">
            {aturan && (
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Model Aktif
                  </h3>
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Sedang Digunakan
                  </Badge>
                </div>
                <p className="text-xs font-mono font-semibold text-foreground break-all">
                  {namaModel(aturan.model_versi)}
                </p>
                <div className="space-y-1.5 pt-1">
                  {[
                    { label: 'Batas Jilid 0–4', value: `${aturan.batas_durasi_jilid_0_4} bulan` },
                    { label: 'Batas Jilid 5–6', value: `${aturan.batas_durasi_jilid_5_6} bulan` },
                    { label: 'Batas Taskih', value: `${aturan.batas_pengulangan_taskih}×` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <IconHistory size={13} />
                Semua Model ({sortedRiwayat.length})
              </h3>

              {riwayat.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Belum ada riwayat model.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayedRiwayat.map((r, i) => (
                    <RiwayatCard
                      key={r.id}
                      r={r}
                      index={i}
                      onDetail={openDetail}
                      onSetAktif={openSetAktif}
                    />
                  ))}
                  {sortedRiwayat.length > 3 && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="italic text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
                        onClick={toggleShowAllModels}
                      >
                        {showAllModels ? (
                          <>
                            <ArrowLeft size={14} />
                            <span>Sembunyikan</span>
                          </>
                        ) : (
                          <>
                            <span>Lihat {sortedRiwayat.length - 3} model lainnya</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <IconAlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-xs leading-5 text-amber-700 dark:text-amber-400">
                Setiap kali aturan disimpan atau model diaktifkan, sistem akan
                <strong> melatih ulang model secara otomatis </strong>
                dan melakukan klasifikasi ulang terhadap seluruh data santri agar hasil rekomendasi
                selalu menggunakan model terbaru.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Process Dialog ══ */}
      <ProcessDialog
        open={processOpen}
        config={processConfig}
        evaluasi={processEvaluasi}
        onClose={closeProcess}
      />

      {/* ══ Modals ══ */}
      <ModalSimpan
        open={activeModal === 'simpan'}
        onClose={() => setActiveModal(null)}
        onConfirm={eksekusiSimpan}
        aturan={aturan}
        formValues={formValues}
      />

      <ModalReset
        open={activeModal === 'reset'}
        onClose={() => setActiveModal(null)}
        onConfirm={eksekusiReset}
        aturan={aturan}
      />

      <ModalDetail
        open={activeModal === 'detail' && selectedRiwayat != null}
        selectedRiwayat={selectedRiwayat}
        onClose={closeModal}
        onSetAktif={openSetAktif}
        onLatihUlang={(item) => eksekusiLatihUlangSaja(item)}
        onDelete={openDeleteFromDetail}
      />

      <ModalDelete
        open={activeModal === 'delete' && selectedRiwayat != null}
        selectedRiwayat={selectedRiwayat}
        onClose={closeModal}
        onConfirm={eksekusiDelete}
      />

      <ModalSetAktif
        open={activeModal === 'set-aktif' && selectedRiwayat != null}
        selectedRiwayat={selectedRiwayat}
        aturan={aturan}
        onClose={closeModal}
        onConfirm={eksekusiSetAktif}
      />
    </div>
  )
}
