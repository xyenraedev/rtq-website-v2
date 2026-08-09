import type { RekomendasiRow, StatistikRekomendasi } from '@/lib/ml-services/hasil-rekomendasi'
import { jilidLabel } from './helpers'

export async function exportHasilRekomendasiExcel(
  sortedData: RekomendasiRow[],
  statistik: StatistikRekomendasi | null
) {
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Data Santri ─────────────────────────────────────────────────
  const headerRow = [
    'No',
    'Nama',
    'Jenis Kelamin',
    'Jilid',
    'Durasi Aktif',
    'Taskih Aktif',
    'Total Taskih',
    'Status',
    'Probabilitas (%)',
    'Sumber Klasifikasi',
    'Tanggal Klasifikasi',
  ]

  const dataRows = sortedData.map((row, i) => [
    i + 1,
    row.nama,
    row.jenis_kelamin ?? '-',
    jilidLabel(row.jilid_saat_ini),
    row.durasi_jilid_aktif ?? '-',
    row.taskih_aktif ?? '-',
    row.total_pengulangan_taskih,
    row.status_rekomendasi ?? 'Belum',
    row.probabilitas != null ? Math.round(row.probabilitas * 100) : '-',
    row.sumber_rekomendasi ?? '-',
    row.classified_at ? new Date(row.classified_at).toLocaleDateString('id-ID') : '-',
  ])

  const wsData = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])

  wsData['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
  ]

  const range = XLSX.utils.decode_range(wsData['!ref']!)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!wsData[cellAddr]) continue
    wsData[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: { bottom: { style: 'medium', color: { rgb: 'FFFFFF' } } },
    }
  }

  for (let R = 1; R <= dataRows.length; R++) {
    const isEven = R % 2 === 0
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!wsData[cellAddr]) wsData[cellAddr] = { t: 's', v: '' }
      const statusVal = wsData[XLSX.utils.encode_cell({ r: R, c: 7 })]?.v

      let fontColor = '111111'
      if (C === 7) {
        fontColor = statusVal === 'BBK' ? 'C0392B' : statusVal === 'TBBK' ? '27AE60' : '888888'
      }

      wsData[cellAddr].s = {
        font: { sz: 10, color: { rgb: fontColor }, bold: C === 7 },
        fill: { fgColor: { rgb: isEven ? 'F2F6FA' : 'FFFFFF' } },
        alignment: { horizontal: C === 0 || C >= 4 ? 'center' : 'left', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'DDE3EC' } } },
      }
    }
  }

  wsData['!freeze'] = { xSplit: 0, ySplit: 1 }
  wsData['!autofilter'] = { ref: wsData['!ref']! }

  XLSX.utils.book_append_sheet(wb, wsData, 'Data Santri')

  // ── Sheet 2: Ringkasan ───────────────────────────────────────────────────
  if (statistik) {
    const now = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    const summaryAoa = [
      ['LAPORAN HASIL REKOMENDASI KLASIFIKASI SANTRI'],
      [`Digenerate: ${now}`],
      [],
      ['RINGKASAN KESELURUHAN'],
      ['Total Santri', statistik.total],
      ['Butuh Bimbingan Khusus (BBK)', statistik.bbk],
      ['Tidak Butuh Bimbingan Khusus (TBBK)', statistik.tbbk],
      ['Persentase BBK (%)', statistik.total > 0 ? `=B5/B4*100` : '0'],
      [],
      ['DISTRIBUSI PER JILID'],
      ['Jilid', 'BBK', 'TBBK', 'Total'],
      ...statistik.perJilid.map((j) => [j.jilid, j.bbk, j.tbbk, j.total]),
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa)
    wsSummary['!cols'] = [{ wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]

    if (wsSummary['A1']) {
      wsSummary['A1'].s = { font: { bold: true, sz: 14, color: { rgb: '1E3A5F' } } }
    }
    if (wsSummary['A2']) {
      wsSummary['A2'].s = { font: { italic: true, sz: 10, color: { rgb: '888888' } } }
    }

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')
  }

  // ── Sheet 3: Alasan AI ───────────────────────────────────────────────────
  const withAlasan = sortedData.filter((r) => r.alasan_rekomendasi)
  if (withAlasan.length > 0) {
    const alasanAoa = [
      ['Nama', 'Status', 'Probabilitas (%)', 'Alasan Keputusan Model'],
      ...withAlasan.map((r) => [
        r.nama,
        r.status_rekomendasi ?? '-',
        r.probabilitas != null ? Math.round(r.probabilitas * 100) : '-',
        r.alasan_rekomendasi ?? '-',
      ]),
    ]
    const wsAlasan = XLSX.utils.aoa_to_sheet(alasanAoa)
    wsAlasan['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsAlasan, 'Detail Alasan AI')
  }

  XLSX.writeFile(wb, `laporan-rekomendasi-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
