import { ComponentChildren } from 'preact'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: ComponentChildren
  class?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-border text-text-main',
  success: 'bg-primary/10 text-primary',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-clay/10 text-clay',
}

export function Badge({ variant = 'default', children, class: className = '' }: BadgeProps) {
  const classes = [
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span class={classes}>{children}</span>
}
