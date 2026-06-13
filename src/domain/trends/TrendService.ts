import type { BattingStats, PitchingStats } from '../stat-engine/types'
import type {
  BattingTrendWindow,
  PitchingTrendWindow,
  PlayerBattingTrends,
  PlayerPitchingTrends,
} from './types'

function sumField(games: Record<string, number>[], key: string): number {
  return games.reduce((acc, g) => acc + (g[key] ?? 0), 0)
}

function makeBattingWindow(games: BattingStats[]): BattingTrendWindow {
  if (games.length === 0) {
    return {
      gamesInWindow: 0,
      stats: {
        plateAppearances: 0, atBats: 0, hits: 0,
        singles: 0, doubles: 0, triples: 0, homeRuns: 0,
        runs: 0, runsBattedIn: 0,
        walks: 0, intentionalWalks: 0, hitByPitch: 0,
        strikeouts: 0, stolenBases: 0, caughtStealing: 0, sacFlies: 0,
        battingAverage: 0, onBasePct: 0, sluggingPct: 0, ops: 0,
      },
    }
  }

  const g = games as unknown as Record<string, number>[]

  const plateAppearances  = sumField(g, 'plateAppearances')
  const atBats            = sumField(g, 'atBats')
  const singles           = sumField(g, 'singles')
  const doubles           = sumField(g, 'doubles')
  const triples           = sumField(g, 'triples')
  const homeRuns          = sumField(g, 'homeRuns')
  const hits              = singles + doubles + triples + homeRuns
  const runs              = sumField(g, 'runs')
  const runsBattedIn      = sumField(g, 'runsBattedIn')
  const walks             = sumField(g, 'walks')
  const intentionalWalks  = sumField(g, 'intentionalWalks')
  const hitByPitch        = sumField(g, 'hitByPitch')
  const strikeouts        = sumField(g, 'strikeouts')
  const stolenBases       = sumField(g, 'stolenBases')
  const caughtStealing    = sumField(g, 'caughtStealing')
  const sacFlies          = sumField(g, 'sacFlies')

  const battingAverage = atBats > 0 ? hits / atBats : 0

  const allWalks       = walks + intentionalWalks
  const obpNumerator   = hits + allWalks + hitByPitch
  const obpDenominator = atBats + allWalks + hitByPitch + sacFlies
  const onBasePct      = obpDenominator > 0 ? obpNumerator / obpDenominator : 0

  const totalBases  = singles + 2 * doubles + 3 * triples + 4 * homeRuns
  const sluggingPct = atBats > 0 ? totalBases / atBats : 0

  const ops = onBasePct + sluggingPct

  return {
    gamesInWindow: games.length,
    stats: {
      plateAppearances, atBats, hits,
      singles, doubles, triples, homeRuns,
      runs, runsBattedIn,
      walks, intentionalWalks, hitByPitch,
      strikeouts, stolenBases, caughtStealing, sacFlies,
      battingAverage, onBasePct, sluggingPct, ops,
    },
  }
}

function makePitchingWindow(games: PitchingStats[]): PitchingTrendWindow {
  if (games.length === 0) {
    return {
      gamesInWindow: 0,
      stats: {
        outsRecorded: 0, battersFaced: 0,
        hitsAllowed: 0, runsAllowed: 0, earnedRuns: 0,
        walksAllowed: 0, strikeouts: 0, hitBatters: 0, pitchCount: 0,
        era: 0, whip: 0,
      },
    }
  }

  const g = games as unknown as Record<string, number>[]

  const outsRecorded = sumField(g, 'outsRecorded')
  const battersFaced = sumField(g, 'battersFaced')
  const hitsAllowed  = sumField(g, 'hitsAllowed')
  const runsAllowed  = sumField(g, 'runsAllowed')
  const earnedRuns   = sumField(g, 'earnedRuns')
  const walksAllowed = sumField(g, 'walksAllowed')
  const strikeouts   = sumField(g, 'strikeouts')
  const hitBatters   = sumField(g, 'hitBatters')
  const pitchCount   = sumField(g, 'pitchCount')

  // ERA = (ER / outs) * 27; WHIP = (BB + H) / (outs / 3)
  const era  = outsRecorded > 0 ? (earnedRuns / outsRecorded) * 27 : 0
  const whip = outsRecorded > 0 ? (walksAllowed + hitsAllowed) / (outsRecorded / 3) : 0

  return {
    gamesInWindow: games.length,
    stats: {
      outsRecorded, battersFaced,
      hitsAllowed, runsAllowed, earnedRuns,
      walksAllowed, strikeouts, hitBatters, pitchCount,
      era, whip,
    },
  }
}

export class TrendService {
  /**
   * Compute last-3, last-5, and season-to-date batting windows for one player.
   * @param gameStats Per-game BattingStats ordered oldest-first.
   */
  computeBattingTrends(gameStats: BattingStats[]): PlayerBattingTrends {
    const n = gameStats.length
    return {
      last3:        makeBattingWindow(gameStats.slice(Math.max(0, n - 3))),
      last5:        makeBattingWindow(gameStats.slice(Math.max(0, n - 5))),
      seasonToDate: makeBattingWindow(gameStats),
    }
  }

  /**
   * Compute last-3, last-5, and season-to-date pitching windows for one player.
   * @param gameStats Per-game PitchingStats ordered oldest-first.
   */
  computePitchingTrends(gameStats: PitchingStats[]): PlayerPitchingTrends {
    const n = gameStats.length
    return {
      last3:        makePitchingWindow(gameStats.slice(Math.max(0, n - 3))),
      last5:        makePitchingWindow(gameStats.slice(Math.max(0, n - 5))),
      seasonToDate: makePitchingWindow(gameStats),
    }
  }
}

export const trendService = new TrendService()
