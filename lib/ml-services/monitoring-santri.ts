/**
 * Santri Service
 *
 * Arsitektur 3 tabel:
 *   santri          → data master santri
 *   santri_progress → progress per-jilid (sumber training + klasifikasi)
 *   rekomendasi     → hasil akhir final
 *
 * Klasifikasi HANYA berdasarkan jilid AKTIF (is_aktif = true).
 * Taskih & durasi reset ke 0 saat naik jilid.
 */

import { createClient } from '@/lib/supabase/client'
import {
  mlKlasifikasi,
  mlKlasifikasiBatch,
  type AturanLimits,
  type MLKlasifikasiInput,
} from '@/lib/ml-services/mlClient'
import { klasifikasiSantri } from '@/lib/ml-services/classifier'
import type {
  AturanCapaian,
  KlasifikasiResult,
  MonitoringStats,
  Rekomendasi,
  Santri,
  SantriDenganRekomendasi,
  SantriFormData,
  SantriProgress,
} from '@/lib/types'

function getClient() {
  return createClient()
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function fetchSantriList(): Promise<SantriDenganRekomendasi[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_dengan_rekomendasi')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SantriDenganRekomendasi[]
}

export async function fetchSantriById(id: string): Promise<SantriDenganRekomendasi | null> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_dengan_rekomendasi')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as SantriDenganRekomendasi
}

export async function fetchRiwayatRekomendasi(santriId: string): Promise<Rekomendasi[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('rekomendasi')
    .select('*')
    .eq('santri_id', santriId)
    .order('classified_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Rekomendasi[]
}

export async function fetchRiwayatProgress(santriId: string): Promise<SantriProgress[]> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('santri_id', santriId)
    .order('jilid', { ascending: true })

  if (error) throw error
  return (data ?? []) as SantriProgress[]
}

export async function fetchMonitoringStats(): Promise<MonitoringStats> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_dengan_rekomendasi')
    .select('status_rekomendasi, durasi_jilid_aktif')

  if (error) throw error

  const list = (data ?? []) as Array<{
    status_rekomendasi: string | null
    durasi_jilid_aktif: number | null
  }>

  const bbk = list.filter((s) => s.status_rekomendasi === 'BBK').length
  const tbbk = list.filter((s) => s.status_rekomendasi === 'TBBK').length
  const belum = list.filter((s) => s.status_rekomendasi === null).length

  const durasis = list.map((s) => s.durasi_jilid_aktif).filter((d): d is number => d !== null)

  const rata =
    durasis.length > 0
      ? parseFloat((durasis.reduce((a, b) => a + b, 0) / durasis.length).toFixed(1))
      : 0

  return {
    total_santri: list.length,
    bbk_count: bbk,
    tbbk_count: tbbk,
    belum_diklasifikasi: belum,
    rata_rata_durasi: rata,
  }
}

// ─── Helpers internal ─────────────────────────────────────────────────────────

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

/** Konversi AturanCapaian (row Supabase) -> AturanLimits (kontrak ML Service) */
function toAturanLimits(aturan: AturanCapaian): AturanLimits {
  return {
    batas_durasi_jilid_0_4: aturan.batas_durasi_jilid_0_4,
    batas_durasi_jilid_5_6: aturan.batas_durasi_jilid_5_6,
    batas_pengulangan_taskih: aturan.batas_pengulangan_taskih,
  }
}

function buildKlasifikasiInput(progress: SantriProgress): MLKlasifikasiInput {
  const { jilid } = progress
  return {
    jilid_saat_ini: jilid,
    total_pengulangan_taskih: progress.pengulangan_taskih,
    durasi_jilid_0: jilid === 0 ? (progress.durasi_bulan ?? null) : null,
    durasi_jilid_1: jilid === 1 ? (progress.durasi_bulan ?? null) : null,
    durasi_jilid_2: jilid === 2 ? (progress.durasi_bulan ?? null) : null,
    durasi_jilid_3: jilid === 3 ? (progress.durasi_bulan ?? null) : null,
    durasi_jilid_4: jilid === 4 ? (progress.durasi_bulan ?? null) : null,
    durasi_jilid_5: jilid === 5 ? (progress.durasi_bulan ?? null) : null,
    durasi_jilid_6: jilid === 6 ? (progress.durasi_bulan ?? null) : null,
  }
}

type HasilDenganSumber = KlasifikasiResult & { sumber: 'decision-tree' | 'rule-based' }

async function klasifikasiDenganFallback(progress: SantriProgress): Promise<HasilDenganSumber> {
  const input = buildKlasifikasiInput(progress)
  const aturan = await fetchAturanAktif()

  try {
    // Aturan aktif WAJIB dikirim ke ML Service supaya status akhir
    // (BBK/TBBK) dijamin sesuai aturan_capaian yang is_active=true
    // saat ini, terlepas dari aturan apa yang dipakai waktu model
    // terakhir dilatih.
    const hasil = await mlKlasifikasi(input, toAturanLimits(aturan))
    return { ...hasil, sumber: 'decision-tree' }
  } catch {
    const hasil = klasifikasiSantri(progress, aturan)
    return { ...hasil, sumber: 'rule-based' }
  }
}

