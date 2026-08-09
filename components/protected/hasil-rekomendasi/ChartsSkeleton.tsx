export function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-40 bg-muted/60 animate-pulse rounded-lg" />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="h-48 bg-muted/60 animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
