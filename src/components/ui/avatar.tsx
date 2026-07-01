import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const avatarVariants = cva('relative flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold overflow-hidden', {
  variants: {
    size: {
      sm: 'h-7 w-7 text-xs',
      md: 'h-9 w-9 text-sm',
      lg: 'h-14 w-14 text-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string
  src?: string | null
  className?: string
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({ name, src, size, className }, ref) => (
  <div ref={ref} className={cn(avatarVariants({ size }), className)}>
    {src ? (
      <img src={src} alt={name} className="h-full w-full object-cover" />
    ) : (
      <span>{getInitials(name)}</span>
    )}
  </div>
))
Avatar.displayName = 'Avatar'

export { Avatar }
