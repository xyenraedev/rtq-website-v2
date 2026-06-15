'use client'

interface MetricCardProps {
  label: string
  value: number
  color: string
}

export function MetricCard({ label, value, color }: MetricCardProps) {
  const pct = Math.round(value * 100)
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={`text-lg font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
