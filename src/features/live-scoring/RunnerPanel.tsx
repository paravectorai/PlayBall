import { useState, useEffect } from 'preact/hooks'
import type { PlayOutcome, RunnerState } from '../../data/schema'
import type { PlayerRow } from '../../data/schema'
import {
  OUTCOME_LABELS,
  RunnerDest,
  RunnerDestinations,
  DefaultAdvancement,
  destinationsToRunnerState,
  hasBaseConflict,
} from './recordPlay'

interface Props {
  outcome: PlayOutcome
  runnersBefore: RunnerState
  batterPlayerId: string
  defaults: DefaultAdvancement
  players: PlayerRow[]
  onConfirm: (dests: RunnerDestinations) => void
  onCancel: () => void
}

type RunnerKey = keyof RunnerDestinations

const BASE_LABELS: Record<RunnerDest, string> = {
  out: 'Out',
  '1st': '1st',
  '2nd': '2nd',
  '3rd': '3rd',
  scored: 'Scored',
}

/** Valid destinations for a runner given their origin base and the outcome type. */
function validDests(fromBase: '1st' | '2nd' | '3rd' | 'batter', outcome: PlayOutcome): RunnerDest[] {
  // Base running events: limit options per role
  if (outcome === 'stolen_base') {
    if (fromBase === 'batter') return []
    if (fromBase === '1st') return ['2nd', '3rd']
    if (fromBase === '2nd') return ['2nd', '3rd', 'scored']
    return ['3rd', 'scored']
  }
  if (outcome === 'caught_stealing') {
    if (fromBase === 'batter') return []
    if (fromBase === '1st') return ['out', '2nd']
    if (fromBase === '2nd') return ['out', '3rd']
    return ['out', 'scored']
  }

  // Batter is always out for strikeout/field out/sac outcomes
  if (fromBase === 'batter') {
    const batterOut: PlayOutcome[] = [
      'strikeout_swinging', 'strikeout_looking', 'field_out', 'sac_fly', 'sac_bunt',
    ]
    if (batterOut.includes(outcome)) return ['out']
    return ['1st'] // batter-reaches outcomes are fixed
  }

  // Runners can generally: out, stay, or advance forward
  const forward: RunnerDest[] = []
  if (fromBase === '1st') forward.push('1st', '2nd', '3rd', 'scored')
  else if (fromBase === '2nd') forward.push('2nd', '3rd', 'scored')
  else forward.push('3rd', 'scored')
  return ['out', ...forward]
}

interface RunnerRowProps {
  label: string
  playerName: string
  originBase: '1st' | '2nd' | '3rd' | 'batter'
  outcome: PlayOutcome
  selected: RunnerDest | null
  isFixed: boolean
  onSelect: (dest: RunnerDest) => void
}

