'use client'

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { getSebaranRekomendasi, type SebaranRekomendasi } from '@/lib/dashboard'

import { ChartSkeleton } from '@/components/skeleton/DashboardSkeletons'

// ─────────────────────────────────────────
// helpers
// ─────────────────────────────────────────

function cssVar(name: string) {
  if (typeof window === 'undefined') return '0 0% 60%'
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hslVar(name: string) {
  return `hsl(${cssVar(name)})`
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replaceAll('_', ' ')
}

function getStatusMeta(status: string) {
  const key = normalizeStatus(status)

  if (key === 'bbk' || key === 'butuh bimbingan khusus') {
    return {
      label: 'Butuh Bimbingan Khusus',
      color: hslVar('--destructive'),
    }
  }

  if (key === 'tbbk' || key === 'tidak butuh bimbingan khusus') {
    return {
      label: 'Tidak Butuh Bimbingan Khusus',
      color: hslVar('--primary'),
    }
  }

  // fallback
  return {
    label: status,
    color: hslVar('--chart-5'),
  }
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: SebaranRekomendasi
  }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  const meta = getStatusMeta(item.status)

  return (
    <div className="rounded-xl border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold">{meta.label}</p>

      <p className="text-xs text-muted-foreground">{item.jumlah} santri</p>
    </div>
  )
}

function CenterLabel({ total }: { total: number }) {
  return (
    <>
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground text-3xl font-bold"
      >
        {total}
      </text>

      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground text-xs"
      >
        Total Santri
      </text>
    </>
  )
}

// ─────────────────────────────────────────
// component
// ─────────────────────────────────────────

export function ChartSebaranRekomendasi() {
  const [data, setData] = useState<SebaranRekomendasi[] | null>(null)

  useEffect(() => {
    getSebaranRekomendasi().then(setData)
  }, [])

  const chartData = useMemo(() => {
    if (!data) return []

    return data.map((item) => {
      const meta = getStatusMeta(item.status)

      return {
        ...item,
        label: meta.label,
        color: meta.color,
      }
    })
  }, [data])

  if (!data) return <ChartSkeleton />

  const total = data.reduce((sum, item) => sum + item.jumlah, 0)

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sebaran Rekomendasi</CardTitle>
          <CardDescription>Belum ada data rekomendasi</CardDescription>
        </CardHeader>

        <CardContent className="flex h-80 items-center justify-center">
          <p className="text-sm text-muted-foreground">Tidak ada data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Sebaran Rekomendasi</CardTitle>

        <CardDescription>
          Rasio capaian {total} santri berdasarkan klasifikasi terbaru
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-70 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="jumlah"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={100}
                paddingAngle={5}
                cornerRadius={12}
                stroke="transparent"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}

                <CenterLabel total={total} />
              </Pie>

              <Tooltip content={<CustomTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* legend */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {chartData.map((item) => (
            <div
              key={item.status}
              className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium"
            >
              <span
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span>{item.label}</span>

              <span className="text-muted-foreground">({item.jumlah})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
