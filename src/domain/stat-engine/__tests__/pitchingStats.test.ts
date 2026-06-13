import { describe, it, expect, beforeAll } from 'vitest'
import { derivePitchingStats } from '../pitchingStats'
import type { PlayEventRow } from '@/data/schema'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let seq = 0

function makeEvent(
  overrides: Partial<PlayEventRow> & Pick<PlayEventRow, 'outcome' | 'pitcherPlayerId'>
): PlayEventRow {
  seq++
  return {
    id: `evt-${seq}`,
    gameId: 'game-1',
    sequenceNumber: seq,
    inning: 1,
    halfInning: 'top',
    batterPlayerId: `batter-${seq}`,
    runnersBefore: {},
    runnersAfter: {},
    runsScored: 0,
    rbiCount: 0,
    outsRecorded: 0,
    isEarnedRun: false,
    notes: '',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

function resetSeq() {
  seq = 0
}

const PA = 'pitcher-a'
const PB = 'pitcher-b'

// ---------------------------------------------------------------------------
// Core fixture game (13 events)
//
// Pitcher A's events (7 PA events, 3 outs = 1.0 IP):
//   Evt 1: single           — H=1, R=0, outs=0
//   Evt 2: strikeout_swing  — SO=1, outs=1
//   Evt 3: home_run (2-run) — H=2, R=2, ER=2, outs=0, isEarnedRun=true
//   Evt 4: walk             — BB=1
//   Evt 5: hit_by_pitch     — HBP=1
//   Evt 6: sac_fly (R+1)    — R=3, ER=3, outs=2, isEarnedRun=true (sac_fly is NOT a hit)
//   Evt 7: strikeout_look   — SO=2, outs=3
//
// Pitcher A expected:
//   outsRecorded=3, BF=7, H=2, R=3, ER=3, BB=1, SO=2, HBP=1
//   ERA = (3*27)/3 = 27.0
//   WHIP = (1+2)/(3/3) = 3.0
//
// Pitcher B's events (5 events, 3 outs = 1.0 IP, 1 unearned run):
//   Evt 8:  field_error          — BF=1, H=0, R=0
//   Evt 9:  single (R+1 unearned)— BF=2, H=1, R=1, ER=0, isEarnedRun=false
//   Evt 10: strikeout_swinging   — BF=3, SO=1, outs=1
//   Evt 11: field_out            — BF=4, outs=2
//   Evt 12: field_out            — BF=5, outs=3
//
// Pitcher B expected:
//   outsRecorded=3, BF=5, H=1, R=1, ER=0, BB=0, SO=1, HBP=0
//   ERA = 0 (no earned runs)
//   WHIP = (0+1)/(3/3) = 1.0
//
// Evt 13: stolen_base (pitcherPlayerId='') — not attributed to any pitcher
// ---------------------------------------------------------------------------

function buildFixture(): PlayEventRow[] {
  resetSeq()
  return [
    // --- Pitcher A ---

    // Evt 1: single
    makeEvent({ pitcherPlayerId: PA, outcome: 'single' }),

    // Evt 2: strikeout swinging
    makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),

    // Evt 3: 2-run home run, earned
    makeEvent({
      pitcherPlayerId: PA,
      outcome: 'home_run',
      runsScored: 2,
      rbiCount: 2,
      isEarnedRun: true,
    }),

    // Evt 4: walk
    makeEvent({ pitcherPlayerId: PA, outcome: 'walk' }),

    // Evt 5: hit by pitch
    makeEvent({ pitcherPlayerId: PA, outcome: 'hit_by_pitch' }),

    // Evt 6: sac fly — runner on 3rd scores; sac_fly is NOT a hit
    makeEvent({
      pitcherPlayerId: PA,
      outcome: 'sac_fly',
      runsScored: 1,
      rbiCount: 1,
      outsRecorded: 1,
      isEarnedRun: true,
    }),

    // Evt 7: strikeout looking — end of inning
    makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_looking', outsRecorded: 1 }),

    // --- Pitcher B ---

    // Evt 8: field_error — batter reaches, no out, not a hit
    makeEvent({ pitcherPlayerId: PB, outcome: 'field_error' }),

    // Evt 9: single, runner on base scores (unearned — reached via error)
    makeEvent({
      pitcherPlayerId: PB,
      outcome: 'single',
      runsScored: 1,
      rbiCount: 0,
      isEarnedRun: false,
    }),

    // Evt 10: strikeout swinging
    makeEvent({ pitcherPlayerId: PB, outcome: 'strikeout_swinging', outsRecorded: 1 }),

    // Evt 11: field_out
    makeEvent({ pitcherPlayerId: PB, outcome: 'field_out', outsRecorded: 1 }),

    // Evt 12: field_out — end of inning
    makeEvent({ pitcherPlayerId: PB, outcome: 'field_out', outsRecorded: 1 }),

    // Evt 13: stolen_base — no pitcher attribution (pitcherPlayerId='')
    makeEvent({ pitcherPlayerId: '', batterPlayerId: '', outcome: 'stolen_base' }),
  ]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('derivePitchingStats', () => {
  it('returns all-zero stats for a pitcher with no events', () => {
    const stats = derivePitchingStats(PA, [])
    expect(stats.outsRecorded).toBe(0)
    expect(stats.battersFaced).toBe(0)
    expect(stats.hitsAllowed).toBe(0)
    expect(stats.runsAllowed).toBe(0)
    expect(stats.earnedRuns).toBe(0)
    expect(stats.walksAllowed).toBe(0)
    expect(stats.strikeouts).toBe(0)
    expect(stats.hitBatters).toBe(0)
    expect(stats.pitchCount).toBe(0)
    expect(stats.era).toBe(0)
    expect(stats.whip).toBe(0)
  })

  it('returns all-zero stats for an unknown pitcher in a non-empty game', () => {
    const stats = derivePitchingStats('unknown-pitcher', buildFixture())
    expect(stats.outsRecorded).toBe(0)
    expect(stats.battersFaced).toBe(0)
    expect(stats.era).toBe(0)
    expect(stats.whip).toBe(0)
  })

  describe('fixture game — Pitcher A', () => {
    let stats: ReturnType<typeof derivePitchingStats>

    beforeAll(() => {
      stats = derivePitchingStats(PA, buildFixture())
    })

    it('counts outs recorded', () => {
      // evts 2(SO), 6(SF), 7(SO) → 3 outs
      expect(stats.outsRecorded).toBe(3)
    })

    it('counts batters faced', () => {
      // evts 1-7 = 7 plate appearances
      expect(stats.battersFaced).toBe(7)
    })

    it('counts hits allowed (single, double, triple, HR only)', () => {
      // evt 1(single) + evt 3(HR) = 2; sac_fly does NOT count as a hit
      expect(stats.hitsAllowed).toBe(2)
    })

    it('counts runs allowed', () => {
      // evt 3: 2 runs, evt 6: 1 run → 3 total
      expect(stats.runsAllowed).toBe(3)
    })

    it('counts earned runs', () => {
      // both evt 3 and evt 6 have isEarnedRun=true → 3 earned
      expect(stats.earnedRuns).toBe(3)
    })

    it('counts walks allowed', () => {
      // evt 4: walk → 1
      expect(stats.walksAllowed).toBe(1)
    })

    it('counts strikeouts', () => {
      // evt 2: swinging, evt 7: looking → 2
      expect(stats.strikeouts).toBe(2)
    })

    it('counts hit batters', () => {
      // evt 5: HBP → 1
      expect(stats.hitBatters).toBe(1)
    })

    it('pitchCount is always 0 (not tracked in MVP)', () => {
      expect(stats.pitchCount).toBe(0)
    })

    it('calculates ERA ((ER * 27) / outsRecorded)', () => {
      // (3 * 27) / 3 = 27.0
      expect(stats.era).toBeCloseTo(27.0, 6)
    })

    it('calculates WHIP ((BB + H) / IP)', () => {
      // (1 + 2) / (3/3) = 3.0
      expect(stats.whip).toBeCloseTo(3.0, 6)
    })
  })

  describe('fixture game — Pitcher B (unearned run)', () => {
    let stats: ReturnType<typeof derivePitchingStats>

    beforeAll(() => {
      stats = derivePitchingStats(PB, buildFixture())
    })

    it('counts outs recorded', () => {
      // evts 10, 11, 12 → 3
      expect(stats.outsRecorded).toBe(3)
    })

    it('counts batters faced', () => {
      // evts 8-12 = 5
      expect(stats.battersFaced).toBe(5)
    })

    it('counts hits allowed', () => {
      // evt 9(single) = 1; field_error is not a hit
      expect(stats.hitsAllowed).toBe(1)
    })

    it('counts runs allowed but not earned runs when isEarnedRun=false', () => {
      expect(stats.runsAllowed).toBe(1)
      expect(stats.earnedRuns).toBe(0)
    })

    it('ERA is 0 when no earned runs', () => {
      expect(stats.era).toBe(0)
    })

    it('WHIP uses hits and walks (no walks here → H/IP)', () => {
      // (0 + 1) / (3/3) = 1.0
      expect(stats.whip).toBeCloseTo(1.0, 6)
    })
  })

  describe('cross-pitcher isolation', () => {
    it('Pitcher A stats are unaffected by Pitcher B events', () => {
      const statsA = derivePitchingStats(PA, buildFixture())
      expect(statsA.battersFaced).toBe(7)
      expect(statsA.hitsAllowed).toBe(2)
    })

    it('Pitcher B stats are unaffected by Pitcher A events', () => {
      const statsB = derivePitchingStats(PB, buildFixture())
      expect(statsB.battersFaced).toBe(5)
      expect(statsB.hitsAllowed).toBe(1)
    })

    it('stolen_base event with empty pitcherPlayerId is not attributed to any pitcher', () => {
      // evt 13 has pitcherPlayerId='' — should not inflate either pitcher's BF
      const statsA = derivePitchingStats(PA, buildFixture())
      const statsB = derivePitchingStats(PB, buildFixture())
      expect(statsA.battersFaced).toBe(7)
      expect(statsB.battersFaced).toBe(5)
    })
  })

  describe('rate stat edge cases', () => {
    it('ERA is 0 when outsRecorded is 0', () => {
      resetSeq()
      const events = [
        makeEvent({ pitcherPlayerId: PA, outcome: 'walk' }),
        makeEvent({
          pitcherPlayerId: PA,
          outcome: 'single',
          runsScored: 1,
          isEarnedRun: true,
        }),
      ]
      const stats = derivePitchingStats(PA, events)
      expect(stats.outsRecorded).toBe(0)
      expect(stats.era).toBe(0)
    })

    it('WHIP is 0 when outsRecorded is 0', () => {
      resetSeq()
      const events = [
        makeEvent({ pitcherPlayerId: PA, outcome: 'walk' }),
      ]
      const stats = derivePitchingStats(PA, events)
      expect(stats.outsRecorded).toBe(0)
      expect(stats.whip).toBe(0)
    })

    it('intentional_walk counts toward walksAllowed and WHIP', () => {
      resetSeq()
      const events = [
        makeEvent({ pitcherPlayerId: PA, outcome: 'intentional_walk' }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
      ]
      const stats = derivePitchingStats(PA, events)
      expect(stats.walksAllowed).toBe(1)  // IBB counts as a walk
      expect(stats.outsRecorded).toBe(3)
      // WHIP = (1 IBB + 0 H) / (3/3) = 1.0
      expect(stats.whip).toBeCloseTo(1.0, 6)
    })

    it('ERA scales correctly for a partial inning (1 out = 0.1 IP)', () => {
      resetSeq()
      const events = [
        makeEvent({
          pitcherPlayerId: PA,
          outcome: 'home_run',
          runsScored: 1,
          isEarnedRun: true,
        }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
      ]
      const stats = derivePitchingStats(PA, events)
      expect(stats.outsRecorded).toBe(1)
      expect(stats.earnedRuns).toBe(1)
      // ERA = (1 * 27) / 1 = 27.0
      expect(stats.era).toBeCloseTo(27.0, 6)
    })

    it('field_error and fielders_choice outcomes do not count as hits allowed', () => {
      resetSeq()
      const events = [
        makeEvent({ pitcherPlayerId: PA, outcome: 'field_error' }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'fielders_choice' }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
        makeEvent({ pitcherPlayerId: PA, outcome: 'strikeout_swinging', outsRecorded: 1 }),
      ]
      const stats = derivePitchingStats(PA, events)
      expect(stats.hitsAllowed).toBe(0)
      expect(stats.battersFaced).toBe(5)
    })
  })
})
