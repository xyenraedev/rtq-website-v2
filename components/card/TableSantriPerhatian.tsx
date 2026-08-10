'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { IconAlertTriangle, IconArrowRight, IconEdit } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { getSantriPerhatian, type SantriPerhatian } from '@/lib/dashboard'
import { TableSkeleton } from '@/components/skeleton/DashboardSkeletons'

// ─────────────────────────────────────────
// helpers
// ─────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

function avatarColor(name: string): string {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ─────────────────────────────────────────
// component
// ─────────────────────────────────────────

export function TableSantriPerhatian() {
  const router = useRouter()
  const [data, setData] = useState<SantriPerhatian[] | null>(null)

  useEffect(() => {
    // Data sudah difilter BBK di server — tidak perlu filter ulang di sini
    getSantriPerhatian().then(setData)
  }, [])

  function handleEditClick(santriId: string) {
    router.push(`/protected/monitoring-santri?edit=${santriId}`)
  }

  function handleViewAll() {
    router.push('/protected/monitoring-santri')
  }

  if (!data) return <TableSkeleton />

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IconAlertTriangle size={16} className="text-red-500 shrink-0" />
              Santri Butuh Perhatian
            </CardTitle>
            <CardDescription>
              {data.length > 0
                ? `${data.length} santri BBK terbaru — perlu tindak lanjut segera`
                : 'Tidak ada santri yang perlu tindak lanjut saat ini'}
            </CardDescription>{' '}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="shrink-0 text-xs text-muted-foreground hover:text-primary hover:bg-muted gap-1.5"
          >
            Lihat semua
            <IconArrowRight size={13} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {!data.length ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 px-5">
            <IconAlertTriangle size={28} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Tidak ada santri yang memerlukan bimbingan khusus
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((santri) => {
              const timeAgo = formatDistanceToNow(new Date(santri.classified_at), {
                addSuffix: true,
                locale: localeId,
              })

              return (
                <li
                  key={santri.id}
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  {/* avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(santri.nama)}`}
                  >
                    {getInitials(santri.nama)}
                  </div>

                  {/* info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{santri.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      Jilid <span className="font-medium">{santri.jilid_saat_ini}</span> &bull;{' '}
                      {timeAgo}
                    </p>
                  </div>

                  {/* badge */}
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-full border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
                  >
                    BBK
                  </Badge>

                  {/* CTA edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(santri.id)}
                    title={`Edit data ${santri.nama}`}
                    className="h-8 w-8 shrink-0 text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
                  >
                    <IconEdit size={14} />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      {!!data.length && (
        <CardFooter className="border-t border-border/60 px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAll}
            className="w-full gap-2 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
          >
            Kelola semua santri BBK di Monitoring
            <IconArrowRight size={13} />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
