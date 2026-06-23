/**
 * Aturan Capaian Service
 */

import { createClient } from '@/lib/supabase/client'
import { mlFeatureImportance, mlLatih, type MLEvaluasiResult } from '@/lib/ml-services/mlClient'
import type { AturanCapaian, AturanCapaianFormData } from '@/lib/types'

function getClient() {
  return createClient()
}

export interface EvaluasiResult {
  akurasi: number
  precision: number
  recall: number
  f1: number
  versi: string
  berhasil: number
}

export interface FeatureImportanceItem {
  nama: string
  importance: number
}

export async function fetchAturanAktif(): Promise<AturanCapaian | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as AturanCapaian
}

export async function fetchRiwayatAturan(): Promise<AturanCapaian[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('aturan_capaian')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AturanCapaian[]
}

export async function fetchFeatureImportance(): Promise<FeatureImportanceItem[]> {
  const result = await mlFeatureImportance()
  return result.features
}

export async function simpanAturan(formData: AturanCapaianFormData): Promise<AturanCapaian> {
  const supabase = getClient()

  // Nonaktifkan aturan lama
  await supabase.from('aturan_capaian').update({ is_active: false }).eq('is_active', true)

  // Simpan aturan baru — trigger di DB akan otomatis generate training_master
  const { data, error } = await supabase
    .from('aturan_capaian')
    .insert({
      batas_durasi_jilid_0_4: formData.batas_durasi_jilid_0_4,
      batas_durasi_jilid_5_6: formData.batas_durasi_jilid_5_6,
      batas_pengulangan_taskih: formData.batas_pengulangan_taskih,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data as AturanCapaian
}

export async function resetAturanDefault(): Promise<AturanCapaian> {
  const supabase = getClient()

  const { data: existingDefault, error } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('batas_durasi_jilid_0_4', 3)
    .eq('batas_durasi_jilid_5_6', 4)
    .eq('batas_pengulangan_taskih', 3)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (existingDefault) {
    return await setAturanAktif(existingDefault.id)
  }

  return await simpanAturan({
    batas_durasi_jilid_0_4: 3,
    batas_durasi_jilid_5_6: 4,
    batas_pengulangan_taskih: 3,
  })
}

/**
 * Hapus aturan/model
 */
export async function deleteAturan(id: string): Promise<void> {
  const supabase = getClient()

  // Cek aturan
  const { data: aturan, error: checkError } = await supabase
    .from('aturan_capaian')
    .select('id, is_active')
    .eq('id', id)
    .single()

  if (checkError || !aturan) {
    throw new Error('Model tidak ditemukan')
  }

  // Jangan hapus model aktif
  if (aturan.is_active) {
    throw new Error('Model aktif tidak dapat dihapus')
  }

  // Hapus data training terkait dulu
  const { error: trainingError } = await supabase
    .from('training_master')
    .delete()
    .eq('aturan_id', id)

  if (trainingError) {
    throw trainingError
  }

  // Hapus aturan
  const { error } = await supabase.from('aturan_capaian').delete().eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Jadikan aturan/model sebagai aktif
 */
export async function setAturanAktif(id: string): Promise<AturanCapaian> {
  const supabase = getClient()

  // Ambil data aturan target
  const { data: aturan, error: checkError } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('id', id)
    .single()

  if (checkError || !aturan) {
    throw new Error('Model tidak ditemukan')
  }

  // Nonaktifkan semua model aktif
  const { error: disableError } = await supabase
    .from('aturan_capaian')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('is_active', true)

  if (disableError) {
    throw disableError
  }

  // Aktifkan model terpilih
  const { data, error } = await supabase
    .from('aturan_capaian')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as AturanCapaian
}

/**
 * Latih ulang Decision Tree.
 *
 * Sumber data: tabel training_master yang sudah digenerate otomatis
 * oleh trigger saat aturan disimpan. Skema training_master sekarang
 * menyimpan histori durasi jilid_0..jilid_6 sekaligus per row (1 row
 * = 1 santri simulasi), bukan snapshot 1 jilid per row, agar fitur
 * rata_rata_durasi/total_durasi/jumlah_jilid_diambil di sisi ML tidak
 * jadi duplikat trivial dari durasi jilid aktif saja.
 */
export async function latihUlangModel(aturanId: string): Promise<EvaluasiResult> {
  const supabase = getClient()

  // Ambil aturan
  const { data: aturan, error: aErr } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('id', aturanId)
    .single()

  if (aErr) throw new Error('Aturan tidak ditemukan')

  // Guard: peringatkan kalau aturan yang dilatih bukan aturan yang
  // sedang aktif. Tidak diblok total (mungkin sengaja melatih riwayat
  // lama), tapi caller harus sadar — ini sumber bug "evaluasi tidak
  // sesuai aturan aktif" kalau dipanggil tanpa sengaja pada id lama.
  if (!aturan.is_active) {
    console.warn(
      `[latihUlangModel] Melatih aturan_id=${aturanId} yang TIDAK is_active. ` +
        'Model hasil training ini tidak akan dipakai sebagai acuan klasifikasi ' +
        'sampai aturan ini diaktifkan lewat setAturanAktif().'
    )
  }

  // Ambil data training dari tabel master (skema baru: histori per jilid)
  const { data: trainingData, error: tErr } = await supabase
    .from('training_master')
    .select(
      'jilid_saat_ini, durasi_jilid_0, durasi_jilid_1, durasi_jilid_2, durasi_jilid_3, ' +
        'durasi_jilid_4, durasi_jilid_5, durasi_jilid_6, total_pengulangan_taskih, label'
    )
    .eq('aturan_id', aturanId)

  if (tErr) throw tErr

  if (!trainingData || trainingData.length === 0) {
    throw new Error('Data training belum tersedia. Coba simpan ulang aturan capaian.')
  }

  // Bangun data latih untuk ML Service — sekarang langsung 1:1 dengan
  // kolom tabel, tidak perlu trik "row.jilid === i ? x : null" lagi
  // karena histori semua jilid sudah tersimpan per row.
  const dataLatih = (
    trainingData as unknown as Array<{
      jilid_saat_ini: number
      durasi_jilid_0: number
      durasi_jilid_1: number
      durasi_jilid_2: number
      durasi_jilid_3: number
      durasi_jilid_4: number
      durasi_jilid_5: number
      durasi_jilid_6: number
      total_pengulangan_taskih: number
      label: 'BBK' | 'TBBK'
    }>
  ).map((row) => ({
    jilid_saat_ini: row.jilid_saat_ini,
    total_pengulangan_taskih: row.total_pengulangan_taskih,
    durasi_jilid_0: row.durasi_jilid_0,
    durasi_jilid_1: row.durasi_jilid_1,
    durasi_jilid_2: row.durasi_jilid_2,
    durasi_jilid_3: row.durasi_jilid_3,
    durasi_jilid_4: row.durasi_jilid_4,
    durasi_jilid_5: row.durasi_jilid_5,
    durasi_jilid_6: row.durasi_jilid_6,
    label: row.label,
  }))

  const evaluasi: MLEvaluasiResult = await mlLatih({
    aturan: {
      batas_durasi_jilid_0_4: aturan.batas_durasi_jilid_0_4 as number,
      batas_durasi_jilid_5_6: aturan.batas_durasi_jilid_5_6 as number,
      batas_pengulangan_taskih: aturan.batas_pengulangan_taskih as number,
    },
    data_latih: dataLatih,
  })

  // Simpan hasil evaluasi ke Supabase
  await supabase
    .from('aturan_capaian')
    .update({
      model_versi: evaluasi.versi,
      model_akurasi: evaluasi.akurasi,
      model_precision: evaluasi.precision,
      model_recall: evaluasi.recall,
      model_f1: evaluasi.f1,
      model_trained_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', aturanId)

  return {
    akurasi: evaluasi.akurasi,
    precision: evaluasi.precision,
    recall: evaluasi.recall,
    f1: evaluasi.f1,
    versi: evaluasi.versi,
    berhasil: evaluasi.berhasil,
  }
}

/**
 * Latih ulang Decision Tree untuk aturan yang SEDANG AKTIF saat ini.
 * Pakai ini sebagai default di UI ("Latih Ulang Model") supaya tidak ada
 * celah salah kirim aturanId yang sudah tidak is_active.
 */
export async function latihUlangModelAktif(): Promise<EvaluasiResult> {
  const aturanAktif = await fetchAturanAktif()
  if (!aturanAktif) {
    throw new Error('Tidak ada aturan capaian yang aktif (is_active=true).')
  }
  return latihUlangModel(aturanAktif.id)
}
