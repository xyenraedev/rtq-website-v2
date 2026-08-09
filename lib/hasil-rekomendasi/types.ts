import type { RekomendasiRow } from '@/lib/ml-services/hasil-rekomendasi'

export type SortKey = keyof Pick<
  RekomendasiRow,
  | 'nomor_induk'
  | 'nama'
  | 'jilid_saat_ini'
  | 'durasi_jilid_aktif'
  | 'total_pengulangan_taskih'
  | 'status_rekomendasi'
  | 'probabilitas'
  | 'classified_at'
>

export type SortDir = 'asc' | 'desc' | null
