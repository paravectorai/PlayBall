import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StatRebuilderService } from '../StatRebuilderService'
import { deriveBattingStats } from '../battingStats'
import { derivePitchingStats } from '../pitchingStats'
import type { PlayEventRow, GameRow, GameStatRow, SeasonStatRow } from '@/data/schema'

// ---------------------------------------------------------------------------
// Fixture helpers (reuse pattern from battingStats.test.ts)
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

// ---------------------------------------------------------------------------
// Mock repos
// ---------------------------------------------------------------------------

function makeMockRepos(events: PlayEventRow[] = []) {
  const upsertedRows: Array<Omit<GameStatRow, 'id' | 'computedAt'>> = []
  let deleted = false

  const playEventsRepo = {
    findByGameOrdered: vi.fn().mockResolvedValue(events),
  }

  const gameStatsRepo = {
    deleteByGame: vi.fn().mockImplementation(async () => {
      deleted = true
    }),
    upsert: vi.fn().mockImplementation(async (row: Omit<GameStatRow, 'id' | 'computedAt'>) => {
      upsertedRows.push(row)
      return { ...row, id: `stat-${upsertedRows.length}`, computedAt: 0 }
    }),
  }

  return {
    playEventsRepo,
    gameStatsRepo,
    upsertedRows,
    get deleteWasCalledBeforeUpserts() {
      // deleted must be true before any upsert row is pushed
      return deleted
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StatRebuilderService.rebuildGameStats', () => {
  beforeEach(() => { seq = 0 })

  it('calls deleteByGame for the correct gameId', async () => {
    const { playEventsRepo, gameStatsRepo } = makeMockRepos([])
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-42')
    expect(gameStatsRepo.deleteByGame).toHaveBeenCalledWith('game-42')
  })

  it('writes no stats when the event list is empty', async () => {
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos([])
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')
    expect(upsertedRows).toHaveLength(0)
  })

  it('deletes before any upsert call', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'batter-1', outcome: 'single' }),
    ]
    const { playEventsRepo, gameStatsRepo } = makeMockRepos(events)
    const callOrder: string[] = []
    gameStatsRepo.deleteByGame.mockImplementation(async () => { callOrder.push('delete') })
    gameStatsRepo.upsert.mockImplementation(async (r: Omit<GameStatRow, 'id' | 'computedAt'>) => {
      callOrder.push(`upsert:${r.statType}`)
      return { ...r, id: 'x', computedAt: 0 }
    })
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')
    expect(callOrder[0]).toBe('delete')
  })

  it('writes one batting stat row for a single batter', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'batter-1', outcome: 'single' }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    const battingRows = upsertedRows.filter(r => r.statType === 'batting')
    expect(battingRows).toHaveLength(1)
    expect(battingRows[0].playerId).toBe('batter-1')
  })

  it('batting stats values match deriveBattingStats output', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'batter-1', outcome: 'single', rbiCount: 0 }),
      makeEvent({ batterPlayerId: 'batter-1', outcome: 'home_run', runsScored: 1, rbiCount: 1, outsRecorded: 0 }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    const expected = deriveBattingStats('batter-1', events)
    const row = upsertedRows.find(r => r.statType === 'batting' && r.playerId === 'batter-1')
    expect(row).toBeDefined()
    expect(row!.stats).toMatchObject(expected as unknown as Record<string, number>)
  })

  it('writes one pitching stat row for a single pitcher', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'batter-1', pitcherPlayerId: 'pitcher-1', outcome: 'strikeout_swinging', outsRecorded: 1 }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    const pitchingRows = upsertedRows.filter(r => r.statType === 'pitching')
    expect(pitchingRows).toHaveLength(1)
    expect(pitchingRows[0].playerId).toBe('pitcher-1')
  })

  it('pitching stats values match derivePitchingStats output', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'b1', pitcherPlayerId: 'pitcher-1', outcome: 'strikeout_swinging', outsRecorded: 1 }),
      makeEvent({ batterPlayerId: 'b2', pitcherPlayerId: 'pitcher-1', outcome: 'walk', outsRecorded: 0 }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    const expected = derivePitchingStats('pitcher-1', events)
    const row = upsertedRows.find(r => r.statType === 'pitching' && r.playerId === 'pitcher-1')
    expect(row).toBeDefined()
    expect(row!.stats).toMatchObject(expected as unknown as Record<string, number>)
  })

  it('writes batting + pitching rows for multiple participants', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'b1', pitcherPlayerId: 'p1', outcome: 'single' }),
      makeEvent({ batterPlayerId: 'b2', pitcherPlayerId: 'p1', outcome: 'strikeout_swinging', outsRecorded: 1 }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    const battingRows  = upsertedRows.filter(r => r.statType === 'batting')
    const pitchingRows = upsertedRows.filter(r => r.statType === 'pitching')
    expect(battingRows).toHaveLength(2)
    expect(pitchingRows).toHaveLength(1)
  })

  it('deduplicates batters who appear in multiple events', async () => {
    const events = [
      makeEvent({ batterPlayerId: 'b1', pitcherPlayerId: 'p1', outcome: 'single' }),
      makeEvent({ batterPlayerId: 'b1', pitcherPlayerId: 'p1', outcome: 'home_run', runsScored: 1, rbiCount: 1 }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    const battingRows = upsertedRows.filter(r => r.statType === 'batting' && r.playerId === 'b1')
    expect(battingRows).toHaveLength(1)
  })

  it('excludes base-running-only events (empty batterPlayerId) from batter list', async () => {
    const events = [
      makeEvent({ batterPlayerId: '', pitcherPlayerId: '', outcome: 'stolen_base',
        runnersBefore: { first: 'b1' }, runnersAfter: { second: 'b1' } }),
    ]
    const { playEventsRepo, gameStatsRepo, upsertedRows } = makeMockRepos(events)
    const svc = new StatRebuilderService(playEventsRepo, gameStatsRepo)
    await svc.rebuildGameStats('game-1')

    expect(upsertedRows).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Season rollup helpers
// ---------------------------------------------------------------------------

function makeGame(id: string): GameRow {
  return {
    id,
    seasonId: 'season-1',
    opponent: 'Opponents',
    gameDate: '2026-06-01',
    homeAway: 'home',
    inningsScheduled: 6,
    status: 'completed',
    ruleset: {},
    createdAt: 0,
  }
}

function makeSeasonMockRepos(gameEventsMap: Record<string, PlayEventRow[]>, games: GameRow[]) {
  const upsertedRows: Array<Omit<SeasonStatRow, 'id' | 'computedAt'>> = []
  let deleteWasCalled = false
  let deleteCalledBeforeFirstUpsert = false

  const playEventsRepo = {
    findByGameOrdered: vi.fn().mockImplementation(async (gameId: string) => {
      return gameEventsMap[gameId] ?? []
    }),
  }
  const gameStatsRepo = {
    deleteByGame: vi.fn().mockResolvedValue(undefined),
    upsert: vi.fn().mockResolvedValue(undefined),
  }
  const gamesRepo = {
    findBySeason: vi.fn().mockResolvedValue(games),
  }
  const seasonStatsRepo = {
    deleteBySeason: vi.fn().mockImplementation(async () => {
      deleteWasCalled = true
    }),
    upsert: vi.fn().mockImplementation(async (row: Omit<SeasonStatRow, 'id' | 'computedAt'>) => {
      if (!deleteCalledBeforeFirstUpsert && deleteWasCalled) {
        deleteCalledBeforeFirstUpsert = true
      }
      upsertedRows.push(row)
      return { ...row, id: `season-stat-${upsertedRows.length}`, computedAt: 0 }
    }),
  }

  return {
    playEventsRepo,
    gameStatsRepo,
    gamesRepo,
    seasonStatsRepo,
    upsertedRows,
    get deleteCalledBeforeUpserts() { return deleteCalledBeforeFirstUpsert },
    get deleteWasCalled() { return deleteWasCalled },
  }
}

// ---------------------------------------------------------------------------
// rebuildSeasonStats tests
// ---------------------------------------------------------------------------

describe('StatRebuilderService.rebuildSeasonStats', () => {
  beforeEach(() => { seq = 0 })

  it('calls deleteBySeason for the correct seasonId', async () => {
    const mocks = makeSeasonMockRepos({}, [])
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-42')
    expect(mocks.seasonStatsRepo.deleteBySeason).toHaveBeenCalledWith('season-42')
  })

  it('writes no stats when the season has no games', async () => {
    const mocks = makeSeasonMockRepos({}, [])
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')
    expect(mocks.upsertedRows).toHaveLength(0)
  })

  it('writes no stats when games exist but have no events', async () => {
    const mocks = makeSeasonMockRepos({ 'game-1': [] }, [makeGame('game-1')])
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')
    expect(mocks.upsertedRows).toHaveLength(0)
  })

  it('deletes before any upsert call', async () => {
    const events = [makeEvent({ batterPlayerId: 'b1', outcome: 'single' })]
    const mocks = makeSeasonMockRepos({ 'game-1': events }, [makeGame('game-1')])
    const callOrder: string[] = []
    mocks.seasonStatsRepo.deleteBySeason.mockImplementation(async () => { callOrder.push('delete') })
    mocks.seasonStatsRepo.upsert.mockImplementation(async (r: Omit<SeasonStatRow, 'id' | 'computedAt'>) => {
      callOrder.push(`upsert:${r.statType}`)
      return { ...r, id: 'x', computedAt: 0 }
    })
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')
    expect(callOrder[0]).toBe('delete')
  })

  it('writes one batting stat row for a single-game, single-batter season', async () => {
    const events = [makeEvent({ batterPlayerId: 'b1', outcome: 'single' })]
    const mocks = makeSeasonMockRepos({ 'game-1': events }, [makeGame('game-1')])
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')

    const battingRows = mocks.upsertedRows.filter(r => r.statType === 'batting')
    expect(battingRows).toHaveLength(1)
    expect(battingRows[0].playerId).toBe('b1')
    expect(battingRows[0].seasonId).toBe('season-1')
  })

  it('accumulates count stats across two games for the same batter', async () => {
    const eventsG1 = [makeEvent({ batterPlayerId: 'b1', outcome: 'single' })]
    const eventsG2 = [makeEvent({ batterPlayerId: 'b1', gameId: 'game-2', outcome: 'home_run', runsScored: 1, rbiCount: 1 })]
    const games = [makeGame('game-1'), { ...makeGame('game-2'), id: 'game-2' }]
    const mocks = makeSeasonMockRepos({ 'game-1': eventsG1, 'game-2': eventsG2 }, games)
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')

    const row = mocks.upsertedRows.find(r => r.statType === 'batting' && r.playerId === 'b1')
    expect(row).toBeDefined()
    const stats = row!.stats as Record<string, number>
    expect(stats.plateAppearances).toBe(2)
    expect(stats.hits).toBe(2)
    expect(stats.homeRuns).toBe(1)
  })

  it('batting season stats match deriveBattingStats across all events', async () => {
    const eventsG1 = [makeEvent({ batterPlayerId: 'b1', outcome: 'single' })]
    const eventsG2 = [makeEvent({ batterPlayerId: 'b1', gameId: 'game-2', outcome: 'walk' })]
    const games = [makeGame('game-1'), { ...makeGame('game-2'), id: 'game-2' }]
    const mocks = makeSeasonMockRepos({ 'game-1': eventsG1, 'game-2': eventsG2 }, games)
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')

    const expected = deriveBattingStats('b1', [...eventsG1, ...eventsG2])
    const row = mocks.upsertedRows.find(r => r.statType === 'batting' && r.playerId === 'b1')
    expect(row!.stats).toMatchObject(expected as unknown as Record<string, number>)
  })

  it('pitching season stats match derivePitchingStats across all events', async () => {
    const eventsG1 = [makeEvent({ batterPlayerId: 'b1', pitcherPlayerId: 'p1', outcome: 'strikeout_swinging', outsRecorded: 1 })]
    const eventsG2 = [makeEvent({ batterPlayerId: 'b2', pitcherPlayerId: 'p1', gameId: 'game-2', outcome: 'walk' })]
    const games = [makeGame('game-1'), { ...makeGame('game-2'), id: 'game-2' }]
    const mocks = makeSeasonMockRepos({ 'game-1': eventsG1, 'game-2': eventsG2 }, games)
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')

    const expected = derivePitchingStats('p1', [...eventsG1, ...eventsG2])
    const row = mocks.upsertedRows.find(r => r.statType === 'pitching' && r.playerId === 'p1')
    expect(row!.stats).toMatchObject(expected as unknown as Record<string, number>)
  })

  it('deduplicates a batter who appears in multiple games', async () => {
    const eventsG1 = [makeEvent({ batterPlayerId: 'b1', outcome: 'single' })]
    const eventsG2 = [makeEvent({ batterPlayerId: 'b1', gameId: 'game-2', outcome: 'double' })]
    const games = [makeGame('game-1'), { ...makeGame('game-2'), id: 'game-2' }]
    const mocks = makeSeasonMockRepos({ 'game-1': eventsG1, 'game-2': eventsG2 }, games)
    const svc = new StatRebuilderService(mocks.playEventsRepo, mocks.gameStatsRepo, mocks.gamesRepo, mocks.seasonStatsRepo)
    await svc.rebuildSeasonStats('season-1')

    const battingRows = mocks.upsertedRows.filter(r => r.statType === 'batting' && r.playerId === 'b1')
    expect(battingRows).toHaveLength(1)
  })
})
