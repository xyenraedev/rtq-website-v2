'use client'

import { IconArrowRight } from '@tabler/icons-react'

interface DiffRowProps {
  label: string
  before: string
  after: string
  changed: boolean
}

export function DiffRow({ label, before, after, changed }: DiffRowProps) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground text-xs w-44">{label}</span>
      <div className="flex items-center gap-2">
        {changed ? (
          <>
            <span className="line-through text-muted-foreground text-xs">{before}</span>
            <IconArrowRight size={10} className="text-muted-foreground" />
            <span className="font-semibold text-primary text-xs">{after}</span>
          </>
        ) : (
          <span className="font-medium text-foreground text-xs">{after}</span>
        )}
      </div>
    </div>
  )
}
