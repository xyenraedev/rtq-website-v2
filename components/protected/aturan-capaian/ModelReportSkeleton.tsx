export function ModelReportSkeleton() {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        <div className="h-7 w-20 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-20 bg-muted animate-pulse rounded-lg w-full" />
        <div className="h-8 bg-muted animate-pulse rounded-lg w-full" />
        <div className="h-8 bg-muted animate-pulse rounded-lg w-full" />
        <div className="h-8 bg-muted animate-pulse rounded-lg w-full" />
      </div>
    </div>
  )
}
