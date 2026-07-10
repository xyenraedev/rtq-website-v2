import { createClient } from '@/lib/supabase/client'

// ─── Types ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSantri: number
  totalGuru: number
  totalBeritaPublished: number
  visitorHariIni: number
}

export interface SebaranRekomendasi {
  status: string
  jumlah: number
}

export interface SantriPerhatian {
  id: string
  nama: string
  jilid_saat_ini: number
  status: string
  probabilitas: number | null
  classified_at: string
}

export interface StatistikVisitor {
  tanggal: string
  unique_visitor: number
  total_kunjungan: number
}

export interface KontenTerkini {
  id: string
  judul: string
  kategori: string
  tipe: 'berita' | 'galeri'
  created_at: string
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

// ─── Dashboard Stats ──────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const [santriRes, guruRes, beritaRes, visitorRes] = await Promise.all([
    supabase.from('santri').select('id', { count: 'exact', head: true }),
    supabase.from('guru').select('id', { count: 'exact', head: true }),
    supabase.from('berita').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase
      .from('log_pengunjung')
      .select('ip_address', { count: 'exact', head: true })
      .eq('tanggal', today),
  ])

  return {
    totalSantri: santriRes.count ?? 0,
    totalGuru: guruRes.count ?? 0,
    totalBeritaPublished: beritaRes.count ?? 0,
    visitorHariIni: visitorRes.count ?? 0,
  }
}

// ─── Sebaran Rekomendasi ──────────────────────────────────────────────

export async function getSebaranRekomendasi(): Promise<SebaranRekomendasi[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('rekomendasi')
    .select('santri_id,status,classified_at')
    .order('classified_at', { ascending: false })

  if (error || !data) return []

  const latest = new Map<string, string>()

  for (const row of data) {
    if (!latest.has(row.santri_id)) {
      latest.set(row.santri_id, row.status)
    }
  }

  const counts = new Map<string, number>()

  for (const status of latest.values()) {
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([status, jumlah]) => ({
    status,
    jumlah,
  }))
}

// ─── Santri Perlu Perhatian ───────────────────────────────────────────

type SantriRelation = {
  id: string
  nama: string
  jilid_saat_ini: number
}

export async function getSantriPerhatian(): Promise<SantriPerhatian[]> {
  const supabase = createClient()

  // Tidak filter status='BBK' di query — itu bisa mengambil baris BBK
  // meskipun BUKAN klasifikasi terbaru untuk santri tsb.
  // Dedup dulu berdasarkan klasifikasi terbaru per santri (sama seperti
  // getSebaranRekomendasi), baru filter yang status terbarunya BBK.
  const { data, error } = await supabase
    .from('rekomendasi')
    .select(
      `
      status,
      probabilitas,
      classified_at,
      santri:santri_id (
        id,
        nama,
        jilid_saat_ini
      )
    `
    )
    .order('classified_at', { ascending: false })

  if (error || !data) return []

  const seen = new Set<string>()
  const result: SantriPerhatian[] = []

  for (const row of data) {
    const santri = getRelation(row.santri as SantriRelation | SantriRelation[] | null)

    if (!santri) continue
    if (seen.has(santri.id)) continue // baris pertama = klasifikasi terbaru santri ini

    seen.add(santri.id)

    // Hanya masukkan jika klasifikasi TERBARU-nya memang BBK
    if (row.status === 'BBK') {
      result.push({
        id: santri.id,
        nama: santri.nama,
        jilid_saat_ini: santri.jilid_saat_ini,
        status: row.status,
        probabilitas: row.probabilitas,
        classified_at: row.classified_at,
      })

      if (result.length >= 5) break
    }
  }

  return result
}

// ─── Statistik Visitor ────────────────────────────────────────────────

export async function getStatistikVisitor(): Promise<StatistikVisitor[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('statistik_visitor_7_hari')
    .select('tanggal,unique_visitor,total_kunjungan')
    .order('tanggal')

  if (error || !data) return []

  return data
}

// ─── Konten Terkini ───────────────────────────────────────────────────

type KategoriRelation = {
  nama: string
}

export async function getKontenTerkini(): Promise<KontenTerkini[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('berita')
    .select(
      `
      id,
      judul,
      created_at,
      berita_kategori:kategori_id (
        nama
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(5)

  if (error || !data) return []

  return data.map((item) => {
    const kategori = getRelation(
      item.berita_kategori as KategoriRelation | KategoriRelation[] | null
    )

    return {
      id: item.id,
      judul: item.judul ?? 'Tanpa Judul',
      kategori: kategori?.nama ?? 'Umum',
      tipe: 'berita' as const,
      created_at: item.created_at,
    }
  })
}
