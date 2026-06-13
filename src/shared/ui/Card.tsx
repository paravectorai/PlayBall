import { ComponentChildren } from 'preact'

interface CardProps {
  children: ComponentChildren
  class?: string
  padding?: boolean
}

export function Card({ children, class: className = '', padding = true }: CardProps) {
  const classes = [
    'bg-surface rounded border border-border',
    padding && 'p-4',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div class={classes}>{children}</div>
}
