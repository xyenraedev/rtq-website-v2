import {
  IconDatabase,
  IconCheck,
  IconBrain,
  IconWand,
  IconRefresh,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import type { ProcessIconKey } from '../../../lib/aturan-capaian/types'

const PROCESS_ICON_MAP: Record<
  ProcessIconKey,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  database: IconDatabase,
  check: IconCheck,
  brain: IconBrain,
  wand: IconWand,
  refresh: IconRefresh,
  trash: IconTrash,
  x: IconX,
}

export function ProcessIcon({
  name,
  size = 14,
  className,
}: {
  name: ProcessIconKey
  size?: number
  className?: string
}) {
  const Icon = PROCESS_ICON_MAP[name]
  return <Icon size={size} className={className} />
}
