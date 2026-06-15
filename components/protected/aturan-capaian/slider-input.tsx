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
    <div className="p-4 bg-card rounded-xl border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{value}</span>
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(name, Number(e.target.value))}
        className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  )
}
