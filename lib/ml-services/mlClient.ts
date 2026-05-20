/**
 * HTTP Client untuk komunikasi dengan ML Service (Flask)
 */

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MLKlasifikasiInput {
  jilid_saat_ini: number
  total_pengulangan_taskih: number
  durasi_jilid_0?: number | null
  durasi_jilid_1?: number | null
  durasi_jilid_2?: number | null
  durasi_jilid_3?: number | null
  durasi_jilid_4?: number | null
  durasi_jilid_5?: number | null
  durasi_jilid_6?: number | null
}

export interface MLKlasifikasiResult {
  /** BBK = Butuh Bimbingan Khusus | TBBK = Tidak Butuh Bimbingan Khusus */
  status: 'TBBK' | 'BBK'
  probabilitas: number
  alasan: string
  fitur_snapshot: Record<string, number>
  model_versi: string
}

export interface MLBatchInput extends MLKlasifikasiInput {
  id: string
}

export interface MLBatchItemResult extends Partial<MLKlasifikasiResult> {
  id: string
  success: boolean
  error?: string
}

export interface MLBatchResult {
  hasil: MLBatchItemResult[]
  berhasil: number
  gagal: number
}

export interface MLLatihInput {
  aturan: {
    batas_durasi_jilid_0_4: number
    batas_durasi_jilid_5_6: number
    batas_pengulangan_taskih: number
  }
  data_latih?: Array<MLKlasifikasiInput & { label: 'TBBK' | 'BBK' }>
}

export interface MLEvaluasiResult {
  versi: string
  akurasi: number
  precision: number
  recall: number
  f1: number
  berhasil: number
  total_data_latih: number
  total_data_test: number
}

export interface MLHealthResult {
  status: string
  model_trained: boolean
  model_versi: string
  total_data_latih: number
}

export interface MLFeatureImportance {
  features: Array<{ nama: string; importance: number }>
}

export interface MLModelInfo {
  is_trained: boolean
  versi: string
  total_data_latih: number
  aturan_aktif: {
    batas_durasi_jilid_0_4?: number
    batas_durasi_jilid_5_6?: number
    batas_pengulangan_taskih?: number
  }
  feature_names: string[]
  algorithm: string
  params: Record<string, unknown>
}

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function mlFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(`${ML_SERVICE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
      ...options,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(
        (body as { error?: string }).error ?? `ML Service error: ${res.status} ${res.statusText}`
      )
    }

    return res.json() as Promise<T>
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') throw new Error('ML Service timeout')
      if (err.message.includes('fetch failed')) throw new Error('ML Service tidak dapat dihubungi')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateInput(input: MLKlasifikasiInput): void {
  if (input.jilid_saat_ini < 0 || input.jilid_saat_ini > 7) {
    throw new Error('jilid_saat_ini harus antara 0–7')
  }
  if (input.total_pengulangan_taskih < 0) {
    throw new Error('total_pengulangan_taskih tidak boleh negatif')
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Cek status ML Service */
export async function mlHealth(): Promise<MLHealthResult> {
  return mlFetch<MLHealthResult>('/health')
}

/** Klasifikasi satu santri */
export async function mlKlasifikasi(input: MLKlasifikasiInput): Promise<MLKlasifikasiResult> {
  validateInput(input)
  return mlFetch<MLKlasifikasiResult>('/klasifikasi', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Klasifikasi banyak santri sekaligus */
export async function mlKlasifikasiBatch(santriList: MLBatchInput[]): Promise<MLBatchResult> {
  if (!Array.isArray(santriList)) throw new Error('santriList harus array')
  santriList.forEach(validateInput)
  return mlFetch<MLBatchResult>('/klasifikasi/batch', {
    method: 'POST',
    body: JSON.stringify({ santri_list: santriList }),
  })
}

/** Latih ulang Decision Tree dengan aturan baru */
export async function mlLatih(input: MLLatihInput): Promise<MLEvaluasiResult> {
  if (!input.aturan) throw new Error('Field aturan wajib diisi')
  return mlFetch<MLEvaluasiResult>('/latih', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Info lengkap model yang sedang aktif */
export async function mlModelInfo(): Promise<MLModelInfo> {
  return mlFetch<MLModelInfo>('/model/info')
}

/** Feature importance Decision Tree */
export async function mlFeatureImportance(): Promise<MLFeatureImportance> {
  return mlFetch<MLFeatureImportance>('/model/feature-importance')
}
