'use client'

interface SliderInputProps {
  label: string
  name: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  description: string
  onChange: (name: string, value: number) => void
}

export function SliderInput({
  label,
  name,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
}: SliderInputProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{Math.round(value)}</span>
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>

      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={1}
        value={Math.round(value)}
        onChange={(e) => onChange(name, Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          {Math.round(min)} {unit}
        </span>
        <span>
          {Math.round(max)} {unit}
        </span>
      </div>
    </div>
  )
}
