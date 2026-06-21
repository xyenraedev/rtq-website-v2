import { mlBaseUrl } from '@/lib/ml-services/mlClient'

export interface ModelParams {
  criterion: string
  max_depth: number
  min_samples_split: number
  min_samples_leaf: number
  class_weight: string
  random_state: number
}

export interface GridSearchRow {
  rank: number
  criterion: string
  max_depth: number
  min_samples_split: number
  min_samples_leaf: number
  cv_score: number
}

export interface DatasetSplit {
  total: number
  train_total: number
  test_total: number
  train_bbk: number
  train_tbbk: number
  test_bbk: number
  test_tbbk: number
  train_ratio: number
  test_ratio: number
}

export interface EvaluasiMetrics {
  akurasi: number
  presisi: number
  recall: number
  f1_score: number
}

export interface CrossValidation {
  fold_scores: number[]
  rata_rata: number
  std: number
}

export interface ConfusionMatrix {
  TP: number
  FN: number
  FP: number
  TN: number
}

export interface FeatureImportanceRow {
  peringkat: number
  nama: string
  nilai: number
}

export interface ModelReport {
  model_params: ModelParams
  grid_search_top10: GridSearchRow[]
  dataset_split: DatasetSplit
  evaluasi: EvaluasiMetrics
  cross_validation: CrossValidation
  confusion_matrix: ConfusionMatrix
  feature_importance: FeatureImportanceRow[]
  tree_image_path: string | null
}

export async function fetchModelReport(): Promise<ModelReport> {
  const res = await fetch(`${mlBaseUrl}/model/report`)
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Gagal mengambil laporan model')
  }
  return res.json() as Promise<ModelReport>
}

export function getTreeImageUrl(): string {
  return `${mlBaseUrl}/model/tree-image`
}