async function simpanRekomendasi(santriId: string, hasil: HasilDenganSumber): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.from('rekomendasi').insert({
    santri_id: santriId,
    status: hasil.status,
    alasan: hasil.alasan,
    fitur_snapshot: hasil.fitur_snapshot,
    probabilitas: hasil.probabilitas,
    sumber: hasil.sumber,
    model_versi: hasil.model_versi,
  })
  if (error) throw error
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function insertSantri(
  formData: SantriFormData
): Promise<{ santri: Santri; klasifikasi: KlasifikasiResult }> {
  const supabase = getClient()
  const jilid = Number(formData.jilid_saat_ini)
  const durasiKey = `durasi_jilid_${jilid}` as keyof SantriFormData
  const durasiRaw = formData[durasiKey]
  const durasi = durasiRaw ? Number(durasiRaw) : null
  const taskih = Number(formData.total_pengulangan_taskih)

  const { data: santri, error: sErr } = await supabase
    .from('santri')
    .insert({
      nama: formData.nama.trim(),
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat?.trim() || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      jilid_saat_ini: jilid,
      total_pengulangan_taskih: taskih,
    })
    .select('*')
    .single()

  if (sErr) throw sErr

  const { data: progress, error: pErr } = await supabase
    .from('santri_progress')
    .insert({
      santri_id: santri.id,
      jilid,
      durasi_bulan: durasi,
      pengulangan_taskih: taskih,
      tanggal_mulai: formData.tanggal_mulai ?? null,
      is_aktif: true,
    })
    .select('*')
    .single()

  if (pErr) throw pErr

  const hasil = await klasifikasiDenganFallback(progress as SantriProgress)
  await simpanRekomendasi(santri.id, hasil)

  return { santri: santri as Santri, klasifikasi: hasil }
}

export async function updateSantri(
  id: string,
  formData: SantriFormData
): Promise<{ santri: Santri; klasifikasi: KlasifikasiResult }> {
  const supabase = getClient()
  const newJilid = Number(formData.jilid_saat_ini)
  const durasiKey = `durasi_jilid_${newJilid}` as keyof SantriFormData
  const durasiRaw = formData[durasiKey]
  const durasi = durasiRaw ? Number(durasiRaw) : null
  const taskih = Number(formData.total_pengulangan_taskih)

  const { data: progressLama } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('santri_id', id)
    .eq('is_aktif', true)
    .single()

  const jilidLama = (progressLama as SantriProgress | null)?.jilid ?? -1
  const naikJilid = newJilid > jilidLama

  const { data: santri, error: sErr } = await supabase
    .from('santri')
    .update({
      nama: formData.nama.trim(),
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat?.trim() || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      jilid_saat_ini: newJilid,
      total_pengulangan_taskih: taskih,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (sErr) throw sErr

  let progress: SantriProgress

  if (naikJilid) {
    if (progressLama) {
      await supabase
        .from('santri_progress')
        .update({
          is_aktif: false,
          tanggal_selesai: new Date().toISOString().split('T')[0],
        })
        .eq('id', (progressLama as SantriProgress).id)
    }

    const { data: progressBaru, error: pErr } = await supabase
      .from('santri_progress')
      .insert({
        santri_id: id,
        jilid: newJilid,
        durasi_bulan: null,
        pengulangan_taskih: 0,
        tanggal_mulai: new Date().toISOString().split('T')[0],
        is_aktif: true,
      })
      .select('*')
      .single()

    if (pErr) throw pErr
    progress = progressBaru as SantriProgress
  } else {
    const { data: progressUpdate, error: pErr } = await supabase
      .from('santri_progress')
      .update({
        durasi_bulan: durasi,
        pengulangan_taskih: taskih,
        updated_at: new Date().toISOString(),
      })
      .eq('santri_id', id)
      .eq('is_aktif', true)
      .select('*')
      .single()

    if (pErr) throw pErr
    progress = progressUpdate as SantriProgress
  }

  const hasil = await klasifikasiDenganFallback(progress)
  await simpanRekomendasi(id, hasil)

  return { santri: santri as Santri, klasifikasi: hasil }
}

export async function deleteSantri(id: string): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.from('santri').delete().eq('id', id)
  if (error) throw error
}

export async function reklasifikasiSantri(santriId: string): Promise<KlasifikasiResult> {
  const supabase = getClient()

  const { data: progress, error } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('santri_id', santriId)
    .eq('is_aktif', true)
    .single()

  if (error) throw error

  const hasil = await klasifikasiDenganFallback(progress as SantriProgress)
  await simpanRekomendasi(santriId, hasil)

  return hasil
}

export async function reklasifikasiBatch(santriIds: string[]): Promise<{
  berhasil: number
  gagal: number
}> {
  const supabase = getClient()

  const { data: progressList, error } = await supabase
    .from('santri_progress')
    .select('*')
    .in('santri_id', santriIds)
    .eq('is_aktif', true)

  if (error) throw error

  const list = (progressList ?? []) as SantriProgress[]
  const aturan = await fetchAturanAktif()

  try {
    const batchInput = list.map((p) => ({ id: p.santri_id, ...buildKlasifikasiInput(p) }))
    // Aturan aktif dikirim sekali untuk seluruh batch — sama untuk semua santri.
    const batchResult = await mlKlasifikasiBatch(batchInput, toAturanLimits(aturan))

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
    let berhasil = 0
    let gagal = 0

    for (const p of list) {
      try {
        const hasil = klasifikasiSantri(p, aturan)
        await supabase.from('rekomendasi').insert({
          santri_id: p.santri_id,
          status: hasil.status,
          alasan: hasil.alasan,
          fitur_snapshot: hasil.fitur_snapshot,
          probabilitas: hasil.probabilitas,
          sumber: 'rule-based' as const,
          model_versi: hasil.model_versi,
        })
        berhasil++
      } catch {
        gagal++
      }
    }

    return { berhasil, gagal }
  }
}
