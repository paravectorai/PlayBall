import { describe, it, expect } from 'vitest'
import { TrendService } from '../TrendService'
import type { BattingStats, PitchingStats } from '../../stat-engine/types'

const svc = new TrendService()

// ---------------------------------------------------------------------------
// Batting fixtures
// ---------------------------------------------------------------------------

function makeBatting(overrides: Partial<BattingStats> = {}): BattingStats {
  return {
    plateAppearances: 4, atBats: 3, hits: 1,
    singles: 1, doubles: 0, triples: 0, homeRuns: 0,
    runs: 0, runsBattedIn: 0,
    walks: 1, intentionalWalks: 0, hitByPitch: 0,
    strikeouts: 1, stolenBases: 0, caughtStealing: 0, sacFlies: 0,
    battingAverage: 1 / 3, onBasePct: 2 / 4, sluggingPct: 1 / 3, ops: 2 / 4 + 1 / 3,
    ...overrides,
  }
}

// Game A: 1-for-3, 1 HR, 1 BB, 1 RBI, 1 R
const gameA: BattingStats = makeBatting({
  plateAppearances: 4, atBats: 3, hits: 1,
  singles: 0, doubles: 0, triples: 0, homeRuns: 1,
  runs: 1, runsBattedIn: 1,
  walks: 1, intentionalWalks: 0, hitByPitch: 0,
  strikeouts: 1, stolenBases: 0, caughtStealing: 0, sacFlies: 0,
  battingAverage: 1 / 3,
  onBasePct: 2 / 4,
  sluggingPct: 4 / 3,
  ops: 2 / 4 + 4 / 3,
})

// Game B: 2-for-4, 2 singles, 1 BB
const gameB: BattingStats = makeBatting({
  plateAppearances: 5, atBats: 4, hits: 2,
  singles: 2, doubles: 0, triples: 0, homeRuns: 0,
  runs: 0, runsBattedIn: 0,
  walks: 1, intentionalWalks: 0, hitByPitch: 0,
  strikeouts: 0, stolenBases: 0, caughtStealing: 0, sacFlies: 0,
  battingAverage: 2 / 4,
  onBasePct: 3 / 5,
  sluggingPct: 2 / 4,
  ops: 3 / 5 + 2 / 4,
})

// Game C: 0-for-3, 1 K, 1 SF (sac fly)
const gameC: BattingStats = makeBatting({
  plateAppearances: 4, atBats: 3, hits: 0,
  singles: 0, doubles: 0, triples: 0, homeRuns: 0,
  runs: 0, runsBattedIn: 1,
  walks: 0, intentionalWalks: 0, hitByPitch: 0,
  strikeouts: 1, stolenBases: 0, caughtStealing: 0, sacFlies: 1,
  battingAverage: 0,
  onBasePct: 0,
  sluggingPct: 0,
  ops: 0,
})

// Game D: 3-for-4, 1 double, 2 singles
const gameD: BattingStats = makeBatting({
  plateAppearances: 4, atBats: 4, hits: 3,
  singles: 2, doubles: 1, triples: 0, homeRuns: 0,
  runs: 1, runsBattedIn: 1,
  walks: 0, intentionalWalks: 0, hitByPitch: 0,
  strikeouts: 0, stolenBases: 0, caughtStealing: 0, sacFlies: 0,
  battingAverage: 3 / 4,
  onBasePct: 3 / 4,
  sluggingPct: 4 / 4,
  ops: 3 / 4 + 4 / 4,
})

// Game E: 1-for-3, 1 triple
const gameE: BattingStats = makeBatting({
  plateAppearances: 3, atBats: 3, hits: 1,
  singles: 0, doubles: 0, triples: 1, homeRuns: 0,
  runs: 1, runsBattedIn: 0,
  walks: 0, intentionalWalks: 0, hitByPitch: 0,
  strikeouts: 1, stolenBases: 0, caughtStealing: 0, sacFlies: 0,
  battingAverage: 1 / 3,
  onBasePct: 1 / 3,
  sluggingPct: 3 / 3,
  ops: 1 / 3 + 1,
})

// ---------------------------------------------------------------------------
// Pitching fixtures
// ---------------------------------------------------------------------------

function makePitching(overrides: Partial<PitchingStats> = {}): PitchingStats {
  return {
    outsRecorded: 9, battersFaced: 12,
    hitsAllowed: 3, runsAllowed: 1, earnedRuns: 1,
    walksAllowed: 1, strikeouts: 4, hitBatters: 0, pitchCount: 45,
    era: (1 / 9) * 27,
    whip: (1 + 3) / (9 / 3),
    ...overrides,
  }
}

