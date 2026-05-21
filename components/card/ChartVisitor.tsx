'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatistikVisitor, type StatistikVisitor } from '@/lib/dashboard'
import { ChartSkeleton } from '@/components/skeleton/DashboardSkeletons'

function formatTanggal(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          {p.name === 'unique_visitor' ? 'Unique visitor' : 'Total kunjungan'}:{' '}
          <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function ChartVisitor() {
  const [data, setData] = useState<StatistikVisitor[] | null>(null)

  useEffect(() => {
    getStatistikVisitor().then(setData)
  }, [])

  if (!data) return <ChartSkeleton />

  const formatted = data.map((d) => ({
    ...d,
    label: formatTanggal(d.tanggal),
  }))

  const totalMingguIni = data.reduce((s, d) => s + d.unique_visitor, 0)

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Tren Pengunjung</CardTitle>
            <CardDescription>7 hari terakhir · portal website</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalMingguIni}</p>
            <p className="text-xs text-muted-foreground">total minggu ini</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4 min-h-55">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Belum ada data pengunjung</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVisitor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#01BF63" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#01BF63" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="unique_visitor"
                stroke="#01BF63"
                strokeWidth={2}
                fill="url(#gradVisitor)"
                dot={{ fill: '#01BF63', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#01BF63' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
