'use client'

import { Skeleton } from '@/components/ui/skeleton'

const GRID_ITEMS = 12

export default function SkeletonGaleri() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden">
        <div className="relative flex min-h-85 items-center justify-center md:min-h-[60vh]">
          <Skeleton className="absolute inset-0 rounded-none" />

          <div className="relative z-10 w-full max-w-3xl space-y-3 px-4 py-16 text-center md:space-y-4 md:py-0">
            <div className="flex justify-center">
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-8 w-56 md:h-14 md:w-96" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-72 md:w-96" />
              <Skeleton className="hidden md:block h-4 w-64" />
            </div>
            <div className="flex justify-center pt-1 md:pt-2">
              <Skeleton className="h-9 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Filter skeleton — mobile */}
        <div className="mb-8 md:hidden overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 w-max pb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* Filter skeleton — desktop */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Grid skeleton — mirrors auto-rows grid */}
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: GRID_ITEMS }).map((_, i) => (
            <Skeleton key={i} className={`rounded-xl ${i % 5 === 2 ? 'row-span-2' : ''}`} />
          ))}
        </div>
      </section>
    </div>
  )
}
