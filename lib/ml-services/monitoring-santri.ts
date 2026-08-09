/**
 * Santri Service
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

function toAturanLimits(aturan: AturanCapaian): AturanLimits {
  return {
    batas_durasi_jilid_0_4: aturan.batas_durasi_jilid_0_4,
    batas_durasi_jilid_5_6: aturan.batas_durasi_jilid_5_6,
    batas_pengulangan_taskih: aturan.batas_pengulangan_taskih,
  }
}

// Disederhanakan drastis: santri_progress sudah punya field jilid/
// durasi_bulan/pengulangan_taskih langsung, jadi tinggal passthrough,
// tidak perlu lagi trik "jilid === 0 ? x : null" x7.
function buildKlasifikasiInput(progress: SantriProgress): MLKlasifikasiInput {
  return {
    jilid: progress.jilid,
    durasi_bulan: progress.durasi_bulan,
    pengulangan_taskih: progress.pengulangan_taskih,
  }
}

type HasilDenganSumber = KlasifikasiResult & { sumber: 'decision-tree' | 'rule-based' }

async function klasifikasiDenganFallback(progress: SantriProgress): Promise<HasilDenganSumber> {
  const input = buildKlasifikasiInput(progress)
  const aturan = await fetchAturanAktif()

  try {
    const hasil = await mlKlasifikasi(input, toAturanLimits(aturan))
    return { ...hasil, sumber: 'decision-tree' }
  } catch {
    const hasil = klasifikasiSantri(progress, aturan)
    return { ...hasil, sumber: 'rule-based' }
  }
}

async function simpanRekomendasi(santriId: string, hasil: HasilDenganSumber): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.from('rekomendasi').upsert(
    {
      santri_id: santriId,
      status: hasil.status,
      alasan: hasil.alasan,
      fitur_snapshot: hasil.fitur_snapshot,
      probabilitas: hasil.probabilitas,
      sumber: hasil.sumber,
      model_versi: hasil.model_versi,
      classified_at: new Date().toISOString(), // update timestamp
    },
    { onConflict: 'santri_id' } // atau 'santri_id' jika itu nama constraint
  )
  if (error) throw error
}

// Ambil progress terbaru langsung dari DB setelah mutasi, supaya klasifikasi
// selalu memakai nilai final (termasuk durasi_bulan yang dikelola sync
// function), bukan objek stale hasil .update()/.insert() sebelumnya.
async function fetchProgressAktifById(progressId: string): Promise<SantriProgress> {
  const supabase = getClient()
  const { data, error } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('id', progressId)
    .single()

  if (error) throw error
  return data as SantriProgress
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function insertSantri(
  formData: SantriFormData
): Promise<{ santri: Santri; klasifikasi: KlasifikasiResult }> {
  const supabase = getClient()
  const jilid = Number(formData.jilid_saat_ini)
  const taskih = Number(formData.total_pengulangan_taskih)

  const { data: santri, error: sErr } = await supabase
    .from('santri')
    .insert({
      nomor_induk: formData.nomor_induk.trim(),
      nama: formData.nama.trim(),
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat?.trim() || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      status_aktif: formData.status_aktif,
      status_kelulusan: formData.status_kelulusan,
      jilid_saat_ini: jilid,
      total_pengulangan_taskih: taskih,
    })
    .select('*')
    .single()

  if (sErr) {
    if (sErr.code === '23505') {
      throw new Error('Nomor induk sudah digunakan santri lain')
    }
    throw sErr
  }

  // durasi_bulan SENGAJA tidak diisi dari form — kolom ini computed,
  // dihitung otomatis oleh sync function berdasarkan tanggal_mulai.
  // Progress baru selalu mulai dari durasi_bulan = null.
  const { data: progress, error: pErr } = await supabase
    .from('santri_progress')
    .insert({
      santri_id: santri.id,
      jilid,
      durasi_bulan: null,
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
  const taskih = Number(formData.total_pengulangan_taskih)

  const { data: progressLama } = await supabase
    .from('santri_progress')
    .select('*')
    .eq('santri_id', id)
    .eq('is_aktif', true)
    .single()

  const jilidLama = (progressLama as SantriProgress | null)?.jilid ?? -1
  const naikJilid = newJilid > jilidLama

  // nomor_induk sengaja TIDAK disertakan di payload update — bersifat
  // permanen sejak insert dan tidak boleh berubah.
  const { data: santri, error: sErr } = await supabase
    .from('santri')
    .update({
      nama: formData.nama.trim(),
      tanggal_lahir: formData.tanggal_lahir || null,
      alamat: formData.alamat?.trim() || null,
      jenis_kelamin: formData.jenis_kelamin || null,
      status_aktif: formData.status_aktif,
      status_kelulusan: formData.status_kelulusan,
      jilid_saat_ini: newJilid,
      total_pengulangan_taskih: taskih,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (sErr) throw sErr

  let progressId: string

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

    // durasi_bulan SENGAJA null — jilid baru, computed ulang oleh sync function.
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
    progressId = (progressBaru as SantriProgress).id
  } else {
    // FIX: durasi_bulan TIDAK disertakan dalam payload update.
    // Kolom ini adalah computed value yang di-maintain oleh sync function
    // (dihitung dari tanggal_mulai secara berkala). Form tidak pernah
    // punya nilai durasi yang valid untuk field ini (selalu disabled/kosong
    // di UI), jadi mengirimnya di sini hanya akan menimpa nilai asli
    // dengan null/stale value. Hanya taskih yang memang di-edit user.
    const { data: progressUpdate, error: pErr } = await supabase
      .from('santri_progress')
      .update({
        pengulangan_taskih: taskih,
        updated_at: new Date().toISOString(),
      })
      .eq('santri_id', id)
      .eq('is_aktif', true)
      .select('*')
      .single()

    if (pErr) throw pErr
    progressId = (progressUpdate as SantriProgress).id
  }

  // Re-fetch dari DB (bukan pakai objek hasil .update()/.insert() secara
  // langsung) supaya klasifikasi memakai durasi_bulan final yang benar,
  // bukan potongan payload yang baru saja kita kirim.
  const progressFinal = await fetchProgressAktifById(progressId)

  const hasil = await klasifikasiDenganFallback(progressFinal)
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
