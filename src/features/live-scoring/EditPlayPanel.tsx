import { useState } from 'preact/hooks'
import type { PlayEventRow, PlayOutcome } from '../../data/schema'
import type { PlayerRow } from '../../data/schema'
import { OutcomeGrid } from './OutcomeGrid'
import { RunnerPanel } from './RunnerPanel'
import {
  computeDefaultAdvancement,
  DefaultAdvancement,
  RunnerDestinations,
  OUTCOME_LABELS,
} from './recordPlay'

interface Props {
  playEvent: PlayEventRow
  players: PlayerRow[]
  onSave: (outcome: PlayOutcome, dests: RunnerDestinations) => void
  onCancel: () => void
}

export function EditPlayPanel({ playEvent, players, onSave, onCancel }: Props) {
  const [pendingOutcome, setPendingOutcome] = useState<{
    outcome: PlayOutcome
    defaults: DefaultAdvancement
  } | null>(null)

  function handleOutcomeTap(outcome: PlayOutcome) {
    const defaults = computeDefaultAdvancement(
      outcome,
      playEvent.runnersBefore,
      playEvent.batterPlayerId
    )
    if (defaults.needsRunnerInput) {
      setPendingOutcome({ outcome, defaults })
    } else {
      onSave(outcome, defaults.destinations)
    }
  }

  if (pendingOutcome) {
    return (
      <RunnerPanel
        outcome={pendingOutcome.outcome}
        runnersBefore={playEvent.runnersBefore}
        batterPlayerId={playEvent.batterPlayerId}
        defaults={pendingOutcome.defaults}
        players={players}
        onConfirm={dests => onSave(pendingOutcome.outcome, dests)}
        onCancel={() => setPendingOutcome(null)}
      />
    )
  }

  return (
    <div class="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10 shrink-0">
        <div class="max-w-lg mx-auto">
          <div class="flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              class="text-white/70 text-sm min-h-[44px] pr-4 flex items-center"
            >
              ‹ Cancel
            </button>
            <h2 class="text-white font-bold text-lg">Edit Play</h2>
            <div class="w-16" />
          </div>
          <p class="text-white/60 text-sm mt-1">
            Current: {OUTCOME_LABELS[playEvent.outcome]?.full ?? playEvent.outcome}
          </p>
        </div>
      </header>

      <div class="max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-4">
        <p class="text-sm text-gray-500">Select the correct outcome:</p>
        <OutcomeGrid onOutcome={handleOutcomeTap} />
      </div>
    </div>
  )
}
