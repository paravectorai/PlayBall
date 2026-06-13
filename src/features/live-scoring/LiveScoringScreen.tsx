import { useEffect, useRef, useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { navigate } from '../../router'
import { gameRepo, playerRepo, playEventRepo } from '../../data/repositories'
import { useGameState } from './useGameState'
import { useSeasons } from '../team/useSeasons'
import { OutcomeGrid, BaseRunningButtons } from './OutcomeGrid'
import { RunnerPanel } from './RunnerPanel'
import { EditPlayPanel } from './EditPlayPanel'
import {
  computeDefaultAdvancement,
  destinationsToRunnerState,
  countRunners,
  OUTCOME_LABELS,
  DefaultAdvancement,
  RunnerDestinations,
} from './recordPlay'
import { statRebuilderService } from '../../domain'
import type { PlayerRow, PlayEventRow, RunnerState, HalfInning, HomeAway, PlayOutcome } from '../../data/schema'

interface Props {
  teamId: string
  seasonId: string
  gameId: string
}

export function LiveScoringScreen({ teamId, seasonId, gameId }: Props) {
  const seasons = useSeasons(teamId)
  const { state, game, setState, reload } = useGameState(gameId)
  const [players, setPlayers] = useState<PlayerRow[] | undefined>(undefined)

  const season = seasons?.find(s => s.id === seasonId)

  // Pending play state — set when runner input is required before saving
  const [pendingPlay, setPendingPlay] = useState<{
    outcome: PlayOutcome
    defaults: DefaultAdvancement
  } | null>(null)

  const [lastEvent, setLastEvent] = useState<PlayEventRow | null>(null)
  const [editingPlay, setEditingPlay] = useState<PlayEventRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Quick-score panel state: how many opponent runs to record this half
  const [quickRunDelta, setQuickRunDelta] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    playerRepo.findByTeam(teamId).then(setPlayers)
  }, [teamId])

  useEffect(() => {
    if (game && game.status === 'scheduled') {
      gameRepo.update(gameId, { status: 'in_progress' })
    }
  }, [game?.status, gameId])

  useEffect(() => {
    if (!state?.lastPlayEventId) {
      setLastEvent(null)
      return
    }
    playEventRepo.findById(state.lastPlayEventId).then(ev => setLastEvent(ev ?? null))
  }, [state?.lastPlayEventId])

  // Reset quick-run delta when half-inning changes
  const prevHalfRef = useRef<string | null>(null)
  useEffect(() => {
    if (!state) return
    const key = `${state.currentInning}-${state.halfInning}`
    if (prevHalfRef.current !== key) {
      setQuickRunDelta(0)
      prevHalfRef.current = key
    }
  }, [state?.currentInning, state?.halfInning])

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  async function savePlay(outcome: PlayOutcome, dests: RunnerDestinations) {
    if (saving || !state) return
    setSaving(true)
    try {
      const currentBatter = state.lineupOrdered[state.currentBatterIndex]
      const batterPlayerId = currentBatter?.playerId ?? ''
      const isBREvent = outcome === 'stolen_base' || outcome === 'caught_stealing'

      const { runnersAfter, runsScored, outsRecorded } = destinationsToRunnerState(
        dests,
        state.runners,
        batterPlayerId
      )

      const rbiCount = outcome === 'field_error' ? 0 : runsScored
      const isEarnedRun = outcome !== 'field_error'

      const seqNum = await playEventRepo.nextSequenceNumber(gameId)

      await playEventRepo.create({
        gameId,
        sequenceNumber: seqNum,
        inning: state.currentInning,
        halfInning: state.halfInning,
        batterPlayerId: isBREvent ? '' : batterPlayerId,
        pitcherPlayerId: state.currentPitcherPlayerId,
        outcome,
        runnersBefore: state.runners,
        runnersAfter,
        runsScored,
        rbiCount,
        outsRecorded,
        isEarnedRun,
        notes: '',
      })

      // Rebuild game and season stat caches, then reload UI state
      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      reload()
      setPendingPlay(null)

      // Build toast
      const label = OUTCOME_LABELS[outcome].full
      const runMsg = runsScored === 1 ? '1 run' : runsScored > 1 ? `${runsScored} runs` : ''
      const toastMsg = runMsg ? `${label} · ${runMsg}` : label
      showToast(toastMsg)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Save opponent quick-score runs as a synthetic 'opponent_score' play event.
   * These events do NOT advance the batter index or generate player stats.
   */
  async function saveOpponentRuns(runs: number) {
    if (saving || !state || runs < 1) return
    setSaving(true)
    try {
      // Opponent bats in the half-inning opposite to ours
      const opponentHalf: HalfInning = state.halfInning

      const seqNum = await playEventRepo.nextSequenceNumber(gameId)
      await playEventRepo.create({
        gameId,
        sequenceNumber: seqNum,
        inning: state.currentInning,
        halfInning: opponentHalf,
        batterPlayerId: '',
        pitcherPlayerId: '',
        outcome: 'opponent_score',
        runnersBefore: {},
        runnersAfter: {},
        runsScored: runs,
        rbiCount: 0,
        outsRecorded: 0,
        isEarnedRun: true,
        notes: '',
      })

      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      reload()
      setQuickRunDelta(0)
      showToast(`${runs} opponent run${runs > 1 ? 's' : ''} recorded`)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Manually end the current half-inning without 3 outs being recorded.
   * Records a synthetic outs event to push the state machine forward.
   */
  async function handleEndHalfInning() {
    if (saving || !state) return
    const outsNeeded = 3 - state.outs
    if (outsNeeded <= 0) return
    setSaving(true)
    try {
      const seqNum = await playEventRepo.nextSequenceNumber(gameId)
      await playEventRepo.create({
        gameId,
        sequenceNumber: seqNum,
        inning: state.currentInning,
        halfInning: state.halfInning,
        batterPlayerId: '',
        pitcherPlayerId: '',
        outcome: 'field_out',
        runnersBefore: state.runners,
        runnersAfter: {},
        runsScored: 0,
        rbiCount: 0,
        outsRecorded: outsNeeded,
        isEarnedRun: true,
        notes: 'manual-end-half',
      })
      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      reload()
      showToast('Half-inning ended')
    } finally {
      setSaving(false)
    }
  }

  async function handleEndGame() {
    if (saving) return
    setSaving(true)
    try {
      await gameRepo.update(gameId, { status: 'completed' })
      navigate({ page: 'game-summary', teamId, seasonId, gameId })
    } finally {
      setSaving(false)
    }
  }

  async function handleUndoLastPlay() {
    if (!lastEvent || saving) return
    setSaving(true)
    try {
      await playEventRepo.delete(lastEvent.id)
      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      setLastEvent(null)
      reload()
      showToast(`Undone: ${OUTCOME_LABELS[lastEvent.outcome].full}`)
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
      await statRebuilderService.rebuildGameStats(gameId)
      await statRebuilderService.rebuildSeasonStats(seasonId)
      setEditingPlay(null)
      reload()
      showToast(`Updated: ${OUTCOME_LABELS[outcome].full}`)
    } finally {
      setSaving(false)
    }
  }

  function handleOutcomeTap(outcome: PlayOutcome) {
    if (!state || saving) return
    const batterPlayerId = state.lineupOrdered[state.currentBatterIndex]?.playerId ?? ''
    const defaults = computeDefaultAdvancement(outcome, state.runners, batterPlayerId)

    if (defaults.needsRunnerInput) {
      setPendingPlay({ outcome, defaults })
    } else {
      savePlay(outcome, defaults.destinations)
    }
  }

  function handleRunnerConfirm(dests: RunnerDestinations) {
    if (!pendingPlay) return
    savePlay(pendingPlay.outcome, dests)
  }

  function handleSelectBatter(index: number) {
    setState(prev => prev ? { ...prev, currentBatterIndex: index } : prev)
  }

  const isLoading = !state || !game || players === undefined

  if (isLoading) {
    return (
      <div class="min-h-screen bg-background">
        <div class="h-28 bg-primary animate-pulse" />
        <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} class="h-20 rounded border border-border bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const {
    currentInning,
    halfInning,
    outs,
    runners,
    homeScore,
    awayScore,
    lineupOrdered,
    currentBatterIndex,
    scoringMode,
  } = state

  const playerMap = new Map(players.map(p => [p.id, p]))
  const currentBatter = lineupOrdered[currentBatterIndex]
  const currentBatterPlayer = playerMap.get(currentBatter?.playerId ?? '')
  const hasRunners = countRunners(runners) > 0

  return (
    <>
      {/* Runner advancement panel — full-screen overlay */}
      {pendingPlay && (
        <RunnerPanel
          outcome={pendingPlay.outcome}
          runnersBefore={runners}
          batterPlayerId={currentBatter?.playerId ?? ''}
          defaults={pendingPlay.defaults}
          players={players}
          onConfirm={handleRunnerConfirm}
          onCancel={() => setPendingPlay(null)}
        />
      )}

      {/* Edit last play — full-screen overlay */}
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
            <div class="flex items-center justify-between mb-1">
              <button
                class="flex items-center gap-1 text-white/70 text-sm min-h-[44px] -ml-1 px-1"
                onClick={() => navigate({ page: 'lineup', teamId, seasonId, gameId })}
              >
                <span class="text-base">‹</span> Lineup
              </button>
              <button
                class="text-white/70 text-sm min-h-[44px] px-1"
                onClick={() => navigate({ page: 'play-log', teamId, seasonId, gameId })}
              >
                Log ›
              </button>
            </div>
            <h1 class="text-white text-xl font-bold">vs. {game.opponent}</h1>
            {season && <p class="text-white/60 text-sm mt-0.5">{season.name}</p>}
          </div>
        </header>

        <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
          <ScoreboardHUD
            inning={currentInning}
            halfInning={halfInning}
            outs={outs}
            runners={runners}
            homeScore={homeScore}
            awayScore={awayScore}
            homeAway={game.homeAway}
            opponent={game.opponent}
          />

          {/* Game-over banner — shown once all scheduled innings are complete */}
          {state.isGameOver && (
            <GameOverBanner
              homeScore={homeScore}
              awayScore={awayScore}
              homeAway={game.homeAway}
              opponent={game.opponent}
              saving={saving}
              alreadyFinal={game.status === 'completed'}
              onEndGame={handleEndGame}
              onViewSummary={() => navigate({ page: 'game-summary', teamId, seasonId, gameId })}
            />
          )}

          {/* ================================================================
              OUR HALF-INNING: full outcome grid + batting order
              ================================================================ */}
          {scoringMode === 'our_half' && (
            lineupOrdered.length === 0 ? (
              <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <span class="text-3xl">⚾</span>
                <p class="text-text-main font-semibold">No lineup set</p>
                <p class="text-sm text-gray-500 max-w-xs">
                  Return to Lineup to add players to the batting order before scoring.
                </p>
                <Button
                  size="md"
                  onClick={() => navigate({ page: 'lineup', teamId, seasonId, gameId })}
                >
                  Go to Lineup
                </Button>
              </div>
            ) : (
              <>
                {/* Now Batting */}
                <section>
                  <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Now Batting
                  </h2>
                  <Card>
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-clay/10 flex items-center justify-center shrink-0">
                        <span class="text-clay font-bold font-tnum text-lg">
                          {currentBatterPlayer?.jerseyNumber ?? '#'}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-bold text-text-main text-lg truncate">
                          {currentBatterPlayer
                            ? `${currentBatterPlayer.firstName} ${currentBatterPlayer.lastName}`
                            : '—'}
                        </p>
                        <p class="text-sm text-gray-500">
                          #{currentBatter?.battingOrder} · {currentBatter?.position}
                        </p>
                      </div>
                      <span class="text-xs font-semibold text-clay bg-clay/10 px-2 py-1 rounded-full shrink-0">
                        UP
                      </span>
                    </div>
                  </Card>
                </section>

                {/* Outcome button grid */}
                <section>
                  <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Outcome
                  </h2>
                  <OutcomeGrid onOutcome={handleOutcomeTap} disabled={saving} />

                  {hasRunners && (
                    <div class="mt-2">
                      <p class="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">
                        Base Running
                      </p>
                      <BaseRunningButtons
                        onOutcome={handleOutcomeTap}
                        disabled={saving}
                        hasRunners={hasRunners}
                      />
                    </div>
                  )}
                </section>

                {/* Last play — undo / edit */}
                {lastEvent && lastEvent.outcome !== 'opponent_score' && (
                  <LastPlayCard
                    lastEvent={lastEvent}
                    saving={saving}
                    onEdit={() => setEditingPlay(lastEvent)}
                    onUndo={handleUndoLastPlay}
                  />
                )}

                {/* Batting order */}
                <section class="flex flex-col gap-2">
                  <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Batting Order
                  </h2>
                  {lineupOrdered.map((entry, idx) => {
                    const player = playerMap.get(entry.playerId)
                    const isActive = idx === currentBatterIndex
                    return (
                      <button
                        key={entry.playerId}
                        type="button"
                        class={[
                          'w-full text-left flex items-center gap-3 px-4 py-3 rounded border min-h-[60px] transition-colors',
                          isActive
                            ? 'bg-clay/5 border-clay'
                            : 'bg-surface border-border hover:border-primary hover:bg-primary/5',
                        ].join(' ')}
                        onClick={() => !isActive && handleSelectBatter(idx)}
                      >
                        <span
                          class={`w-6 text-center font-bold font-tnum text-sm shrink-0 ${isActive ? 'text-clay' : 'text-gray-400'}`}
                        >
                          {entry.battingOrder}
                        </span>
                        <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span class="text-primary font-bold font-tnum text-xs">
                            {player?.jerseyNumber ?? '#'}
                          </span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p
                            class={`font-semibold truncate text-sm ${isActive ? 'text-clay' : 'text-text-main'}`}
                          >
                            {player ? `${player.firstName} ${player.lastName}` : 'Unknown'}
                          </p>
                          <p class="text-xs text-gray-500">{entry.position}</p>
                        </div>
                        {isActive && (
                          <span class="text-xs font-semibold text-clay shrink-0">UP</span>
                        )}
                      </button>
                    )
                  })}
                </section>

                {/* End half-inning button */}
                <section>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleEndHalfInning}
                    class="w-full min-h-[44px] rounded border border-border text-sm font-medium text-gray-500 bg-surface hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    End Half-Inning (3 outs)
                  </button>
                </section>

                {/* End game button — always available for mercy rule / called games */}
                {!state.isGameOver && (
                  <section>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleEndGame}
                      class="w-full min-h-[44px] rounded border border-border text-sm font-medium text-gray-500 bg-surface hover:border-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                    >
                      End Game → Summary
                    </button>
                  </section>
                )}
              </>
            )
          )}

          {/* ================================================================
              OPPONENT HALF-INNING: quick-score mode (+/– counter)
              ================================================================ */}
          {scoringMode === 'opponent_quick' && (
            <OpponentQuickScorePanel
              inning={currentInning}
              halfInning={halfInning}
              opponent={game.opponent}
              runDelta={quickRunDelta}
              saving={saving}
              lastEvent={lastEvent}
              showEndGame={!state.isGameOver}
              onIncrement={() => setQuickRunDelta(d => d + 1)}
              onDecrement={() => setQuickRunDelta(d => Math.max(0, d - 1))}
              onSave={() => saveOpponentRuns(quickRunDelta)}
              onEndHalf={handleEndHalfInning}
              onEndGame={handleEndGame}
              onUndo={lastEvent?.outcome === 'opponent_score' ? handleUndoLastPlay : undefined}
            />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Last-play undo/edit card (shown during our half only)
// ---------------------------------------------------------------------------

interface LastPlayCardProps {
  lastEvent: PlayEventRow
  saving: boolean
  onEdit: () => void
  onUndo: () => void
}

function LastPlayCard({ lastEvent, saving, onEdit, onUndo }: LastPlayCardProps) {
  return (
    <section>
      <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Last Play
      </h2>
      <Card>
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-text-main">
              {OUTCOME_LABELS[lastEvent.outcome].full}
            </p>
            <p class="text-xs text-gray-500">
              {lastEvent.halfInning === 'top' ? '▲' : '▼'} {lastEvent.inning}
              {lastEvent.runsScored > 0
                ? ` · ${lastEvent.runsScored} run${lastEvent.runsScored > 1 ? 's' : ''}`
                : ''}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onEdit}
              class="px-3 py-2 min-h-[44px] rounded border border-border text-sm font-medium text-text-main bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onUndo}
              class="px-3 py-2 min-h-[44px] rounded border border-clay/30 text-sm font-medium text-clay bg-clay/5 hover:bg-clay/10 disabled:opacity-40 transition-colors"
            >
              Undo
            </button>
          </div>
        </div>
      </Card>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Game-over banner
// ---------------------------------------------------------------------------

interface GameOverBannerProps {
  homeScore: number
  awayScore: number
  homeAway: HomeAway
  opponent: string
  saving: boolean
  alreadyFinal: boolean
  onEndGame: () => void
  onViewSummary: () => void
}

function GameOverBanner({
  homeScore,
  awayScore,
  homeAway,
  opponent,
  saving,
  alreadyFinal,
  onEndGame,
  onViewSummary,
}: GameOverBannerProps) {
  const ourScore = homeAway === 'home' ? homeScore : awayScore
  const theirScore = homeAway === 'home' ? awayScore : homeScore
  const won = ourScore > theirScore
  const tied = ourScore === theirScore

  return (
    <div
      class={[
        'rounded-xl border-2 px-4 py-5 flex flex-col gap-4 text-center',
        won
          ? 'border-green-400 bg-green-50'
          : tied
          ? 'border-gray-300 bg-gray-50'
          : 'border-clay/40 bg-clay/5',
      ].join(' ')}
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
          Game Over
        </p>
        <p
          class={`text-2xl font-bold ${won ? 'text-green-700' : tied ? 'text-gray-600' : 'text-clay'}`}
        >
          {won ? 'Win' : tied ? 'Tie' : 'Loss'} · {ourScore}–{theirScore}
        </p>
        <p class="text-sm text-gray-500 mt-0.5">vs. {opponent}</p>
      </div>
      {alreadyFinal ? (
        <Button size="md" onClick={onViewSummary}>
          View Summary
        </Button>
      ) : (
        <Button size="md" disabled={saving} onClick={onEndGame}>
          {saving ? 'Saving…' : 'End Game → Summary'}
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Opponent quick-score panel
// ---------------------------------------------------------------------------

interface OpponentQuickScorePanelProps {
  inning: number
  halfInning: HalfInning
  opponent: string
  runDelta: number
  saving: boolean
  lastEvent: PlayEventRow | null
  showEndGame: boolean
  onIncrement: () => void
  onDecrement: () => void
  onSave: () => void
  onEndHalf: () => void
  onEndGame: () => void
  onUndo?: () => void
}

function OpponentQuickScorePanel({
  inning,
  halfInning,
  opponent,
  runDelta,
  saving,
  lastEvent,
  showEndGame,
  onIncrement,
  onDecrement,
  onSave,
  onEndHalf,
  onEndGame,
  onUndo,
}: OpponentQuickScorePanelProps) {
  const halfArrow = halfInning === 'top' ? '▲' : '▼'
  const opponentAbbr = opponent.length > 20 ? opponent.slice(0, 20) + '…' : opponent

  return (
    <>
      {/* Orange-tinted header banner to visually signal opponent territory */}
      <div class="rounded-xl border-2 border-clay/40 bg-clay/5 px-4 py-5 flex flex-col gap-5">
        {/* Label */}
        <div class="text-center">
          <p class="text-xs font-semibold uppercase tracking-widest text-clay mb-0.5">
            {halfArrow} {inning} — Opponent at bat
          </p>
          <p class="text-xl font-bold text-text-main">{opponentAbbr}</p>
        </div>

        {/* +/– counter */}
        <div class="flex items-center justify-center gap-6">
          <button
            type="button"
            disabled={saving || runDelta === 0}
            onClick={onDecrement}
            class="w-16 h-16 rounded-full bg-white border-2 border-clay/30 text-clay text-3xl font-bold flex items-center justify-center hover:bg-clay/10 disabled:opacity-40 transition-colors"
            aria-label="Remove run"
          >
            –
          </button>

          <div class="flex flex-col items-center min-w-[4rem]">
            <span class="text-6xl font-bold font-tnum text-text-main leading-none">
              {runDelta}
            </span>
            <span class="text-xs text-gray-400 mt-1 uppercase tracking-wide">
              {runDelta === 1 ? 'run' : 'runs'}
            </span>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onIncrement}
            class="w-16 h-16 rounded-full bg-clay text-white text-3xl font-bold flex items-center justify-center hover:bg-clay/80 disabled:opacity-40 transition-colors shadow-sm"
            aria-label="Add run"
          >
            +
          </button>
        </div>

        {/* Save runs button */}
        <button
          type="button"
          disabled={saving || runDelta === 0}
          onClick={onSave}
          class="w-full min-h-[52px] rounded-lg bg-clay text-white text-base font-semibold hover:bg-clay/80 disabled:opacity-40 transition-colors shadow-sm"
        >
          {saving ? 'Saving…' : `Record ${runDelta} Run${runDelta !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Last opponent score — undo */}
      {lastEvent?.outcome === 'opponent_score' && onUndo && (
        <section>
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Last Entry
          </h2>
          <Card>
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-text-main">
                  {lastEvent.runsScored} opponent run{lastEvent.runsScored !== 1 ? 's' : ''}
                </p>
                <p class="text-xs text-gray-500">
                  {lastEvent.halfInning === 'top' ? '▲' : '▼'} {lastEvent.inning} · manual entry
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={onUndo}
                class="px-3 py-2 min-h-[44px] rounded border border-clay/30 text-sm font-medium text-clay bg-clay/5 hover:bg-clay/10 disabled:opacity-40 transition-colors"
              >
                Undo
              </button>
            </div>
          </Card>
        </section>
      )}

      {/* End half-inning */}
      <section>
        <button
          type="button"
          disabled={saving}
          onClick={onEndHalf}
          class="w-full min-h-[44px] rounded border border-border text-sm font-medium text-gray-500 bg-surface hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
        >
          End Half-Inning (3 outs recorded)
        </button>
      </section>

      {/* End game button — available for mercy rule / called games */}
      {showEndGame && (
        <section>
          <button
            type="button"
            disabled={saving}
            onClick={onEndGame}
            class="w-full min-h-[44px] rounded border border-border text-sm font-medium text-gray-500 bg-surface hover:border-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
          >
            End Game → Summary
          </button>
        </section>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Scoreboard HUD
// ---------------------------------------------------------------------------

interface ScoreboardHUDProps {
  inning: number
  halfInning: HalfInning
  outs: number
  runners: RunnerState
  homeScore: number
  awayScore: number
  homeAway: HomeAway
  opponent: string
}

function ScoreboardHUD({
  inning,
  halfInning,
  outs,
  runners,
  homeScore,
  awayScore,
  homeAway,
  opponent,
}: ScoreboardHUDProps) {
  const halfArrow = halfInning === 'top' ? '▲' : '▼'
  const opponentAbbr = opponent.length > 7 ? opponent.slice(0, 7) + '…' : opponent

  const awayLabel = homeAway === 'away' ? 'US' : opponentAbbr
  const homeLabel = homeAway === 'home' ? 'US' : opponentAbbr

  return (
    <Card padding={false}>
      <div class="px-4 py-4 flex items-center justify-between gap-2">
        {/* Score */}
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex flex-col items-center min-w-[48px]">
            <span class="text-xs text-gray-400 font-medium uppercase tracking-wide truncate max-w-[56px]">
              {awayLabel}
            </span>
            <span class="text-3xl font-bold font-tnum text-text-main leading-none mt-0.5">
              {awayScore}
            </span>
          </div>
          <span class="text-gray-300 text-2xl font-light leading-none">–</span>
          <div class="flex flex-col items-center min-w-[48px]">
            <span class="text-xs text-gray-400 font-medium uppercase tracking-wide truncate max-w-[56px]">
              {homeLabel}
            </span>
            <span class="text-3xl font-bold font-tnum text-text-main leading-none mt-0.5">
              {homeScore}
            </span>
          </div>
        </div>

        {/* Inning + outs */}
        <div class="flex flex-col items-center gap-1 shrink-0">
          <span class="text-base font-bold font-tnum text-text-main">
            {halfArrow} {inning}
          </span>
          <div class="flex items-center gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                class={`w-3 h-3 rounded-full border ${i < outs ? 'bg-clay border-clay' : 'bg-transparent border-gray-300'}`}
              />
            ))}
          </div>
          <span class="text-xs text-gray-400">
            {outs === 1 ? '1 out' : `${outs} outs`}
          </span>
        </div>

        {/* Runner diamond */}
        <RunnerDiamond runners={runners} />
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Runner diamond
// ---------------------------------------------------------------------------

function RunnerDiamond({ runners }: { runners: RunnerState }) {
  const first = !!runners.first
  const second = !!runners.second
  const third = !!runners.third

  const base = (occupied: boolean) =>
    [
      'w-4 h-4 rotate-45 border-2',
      occupied ? 'bg-clay border-clay' : 'bg-transparent border-gray-300',
    ].join(' ')

  return (
    <div class="relative w-14 h-14 shrink-0" aria-label="Runner positions">
      {/* 2B — top center */}
      <div class={`absolute top-0 left-1/2 -translate-x-1/2 ${base(second)}`} />
      {/* 3B — middle left */}
      <div class={`absolute top-1/2 left-0 -translate-y-1/2 ${base(third)}`} />
      {/* 1B — middle right */}
      <div class={`absolute top-1/2 right-0 -translate-y-1/2 ${base(first)}`} />
      {/* Home — bottom center */}
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2 bg-transparent border-gray-200" />
    </div>
  )
}
