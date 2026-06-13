import type { PlayEventRow } from '@/data/schema'
import type { FieldingStats } from './types'

/**
 * Derive fielding statistics for one player from the complete ordered event log of a game.
 *
 * MVP LIMITATION: PlayEventRow records which fielding outcome occurred (field_out,
 * field_error, fielders_choice) but does NOT record which fielder was involved.
 * There is no per-play fielderPlayerId in the current schema, so putouts, assists,
 * errors, and double plays cannot be attributed to individual players.
 *
 * This function always returns zeros. It is correctly typed and exported so that
 * the domain interface is complete. When a future ticket adds per-play fielder
 * attribution to PlayEventRow, only this function needs to change.
 *
 * Returns a fully populated FieldingStats object. fieldingPct is 0 when
 * PO + A + E = 0 — never NaN or undefined.
 */
export function deriveFieldingStats(_playerId: string, _events: PlayEventRow[]): FieldingStats {
  const putouts    = 0
  const assists    = 0
  const errors     = 0
  const doublePlays = 0

  // (PO + A) / (PO + A + E); 0 when all three are 0
  const denominator = putouts + assists + errors
  const fieldingPct = denominator > 0 ? (putouts + assists) / denominator : 0

  return { putouts, assists, errors, doublePlays, fieldingPct }
}
