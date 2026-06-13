import { describe, it, expect, beforeAll } from 'vitest'
import { deriveBattingStats } from '../battingStats'
import type { PlayEventRow } from '@/data/schema'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let seq = 0

function makeEvent(
  overrides: Partial<PlayEventRow> & Pick<PlayEventRow, 'outcome' | 'batterPlayerId'>
): PlayEventRow {
  seq++
  return {
    id: `evt-${seq}`,
    gameId: 'game-1',
    sequenceNumber: seq,
    inning: 1,
    halfInning: 'top',
    pitcherPlayerId: 'pitcher-1',
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

const P  = 'player-a'  // player under test
const P2 = 'player-b'  // other player (batter on intervening events)

// ---------------------------------------------------------------------------
// Core fixture game (13 events)
//
// P's plate appearance events: 1(1B), 4(BB), 8(HR), 9(HBP), 11(SF), 12(2B), 13(SO)
//
// Expected totals:
//   PA=7  AB=4  H=3  1B=1  2B=1  HR=1  BB=1  IBB=0  HBP=1  SO=1  SF=1
//   RBI=2  R=2  SB=1  CS=1
//   AVG = 3/4 = .750
//   OBP = (3+1+0+1) / (4+1+0+1+1) = 5/7 ≈ .714286
//   SLG = (1 + 2 + 4) / 4 = 7/4 = 1.750
//   OPS = 5/7 + 7/4 ≈ 2.464
// ---------------------------------------------------------------------------

function buildFixture(): PlayEventRow[] {
  resetSeq()
  return [
    // --- Inning 1 ---

    // Evt 1: P singles; bases empty → P on 1st
    makeEvent({
      batterPlayerId: P,
      outcome: 'single',
      runnersBefore: {},
      runnersAfter: { first: P },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 0,
    }),

    // Evt 2: P2 doubles; P advances from 1st to 3rd
    makeEvent({
      batterPlayerId: P2,
      outcome: 'double',
      runnersBefore: { first: P },
      runnersAfter: { second: P2, third: P },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 0,
    }),

    // Evt 3: P2 singles (second PA); P scores from 3rd, P2 to 1st
    makeEvent({
      batterPlayerId: P2,
      outcome: 'single',
      runnersBefore: { second: P2, third: P },
      runnersAfter: { first: P2 },
      runsScored: 1,
      rbiCount: 1,
      outsRecorded: 0,
    }),

    // Evt 4: P walks; bases empty
    makeEvent({
      batterPlayerId: P,
      outcome: 'walk',
      runnersBefore: {},
      runnersAfter: { first: P },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 0,
    }),

    // Evt 5: P steals 2nd (base-running event; batterPlayerId empty)
    makeEvent({
      batterPlayerId: '',
      outcome: 'stolen_base',
      runnersBefore: { first: P },
      runnersAfter: { second: P },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 0,
    }),

    // Evt 6: P2 grounds out; P stays on 2nd
    makeEvent({
      batterPlayerId: P2,
      outcome: 'field_out',
      runnersBefore: { second: P },
      runnersAfter: { second: P },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 1,
    }),

    // --- Inning 2 ---

    // Evt 7: P caught stealing trying for 3rd
    makeEvent({
      batterPlayerId: '',
      outcome: 'caught_stealing',
      runnersBefore: { second: P },
      runnersAfter: {},
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 1,
    }),

    // Evt 8: P hits solo HR → R+1, RBI+1
    makeEvent({
      batterPlayerId: P,
      outcome: 'home_run',
      runnersBefore: {},
      runnersAfter: {},
      runsScored: 1,
      rbiCount: 1,
      outsRecorded: 0,
    }),

    // Evt 9: P is hit by pitch
    makeEvent({
      batterPlayerId: P,
      outcome: 'hit_by_pitch',
      runnersBefore: {},
      runnersAfter: { first: P },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 0,
    }),

    // Evt 10: P2 singles; P stays on 1st, P2 on 2nd
    makeEvent({
      batterPlayerId: P2,
      outcome: 'single',
      runnersBefore: { first: P },
      runnersAfter: { first: P, second: P2 },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 0,
    }),

    // Evt 11: P hits sac fly (no runner on 3rd, so runsScored=0); P out, P2 stays
    makeEvent({
      batterPlayerId: P,
      outcome: 'sac_fly',
      runnersBefore: { first: P, second: P2 },
      runnersAfter: { second: P2 },
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 1,
    }),

    // --- Inning 3 ---

    // Evt 12: P doubles; P2 on 3rd scores; P on 2nd → RBI+1
    makeEvent({
      batterPlayerId: P,
      outcome: 'double',
      runnersBefore: { third: P2 },
      runnersAfter: { second: P },
      runsScored: 1,
      rbiCount: 1,
      outsRecorded: 0,
    }),

    // Evt 13: P strikes out looking
    makeEvent({
      batterPlayerId: P,
      outcome: 'strikeout_looking',
      runnersBefore: {},
      runnersAfter: {},
      runsScored: 0,
      rbiCount: 0,
      outsRecorded: 1,
    }),
  ]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deriveBattingStats', () => {
  it('returns all-zero stats for a player with no events', () => {
    const stats = deriveBattingStats(P, [])
    expect(stats.plateAppearances).toBe(0)
    expect(stats.atBats).toBe(0)
    expect(stats.hits).toBe(0)
    expect(stats.runs).toBe(0)
    expect(stats.battingAverage).toBe(0)
    expect(stats.onBasePct).toBe(0)
    expect(stats.sluggingPct).toBe(0)
    expect(stats.ops).toBe(0)
  })

  it('returns all-zero stats when player has no events in a non-empty game', () => {
    const stats = deriveBattingStats('unknown-player', buildFixture())
    expect(stats.plateAppearances).toBe(0)
    expect(stats.atBats).toBe(0)
    expect(stats.battingAverage).toBe(0)
  })

  describe('fixture game — Player A', () => {
    let stats: ReturnType<typeof deriveBattingStats>

    beforeAll(() => {
      stats = deriveBattingStats(P, buildFixture())
    })

    it('counts plate appearances', () => {
      // PA events: evt 1,4,8,9,11,12,13 = 7
      expect(stats.plateAppearances).toBe(7)
    })

    it('counts at-bats (excludes BB, HBP, SF)', () => {
      // AB events: 1(1B), 8(HR), 12(2B), 13(SO) = 4
      expect(stats.atBats).toBe(4)
    })

    it('counts hit types', () => {
      expect(stats.singles).toBe(1)
      expect(stats.doubles).toBe(1)
      expect(stats.triples).toBe(0)
      expect(stats.homeRuns).toBe(1)
      expect(stats.hits).toBe(3)
    })

    it('counts walks and HBP', () => {
      expect(stats.walks).toBe(1)
      expect(stats.intentionalWalks).toBe(0)
      expect(stats.hitByPitch).toBe(1)
    })

    it('counts strikeouts', () => {
      expect(stats.strikeouts).toBe(1)
    })

    it('sums RBI from event rbiCount', () => {
      // evt 8 (solo HR): 1 rbi; evt 12 (2B scores P2): 1 rbi → total 2
      expect(stats.runsBattedIn).toBe(2)
    })

    it('counts runs scored as batter (HR) and as runner', () => {
      // evt 3: P scores from 3rd on P2 single → +1
      // evt 8: P hits solo HR → +1
      expect(stats.runs).toBe(2)
    })

    it('attributes stolen base to the correct runner', () => {
      expect(stats.stolenBases).toBe(1)
    })

    it('attributes caught stealing to the correct runner', () => {
      expect(stats.caughtStealing).toBe(1)
    })

    it('calculates batting average (H / AB)', () => {
      expect(stats.battingAverage).toBeCloseTo(3 / 4, 6)
    })

    it('calculates OBP ((H+BB+HBP) / (AB+BB+HBP+SF))', () => {
      // (3+1+1) / (4+1+1+1) = 5/7
      expect(stats.onBasePct).toBeCloseTo(5 / 7, 6)
    })

    it('calculates slugging percentage (TB / AB)', () => {
      // TB = 1(1B) + 2(2B) + 4(HR) = 7; SLG = 7/4
      expect(stats.sluggingPct).toBeCloseTo(7 / 4, 6)
    })

    it('calculates OPS (OBP + SLG)', () => {
      expect(stats.ops).toBeCloseTo(5 / 7 + 7 / 4, 6)
    })
  })

  describe('run scoring attribution', () => {
    it('credits batter 1 run on a solo HR', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P,
          outcome: 'home_run',
          runnersBefore: {},
          runnersAfter: {},
          runsScored: 1,
          rbiCount: 1,
          outsRecorded: 0,
        }),
      ]
      expect(deriveBattingStats(P, events).runs).toBe(1)
    })

    it('credits all runners on a grand slam', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P2,
          outcome: 'home_run',
          runnersBefore: { first: 'p-c', second: P, third: 'p-d' },
          runnersAfter: {},
          runsScored: 4,
          rbiCount: 4,
          outsRecorded: 0,
        }),
      ]
      const stats = deriveBattingStats(P, events)
      expect(stats.runs).toBe(1) // P was on 2nd and scored
    })

    it('does not credit a run when runner is out at home (runsScored=0)', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P2,
          outcome: 'field_out',
          runnersBefore: { third: P },
          runnersAfter: {},
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 2, // thrown out at home + batter
        }),
      ]
      expect(deriveBattingStats(P, events).runs).toBe(0)
    })

    it('does not count a run when player simply advances', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P2,
          outcome: 'single',
          runnersBefore: { first: P },
          runnersAfter: { second: P },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 0,
        }),
      ]
      expect(deriveBattingStats(P, events).runs).toBe(0)
    })

    it('applies 3rd→2nd priority: lower base runner out when only some score', () => {
      // Runner on 3rd (P2) and 2nd (P); runsScored=1, outsRecorded=1 (one out on bases).
      // Attribution: 3rd base runner scores first → P2 scores, P was out.
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: 'p-x',
          outcome: 'single',
          runnersBefore: { second: P, third: P2 },
          runnersAfter: { first: 'p-x' },
          runsScored: 1,
          rbiCount: 1,
          outsRecorded: 1,
        }),
      ]
      expect(deriveBattingStats(P, events).runs).toBe(0)  // P was attributed the out
      expect(deriveBattingStats(P2, events).runs).toBe(1) // P2 scored from 3rd
    })
  })

  describe('stolen base / caught stealing attribution', () => {
    it('attributes SB when runner advances 1st→2nd', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: '',
          outcome: 'stolen_base',
          runnersBefore: { first: P },
          runnersAfter: { second: P },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 0,
        }),
      ]
      expect(deriveBattingStats(P, events).stolenBases).toBe(1)
      expect(deriveBattingStats(P2, events).stolenBases).toBe(0)
    })

    it('attributes SB when runner steals home', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: '',
          outcome: 'stolen_base',
          runnersBefore: { third: P },
          runnersAfter: {},
          runsScored: 1,
          rbiCount: 0,
          outsRecorded: 0,
        }),
      ]
      const stats = deriveBattingStats(P, events)
      expect(stats.stolenBases).toBe(1)
      expect(stats.runs).toBe(1)
    })

    it('attributes CS to the runner who was thrown out, not the stayer', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: '',
          outcome: 'caught_stealing',
          runnersBefore: { first: P2, second: P },
          runnersAfter: { first: P2 },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 1,
        }),
      ]
      expect(deriveBattingStats(P, events).caughtStealing).toBe(1)
      expect(deriveBattingStats(P2, events).caughtStealing).toBe(0)
    })
  })

  describe('rate stat edge cases', () => {
    it('AVG and SLG are 0 when AB = 0 (only non-AB outcomes)', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P,
          outcome: 'walk',
          runnersBefore: {},
          runnersAfter: { first: P },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 0,
        }),
        makeEvent({
          batterPlayerId: P,
          outcome: 'sac_bunt',
          runnersBefore: { first: P },
          runnersAfter: {},
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 1,
        }),
      ]
      const stats = deriveBattingStats(P, events)
      expect(stats.atBats).toBe(0)
      expect(stats.battingAverage).toBe(0)
      expect(stats.sluggingPct).toBe(0)
      // OBP: (0+1+0)/(0+1+0+0) = 1.0 — denominator is non-zero due to the walk
      expect(stats.onBasePct).toBeCloseTo(1.0, 6)
    })

    it('OBP is 0 when denominator is 0 (no AB, BB, HBP, or SF)', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P,
          outcome: 'sac_bunt',
          runnersBefore: { first: P2 },
          runnersAfter: { second: P2 },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 1,
        }),
      ]
      const stats = deriveBattingStats(P, events)
      expect(stats.atBats).toBe(0)
      expect(stats.onBasePct).toBe(0)
    })

    it('treats intentional walk as BB for OBP numerator and denominator', () => {
      resetSeq()
      const events: PlayEventRow[] = [
        makeEvent({
          batterPlayerId: P,
          outcome: 'intentional_walk',
          runnersBefore: {},
          runnersAfter: { first: P },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 0,
        }),
        makeEvent({
          batterPlayerId: P,
          outcome: 'single',
          runnersBefore: {},
          runnersAfter: { first: P },
          runsScored: 0,
          rbiCount: 0,
          outsRecorded: 0,
        }),
      ]
      const stats = deriveBattingStats(P, events)
      expect(stats.intentionalWalks).toBe(1)
      expect(stats.atBats).toBe(1)  // only the single counts as AB
      // OBP = (1H + 1IBB) / (1AB + 1IBB) = 2/2 = 1.0
      expect(stats.onBasePct).toBeCloseTo(1.0, 6)
      // SLG = 1TB / 1AB = 1.0
      expect(stats.sluggingPct).toBeCloseTo(1.0, 6)
      expect(stats.ops).toBeCloseTo(2.0, 6)
    })
  })
})
