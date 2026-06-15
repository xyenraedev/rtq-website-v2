import { FormValues, AturanCapaian } from './types'

export function namaModel(jilid04: number, jilid56: number, taskih: number): string {
  const gabung = [jilid04, jilid56, taskih].map((v) => String(Math.round(v))).join('')
  return `decision_tree_${gabung}`
}

export function isDuplikat(
  formValues: FormValues,
  riwayat: AturanCapaian[],
  activeId?: string
): boolean {
  return riwayat.some(
    (r) =>
      r.id !== activeId &&
      r.batas_durasi_jilid_0_4 === formValues.batas_durasi_jilid_0_4 &&
      r.batas_durasi_jilid_5_6 === formValues.batas_durasi_jilid_5_6 &&
      r.batas_pengulangan_taskih === formValues.batas_pengulangan_taskih
  )
}
