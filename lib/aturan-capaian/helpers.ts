import type { AturanCapaian } from '@/lib/types'
import type { FormValues } from './types'

/**
 * Nama model = kolom `model_versi` dari tabel `aturan_capaian` (digenerate
 * oleh ML Service saat training, format "decision-tree_{b04}{b56}{b_tsk}",
 * mis. "decision-tree_343"). Belum ada nilainya sampai aturan ini benar-benar
 * dilatih, jadi tampilkan placeholder.
 */
export function namaModel(modelVersi: string | null | undefined): string {
  return modelVersi ?? 'Belum dilatih'
}

/**
 * Preview nama model SEBELUM training dijalankan, dihitung langsung dari
 * 3 nilai aturan. Format harus identik dengan _buat_versi() di ML Service:
 * decision-tree_{batas_durasi_jilid_0_4}{batas_durasi_jilid_5_6}{batas_pengulangan_taskih}
 * Dipakai di modal konfirmasi simpan, sebelum model_versi tersimpan di DB.
 */
export function buatNamaModel(
  batasDurasiJilid04: number,
  batasDurasiJilid56: number,
  batasPengulanganTaskih: number
): string {
  return `decision-tree_${batasDurasiJilid04}${batasDurasiJilid56}${batasPengulanganTaskih}`
}

/**
 * Format nilai metrik (0..1) jadi persen 2 desimal, mis. 0.9107 -> "91.07%".
 * Dipakai untuk Akurasi/Presisi/Recall/F1 supaya tidak dibulatkan ke bilangan
 * bulat seperti Math.round() sebelumnya.
 */
export function formatPersen(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${(value * 100).toFixed(2)}%`
}

/**
 * Cek apakah kombinasi parameter pada `formValues` sudah pernah ada
 * di `riwayat`. `excludeId` dipakai untuk mengabaikan entri aturan yang
 * sedang aktif/sedang diedit itu sendiri, supaya tidak dianggap duplikat
 * dari dirinya sendiri.
 */
export function isDuplikat(
  formValues: FormValues,
  riwayat: AturanCapaian[],
  excludeId?: string
): boolean {
  return riwayat.some((r) => {
    if (excludeId && r.id === excludeId) return false
    return (
      r.batas_durasi_jilid_0_4 === formValues.batas_durasi_jilid_0_4 &&
      r.batas_durasi_jilid_5_6 === formValues.batas_durasi_jilid_5_6 &&
      r.batas_pengulangan_taskih === formValues.batas_pengulangan_taskih
    )
  })
}
