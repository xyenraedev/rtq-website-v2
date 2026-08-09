import { IconChartBar, IconDownload, IconBrain, IconRefresh } from '@tabler/icons-react'

export function HasilRekomendasiHeader({
  isAdmin,
  reklasLoading,
  onExport,
  onReklasClick,
}: {
  isAdmin: boolean
  reklasLoading: boolean
  onExport: () => void
  onReklasClick: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <IconChartBar size={24} className="text-primary" />
          Hasil Rekomendasi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hasil klasifikasi BBK/TBBK seluruh santri oleh model Decision Tree
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <IconDownload size={15} />
          Ekspor Excel
        </button>
        {isAdmin && (
          <button
            onClick={onReklasClick}
            disabled={reklasLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {reklasLoading ? (
              <IconRefresh size={15} className="animate-spin" />
            ) : (
              <IconBrain size={15} />
            )}
            Jalankan Ulang Klasifikasi
          </button>
        )}
      </div>
    </div>
  )
}
