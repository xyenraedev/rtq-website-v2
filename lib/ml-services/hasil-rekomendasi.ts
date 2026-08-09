/**
 * Rekomendasi Service
 */

import { createClient } from '@/lib/supabase/client'
import { mlKlasifikasiBatch, type AturanLimits } from '@/lib/ml-services/mlClient'
import { klasifikasiSantri } from '@/lib/ml-services/classifier'
import type { AturanCapaian, SantriProgress, StatusRekomendasi } from '@/lib/types'

function getClient() {
  return createClient()
}

export interface RekomendasiRow {
  id: string
  nama: string
  jenis_kelamin: string | null
  jilid_saat_ini: number
  total_pengulangan_taskih: number
  nomor_induk: number | null
  status_aktif: boolean
  status_kelulusan: string
  status_rekomendasi: StatusRekomendasi | null
  alasan_rekomendasi: string | null
  probabilitas: number | null
  classified_at: string | null
  sumber_rekomendasi: string | null
  // Progress jilid aktif (dari view santri_dengan_rekomendasi)
  jilid_aktif: number | null
  durasi_jilid_aktif: number | null
  taskih_aktif: number | null
}

export interface StatistikRekomendasi {
  total: number
  bbk: number
  tbbk: number
  perJilid: Array<{
    jilid: string
    bbk: number
    tbbk: number
    total: number
  }>
}

export async function fetchHasilRekomendasiList(): Promise<RekomendasiRow[]> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('santri_dengan_rekomendasi')
    .select('*')
    .not('status_rekomendasi', 'is', null)
    .eq('status_aktif', true)
    .order('classified_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as RekomendasiRow[]
}

export async function fetchStatistikRekomendasi(): Promise<StatistikRekomendasi> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_dengan_rekomendasi')
    .select('status_rekomendasi, jilid_saat_ini')
    .eq('status_aktif', true)

  if (error) throw error

  const list = (data ?? []) as Array<{
    status_rekomendasi: string | null
    jilid_saat_ini: number
  }>

  const perJilidMap: Record<number, { bbk: number; tbbk: number; total: number }> = {}

  for (const item of list) {
    const j = item.jilid_saat_ini
    if (!perJilidMap[j]) perJilidMap[j] = { bbk: 0, tbbk: 0, total: 0 }
    perJilidMap[j].total++
    if (item.status_rekomendasi === 'BBK') perJilidMap[j].bbk++
    else if (item.status_rekomendasi === 'TBBK') perJilidMap[j].tbbk++
  }

  return {
    total: list.length,
    bbk: list.filter((s) => s.status_rekomendasi === 'BBK').length,
    tbbk: list.filter((s) => s.status_rekomendasi === 'TBBK').length,
    perJilid: Object.entries(perJilidMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([jilid, stat]) => ({
        jilid: Number(jilid) === 7 ? 'Al-Quran' : `Jilid ${jilid}`,
        ...stat,
      })),
  }
}

async function fetchAturanAktif(): Promise<AturanCapaian> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('aturan_capaian')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error) throw new Error('Aturan capaian aktif tidak ditemukan')
  return data as AturanCapaian
}

function toAturanLimits(aturan: AturanCapaian): AturanLimits {
  return {
    batas_durasi_jilid_0_4: aturan.batas_durasi_jilid_0_4,
    batas_durasi_jilid_5_6: aturan.batas_durasi_jilid_5_6,
    batas_pengulangan_taskih: aturan.batas_pengulangan_taskih,
  }
}

export async function reklasifikasiSemua(): Promise<{ berhasil: number; gagal: number }> {
  const supabase = getClient()

  const { data: progressList, error: pErr } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('is_aktif', true)

  if (pErr) throw pErr
  if (!progressList || progressList.length === 0) return { berhasil: 0, gagal: 0 }

  const list = progressList as SantriProgress[]
  const aturan = await fetchAturanAktif()

  // Disederhanakan total: santri_progress sudah punya jilid/durasi_bulan/
  // pengulangan_taskih langsung, tidak perlu lagi trik "jilid === i ? x : null".
  const batchInput = list.map((p) => ({
    id: p.santri_id,
    jilid: p.jilid,
    durasi_bulan: p.durasi_bulan,
    pengulangan_taskih: p.pengulangan_taskih,
  }))

  try {
    const batchResult = await mlKlasifikasiBatch(batchInput, toAturanLimits(aturan))

    const upsertBatch = batchResult.hasil
      .filter((h) => h.success && h.status)
      .map((h) => ({
        santri_id: h.id,
        status: h.status!,
        alasan: h.alasan ?? '',
        fitur_snapshot: h.fitur_snapshot ?? {},
        probabilitas: h.probabilitas ?? null,
        sumber: 'decision-tree' as const,
        model_versi: h.model_versi ?? '',
      }))

    if (upsertBatch.length > 0) {
      const { error: upsertErr } = await supabase
        .from('rekomendasi')
        .upsert(upsertBatch, { onConflict: 'santri_id' })
      if (upsertErr) throw upsertErr
    }

    return { berhasil: batchResult.berhasil, gagal: batchResult.gagal }
  } catch (err) {
    console.error('ML Batch gagal, fallback ke rule-based:', err)

    let berhasil = 0
    let gagal = 0

    for (const p of list) {
      try {
        const hasil = klasifikasiSantri(p, aturan)
        const { error: upsertErr } = await supabase.from('rekomendasi').upsert(
          {
            santri_id: p.santri_id,
            status: hasil.status,
            alasan: hasil.alasan,
            fitur_snapshot: hasil.fitur_snapshot,
            probabilitas: hasil.probabilitas,
            sumber: 'rule-based' as const,
            model_versi: hasil.model_versi,
          },
          { onConflict: 'santri_id' }
        )
        if (upsertErr) throw upsertErr
        berhasil++
      } catch {
        gagal++
      }
    }

    return { berhasil, gagal }
  }
}
