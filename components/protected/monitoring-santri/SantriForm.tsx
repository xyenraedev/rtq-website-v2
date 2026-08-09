import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  IconUserPlus,
  IconEdit,
  IconX,
  IconCheck,
  IconRefresh,
  IconAlertTriangle,
  IconLock,
} from '@tabler/icons-react'
import { insertSantri, updateSantri } from '@/lib/ml-services/monitoring-santri'
import type {
  SantriDenganRekomendasi,
  SantriFormData,
  SantriProgress,
  Santri,
  KlasifikasiResult,
} from '@/lib/types'
import {
  EMPTY_FORM,
  santriToForm,
  isNomorIndukTerpakai,
  jilidLabel,
} from '@/lib/monitoring-santri/helpers'
import { STATUS_KELULUSAN_OPTIONS } from '@/lib/monitoring-santri/types'
import type { DurasiKey, StatusKelulusan } from '@/lib/monitoring-santri/types'

export function SantriForm({
  initial,
  progressList,
  existingNomorIndukList,
  suggestedNomorInduk,
  onClose,
  onSaved,
}: {
  initial?: SantriDenganRekomendasi | null
  progressList?: SantriProgress[]
  existingNomorIndukList: string[]
  suggestedNomorInduk: string
  onClose: () => void
  onSaved: (saved: { santri: Santri; klasifikasi: KlasifikasiResult }) => void
}) {
  const isEdit = !!initial
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SantriFormData>(
    initial ? santriToForm(initial) : { ...EMPTY_FORM, nomor_induk: suggestedNomorInduk }
  )
  const overlayRef = useRef<HTMLDivElement>(null)

  const jilid = Number(form.jilid_saat_ini)

  const progressByJilid: Record<number, SantriProgress> = {}
  for (const p of progressList ?? []) {
    progressByJilid[p.jilid] = p
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleStatusKelulusanChange(value: StatusKelulusan) {
    if (value === 'lulus' && jilid !== 7) {
      toast.error('Status "Lulus" hanya berlaku untuk santri di Al-Qur\'an')
      return
    }
    setForm((prev) => ({
      ...prev,
      status_kelulusan: value,
      // keluar wajib nonaktif — dipaksa otomatis, tidak bisa ditimpa manual
      status_aktif: value === 'keluar' ? false : prev.status_aktif,
    }))
  }

  function validateBeforeSubmit(): string | null {
    if (form.status_kelulusan === 'lulus' && jilid !== 7) {
      return 'Status "Lulus" hanya berlaku untuk santri di Al-Qur\'an'
    }
    if (form.status_kelulusan === 'keluar' && form.status_aktif) {
      return 'Santri dengan status "Keluar" harus berstatus nonaktif'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim()) {
      toast.error('Nama santri wajib diisi')
      return
    }

    const validationError = validateBeforeSubmit()
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!isEdit) {
      const nomorInduk = form.nomor_induk.trim()
      if (isNomorIndukTerpakai(nomorInduk, existingNomorIndukList)) {
        toast.error('Nomor induk bentrok, silakan refresh halaman untuk mendapatkan nomor baru.')
        return
      }
    }

    setLoading(true)
    try {
      if (isEdit) {
        const { santri, klasifikasi } = await updateSantri(initial!.id, form)
        toast.success('Data identitas berhasil diperbarui')
        onSaved({ santri, klasifikasi })
      } else {
        const { santri, klasifikasi } = await insertSantri(form)
        toast.success('Santri berhasil ditambahkan')
        onSaved({ santri, klasifikasi })
      }
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isEdit ? (
                <IconEdit size={18} className="text-primary" />
              ) : (
                <IconUserPlus size={18} className="text-primary" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {isEdit ? 'Edit Identitas Santri' : 'Tambah Santri Baru'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Klasifikasi BBK/TBBK otomatis dijalankan setelah disimpan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <IconX size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                1
              </span>
              Data Administratif
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Nomor Induk <span className="text-red-500">*</span>
                </label>
                {isEdit ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={form.nomor_induk}
                      disabled
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed text-sm font-mono"
                    />
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                      <IconLock size={12} />
                      Permanen
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-sm font-mono">
                      <IconLock size={12} className="text-muted-foreground shrink-0" />
                      <span className="text-foreground">{form.nomor_induk}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Nomor induk dibuat otomatis (tahun + urutan). Tidak dapat diubah.
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Status Keaktifan
                </label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    disabled={form.status_kelulusan === 'keluar'}
                    onClick={() => setForm((prev) => ({ ...prev, status_aktif: true }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      form.status_aktif
                        ? 'bg-emerald-500 text-white'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, status_aktif: false }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      !form.status_aktif
                        ? 'bg-muted-foreground text-white'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Nonaktif
                  </button>
                </div>
                {form.status_kelulusan === 'keluar' && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Santri yang keluar otomatis berstatus nonaktif
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Status Kelulusan
                </label>
                <select
                  name="status_kelulusan"
                  value={form.status_kelulusan}
                  onChange={(e) => handleStatusKelulusanChange(e.target.value as StatusKelulusan)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {STATUS_KELULUSAN_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value === 'lulus' && jilid !== 7}
                    >
                      {opt.label}
                      {opt.value === 'lulus' && jilid !== 7 ? " (khusus Al-Qur'an)" : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                2
              </span>
              Identitas Santri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={form.tanggal_lahir}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Jenis Kelamin
                </label>
                <select
                  name="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Alamat
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Contoh: Ngurensiti RT 00 RW 00, Kec. Wedarijaksa, Kab. Pati
                </p>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Masukkan alamat lengkap"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                3
              </span>
              Capaian Pembelajaran
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Jilid Saat Ini <span className="text-red-500">*</span>
                </label>
                <select
                  name="jilid_saat_ini"
                  value={form.jilid_saat_ini}
                  onChange={(e) => {
                    const nextJilid = Number(e.target.value)
                    if (isEdit && initial) {
                      const currentJilid = initial.jilid_saat_ini
                      if (nextJilid < currentJilid) {
                        toast.error('Tidak boleh turun jilid')
                        return
                      }
                      if (nextJilid > currentJilid + 1) {
                        toast.error('Jilid harus naik satu per satu')
                        return
                      }
                    }
                    setForm((prev) => ({
                      ...prev,
                      jilid_saat_ini: nextJilid,
                      total_pengulangan_taskih: 0,
                      status_kelulusan: (nextJilid !== 7 && prev.status_kelulusan === 'lulus'
                        ? 'belum_lulus'
                        : prev.status_kelulusan) as StatusKelulusan,
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7]
                    .filter((j) => {
                      if (!isEdit || !initial) return true
                      const currentJilid = initial.jilid_saat_ini
                      return j === currentJilid || j === currentJilid + 1
                    })
                    .map((j) => (
                      <option key={j} value={j}>
                        {j === 7 ? 'Al-Quran' : `Jilid ${j}`}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Pengulangan Taskih (Jilid Aktif)
                </label>
                <input
                  type="number"
                  name="total_pengulangan_taskih"
                  value={form.total_pengulangan_taskih}
                  onChange={handleChange}
                  min={0}
                  disabled={jilid === 7}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                {jilid === 7 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Al-Quran tidak memiliki taskih
                  </p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <span className="w-5 h-5 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold">
                4
              </span>
              Progress & Durasi per Jilid (bulan)
            </h3>
            <p className="text-xs text-muted-foreground mb-3 ml-7">
              Nilai durasi di bawah ini murni tampilan (read-only), dihitung otomatis dari tanggal
              mulai dan disinkronkan berkala oleh sistem. Tidak dikirim saat form disimpan — hanya
              field &quot;Pengulangan Taskih&quot; di atas yang benar-benar tersimpan dari form ini.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: jilid + 1 }, (_, j) => {
                const fieldKey = `durasi_jilid_${j}` as DurasiKey
                const isActive = j === jilid
                const isCompleted = j < jilid
                const progressRecord = progressByJilid[j]
                // Sumber tampilan SELALU dari progressRecord (data asli tabel
                // santri_progress, di-refresh sync function). form[fieldKey]
                // hanya dipakai sebagai fallback jika belum ada record progress
                // sama sekali (mis. saat membuat santri baru) — dan nilai itu
                // TIDAK PERNAH dikirim balik ke server saat submit.
                const existingValue = progressRecord?.durasi_bulan ?? Number(form[fieldKey]) ?? ''

                return (
                  <div
                    key={j}
                    className={`rounded-xl border p-3 ${
                      isActive
                        ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                        : isCompleted
                          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                          : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className={`text-xs font-semibold ${
                          isActive
                            ? 'text-primary'
                            : isCompleted
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {jilidLabel(j)}
                      </label>
                      {isActive && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                          AKTIF
                        </span>
                      )}
                      {isCompleted && (
                        <IconCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    {/*
                      Sengaja TANPA `name` prop: input ini murni display,
                      tidak boleh pernah ikut ter-serialize sebagai bagian
                      dari payload form (mencegah bug lama terulang).
                    */}
                    <input
                      type="number"
                      value={existingValue}
                      min={0}
                      step={0.5}
                      disabled
                      readOnly
                      className="w-full px-2 py-1.5 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed text-sm"
                    />
                    {progressRecord && (
                      <div className="mt-2 space-y-0.5">
                        {progressRecord.tanggal_mulai && (
                          <p className="text-[10px] text-muted-foreground">
                            Mulai: {progressRecord.tanggal_mulai}
                          </p>
                        )}
                        {progressRecord.tanggal_selesai && (
                          <p className="text-[10px] text-muted-foreground">
                            Selesai: {progressRecord.tanggal_selesai}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {isEdit && progressList && progressList.some((p) => p.jilid > jilid) && (
              <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <IconAlertTriangle size={12} className="inline mr-1" />
                  Ada progress jilid di atas jilid saat ini. Mengubah jilid ke angka lebih tinggi
                  akan membuat record progress baru.
                </p>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <IconRefresh size={14} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <IconCheck size={14} />
                  Simpan Identitas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
