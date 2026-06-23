// ============================================================
// TYPES: Sistem Rekomendasi Santri
// ============================================================

export type JenisKelamin = 'L' | 'P'
export type StatusRekomendasi = 'TBBK' | 'BBK'
export type SumberKlasifikasi = 'decision-tree' | 'rule-based' | 'manual'

// ─── Master Santri ────────────────────────────────────────────────────────────

export interface Santri {
  id: string
  nama: string
  tanggal_lahir: string | null
  alamat: string | null
  jenis_kelamin: JenisKelamin | null
  jilid_saat_ini: number
  total_pengulangan_taskih: number
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_0: number | null
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_1: number | null
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_2: number | null
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_3: number | null
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_4: number | null
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_5: number | null
  /** @deprecated Gunakan SantriProgress.durasi_bulan */
  durasi_jilid_6: number | null
  created_at: string
  updated_at: string
}

// ─── Progress Per-Jilid ───────────────────────────────────────────────────────

export interface SantriProgress {
  id: string
  santri_id: string
  /** 0–7 (7 = Al-Quran) */
  jilid: number
  /** Durasi menyelesaikan jilid ini dalam bulan */
  durasi_bulan: number | null
  pengulangan_taskih: number
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  /** true = jilid yang sedang berjalan saat ini */
  is_aktif: boolean
  created_at: string
  updated_at: string
}

// ─── View: santri_dengan_rekomendasi ─────────────────────────────────────────

export interface SantriDenganRekomendasi extends Santri {
  progress_id: string | null
  jilid_aktif: number | null
  durasi_jilid_aktif: number | null
  taskih_aktif: number | null
  tanggal_mulai: string | null
  tanggal_selesai: string | null
  rekomendasi_id: string | null
  status_rekomendasi: StatusRekomendasi | null
  alasan_rekomendasi: string | null
  probabilitas: number | null
  classified_at: string | null
  sumber_rekomendasi: SumberKlasifikasi | null
  model_versi_rekomendasi: string | null
}

// ─── Rekomendasi ──────────────────────────────────────────────────────────────

export interface Rekomendasi {
  id: string
  santri_id: string
  status: StatusRekomendasi
  alasan: string | null
  fitur_snapshot: Record<string, number | null> | null
  probabilitas: number | null
  sumber: SumberKlasifikasi
  model_versi: string | null
  classified_at: string
}

export interface RekomendasiDenganSantri extends Rekomendasi {
  santri: Pick<Santri, 'id' | 'nama' | 'jilid_saat_ini' | 'total_pengulangan_taskih'>
}

// ─── Aturan Capaian ───────────────────────────────────────────────────────────

export interface AturanCapaian {
  id: string
  batas_durasi_jilid_0_4: number
  batas_durasi_jilid_5_6: number
  batas_pengulangan_taskih: number
  model_versi: string | null
  model_akurasi: number | null
  model_precision: number | null
  model_recall: number | null
  model_f1: number | null
  model_trained_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AturanCapaianFormData {
  batas_durasi_jilid_0_4: number
  batas_durasi_jilid_5_6: number
  batas_pengulangan_taskih: number
}

// ─── Form Data ────────────────────────────────────────────────────────────────

export interface SantriFormData {
  nama: string
  tanggal_lahir: string
  alamat: string
  jenis_kelamin: JenisKelamin
  jilid_saat_ini: number
  total_pengulangan_taskih: number
  tanggal_mulai?: string
  durasi_jilid_0: string
  durasi_jilid_1: string
  durasi_jilid_2: string
  durasi_jilid_3: string
  durasi_jilid_4: string
  durasi_jilid_5: string
  durasi_jilid_6: string
}

// ─── Klasifikasi ──────────────────────────────────────────────────────────────

export interface KlasifikasiResult {
  status: StatusRekomendasi
  /**
   * Prediksi mentah Decision Tree sebelum ditimpa rule-based safety
   * layer berdasarkan aturan capaian aktif. Hanya ada saat sumber =
   * 'decision-tree'; klasifikasiSantri() (rule-based murni) tidak mengisi
   * field ini karena tidak ada prediksi ML untuk dibandingkan.
   */
  status_ml?: StatusRekomendasi
  /** true jika status_ml ditimpa oleh aturan aktif (rule-based override) */
  override_rule?: boolean
  /** true jika model belum dilatih ulang dengan aturan yang sedang aktif */
  model_stale?: boolean
  alasan: string
  probabilitas: number
  model_versi: string
  fitur_snapshot: Record<string, number | null>
}

// ─── Model Evaluasi ───────────────────────────────────────────────────────────

export interface ModelEvaluasi {
  akurasi: number
  precision: number
  recall: number
  f1: number
  versi: string
  trained_at: string
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface MonitoringStats {
  total_santri: number
  bbk_count: number
  tbbk_count: number
  belum_diklasifikasi: number
  rata_rata_durasi: number
}