function RunnerRow({ label, playerName, originBase, outcome, selected, isFixed, onSelect }: RunnerRowProps) {
  const options = validDests(originBase, outcome)

  return (
    <div class="flex flex-col gap-1.5">
      <div class="flex items-baseline gap-1.5">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span class="text-sm font-medium text-text-main">{playerName}</span>
      </div>
      <div class="flex gap-1.5 flex-wrap">
        {options.map(dest => {
          const isSelected = selected === dest
          const isOut = dest === 'out'
          const isScored = dest === 'scored'
          return (
            <button
              key={dest}
              type="button"
              disabled={isFixed}
              onClick={() => onSelect(dest)}
              class={[
                'px-3 rounded-full border text-sm font-medium transition-colors min-h-[40px]',
                isFixed ? 'cursor-default' : 'cursor-pointer',
                isSelected && isOut
                  ? 'bg-clay text-white border-clay'
                  : isSelected && isScored
                  ? 'bg-primary text-white border-primary'
                  : isSelected
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'bg-surface border-border text-gray-600 hover:border-gray-400',
              ].join(' ')}
            >
              {BASE_LABELS[dest]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function RunnerPanel({ outcome, runnersBefore, batterPlayerId, defaults, players, onConfirm, onCancel }: Props) {
  const [dests, setDests] = useState<RunnerDestinations>(defaults.destinations)

  // Reset when outcome or defaults change
  useEffect(() => {
    setDests(defaults.destinations)
  }, [outcome])

  function setDest(key: RunnerKey, value: RunnerDest) {
    setDests(prev => ({ ...prev, [key]: value }))
  }

  const preview = destinationsToRunnerState(dests, runnersBefore, batterPlayerId)
  const conflict = hasBaseConflict(dests)
  const canRecord = !conflict

  function playerName(playerId: string): string {
    const p = players.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName} #${p.jerseyNumber}` : 'Player'
  }

  const isBREvent = outcome === 'stolen_base' || outcome === 'caught_stealing'

  const batterFixed = (() => {
    if (isBREvent) return false
    const batterOuts: PlayOutcome[] = [
      'strikeout_swinging', 'strikeout_looking', 'field_out', 'sac_fly', 'sac_bunt',
    ]
    const batterReaches: PlayOutcome[] = [
      'single', 'double', 'triple', 'home_run',
      'walk', 'intentional_walk', 'hit_by_pitch', 'catcher_interference',
      'field_error', 'fielders_choice',
    ]
    return batterOuts.includes(outcome) || batterReaches.includes(outcome)
  })()

  return (
    <div class="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">
      {/* Header */}
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
            <h2 class="text-white font-bold text-lg">
              {OUTCOME_LABELS[outcome].full}
            </h2>
            <div class="w-16" />
          </div>
        </div>
      </header>

      <div class="max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-5 flex-1">
        <p class="text-sm text-gray-500">
          Confirm where each runner ends up.
        </p>

        {/* Batter row (not shown for base-running events) */}
        {!isBREvent && dests.batter !== null && (
          <RunnerRow
            label="Batter"
            playerName={playerName(batterPlayerId)}
            originBase="batter"
            outcome={outcome}
            selected={dests.batter}
            isFixed={batterFixed}
            onSelect={d => setDest('batter', d)}
          />
        )}

        {/* Runner from 3rd */}
        {runnersBefore.third && dests.from3rd !== null && (
          <RunnerRow
            label="Runner on 3rd"
            playerName={playerName(runnersBefore.third)}
            originBase="3rd"
            outcome={outcome}
            selected={dests.from3rd}
            isFixed={false}
            onSelect={d => setDest('from3rd', d)}
          />
        )}

        {/* Runner from 2nd */}
        {runnersBefore.second && dests.from2nd !== null && (
          <RunnerRow
            label="Runner on 2nd"
            playerName={playerName(runnersBefore.second)}
            originBase="2nd"
            outcome={outcome}
            selected={dests.from2nd}
            isFixed={false}
            onSelect={d => setDest('from2nd', d)}
          />
        )}

        {/* Runner from 1st */}
        {runnersBefore.first && dests.from1st !== null && (
          <RunnerRow
            label="Runner on 1st"
            playerName={playerName(runnersBefore.first)}
            originBase="1st"
            outcome={outcome}
            selected={dests.from1st}
            isFixed={false}
            onSelect={d => setDest('from1st', d)}
          />
        )}

        {/* Conflict warning */}
        {conflict && (
          <p class="text-clay text-sm font-medium">
            Two runners cannot end up at the same base. Adjust destinations above.
          </p>
        )}
      </div>

      {/* Footer: preview + record button */}
      <div class="sticky bottom-0 bg-surface border-t border-border px-4 py-4 pb-safe-bottom shrink-0">
        <div class="max-w-lg mx-auto flex flex-col gap-3">
          {/* Run/out preview */}
          <div class="flex gap-4 text-sm font-medium">
            <span class={preview.runsScored > 0 ? 'text-primary' : 'text-gray-400'}>
              {preview.runsScored === 1 ? '1 run scored' : `${preview.runsScored} runs scored`}
            </span>
            <span class={preview.outsRecorded > 0 ? 'text-clay' : 'text-gray-400'}>
              {preview.outsRecorded === 1 ? '1 out' : `${preview.outsRecorded} outs`}
            </span>
          </div>

          <button
            type="button"
            disabled={!canRecord}
            onClick={() => onConfirm(dests)}
            class={[
              'w-full min-h-[52px] rounded-lg font-semibold text-base transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              canRecord
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            Record Play
          </button>
        </div>
      </div>
    </div>
  )
}
