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

export async function fetchFeatureImportance(aturanId: string): Promise<FeatureImportanceItem[]> {
  const result = await mlFeatureImportance(aturanId)
  return result.features
}

export async function simpanAturan(formData: AturanCapaianFormData): Promise<AturanCapaian> {
  const supabase = getClient()

  await supabase.from('aturan_capaian').update({ is_active: false }).eq('is_active', true)

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
    .eq('batas_durasi_jilid_0_4', 6)
    .eq('batas_durasi_jilid_5_6', 8)
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

  const { data: aturan, error: checkError } = await supabase
    .from('aturan_capaian')
    .select('id, is_active')
    .eq('id', id)
    .single()

  if (checkError || !aturan) {
    throw new Error('Model tidak ditemukan')
  }

  if (aturan.is_active) {
    throw new Error('Model aktif tidak dapat dihapus')
  }

  const { error: trainingError } = await supabase
    .from('training_master')
    .delete()
    .eq('aturan_id', id)

  if (trainingError) {
    throw trainingError
  }

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

  const { data: aturan, error: checkError } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('id', id)
    .single()

  if (checkError || !aturan) {
    throw new Error('Model tidak ditemukan')
  }

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
 * Sumber data: tabel training_master (skema baru, 1 row = 1 sampel
 * jilid tunggal: jilid, durasi_bulan, pengulangan_taskih, label).
 * Fitur model disederhanakan jadi hanya 3 variabel yang benar-benar
 * dipakai rule (durasi > batas ATAU taskih >= batas) — lihat model.py.
 */
export async function latihUlangModel(aturanId: string): Promise<EvaluasiResult> {
  const supabase = getClient()

  const { data: aturan, error: aErr } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('id', aturanId)
    .single()

  if (aErr) throw new Error('Aturan tidak ditemukan')

  if (!aturan.is_active) {
    console.warn(
      `[latihUlangModel] Melatih aturan_id=${aturanId} yang TIDAK is_active. ` +
        'Model hasil training ini tidak akan dipakai sebagai acuan klasifikasi ' +
        'sampai aturan ini diaktifkan lewat setAturanAktif().'
    )
  }

  const { data: trainingData, error: tErr } = await supabase
    .from('training_master')
    .select('jilid, durasi_bulan, pengulangan_taskih, label')
    .eq('aturan_id', aturanId)

  if (tErr) throw tErr

  if (!trainingData || trainingData.length === 0) {
    throw new Error('Data training belum tersedia. Coba simpan ulang aturan capaian.')
  }

  const dataLatih = (
    trainingData as unknown as Array<{
      jilid: number
      durasi_bulan: number
      pengulangan_taskih: number
      label: 'BBK' | 'TBBK'
    }>
  ).map((row) => ({
    jilid: row.jilid,
    durasi_bulan: row.durasi_bulan,
    pengulangan_taskih: row.pengulangan_taskih,
    label: row.label,
  }))

  const evaluasi: MLEvaluasiResult = await mlLatih({
    aturan: {
      id: aturan.id,
      batas_durasi_jilid_0_4: aturan.batas_durasi_jilid_0_4 as number,
      batas_durasi_jilid_5_6: aturan.batas_durasi_jilid_5_6 as number,
      batas_pengulangan_taskih: aturan.batas_pengulangan_taskih as number,
    },
    data_latih: dataLatih,
  })

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
