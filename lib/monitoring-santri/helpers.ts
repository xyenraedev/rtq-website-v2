import type { SantriDenganRekomendasi, SantriFormData } from '@/lib/types'
import type { StatusKelulusan, UsiaFilter } from './types'

export const EMPTY_FORM: SantriFormData = {
  nomor_induk: '',
  status_aktif: true,
  status_kelulusan: 'belum_lulus',
  nama: '',
  tanggal_lahir: '',
  alamat: '',
  jenis_kelamin: 'Laki-laki',
  jilid_saat_ini: 0,
  total_pengulangan_taskih: 0,
  durasi_jilid_0: '',
  durasi_jilid_1: '',
  durasi_jilid_2: '',
  durasi_jilid_3: '',
  durasi_jilid_4: '',
  durasi_jilid_5: '',
  durasi_jilid_6: '',
}

export function jilidLabel(n: number) {
  return n === 7 ? 'Al-Quran' : `Jilid ${n}`
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function formatDurasiBulan(durasi: number): string {
  const totalHari = Math.round(durasi * 30)
  const tahun = Math.floor(totalHari / 360)
  const sisaHari = totalHari % 360
  const bulan = Math.floor(sisaHari / 30)
  const hari = sisaHari % 30

  const parts: string[] = []
  if (tahun > 0) parts.push(`${tahun} th`)
  if (bulan > 0) parts.push(`${bulan} bln`)
  if (hari > 0) parts.push(`${hari} hr`)

  return parts.length ? parts.join(' ') : '0 hr'
}

export function hitungUsia(tanggalLahir: string | null | undefined): number | null {
  if (!tanggalLahir) return null
  const lahir = new Date(tanggalLahir)
  if (Number.isNaN(lahir.getTime())) return null
  const now = new Date()
  let usia = now.getFullYear() - lahir.getFullYear()
  const belumUlangTahun =
    now.getMonth() < lahir.getMonth() ||
    (now.getMonth() === lahir.getMonth() && now.getDate() < lahir.getDate())
  if (belumUlangTahun) usia--
  return usia
}

export function kategoriUsia(usia: number | null): UsiaFilter {
  if (usia == null) return ''
  if (usia <= 12) return 'anak'
  if (usia <= 17) return 'remaja'
  return 'dewasa'
}

export function kategoriUsiaLabel(k: UsiaFilter) {
  if (k === 'anak') return 'Anak (≤12 th)'
  if (k === 'remaja') return 'Remaja (13–17 th)'
  if (k === 'dewasa') return 'Dewasa (18+ th)'
  return ''
}

export function hitungLamaBelajarBulan(s: SantriDenganRekomendasi): number {
  if (!s.created_at) return 0
  const mulai = new Date(s.created_at)
  const sekarang = new Date()
  const selisihHari = (sekarang.getTime() - mulai.getTime()) / (1000 * 60 * 60 * 24)
  return Number((selisihHari / 30).toFixed(2))
}

export function santriToForm(s: SantriDenganRekomendasi): SantriFormData {
  return {
    nomor_induk: s.nomor_induk ?? '',
    status_aktif: s.status_aktif ?? true,
    status_kelulusan: (s.status_kelulusan as StatusKelulusan) ?? 'belum_lulus',
    nama: s.nama,
    tanggal_lahir: s.tanggal_lahir ?? '',
    alamat: s.alamat ?? '',
    jenis_kelamin: s.jenis_kelamin ?? 'Laki-laki',
    jilid_saat_ini: s.jilid_saat_ini,
    total_pengulangan_taskih: s.total_pengulangan_taskih,
    durasi_jilid_0: '',
    durasi_jilid_1: '',
    durasi_jilid_2: '',
    durasi_jilid_3: '',
    durasi_jilid_4: '',
    durasi_jilid_5: '',
    durasi_jilid_6: '',
  }
}

// Nomor induk: 4 digit tahun + 3 digit urutan, reset tiap pergantian tahun.
export function generateNomorIndukBerikutnya(list: SantriDenganRekomendasi[]): string {
  const tahun = new Date().getFullYear().toString()

  const urutanTahunIni = list
    .map((s) => String(s.nomor_induk ?? ''))
    .filter((n): n is string => !!n && n.length === 7 && n.startsWith(tahun))
    .map((n) => parseInt(n.slice(4), 10))
    .filter((n) => !Number.isNaN(n))

  const urutanTerbesar = urutanTahunIni.length > 0 ? Math.max(...urutanTahunIni) : 0
  const urutanBerikutnya = (urutanTerbesar + 1).toString().padStart(3, '0')

  return `${tahun}${urutanBerikutnya}`
}

export function isNomorIndukTerpakai(
  nomorInduk: string,
  existingNomorIndukList: string[]
): boolean {
  return existingNomorIndukList.includes(nomorInduk)
}
