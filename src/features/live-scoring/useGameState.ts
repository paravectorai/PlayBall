import { useEffect, useState } from 'preact/hooks'
import { lineupRepo, playEventRepo, gameRepo } from '../../data/repositories'
import type { LiveGameState, LiveLineupEntry } from '../../domain/game-state/types'
import type { GameRow, HalfInning, PlayEventRow, RunnerState } from '../../data/schema'

function buildLiveState(
  game: GameRow,
  lineup: LiveLineupEntry[],
  events: PlayEventRow[]
): LiveGameState {
  // The half-inning in which OUR team bats.
  // home team bats in 'bottom'; away team bats in 'top'.
  const ourHalf: HalfInning = game.homeAway === 'home' ? 'bottom' : 'top'
  const opponentHalf: HalfInning = ourHalf === 'bottom' ? 'top' : 'bottom'

  let inning = 1
  let halfInning: HalfInning = 'top'
  let outs = 0
  let runners: RunnerState = {}
  let ourRuns = 0
  let opponentRuns = 0
  let batterIndex = 0
  let lastPlayEventId: string | null = null

  for (const ev of events) {
    lastPlayEventId = ev.id

    // Credit runs to the correct team based on which half-inning the event occurred in.
    // 'opponent_score' events store opponent quick-score runs in the opponent's half.
    if (ev.halfInning === ourHalf) {
      ourRuns += ev.runsScored
    } else {
      opponentRuns += ev.runsScored
    }

    runners = ev.runnersAfter

    // Only advance the batter index for our half-inning plate appearances.
    const isBaseRunningOnly = ev.outcome === 'stolen_base' || ev.outcome === 'caught_stealing'
    const isOpponentEvent = ev.halfInning === opponentHalf
    if (!isBaseRunningOnly && !isOpponentEvent && lineup.length > 0) {
      batterIndex = (batterIndex + 1) % lineup.length
    }

    outs += ev.outsRecorded
    if (outs >= 3) {
      outs = 0
      runners = {}
      if (halfInning === 'top') {
        halfInning = 'bottom'
      } else {
        halfInning = 'top'
        inning += 1
      }
    }
  }

  const pitcher = lineup.find(l => l.position === 'P')

  // Assign to home/away score slots.
  const homeScore = game.homeAway === 'home' ? ourRuns : opponentRuns
  const awayScore  = game.homeAway === 'away' ? ourRuns : opponentRuns

  // Determine the current scoring mode based on the active half-inning.
  const isOurHalfNow = halfInning === ourHalf
  const scoringMode: LiveGameState['scoringMode'] = isOurHalfNow
    ? 'our_half'
    : game.opponentTeamId
    ? 'opponent_lineup'
    : 'opponent_quick'

  return {
    gameId: game.id,
    currentInning: inning,
    halfInning,
    outs,
    runners,
    homeScore,
    awayScore,
    opponentRuns,
    lineupOrdered: lineup,
    currentBatterIndex: batterIndex,
    currentPitcherPlayerId: pitcher?.playerId ?? '',
    lastPlayEventId,
    isGameOver: inning > game.inningsScheduled || game.status === 'completed',
    isPaused: false,
    scoringMode,
  }
}

export function useGameState(gameId: string) {
  const [state, setState] = useState<LiveGameState | null>(null)
  const [game, setGame] = useState<GameRow | null>(null)
  const [loadKey, setLoadKey] = useState(0)

  function reload() {
    setLoadKey(k => k + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [g, lineupRows, events] = await Promise.all([
        gameRepo.findById(gameId),
        lineupRepo.findByGame(gameId),
        playEventRepo.findByGameOrdered(gameId),
      ])

      if (cancelled || !g) return

      const lineup: LiveLineupEntry[] = lineupRows
        .filter(l => l.battingOrder > 0)
        .sort((a, b) => a.battingOrder - b.battingOrder)
        .map(l => ({ battingOrder: l.battingOrder, playerId: l.playerId, position: l.position }))

      setGame(g)
      setState(buildLiveState(g, lineup, events))
    }

    load()
    return () => { cancelled = true }
  }, [gameId, loadKey])

  return { state, game, setState, reload }
}
