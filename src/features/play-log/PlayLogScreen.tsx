import { useEffect, useRef, useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { navigate } from '../../router'
import { gameRepo, playerRepo, playEventRepo } from '../../data/repositories'
import { EditPlayPanel } from '../live-scoring/EditPlayPanel'
import {
  destinationsToRunnerState,
  OUTCOME_LABELS,
  RunnerDestinations,
} from '../live-scoring/recordPlay'
import { useSeasons } from '../team/useSeasons'
import { statRebuilderService } from '../../domain'
import type { GameRow, PlayEventRow, PlayerRow, PlayOutcome, RunnerState } from '../../data/schema'

interface Props {
  teamId: string
  seasonId: string
  gameId: string
}

async function recomputeRunnerStates(gameId: string): Promise<void> {
  const events = await playEventRepo.findByGameOrdered(gameId)
  let runners: RunnerState = {}
  let outs = 0

  for (const ev of events) {
    const changed = JSON.stringify(ev.runnersBefore) !== JSON.stringify(runners)
    if (changed) {
      await playEventRepo.update(ev.id, { runnersBefore: { ...runners } })
    }
    runners = { ...ev.runnersAfter }
    outs += ev.outsRecorded
    if (outs >= 3) {
      outs = 0
      runners = {}
    }
  }
}

export function PlayLogScreen({ teamId, seasonId, gameId }: Props) {
  const seasons = useSeasons(teamId)
  const [game, setGame] = useState<GameRow | null>(null)
  const [players, setPlayers] = useState<PlayerRow[] | undefined>(undefined)
  const [events, setEvents] = useState<PlayEventRow[] | undefined>(undefined)
  const [editingPlay, setEditingPlay] = useState<PlayEventRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loadKey, setLoadKey] = useState(0)

  const season = seasons?.find(s => s.id === seasonId)

  useEffect(() => {
    gameRepo.findById(gameId).then(g => setGame(g ?? null))
    playerRepo.findByTeam(teamId).then(setPlayers)
    playEventRepo.findByGameOrdered(gameId).then(setEvents)
  }, [gameId, teamId, loadKey])

  function reload() {
    setLoadKey(k => k + 1)
  }

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  async function handleDelete(ev: PlayEventRow) {
    if (saving) return
    const label = OUTCOME_LABELS[ev.outcome]?.full ?? 'this play'
    if (!window.confirm(`Delete this play?\n${label}`)) return
    setSaving(true)
    try {
      await playEventRepo.delete(ev.id)
      await recomputeRunnerStates(gameId)
      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      reload()
      showToast(`Deleted: ${label}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSave(outcome: PlayOutcome, dests: RunnerDestinations) {
    if (!editingPlay || saving) return
    setSaving(true)
    try {
      const isBREvent = outcome === 'stolen_base' || outcome === 'caught_stealing'
      const { runnersAfter, runsScored, outsRecorded } = destinationsToRunnerState(
        dests,
        editingPlay.runnersBefore,
        editingPlay.batterPlayerId
      )
      const rbiCount = outcome === 'field_error' ? 0 : runsScored
      const isEarnedRun = outcome !== 'field_error'

      await playEventRepo.update(editingPlay.id, {
        outcome,
        batterPlayerId: isBREvent ? '' : editingPlay.batterPlayerId,
        runnersAfter,
        runsScored,
        rbiCount,
        outsRecorded,
        isEarnedRun,
      })
      await recomputeRunnerStates(gameId)
      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      setEditingPlay(null)
      reload()
      showToast(`Updated: ${OUTCOME_LABELS[outcome].full}`)
    } finally {
      setSaving(false)
    }
  }

  const isLoading = !game || players === undefined || events === undefined

  if (isLoading) {
    return (
      <div class="min-h-screen bg-background">
        <div class="h-28 bg-primary animate-pulse" />
        <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} class="h-16 rounded border border-border bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {editingPlay && (
        <EditPlayPanel
          playEvent={editingPlay}
          players={players}
          onSave={handleEditSave}
          onCancel={() => setEditingPlay(null)}
        />
      )}

      <div class="min-h-screen bg-background pb-24">
        <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
          <div class="max-w-lg mx-auto">
            <div class="flex items-center justify-between">
            <button
              class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
              onClick={() => navigate({ page: 'score', teamId, seasonId, gameId })}
            >
              <span class="text-base">‹</span> Live Scoring
            </button>
            <button
              class="text-white/70 text-sm mb-2 min-h-[44px] px-1 hover:text-white transition-colors"
              onClick={() => navigate({ page: 'game-summary', teamId, seasonId, gameId })}
            >
              Summary ›
            </button>
          </div>
            <h1 class="text-white text-xl font-bold">Play Log</h1>
            <p class="text-white/60 text-sm mt-0.5">
              vs. {game.opponent}{season ? ` · ${season.name}` : ''}
              {events.length > 0 ? ` · ${events.length} play${events.length !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </header>

        <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
          {events.length === 0 ? (
            <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span class="text-3xl">📋</span>
              <p class="text-text-main font-semibold">No plays recorded yet</p>
              <p class="text-sm text-gray-500 max-w-xs">
                Plays will appear here as you record them during the game.
              </p>
              <Button
                size="md"
                onClick={() => navigate({ page: 'score', teamId, seasonId, gameId })}
              >
                Go to Live Scoring
              </Button>
            </div>
          ) : (
            events.map(ev => {
              const batter = players.find(p => p.id === ev.batterPlayerId)
              const halfArrow = ev.halfInning === 'top' ? '▲' : '▼'
              const isBREvent = ev.outcome === 'stolen_base' || ev.outcome === 'caught_stealing'
              const isOpponentScore = ev.outcome === 'opponent_score'
              const outcomeLabel = OUTCOME_LABELS[ev.outcome]?.full ?? 'Unknown'
              const runLabel =
                ev.runsScored === 1 ? '1 run' : ev.runsScored > 1 ? `${ev.runsScored} runs` : ''
              const outLabel =
                ev.outsRecorded === 1
                  ? '1 out'
                  : ev.outsRecorded > 1
                  ? `${ev.outsRecorded} outs`
                  : ''
              const meta = [runLabel, outLabel].filter(Boolean).join(' · ')

              return (
                <Card key={ev.id}>
                  <div class="flex items-center gap-3">
                    {/* Inning indicator */}
                    <div class="flex flex-col items-center shrink-0 w-8 text-center">
                      <span class="text-xs text-gray-400 leading-none">{halfArrow}</span>
                      <span class="text-sm font-bold font-tnum text-text-main leading-snug">
                        {ev.inning}
                      </span>
                    </div>

                    {/* Play details */}
                    <div class="flex-1 min-w-0">
                      {!isBREvent && !isOpponentScore && batter && (
                        <p class="text-xs text-gray-400 truncate mb-0.5">
                          #{batter.jerseyNumber} {batter.firstName} {batter.lastName}
                        </p>
                      )}
                      <p class={`font-semibold text-sm leading-snug ${isOpponentScore ? 'text-clay' : 'text-text-main'}`}>
                        {outcomeLabel}
                      </p>
                      {meta && (
                        <p class="text-xs text-gray-400 mt-0.5">{meta}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div class="flex gap-2 shrink-0">
                      {!isOpponentScore && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setEditingPlay(ev)}
                          class="px-3 py-2 min-h-[44px] rounded border border-border text-sm font-medium text-text-main bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDelete(ev)}
                        class="px-3 py-2 min-h-[44px] rounded border border-clay/30 text-sm font-medium text-clay bg-clay/5 hover:bg-clay/10 disabled:opacity-40 transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {toast && (
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </>
  )
}
