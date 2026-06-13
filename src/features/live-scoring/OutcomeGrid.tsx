import type { PlayOutcome } from '../../data/schema'
import { OUTCOME_LABELS } from './recordPlay'

interface Props {
  onOutcome: (outcome: PlayOutcome) => void
  disabled?: boolean
}

interface OutcomeButtonProps {
  outcome: PlayOutcome
  onOutcome: (outcome: PlayOutcome) => void
  disabled: boolean
  colorClass?: string
}

function OutcomeButton({ outcome, onOutcome, disabled, colorClass = '' }: OutcomeButtonProps) {
  const { short, full } = OUTCOME_LABELS[outcome]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onOutcome(outcome)}
      class={[
        'flex flex-col items-center justify-center gap-0.5 rounded-lg border',
        'min-h-[56px] flex-1 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        colorClass || 'bg-surface border-border hover:bg-primary/5 hover:border-primary',
      ].join(' ')}
    >
      <span class="text-base font-bold leading-none">{short}</span>
      <span class="text-[10px] text-gray-500 leading-none">{full}</span>
    </button>
  )
}

function HitButton({ outcome, onOutcome, disabled }: OutcomeButtonProps) {
  return (
    <OutcomeButton
      outcome={outcome}
      onOutcome={onOutcome}
      disabled={disabled}
      colorClass="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary"
    />
  )
}

function DangerButton({ outcome, onOutcome, disabled }: OutcomeButtonProps) {
  return (
    <OutcomeButton
      outcome={outcome}
      onOutcome={onOutcome}
      disabled={disabled}
      colorClass="bg-clay/5 border-clay/20 text-clay hover:bg-clay/10 hover:border-clay"
    />
  )
}

export function OutcomeGrid({ onOutcome, disabled = false }: Props) {
  return (
    <div class="flex flex-col gap-2">
      {/* Hits row */}
      <div class="flex gap-2">
        {(['single', 'double', 'triple', 'home_run'] as PlayOutcome[]).map(o => (
          <HitButton key={o} outcome={o} onOutcome={onOutcome} disabled={disabled} />
        ))}
      </div>

      {/* On base row */}
      <div class="flex gap-2">
        {(['walk', 'intentional_walk', 'hit_by_pitch', 'catcher_interference'] as PlayOutcome[]).map(o => (
          <OutcomeButton key={o} outcome={o} onOutcome={onOutcome} disabled={disabled} />
        ))}
      </div>

      {/* Outs row */}
      <div class="flex gap-2">
        {(['strikeout_swinging', 'strikeout_looking', 'field_out', 'field_error'] as PlayOutcome[]).map(o => (
          <DangerButton key={o} outcome={o} onOutcome={onOutcome} disabled={disabled} />
        ))}
      </div>

      {/* Special row */}
      <div class="flex gap-2">
        {(['sac_fly', 'sac_bunt', 'fielders_choice'] as PlayOutcome[]).map(o => (
          <OutcomeButton key={o} outcome={o} onOutcome={onOutcome} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}

interface BaseRunningProps {
  onOutcome: (outcome: PlayOutcome) => void
  disabled?: boolean
  hasRunners: boolean
}

export function BaseRunningButtons({ onOutcome, disabled = false, hasRunners }: BaseRunningProps) {
  if (!hasRunners) return null
  return (
    <div class="flex gap-2">
      {(['stolen_base', 'caught_stealing'] as PlayOutcome[]).map(o => (
        <OutcomeButton key={o} outcome={o} onOutcome={onOutcome} disabled={disabled} />
      ))}
      <div class="flex-1" />
      <div class="flex-1" />
    </div>
  )
}
