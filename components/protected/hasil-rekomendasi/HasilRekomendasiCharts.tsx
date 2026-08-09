import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { StatistikRekomendasi } from '@/lib/ml-services/hasil-rekomendasi'

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="font-medium" style={{ color: item.fill }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  )
}

export default function HasilRekomendasiCharts({ statistik }: { statistik: StatistikRekomendasi }) {
  const pieData = [
    { name: 'BBK', value: statistik.bbk, color: '#ef4444' },
    { name: 'TBBK', value: statistik.tbbk, color: '#10b981' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Distribusi Status</h3>
        {statistik.total > 0 ? (
          <div className="flex flex-col items-center">
            {/* Wrapper dengan min-height + padding-top supaya lingkaran pie tidak kepotong di atas */}
            <div className="w-full" style={{ minHeight: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p className="text-xl font-bold text-red-600">{statistik.bbk}</p>
                <p className="text-xs text-muted-foreground">BBK</p>
              </div>
              <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <p className="text-xl font-bold text-emerald-600">{statistik.tbbk}</p>
                <p className="text-xs text-muted-foreground">TBBK</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
            Belum ada data
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-4">Status per Jilid</h3>
        {statistik.perJilid.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={statistik.perJilid}
              barSize={16}
              barGap={4}
              margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="jilid"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
              <Bar dataKey="bbk" name="BBK" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tbbk" name="TBBK" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Belum ada data statistik
          </div>
        )}
      </div>
    </div>
  )
}
