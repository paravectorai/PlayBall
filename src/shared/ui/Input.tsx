import { ComponentProps } from 'preact'

type InputProps = ComponentProps<'input'> & {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, class: className = '', ...props }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  const inputClasses = [
    'min-h-[44px] w-full rounded border px-3 text-text-main bg-surface',
    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    error ? 'border-clay' : 'border-border',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div class="flex flex-col gap-1">
      {label && (
        <label for={inputId} class="text-sm font-medium text-text-main">
          {label}
        </label>
      )}
      <input id={inputId} class={inputClasses} {...props} />
      {error && <p class="text-xs text-clay">{error}</p>}
      {!error && hint && <p class="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
