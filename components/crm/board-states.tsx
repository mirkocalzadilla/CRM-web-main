'use client'

import { Skeleton } from '@/components/ui/skeleton'

/** Loading/feedback states del tablero CRM, fuera de crm-board para respetar <200 líneas. */

export function BoardSkeleton() {
  // Mirror the responsive column layout of PipelineBoard so the loading state
  // matches the real board (full-width on desktop, snap carousel on mobile).
  return (
    <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex w-[80vw] max-w-xs flex-shrink-0 flex-col sm:w-72 lg:w-auto lg:min-w-68 lg:flex-1"
        >
          <Skeleton className="h-full w-full rounded-2xl bg-white/[0.03]" />
        </div>
      ))}
    </div>
  )
}

export function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-sm font-normal text-zinc-500">{text}</p>
    </div>
  )
}
