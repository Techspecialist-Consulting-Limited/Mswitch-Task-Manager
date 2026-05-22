import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: SelectOption[]
  placeholder?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, options, placeholder, error, id, ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label htmlFor={id} className="text-sm font-medium text-zinc-700">{label}</label>}
    <select
      id={id}
      className={cn(
        'flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50',
        error && 'border-red-400',
        className
      )}
      ref={ref}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))
Select.displayName = 'Select'

export { Select }
