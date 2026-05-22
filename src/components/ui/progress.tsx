import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const progressVariants = cva('overflow-hidden rounded-full bg-zinc-100', {
  variants: {
    size: {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    },
  },
  defaultVariants: { size: 'md' },
})

interface ProgressProps extends VariantProps<typeof progressVariants> {
  value: number
  className?: string
  showLabel?: boolean
}

export function Progress({ value, size, className, showLabel }: ProgressProps) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div className="flex items-center gap-3">
      <div className={cn(progressVariants({ size }), 'flex-1', className)}>
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {showLabel && <span className="text-xs text-zinc-500">{value}%</span>}
    </div>
  )
}
