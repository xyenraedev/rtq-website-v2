import type { SantriDenganRekomendasi } from '@/lib/types'

export type DurasiKey =
  | 'durasi_jilid_0'
  | 'durasi_jilid_1'
  | 'durasi_jilid_2'
  | 'durasi_jilid_3'
  | 'durasi_jilid_4'
  | 'durasi_jilid_5'
  | 'durasi_jilid_6'

export type StatusKelulusan = 'belum_lulus' | 'lulus' | 'keluar'

export type JenisKelaminFilter = 'Laki-laki' | 'Perempuan' | ''
export type UsiaFilter = '' | 'anak' | 'remaja' | 'dewasa'
export type StatusAktifFilter = '' | 'aktif' | 'nonaktif'
export type StatusKelulusanFilter = '' | StatusKelulusan
export type SortKey =
  | 'nomor_induk'
  | 'nama'
  | 'jilid_saat_ini'
  | 'usia'
  | 'lama_belajar'
  | 'created_at'
export type SortDir = 'asc' | 'desc' | null

export type SantriEnriched = SantriDenganRekomendasi & {
  _usia: number | null
  _lamaBelajar: number
}

export const STATUS_KELULUSAN_OPTIONS: { value: StatusKelulusan; label: string }[] = [
  { value: 'belum_lulus', label: 'Belum Lulus' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'keluar', label: 'Keluar' },
]

export type AksiPerubahanSantri = 'update' | 'reklasifikasi'

export interface LastUpdatedSantriInfo {
  id: string
  nama: string
  statusRekomendasi: import('@/lib/types').StatusRekomendasi | null
  aksi: AksiPerubahanSantri
}
