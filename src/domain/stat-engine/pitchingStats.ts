import type { PlayEventRow, PlayOutcome } from '@/data/schema'
import type { PitchingStats } from './types'

const HIT_OUTCOMES = new Set<PlayOutcome>([
  'single',
  'double',
  'triple',
  'home_run',
])

/**
 * Derive pitching statistics for one pitcher from the complete ordered event log
 * of a single game. All events for the game must be provided so that multi-pitcher
 * games are correctly partitioned by pitcherPlayerId.
 *
 * Base-running-only events (stolen_base, caught_stealing) store an empty string
 * in pitcherPlayerId and are naturally excluded by the filter below.
 *
 * pitchCount is always 0 — per-pitch tracking is out of MVP scope; the PlayEventRow
 * schema has no per-pitch count field.
 *
 * earnedRuns uses isEarnedRun as an event-level flag: all runsScored on an event
 * are considered earned when isEarnedRun === true. Mixed earned/unearned on one
 * event is not expressible in the current schema and does not occur in typical play.
 *
 * Returns a fully populated PitchingStats object. Rate stats are 0 when
 * outsRecorded is 0 — never NaN or undefined.
 */
export function derivePitchingStats(pitcherId: string, events: PlayEventRow[]): PitchingStats {
  const pitcherEvents = events.filter(e => e.pitcherPlayerId === pitcherId)

  const outsRecorded = pitcherEvents.reduce((sum, e) => sum + e.outsRecorded, 0)
  const battersFaced = pitcherEvents.length

  const hitsAllowed  = pitcherEvents.filter(e => HIT_OUTCOMES.has(e.outcome)).length
  const runsAllowed  = pitcherEvents.reduce((sum, e) => sum + e.runsScored, 0)
  const earnedRuns   = pitcherEvents
    .filter(e => e.isEarnedRun)
    .reduce((sum, e) => sum + e.runsScored, 0)

  const walksAllowed = pitcherEvents.filter(
    e => e.outcome === 'walk' || e.outcome === 'intentional_walk'
  ).length
  const strikeouts   = pitcherEvents.filter(
    e => e.outcome === 'strikeout_swinging' || e.outcome === 'strikeout_looking'
  ).length
  const hitBatters   = pitcherEvents.filter(e => e.outcome === 'hit_by_pitch').length

  // Pitch-by-pitch tracking is out of MVP scope — no pitchCount field on PlayEventRow.
  const pitchCount = 0

  // ERA = (ER / IP) * 9 = (ER * 27) / outsRecorded
  const era  = outsRecorded > 0 ? (earnedRuns * 27) / outsRecorded : 0
  // WHIP = (BB + H) / IP = (BB + H) / (outsRecorded / 3)
  const whip = outsRecorded > 0 ? (walksAllowed + hitsAllowed) / (outsRecorded / 3) : 0

  return {
    outsRecorded,
    battersFaced,
    hitsAllowed,
    runsAllowed,
    earnedRuns,
    walksAllowed,
    strikeouts,
    hitBatters,
    pitchCount,
    era,
    whip,
  }
}
