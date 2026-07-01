import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const progressVariants = cva('overflow-hidden rounded-full bg-zinc-100', {
  variants: {
    size: {
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-3',
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
  const color = value >= 80 ? 'bg-emerald-500' : value >= 40 ? 'bg-indigo-500' : 'bg-indigo-300'
  return (
    <div className="flex items-center gap-3">
      <div className={cn(progressVariants({ size }), 'flex-1', className)}>
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {showLabel && <span className="min-w-[2.5rem] text-right text-xs font-medium text-zinc-500">{value}%</span>}
    </div>
  )
}
