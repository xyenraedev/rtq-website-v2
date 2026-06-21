'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  IconBrain,
  IconRefresh,
  IconChartBar,
  IconTable,
  IconSettings2,
  IconAward,
  IconTargetArrow,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChartPie,
  IconExternalLink,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  fetchModelReport,
  getTreeImageUrl,
  type ModelReport,
  type FeatureImportanceRow,
  type GridSearchRow,
} from '@/lib/ml-services/ml-report'
import type { EvaluasiResult } from '@/lib/ml-services/aturan-capaian'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ModelReportSectionProps {
  /** Evaluasi segar dari proses latih ulang (opsional, override tampilan sementara) */
  latestEvaluasi?: EvaluasiResult | null
  /** Versi model aktif dari DB — trigger auto-fetch saat berubah */
  modelVersi?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pct(v: number, decimals = 2): string {
  return `${(v * 100).toFixed(decimals)}%`
}

function fmt(v: number, decimals = 4): string {
  return v.toFixed(decimals)
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function SubHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-semibold text-foreground">{title}</span>
    </div>
  )
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[11px]">{children}</table>
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        'px-3 py-2 bg-muted/60 text-muted-foreground font-semibold whitespace-nowrap border-b border-border',
        right ? 'text-right' : 'text-left'
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  right,
  mono,
  primary,
}: {
  children: React.ReactNode
  right?: boolean
  mono?: boolean
  primary?: boolean
}) {
  return (
    <td
      className={cn(
        'px-3 py-2 border-b border-border last:border-0',
        right && 'text-right',
        mono && 'font-mono tabular-nums',
        primary && 'font-semibold text-primary'
      )}
    >
      {children}
    </td>
  )
}