const pitchA: PitchingStats = makePitching({ outsRecorded: 9, earnedRuns: 1, walksAllowed: 1, hitsAllowed: 3 })
const pitchB: PitchingStats = makePitching({ outsRecorded: 12, earnedRuns: 2, walksAllowed: 2, hitsAllowed: 4 })
const pitchC: PitchingStats = makePitching({ outsRecorded: 6, earnedRuns: 0, walksAllowed: 0, hitsAllowed: 1 })
const pitchD: PitchingStats = makePitching({ outsRecorded: 15, earnedRuns: 3, walksAllowed: 3, hitsAllowed: 5 })

// ---------------------------------------------------------------------------
// Batting trend tests
// ---------------------------------------------------------------------------

describe('TrendService.computeBattingTrends', () => {
  it('returns all-zero windows for empty input', () => {
    const trends = svc.computeBattingTrends([])
    for (const w of [trends.last3, trends.last5, trends.seasonToDate]) {
      expect(w.gamesInWindow).toBe(0)
      expect(w.stats.hits).toBe(0)
      expect(w.stats.battingAverage).toBe(0)
      expect(w.stats.onBasePct).toBe(0)
      expect(w.stats.ops).toBe(0)
    }
  })

  it('gamesInWindow reflects available games when fewer than window size', () => {
    const trends = svc.computeBattingTrends([gameA, gameB])
    expect(trends.last3.gamesInWindow).toBe(2)
    expect(trends.last5.gamesInWindow).toBe(2)
    expect(trends.seasonToDate.gamesInWindow).toBe(2)
  })

  it('last3 uses the most recent 3 of 5 games', () => {
    const trends = svc.computeBattingTrends([gameA, gameB, gameC, gameD, gameE])
    expect(trends.last3.gamesInWindow).toBe(3)
    // last3 window = gameC + gameD + gameE
    const expectedAB = gameC.atBats + gameD.atBats + gameE.atBats  // 3+4+3 = 10
    expect(trends.last3.stats.atBats).toBe(expectedAB)
  })

  it('last5 uses all 5 games when exactly 5 available', () => {
    const trends = svc.computeBattingTrends([gameA, gameB, gameC, gameD, gameE])
    expect(trends.last5.gamesInWindow).toBe(5)
    const expectedAB = gameA.atBats + gameB.atBats + gameC.atBats + gameD.atBats + gameE.atBats
    expect(trends.last5.stats.atBats).toBe(expectedAB)
  })

  it('seasonToDate sums all games', () => {
    const trends = svc.computeBattingTrends([gameA, gameB, gameC, gameD, gameE])
    expect(trends.seasonToDate.gamesInWindow).toBe(5)
    const expectedH = gameA.hits + gameB.hits + gameC.hits + gameD.hits + gameE.hits
    expect(trends.seasonToDate.stats.hits).toBe(expectedH)
  })

  it('recomputes AVG from summed H/AB, not average of per-game rates', () => {
    // gameA: 1/3 = .333; gameB: 2/4 = .500 → naive avg = .417
    // correct: (1+2)/(3+4) = 3/7 ≈ .429
    const trends = svc.computeBattingTrends([gameA, gameB])
    expect(trends.last3.stats.battingAverage).toBeCloseTo(3 / 7, 6)
  })

  it('recomputes OBP using sacFlies in denominator', () => {
    // gameC: 0H, 0BB, 0HBP in 3 AB + 1 SF → OBP = 0/(3+0+0+1) = 0
    // gameA: 1H+1BB in 3AB+1BB → OBP = 2/4
    // combined: (1+0+0)/(3+3+1+0+0+0+0+1+0) = numer=1+1=2, denom=3+1+1+1=6 → wait let me recalc
    // A: H=1, BB=1, IBB=0, HBP=0, AB=3, SF=0 → OBP_num=2, OBP_denom=4
    // C: H=0, BB=0, IBB=0, HBP=0, AB=3, SF=1 → OBP_num=0, OBP_denom=4
    // Combined: num=2, denom=8 → 0.25
    const trends = svc.computeBattingTrends([gameA, gameC])
    expect(trends.seasonToDate.stats.onBasePct).toBeCloseTo(2 / 8, 6)
    // sacFlies are summed in the window
    expect(trends.seasonToDate.stats.sacFlies).toBe(1)
  })

  it('recomputes SLG from summed total bases / summed AB', () => {
    // gameA: 4TB (HR) / 3AB = 1.333; gameD: 4TB (2*1B+2B) / 4AB = 1.0
    // combined: 8TB / 7AB
    const trends = svc.computeBattingTrends([gameA, gameD])
    const expectedTB = 4 + (2 + 2)  // HR=4, 2*single=2, double=2
    const expectedAB = 3 + 4
    expect(trends.seasonToDate.stats.sluggingPct).toBeCloseTo(expectedTB / expectedAB, 6)
  })

  it('OPS = OBP + SLG in trend window', () => {
    const trends = svc.computeBattingTrends([gameA, gameB, gameD])
    const { onBasePct, sluggingPct, ops } = trends.seasonToDate.stats
    expect(ops).toBeCloseTo(onBasePct + sluggingPct, 10)
  })

  it('count stats are correctly summed across window', () => {
    const trends = svc.computeBattingTrends([gameA, gameB])
    expect(trends.seasonToDate.stats.plateAppearances).toBe(gameA.plateAppearances + gameB.plateAppearances)
    expect(trends.seasonToDate.stats.runs).toBe(gameA.runs + gameB.runs)
    expect(trends.seasonToDate.stats.runsBattedIn).toBe(gameA.runsBattedIn + gameB.runsBattedIn)
    expect(trends.seasonToDate.stats.strikeouts).toBe(gameA.strikeouts + gameB.strikeouts)
    expect(trends.seasonToDate.stats.homeRuns).toBe(gameA.homeRuns + gameB.homeRuns)
  })

  it('AVG and SLG are 0 when summed AB is 0', () => {
    const noAB: BattingStats = makeBatting({
      plateAppearances: 1, atBats: 0, hits: 0,
      singles: 0, doubles: 0, triples: 0, homeRuns: 0,
      walks: 1, sacFlies: 0,
      battingAverage: 0, sluggingPct: 0, onBasePct: 1.0, ops: 1.0,
    })
    const trends = svc.computeBattingTrends([noAB])
    expect(trends.seasonToDate.stats.battingAverage).toBe(0)
    expect(trends.seasonToDate.stats.sluggingPct).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Pitching trend tests
// ---------------------------------------------------------------------------

describe('TrendService.computePitchingTrends', () => {
  it('returns all-zero windows for empty input', () => {
    const trends = svc.computePitchingTrends([])
    for (const w of [trends.last3, trends.last5, trends.seasonToDate]) {
      expect(w.gamesInWindow).toBe(0)
      expect(w.stats.era).toBe(0)
      expect(w.stats.whip).toBe(0)
      expect(w.stats.outsRecorded).toBe(0)
    }
  })

  it('gamesInWindow reflects available games when fewer than window size', () => {
    const trends = svc.computePitchingTrends([pitchA, pitchB])
    expect(trends.last3.gamesInWindow).toBe(2)
  })

  it('last3 uses the most recent 3 of 4 games', () => {
    const trends = svc.computePitchingTrends([pitchA, pitchB, pitchC, pitchD])
    expect(trends.last3.gamesInWindow).toBe(3)
    // last3 = pitchB + pitchC + pitchD
    const expectedOuts = pitchB.outsRecorded + pitchC.outsRecorded + pitchD.outsRecorded
    expect(trends.last3.stats.outsRecorded).toBe(expectedOuts)
  })

  it('recomputes ERA from summed ER and outs (not average of per-game ERA)', () => {
    // pitchA: 1 ER, 9 outs → ERA = 3.00
    // pitchB: 2 ER, 12 outs → ERA = 4.50
    // naive avg ERA = 3.75; correct = (1+2)/(9+12)*27 = 3/21*27 = 81/21 ≈ 3.857
    const trends = svc.computePitchingTrends([pitchA, pitchB])
    const expectedERA = (3 / 21) * 27
    expect(trends.seasonToDate.stats.era).toBeCloseTo(expectedERA, 6)
  })

  it('recomputes WHIP from summed (BB+H) and summed outs', () => {
    // pitchA: (1+3)/(9/3) = 4/3 ≈ 1.333
    // pitchC: (0+1)/(6/3) = 1/2 = 0.500
    // combined: (1+3+0+1)/((9+6)/3) = 5/5 = 1.000
    const trends = svc.computePitchingTrends([pitchA, pitchC])
    expect(trends.seasonToDate.stats.whip).toBeCloseTo(1.0, 6)
  })

  it('ERA and WHIP are 0 when no outs recorded', () => {
    const noOuts: PitchingStats = makePitching({
      outsRecorded: 0, earnedRuns: 0, walksAllowed: 0, hitsAllowed: 0,
      era: 0, whip: 0,
    })
    const trends = svc.computePitchingTrends([noOuts])
    expect(trends.seasonToDate.stats.era).toBe(0)
    expect(trends.seasonToDate.stats.whip).toBe(0)
  })

  it('count stats are correctly summed', () => {
    const trends = svc.computePitchingTrends([pitchA, pitchB, pitchC])
    expect(trends.seasonToDate.stats.outsRecorded).toBe(pitchA.outsRecorded + pitchB.outsRecorded + pitchC.outsRecorded)
    expect(trends.seasonToDate.stats.strikeouts).toBe(pitchA.strikeouts + pitchB.strikeouts + pitchC.strikeouts)
  })
})
