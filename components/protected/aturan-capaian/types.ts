import { AturanCapaian } from '@/lib/types'
import { EvaluasiResult } from '@/lib/ml-services/aturan-capaian'

export type FormValues = {
  batas_durasi_jilid_0_4: number
  batas_durasi_jilid_5_6: number
  batas_pengulangan_taskih: number
}

export type ModalType =
  | 'simpan'
  | 'reset'
  | 'post-simpan'
  | 'latih'
  | 'detail'
  | 'delete'
  | 'set-aktif'
  | 'process'
  | null

export type ProcessStep = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: 'idle' | 'running' | 'done' | 'error'
  result?: string
}

export type ProcessConfig = {
  title: string
  subtitle: string
  steps: ProcessStep[]
}

export type { AturanCapaian, EvaluasiResult }