function Skeleton({ h = 'h-8' }: { h?: string }) {
  return <div className={cn('bg-muted animate-pulse rounded-lg w-full', h)} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric strip (4 metrik sejajar)
// ─────────────────────────────────────────────────────────────────────────────

function MetricStrip({ evaluasi }: { evaluasi: ModelReport['evaluasi'] }) {
  const items = [
    { label: 'Akurasi', value: evaluasi.akurasi, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Presisi', value: evaluasi.presisi, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Recall', value: evaluasi.recall, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'F1-Score', value: evaluasi.f1_score, color: 'text-amber-600 dark:text-amber-400' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((m) => (
        <div
          key={m.label}
          className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-border"
        >
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {m.label}
          </span>
          <span className={cn('text-xl font-bold tabular-nums', m.color)}>{pct(m.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible panel
// ─────────────────────────────────────────────────────────────────────────────

function CollapsePanel({
  label,
  defaultOpen = false,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-foreground">{label}</span>
        {open ? (
          <IconChevronUp size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <IconChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Konfigurasi Parameter Model
// ─────────────────────────────────────────────────────────────────────────────

function ParamTable({ params }: { params: ModelReport['model_params'] }) {
  const rows = [
    { p: 'criterion', v: params.criterion, k: 'Kriteria split (Gini Index)' },
    { p: 'max_depth', v: String(params.max_depth), k: 'Kedalaman maksimal pohon' },
    { p: 'min_samples_split', v: String(params.min_samples_split), k: 'Min sampel untuk split' },
    { p: 'min_samples_leaf', v: String(params.min_samples_leaf), k: 'Min sampel pada daun' },
    { p: 'class_weight', v: params.class_weight, k: 'Penyeimbang bobot kelas' },
    { p: 'random_state', v: String(params.random_state), k: 'Seed reproduksibilitas' },
  ]
  return (
    <CollapsePanel label="Konfigurasi Parameter Model">
      <SubHeading icon={<IconSettings2 size={13} />} title="Parameter Model Decision Tree" />
      <TableWrap>
        <thead>
          <tr>
            <Th>Parameter</Th>
            <Th>Nilai</Th>
            <Th>Keterangan</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p} className="hover:bg-muted/20 transition-colors">
              <Td mono>{r.p}</Td>
              <Td primary>{r.v}</Td>
              <Td>{r.k}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Hasil Grid Search
// ─────────────────────────────────────────────────────────────────────────────

function GridSearchTable({ rows }: { rows: GridSearchRow[] }) {
  return (
    <CollapsePanel label="Hasil Grid Search">
      <SubHeading icon={<IconAward size={13} />} title="10 Kombinasi Parameter Terbaik" />
      <TableWrap>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Criterion</Th>
            <Th right>Depth</Th>
            <Th right>Min Split</Th>
            <Th right>Min Leaf</Th>
            <Th right>CV Score</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.rank}
              className={cn(
                'transition-colors',
                r.rank === 1 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/20'
              )}
            >
              <Td>
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold',
                    r.rank === 1
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {r.rank}
                </span>
              </Td>
              <Td mono>{r.criterion}</Td>
              <Td right mono>
                {r.max_depth}
              </Td>
              <Td right mono>
                {r.min_samples_split}
              </Td>
              <Td right mono>
                {r.min_samples_leaf}
              </Td>
              <Td right primary={r.rank === 1}>
                <span className={cn('font-mono tabular-nums', r.rank === 1 && 'font-bold')}>
                  {fmt(r.cv_score)}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Distribusi Dataset
// ─────────────────────────────────────────────────────────────────────────────

function DatasetSplitTable({ split }: { split: ModelReport['dataset_split'] }) {
  const bbkPctTrain = split.train_total > 0 ? (split.train_bbk / split.train_total) * 100 : 0
  const tbbkPctTrain = split.train_total > 0 ? (split.train_tbbk / split.train_total) * 100 : 0
  const bbkPctTest = split.test_total > 0 ? (split.test_bbk / split.test_total) * 100 : 0
  const tbbkPctTest = split.test_total > 0 ? (split.test_tbbk / split.test_total) * 100 : 0
  const totalBBK = split.train_bbk + split.test_bbk
  const totalTBBK = split.train_tbbk + split.test_tbbk

  return (
    <CollapsePanel label="Distribusi Dataset">
      <SubHeading icon={<IconTable size={13} />} title="Stratified Split 80:20" />
      <TableWrap>
        <thead>
          <tr>
            <Th>Bagian</Th>
            <Th right>Total</Th>
            <Th right>BBK</Th>
            <Th right>TBBK</Th>
            <Th right>Rasio</Th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-muted/20 transition-colors">
            <Td>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                Data Latih (80%)
              </span>
            </Td>
            <Td right mono>
              {split.train_total}
            </Td>
            <Td right mono>
              {split.train_bbk} ({bbkPctTrain.toFixed(1)}%)
            </Td>
            <Td right mono>
              {split.train_tbbk} ({tbbkPctTrain.toFixed(1)}%)
            </Td>
            <Td right mono>
              ≈{Math.round(bbkPctTrain)}:{Math.round(tbbkPctTrain)}
            </Td>
          </tr>
          <tr className="hover:bg-muted/20 transition-colors">
            <Td>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Data Uji (20%)
              </span>
            </Td>
            <Td right mono>
              {split.test_total}
            </Td>
            <Td right mono>
              {split.test_bbk} ({bbkPctTest.toFixed(1)}%)
            </Td>
            <Td right mono>
              {split.test_tbbk} ({tbbkPctTest.toFixed(1)}%)
            </Td>
            <Td right mono>
              ≈{Math.round(bbkPctTest)}:{Math.round(tbbkPctTest)}
            </Td>
          </tr>
          <tr className="bg-muted/30 font-semibold">
            <Td>Total</Td>
            <Td right primary>
              {split.total}
            </Td>
            <Td right mono>
              {totalBBK}
            </Td>
            <Td right mono>
              {totalTBBK}
            </Td>
            <Td right mono>
              ≈{Math.round((totalBBK / split.total) * 100)}:
              {Math.round((totalTBBK / split.total) * 100)}
            </Td>
          </tr>
        </tbody>
      </TableWrap>
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Cross Validation
// ─────────────────────────────────────────────────────────────────────────────

function CrossValidationTable({ cv }: { cv: ModelReport['cross_validation'] }) {
  const max = Math.max(...cv.fold_scores)
  return (
    <CollapsePanel label="5-Fold Cross Validation">
      <SubHeading icon={<IconChartBar size={13} />} title="Konsistensi Performa per Fold" />
      <TableWrap>
        <thead>
          <tr>
            <Th>Fold</Th>
            <Th right>Akurasi</Th>
            <Th>Distribusi</Th>
          </tr>
        </thead>
        <tbody>
          {cv.fold_scores.map((score, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              <Td>Fold {i + 1}</Td>
              <Td right primary={score === max}>
                <span className="font-mono tabular-nums">{fmt(score)}</span>
              </Td>
              <Td>
                <div className="flex items-center gap-2 min-w-20">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(score / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
                    {pct(score, 1)}
                  </span>
                </div>
              </Td>
            </tr>
          ))}
          <tr className="bg-muted/30">
            <Td>
              <span className="font-semibold">Rata-rata ± Std</span>
            </Td>
            <Td right>
              <span className="font-bold font-mono text-primary">
                {fmt(cv.rata_rata)} ± {fmt(cv.std)}
              </span>
            </Td>
            <Td>
              <span className="text-[10px] text-muted-foreground">Variansi rendah = konsisten</span>
            </Td>
          </tr>
        </tbody>
      </TableWrap>
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Confusion Matrix
// ─────────────────────────────────────────────────────────────────────────────

function ConfusionMatrixSection({ cm }: { cm: ModelReport['confusion_matrix'] }) {
  const total = cm.TP + cm.FN + cm.FP + cm.TN
  return (
    <CollapsePanel label="Confusion Matrix">
      <SubHeading icon={<IconChartPie size={13} />} title="Distribusi Hasil Prediksi" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Grid visual */}
        <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
          <div />
          <div className="py-1 px-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold rounded-md border border-blue-200 dark:border-blue-800 text-[10px]">
            Pred. BBK
          </div>
          <div className="py-1 px-1 bg-muted text-muted-foreground font-semibold rounded-md border border-border text-[10px]">
            Pred. TBBK
          </div>
          <div className="flex items-center justify-end pr-1 font-semibold text-blue-700 dark:text-blue-300 text-[10px]">
            Aktual BBK
          </div>
          <div className="py-3 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-lg">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{cm.TP}</div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">TP</div>
          </div>
          <div className="py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-lg font-bold text-red-500">{cm.FN}</div>
            <div className="text-[9px] text-red-500 font-bold">FN</div>
          </div>
          <div className="flex items-center justify-end pr-1 font-semibold text-muted-foreground text-[10px]">
            Aktual TBBK
          </div>
          <div className="py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="text-lg font-bold text-amber-500">{cm.FP}</div>
            <div className="text-[9px] text-amber-500 font-bold">FP</div>
          </div>
          <div className="py-3 bg-muted border border-border rounded-lg">
            <div className="text-lg font-bold text-muted-foreground">{cm.TN}</div>
            <div className="text-[9px] text-muted-foreground font-bold">TN</div>
          </div>
        </div>

        {/* Stats list */}
        <div className="space-y-1.5">
          {[
            {
              icon: <IconCheck size={11} />,
              label: 'TP — BBK tepat terdeteksi',
              val: cm.TP,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
            },
            {
              icon: <IconX size={11} />,
              label: 'FN — BBK terlewat',
              val: cm.FN,
              color: 'text-red-500',
              bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
            },
            {
              icon: <IconAlertTriangle size={11} />,
              label: 'FP — TBBK salah prediksi',
              val: cm.FP,
              color: 'text-amber-500',
              bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
            },
            {
              icon: <IconCheck size={11} />,
              label: 'TN — TBBK tepat terdeteksi',
              val: cm.TN,
              color: 'text-muted-foreground',
              bg: 'bg-muted border-border',
            },
          ].map((item) => (
            <div
              key={item.label}
              className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg border', item.bg)}
            >
              <span className={cn('shrink-0', item.color)}>{item.icon}</span>
              <span className="flex-1 text-[10px] text-foreground">{item.label}</span>
              <span className={cn('text-sm font-bold tabular-nums shrink-0', item.color)}>
                {item.val}
              </span>
              <span className="text-[9px] text-muted-foreground w-7 text-right shrink-0">
                {total > 0 ? pct(item.val / total, 1) : '—'}
              </span>
            </div>
          ))}
          {cm.FN === 0 && (
            <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <IconCheck size={11} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Tidak ada False Negative — seluruh santri BBK terdeteksi.
              </p>
            </div>
          )}
        </div>
      </div>
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Feature Importance
// ─────────────────────────────────────────────────────────────────────────────

function FeatureImportanceSection({ features }: { features: FeatureImportanceRow[] }) {
  const maxVal = features.length > 0 ? features[0].nilai : 1
  return (
    <CollapsePanel label="Feature Importance">
      <SubHeading
        icon={<IconChartBar size={13} />}
        title="Pengaruh Fitur terhadap Keputusan Model"
      />
      <div className="space-y-1.5">
        {features.map((f) => (
          <div key={f.nama} className="flex items-center gap-2">
            <span
              className={cn(
                'text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0',
                f.peringkat === 1
                  ? 'bg-primary text-primary-foreground'
                  : f.peringkat <= 3
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {f.peringkat}
            </span>
            <span className="w-40 text-[10px] font-mono text-foreground truncate shrink-0">
              {f.nama}
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  f.peringkat === 1
                    ? 'bg-primary'
                    : f.peringkat <= 3
                      ? 'bg-primary/60'
                      : 'bg-primary/25'
                )}
                style={{ width: maxVal > 0 ? `${(f.nilai / maxVal) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground w-12 text-right shrink-0">
              {fmt(f.nilai)}
            </span>
            {f.peringkat === 1 && (
              <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 px-1.5 shrink-0">
                #1
              </Badge>
            )}
          </div>
        ))}
      </div>
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Visualisasi Pohon Keputusan
// ─────────────────────────────────────────────────────────────────────────────

function TreeImageSection({ treePath }: { treePath: string | null }) {
  const [imgError, setImgError] = useState(false)
  const treeUrl = getTreeImageUrl()

  return (
    <CollapsePanel label="Visualisasi Pohon Keputusan">
      <SubHeading
        icon={<IconBrain size={13} />}
        title="Struktur Aturan Klasifikasi (max_depth = 5)"
      />
      {!treePath || imgError ? (
        <div className="flex flex-col items-center gap-2 py-8 bg-muted/30 rounded-lg border border-dashed border-border">
          <IconAlertTriangle size={20} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Visualisasi belum tersedia. Latih model terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-full rounded-lg border border-border overflow-hidden bg-white dark:bg-card">
            <Image
              src={treeUrl}
              alt="Visualisasi Pohon Keputusan Model Decision Tree"
              width={1400}
              height={600}
              className="w-full h-auto object-contain"
              unoptimized
              onError={() => setImgError(true)}
            />
          </div>
          <a
            href={treeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <IconExternalLink size={11} />
            Buka ukuran penuh
          </a>
        </div>
      )}
    </CollapsePanel>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function ModelReportSection({ latestEvaluasi, modelVersi }: ModelReportSectionProps) {
  const [report, setReport] = useState<ModelReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchModelReport()
      setReport(data)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Gagal memuat laporan model')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch saat komponen mount atau modelVersi berubah
  useEffect(() => {
    void load()
  }, [load, modelVersi])

  // Merge evaluasi segar ke dalam report.evaluasi jika ada
  const mergedEvaluasi: ModelReport['evaluasi'] | null = latestEvaluasi
    ? {
        akurasi: latestEvaluasi.akurasi,
        presisi: latestEvaluasi.precision,
        recall: latestEvaluasi.recall,
        f1_score: latestEvaluasi.f1,
      }
    : (report?.evaluasi ?? null)

  return (
    <div className="mt-4 space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconChartPie size={15} className="text-emerald-600" />
          <span className="text-sm font-semibold text-foreground">
            Evaluasi &amp; Laporan Model
          </span>
          {latestEvaluasi && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
              {latestEvaluasi.versi}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          className="h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <IconRefresh size={12} className={cn(loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <IconAlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
              Gagal memuat laporan
            </p>
            <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Skeleton saat load pertama kali */}
      {loading && !report && (
        <div className="space-y-2">
          <Skeleton h="h-20" />
          <Skeleton h="h-8" />
          <Skeleton h="h-8" />
          <Skeleton h="h-8" />
        </div>
      )}

      {/* Metric strip — tampil kalau ada evaluasi */}
      {mergedEvaluasi && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5">
            <IconInfoCircle size={12} className="text-emerald-600" />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Performa Model pada Data Uji
            </span>
          </div>
          <MetricStrip evaluasi={mergedEvaluasi} />
          {latestEvaluasi && (
            <p className="text-[10px] text-muted-foreground text-center">
              {latestEvaluasi.berhasil} santri berhasil diklasifikasi ulang
            </p>
          )}
        </div>
      )}

      {/* Detail collapsible panels */}
      {report && (
        <div className="space-y-2">
          <ParamTable params={report.model_params} />
          <GridSearchTable rows={report.grid_search_top10} />
          <DatasetSplitTable split={report.dataset_split} />
          <CrossValidationTable cv={report.cross_validation} />
          <ConfusionMatrixSection cm={report.confusion_matrix} />
          <FeatureImportanceSection features={report.feature_importance} />
          <TreeImageSection treePath={report.tree_image_path} />
        </div>
      )}

      {!loading && !report && !error && (
        <div className="flex flex-col items-center gap-2 py-8 bg-muted/30 rounded-xl border border-dashed border-border">
          <IconBrain size={20} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Latih model terlebih dahulu untuk melihat laporan.
          </p>
        </div>
      )}
    </div>
  )
}
