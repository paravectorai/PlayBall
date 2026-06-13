import { describe, it, expect } from 'vitest'
import { deriveFieldingStats } from '../fieldingStats'
import type { PlayEventRow } from '@/data/schema'

// ---------------------------------------------------------------------------
// Fixture helper
// ---------------------------------------------------------------------------

let seq = 0

function makeEvent(
  overrides: Partial<PlayEventRow> & Pick<PlayEventRow, 'outcome'>
): PlayEventRow {
  seq++
  return {
    id: `evt-${seq}`,
    gameId: 'game-1',
    sequenceNumber: seq,
    inning: 1,
    halfInning: 'top',
    batterPlayerId: `batter-${seq}`,
    pitcherPlayerId: 'pitcher-1',
    runnersBefore: {},
    runnersAfter: {},
    runsScored: 0,
    rbiCount: 0,
    outsRecorded: 1,
    isEarnedRun: false,
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

function resetSeq() { seq = 0 }

const P  = 'player-a'
const P2 = 'player-b'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deriveFieldingStats', () => {
  it('returns all-zero stats for a player with no events', () => {
    const stats = deriveFieldingStats(P, [])
    expect(stats.putouts).toBe(0)
    expect(stats.assists).toBe(0)
    expect(stats.errors).toBe(0)
    expect(stats.doublePlays).toBe(0)
    expect(stats.fieldingPct).toBe(0)
  })

  it('returns all-zero stats for an unknown player in a non-empty game', () => {
    resetSeq()
    const events = [
      makeEvent({ outcome: 'field_out' }),
      makeEvent({ outcome: 'field_error' }),
    ]
    const stats = deriveFieldingStats('unknown-player', events)
    expect(stats.putouts).toBe(0)
    expect(stats.assists).toBe(0)
    expect(stats.errors).toBe(0)
    expect(stats.fieldingPct).toBe(0)
  })

  it('returns zeros even when field_out, field_error, and fielders_choice events exist', () => {
    // Schema does not record which fielder was involved — all zeros is correct.
    resetSeq()
    const events = [
      makeEvent({ outcome: 'field_out' }),
      makeEvent({ outcome: 'field_error' }),
      makeEvent({ outcome: 'fielders_choice' }),
    ]
    const stats = deriveFieldingStats(P, events)
    expect(stats.putouts).toBe(0)
    expect(stats.assists).toBe(0)
    expect(stats.errors).toBe(0)
    expect(stats.doublePlays).toBe(0)
  })

  it('fieldingPct is 0 when PO = A = E = 0 (no division by zero)', () => {
    const stats = deriveFieldingStats(P, [])
    expect(stats.fieldingPct).toBe(0)
    expect(Number.isFinite(stats.fieldingPct)).toBe(true)
  })

  it('player P2 also returns zeros — cross-player isolation', () => {
    resetSeq()
    const events = [makeEvent({ outcome: 'field_out' })]
    expect(deriveFieldingStats(P, events).putouts).toBe(0)
    expect(deriveFieldingStats(P2, events).putouts).toBe(0)
  })

  it('returns zeros for base-running-only events (stolen_base, caught_stealing)', () => {
    resetSeq()
    const events = [
      makeEvent({
        outcome: 'stolen_base',
        batterPlayerId: '',
        pitcherPlayerId: '',
        outsRecorded: 0,
      }),
      makeEvent({
        outcome: 'caught_stealing',
        batterPlayerId: '',
        pitcherPlayerId: '',
        outsRecorded: 1,
      }),
    ]
    const stats = deriveFieldingStats(P, events)
    expect(stats.putouts).toBe(0)
    expect(stats.errors).toBe(0)
  })

  it('returns a complete FieldingStats object with no undefined fields', () => {
    const stats = deriveFieldingStats(P, [])
    expect(stats).toHaveProperty('putouts')
    expect(stats).toHaveProperty('assists')
    expect(stats).toHaveProperty('errors')
    expect(stats).toHaveProperty('doublePlays')
    expect(stats).toHaveProperty('fieldingPct')
    for (const val of Object.values(stats)) {
      expect(typeof val).toBe('number')
      expect(Number.isFinite(val)).toBe(true)
    }
  })
})
