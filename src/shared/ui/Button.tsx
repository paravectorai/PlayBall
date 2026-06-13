import { ComponentProps } from 'preact'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = Omit<ComponentProps<'button'>, 'size'> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
  secondary: 'border border-primary text-primary bg-transparent hover:bg-primary/5 focus:ring-primary',
  danger: 'bg-clay text-white hover:bg-clay/90 focus:ring-clay',
  ghost: 'text-primary bg-transparent hover:bg-primary/5 focus:ring-primary',
}

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-[44px] px-3 text-sm',
  md: 'min-h-[44px] px-4 text-base',
  lg: 'min-h-[52px] px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  class: className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button class={classes} {...props}>
      {children}
    </button>
  )
}
