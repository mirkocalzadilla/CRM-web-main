import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  /** Icon dot only, no wordmark (collapsed sidebar). */
  compact?: boolean
}

export function Logo({ className, compact }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="size-2 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-[0_0_12px_-2px_rgba(167,139,250,0.7)]" />
      {!compact && (
        <span className="text-white font-bold text-xs tracking-[0.2em]">
          MIRKO · CRM
        </span>
      )}
    </div>
  )
}
