import type { AturanCapaian, KlasifikasiResult, SantriProgress } from '@/lib/types'
import { formatDurasiBulan, jilidLabel as getJilidLabel } from '@/lib/format'

type ProgressInput = Pick<SantriProgress, 'jilid' | 'durasi_bulan' | 'pengulangan_taskih'>

type AturanInput = Pick<
  AturanCapaian,
  'batas_durasi_jilid_0_4' | 'batas_durasi_jilid_5_6' | 'batas_pengulangan_taskih' | 'model_versi'
>

export function klasifikasiSantri(progress: ProgressInput, aturan: AturanInput): KlasifikasiResult {
  const {
    batas_durasi_jilid_0_4: b04,
    batas_durasi_jilid_5_6: b56,
    batas_pengulangan_taskih: bTaskih,
  } = aturan
  const { jilid, durasi_bulan, pengulangan_taskih } = progress

  const jilidLabel = getJilidLabel(jilid)

  // Al-Quran (jilid 7) = level final, tidak dievaluasi batas durasi/taskih
  if (jilid === 7) {
    const alasan = [
      `Santri sudah berada di level ${jilidLabel} (level akhir, tidak ada kenaikan jilid lagi) sehingga dinilai TIDAK membutuhkan bimbingan khusus (TBBK).`,
      '',
      'Detail:',
      `${jilidLabel}: durasi ${durasi_bulan != null ? formatDurasiBulan(durasi_bulan) : '—'} — tidak dievaluasi (level final)`,
    ].join('\n')

    return {
      status: 'TBBK',
      alasan,
      probabilitas: 0.95,
      model_versi: aturan.model_versi ?? 'rule-based-v1',
      fitur_snapshot: {
        jilid,
        durasi_bulan: durasi_bulan ?? 0,
        pengulangan_taskih,
        batas_durasi: 0,
        batas_taskih: bTaskih,
      },
    }
  }

  const batasDurasi = jilid <= 4 ? b04 : b56

  const detailParts: string[] = []
  let bbkScore = 0
  let totalCek = 0

  if (durasi_bulan !== null && durasi_bulan !== undefined) {
    totalCek++
    const durasiMelebihi = durasi_bulan > batasDurasi
    if (durasiMelebihi) bbkScore++
    detailParts.push(
      `${jilidLabel}: ${formatDurasiBulan(durasi_bulan)} ${durasiMelebihi ? '>' : '≤'} batas ${formatDurasiBulan(batasDurasi)} ${durasiMelebihi ? '❌' : '✓'}`
    )
  } else {
    detailParts.push(`${jilidLabel}: durasi belum tercatat`)
  }

  totalCek++
  const taskihMelebihi = pengulangan_taskih >= bTaskih
  if (taskihMelebihi) bbkScore++
  detailParts.push(
    `Taskih: ${pengulangan_taskih}x ${taskihMelebihi ? '≥' : '<'} batas ${bTaskih}x ${taskihMelebihi ? '❌' : '✓'}`
  )

  const isBBK = bbkScore > 0

  const probabilitas =
    totalCek > 0
      ? parseFloat(
          (isBBK
            ? Math.min(0.95, 0.5 + (bbkScore / totalCek) * 0.45)
            : Math.min(0.95, 0.5 + ((totalCek - bbkScore) / totalCek) * 0.45)
          ).toFixed(4)
        )
      : 0.5

  const ringkasan = isBBK
    ? `BBK: ${bbkScore} dari ${totalCek} kriteria melampaui batas`
    : `TBBK: semua ${totalCek} kriteria memenuhi batas`

  const alasan = [ringkasan, '', 'Detail:', ...detailParts].join('\n')

  return {
    status: isBBK ? 'BBK' : 'TBBK',
    alasan,
    probabilitas,
    model_versi: aturan.model_versi ?? 'rule-based',
    fitur_snapshot: {
      jilid,
      durasi_bulan: durasi_bulan ?? 0,
      pengulangan_taskih,
      batas_durasi: batasDurasi,
      batas_taskih: bTaskih,
    },
  }
}
