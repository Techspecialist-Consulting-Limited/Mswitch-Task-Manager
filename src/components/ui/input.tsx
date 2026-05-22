import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="text-sm font-medium text-zinc-700">{label}</label>}
    <input
      id={id}
      className={cn(
        'flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50',
        error && 'border-red-400 focus:ring-red-400',
        className
      )}
      ref={ref}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'

export { Input }
