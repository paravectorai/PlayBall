import type { PlayEventRow, PlayOutcome } from '@/data/schema'
import type { BattingStats } from './types'

// Outcomes that do not count as an official at-bat (per official baseball scoring rules).
const NON_AB_OUTCOMES = new Set<PlayOutcome>([
  'walk',
  'intentional_walk',
  'hit_by_pitch',
  'sac_fly',
  'sac_bunt',
  'catcher_interference',
])

type RunnerState = { first?: string; second?: string; third?: string }

function onAnyBase(playerId: string, state: RunnerState): boolean {
  return state.first === playerId || state.second === playerId || state.third === playerId
}

function baseNumber(playerId: string, state: RunnerState): 1 | 2 | 3 | null {
  if (state.first === playerId) return 1
  if (state.second === playerId) return 2
  if (state.third === playerId) return 3
  return null
}

/**
 * Determine whether the given player scored as a base runner on a specific play event.
 *
 * Attribution order: 3rd base runner scores before 2nd, 2nd before 1st. This is
 * correct for all standard situations; the edge case where a lower-base runner
 * scores while a higher-base runner is put out does not occur in typical play.
 */
function didPlayerScoreAsRunner(playerId: string, event: PlayEventRow): boolean {
  const before = event.runnersBefore
  const after = event.runnersAfter

  if (!onAnyBase(playerId, before)) return false
  if (onAnyBase(playerId, after)) return false // player stayed on base

  // Player disappeared — attribute runs in 3rd → 2nd → 1st priority.
  let runsLeft = event.runsScored

  // For home runs the batter's own run is already in runsScored; subtract it so
  // we only distribute base-runner runs here (batter run is counted separately).
  if (event.outcome === 'home_run') runsLeft--

  for (const runnerId of [before.third, before.second, before.first]) {
    if (!runnerId) continue
    if (onAnyBase(runnerId, after)) continue // this runner stayed on base

    if (runsLeft > 0) {
      if (runnerId === playerId) return true
      runsLeft--
    }
    // else: this runner was out on the basepaths
  }

  return false
}

/**
 * Return the player who stole a base on a stolen_base event.
 * The stealer is the runner who advanced to a higher base (or scored).
 */
function findStealer(event: PlayEventRow): string | null {
  const before = event.runnersBefore
  const after = event.runnersAfter

  for (const runnerId of [before.first, before.second, before.third]) {
    if (!runnerId) continue
    const baseBefore = baseNumber(runnerId, before)!
    const baseAfter = baseNumber(runnerId, after)
    if (baseAfter === null || baseAfter > baseBefore) return runnerId
  }
  return null
}

/**
 * Return the player who was caught stealing on a caught_stealing event.
 * The caught runner is the one who disappeared from the bases.
 */
function findCaughtStealing(event: PlayEventRow): string | null {
  const before = event.runnersBefore
  const after = event.runnersAfter

  for (const runnerId of [before.first, before.second, before.third]) {
    if (runnerId && !onAnyBase(runnerId, after)) return runnerId
  }
  return null
}

/**
 * Derive batting statistics for one player from the complete ordered event log of
 * a single game. All events for the game must be provided (not just this player's
 * events) because run scoring requires scanning runner state across all plays.
 *
 * Returns a fully populated BattingStats object. Rate stats are 0 when the
 * denominator is 0 — never NaN or undefined.
 */
export function deriveBattingStats(playerId: string, events: PlayEventRow[]): BattingStats {
  // Plate-appearance events: events where this player was the batter.
  // stolen_base and caught_stealing have batterPlayerId === '' so they are
  // naturally excluded by this filter.
  const paEvents = events.filter(e => e.batterPlayerId === playerId)

  // --- Count stats from batter's own PA events ---
  const plateAppearances = paEvents.length
  const singles          = paEvents.filter(e => e.outcome === 'single').length
  const doubles          = paEvents.filter(e => e.outcome === 'double').length
  const triples          = paEvents.filter(e => e.outcome === 'triple').length
  const homeRuns         = paEvents.filter(e => e.outcome === 'home_run').length
  const hits             = singles + doubles + triples + homeRuns

  const walks            = paEvents.filter(e => e.outcome === 'walk').length
  const intentionalWalks = paEvents.filter(e => e.outcome === 'intentional_walk').length
  const hitByPitch       = paEvents.filter(e => e.outcome === 'hit_by_pitch').length
  const strikeouts       = paEvents.filter(
    e => e.outcome === 'strikeout_swinging' || e.outcome === 'strikeout_looking'
  ).length
  const sacFlies         = paEvents.filter(e => e.outcome === 'sac_fly').length

  const atBats = paEvents.filter(e => !NON_AB_OUTCOMES.has(e.outcome)).length

  // RBI is stored directly on each play event
  const runsBattedIn = paEvents.reduce((sum, e) => sum + e.rbiCount, 0)

  // --- Runs scored (requires scanning all game events) ---
  let runs = 0
  for (const event of events) {
    if (event.batterPlayerId === playerId && event.outcome === 'home_run') {
      runs++ // batter scores on their own home run
    } else if (didPlayerScoreAsRunner(playerId, event)) {
      runs++
    }
  }

  // --- Stolen bases / caught stealing (base-running-only events) ---
  const stolenBases    = events.filter(
    e => e.outcome === 'stolen_base' && findStealer(e) === playerId
  ).length
  const caughtStealing = events.filter(
    e => e.outcome === 'caught_stealing' && findCaughtStealing(e) === playerId
  ).length

  // --- Rate stats ---
  const battingAverage = atBats > 0 ? hits / atBats : 0

  // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)  where BB includes IBB
  const allWalks       = walks + intentionalWalks
  const obpNumerator   = hits + allWalks + hitByPitch
  const obpDenominator = atBats + allWalks + hitByPitch + sacFlies
  const onBasePct      = obpDenominator > 0 ? obpNumerator / obpDenominator : 0

  // SLG = TB / AB  where TB = 1B + 2×2B + 3×3B + 4×HR
  const totalBases  = singles + 2 * doubles + 3 * triples + 4 * homeRuns
  const sluggingPct = atBats > 0 ? totalBases / atBats : 0

  const ops = onBasePct + sluggingPct

  return {
    plateAppearances,
    atBats,
    hits,
    singles,
    doubles,
    triples,
    homeRuns,
    runs,
    runsBattedIn,
    walks,
    intentionalWalks,
    hitByPitch,
    strikeouts,
    stolenBases,
    caughtStealing,
    sacFlies,
    battingAverage,
    onBasePct,
    sluggingPct,
    ops,
  }
}
