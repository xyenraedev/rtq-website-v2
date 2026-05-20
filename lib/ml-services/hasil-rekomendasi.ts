/**
 * Rekomendasi Service
 */

import { createClient } from '@/lib/supabase/client'
import { mlKlasifikasiBatch } from '@/lib/ml-services/mlClient'
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

export async function fetchHasilRekomendasiList(filters?: {
  status?: StatusRekomendasi | ''
  search?: string
}): Promise<RekomendasiRow[]> {
  const supabase = getClient()

  let query = supabase
    .from('santri_dengan_rekomendasi')
    .select('*')
    .not('status_rekomendasi', 'is', null)
    .order('classified_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status_rekomendasi', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('nama', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as RekomendasiRow[]
}

export async function fetchStatistikRekomendasi(): Promise<StatistikRekomendasi> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_dengan_rekomendasi')
    .select('status_rekomendasi, jilid_saat_ini')

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

export async function reklasifikasiSemua(): Promise<{ berhasil: number; gagal: number }> {
  const supabase = getClient()

  const { data: progressList, error: pErr } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('is_aktif', true)

  if (pErr) throw pErr
  if (!progressList || progressList.length === 0) return { berhasil: 0, gagal: 0 }

  const list = progressList as SantriProgress[]

  try {
    const batchInput = list.map((p) => ({
      id: p.santri_id,
      jilid_saat_ini: p.jilid,
      total_pengulangan_taskih: p.pengulangan_taskih,
      durasi_jilid_0: p.jilid === 0 ? (p.durasi_bulan ?? null) : null,
      durasi_jilid_1: p.jilid === 1 ? (p.durasi_bulan ?? null) : null,
      durasi_jilid_2: p.jilid === 2 ? (p.durasi_bulan ?? null) : null,
      durasi_jilid_3: p.jilid === 3 ? (p.durasi_bulan ?? null) : null,
      durasi_jilid_4: p.jilid === 4 ? (p.durasi_bulan ?? null) : null,
      durasi_jilid_5: p.jilid === 5 ? (p.durasi_bulan ?? null) : null,
      durasi_jilid_6: p.jilid === 6 ? (p.durasi_bulan ?? null) : null,
    }))

    const batchResult = await mlKlasifikasiBatch(batchInput)

    const insertBatch = batchResult.hasil
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

    if (insertBatch.length > 0) {
      const { error: insertErr } = await supabase.from('rekomendasi').insert(insertBatch)
      if (insertErr) throw insertErr
    }

    return { berhasil: batchResult.berhasil, gagal: batchResult.gagal }
  } catch {
     console.error('ML Batch gagal:', pErr)

     throw new Error('ML Service gagal dihubungi')
  }
}
