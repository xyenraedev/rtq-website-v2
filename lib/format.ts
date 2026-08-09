export function jilidLabel(n: number): string {
  return n === 7 ? 'Al-Quran' : `Jilid ${n}`
}

export function formatDurasiBulan(durasi: number): string {
  const totalHari = Math.round(durasi * 30)
  const tahun = Math.floor(totalHari / 360)
  const sisaHari = totalHari % 360
  const bulan = Math.floor(sisaHari / 30)
  const hari = sisaHari % 30

  const parts: string[] = []
  if (tahun > 0) parts.push(`${tahun} th`)
  if (bulan > 0) parts.push(`${bulan} bln`)
  if (hari > 0) parts.push(`${hari} hr`)

  return parts.length ? parts.join(' ') : '0 hr'
}
