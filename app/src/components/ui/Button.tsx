import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-[#10b981] hover:bg-[#059669] text-white active:scale-95',
      secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
      ghost: 'text-[#a1a1aa] hover:text-white hover:bg-white/10',
      destructive: 'bg-red-600 hover:bg-red-700 text-white',
      outline: 'border border-white/10 text-white hover:bg-white/10',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-2',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <span className="animate-spin mr-2">⟳</span>}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
