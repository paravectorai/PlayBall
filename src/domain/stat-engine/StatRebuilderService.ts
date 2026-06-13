import { playEventRepo } from '@/data/repositories/PlayEventRepository'
import { gameStatRepo } from '@/data/repositories/GameStatRepository'
import { gameRepo } from '@/data/repositories/GameRepository'
import { seasonStatRepo } from '@/data/repositories/SeasonStatRepository'
import { deriveBattingStats } from './battingStats'
import { derivePitchingStats } from './pitchingStats'
import type { PlayEventRow, GameRow } from '@/data/schema'
import type { GameStatRow, SeasonStatRow, StatType } from '@/data/schema'

// Minimal repo interfaces for constructor injection (enables unit testing without Dexie).
type GameStatUpsertInput = Omit<GameStatRow, 'id' | 'computedAt'>
type SeasonStatUpsertInput = Omit<SeasonStatRow, 'id' | 'computedAt'>

interface PlayEventsRepo {
  findByGameOrdered(gameId: string): Promise<PlayEventRow[]>
}
interface GameStatsRepo {
  deleteByGame(gameId: string): Promise<void>
  upsert(data: GameStatUpsertInput): Promise<GameStatRow>
}
interface GamesRepo {
  findBySeason(seasonId: string): Promise<GameRow[]>
}
interface SeasonStatsRepo {
  deleteBySeason(seasonId: string): Promise<void>
  upsert(data: SeasonStatUpsertInput): Promise<SeasonStatRow>
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)]
}

export class StatRebuilderService {
  constructor(
    private readonly playEventsRepo: PlayEventsRepo = playEventRepo,
    private readonly gameStatsRepo: GameStatsRepo = gameStatRepo,
    private readonly gamesRepo: GamesRepo = gameRepo,
    private readonly seasonStatsRepo: SeasonStatsRepo = seasonStatRepo,
  ) {}

  /**
   * Recompute and persist game-level stats for all participants in a game.
   *
   * Deletes existing game_stats rows first so stale entries (e.g. a player whose
   * only event was deleted) are automatically removed.
   */
  async rebuildGameStats(gameId: string): Promise<void> {
    const events = await this.playEventsRepo.findByGameOrdered(gameId)

    // Exclude synthetic opponent_score events — they carry no player attribution
    const scorableEvents = events.filter(e => e.outcome !== 'opponent_score')

    const batterIds  = unique(scorableEvents.map(e => e.batterPlayerId).filter(id => id !== ''))
    const pitcherIds = unique(scorableEvents.map(e => e.pitcherPlayerId).filter(id => id !== ''))

    await this.gameStatsRepo.deleteByGame(gameId)

    for (const playerId of batterIds) {
      const stats = deriveBattingStats(playerId, scorableEvents)
      await this.gameStatsRepo.upsert({
        gameId,
        playerId,
        statType: 'batting' as StatType,
        stats: stats as unknown as Record<string, number>,
      })
    }

    for (const pitcherId of pitcherIds) {
      const stats = derivePitchingStats(pitcherId, scorableEvents)
      await this.gameStatsRepo.upsert({
        gameId,
        playerId: pitcherId,
        statType: 'pitching' as StatType,
        stats: stats as unknown as Record<string, number>,
      })
    }
  }

  /**
   * Recompute and persist season-level stats for all players who appeared in any
   * game of the given season.
   *
   * All play events across every game in the season are loaded and passed to the
   * same derivation functions used for game-level stats — this ensures rate stats
   * (OBP, SLG, ERA, WHIP) are computed from correct season-aggregate denominators
   * rather than summing per-game rate values.
   *
   * Deletes all existing season_stats rows for this season before writing new ones
   * so players who no longer have events (e.g. after a full-game delete) are cleaned up.
   */
  async rebuildSeasonStats(seasonId: string): Promise<void> {
    const games = await this.gamesRepo.findBySeason(seasonId)

    const allEvents: PlayEventRow[] = []
    for (const game of games) {
      const events = await this.playEventsRepo.findByGameOrdered(game.id)
      allEvents.push(...events)
    }

    // Exclude synthetic opponent_score events — they carry no player attribution
    const scorableEvents = allEvents.filter(e => e.outcome !== 'opponent_score')

    const batterIds  = unique(scorableEvents.map(e => e.batterPlayerId).filter(id => id !== ''))
    const pitcherIds = unique(scorableEvents.map(e => e.pitcherPlayerId).filter(id => id !== ''))

    await this.seasonStatsRepo.deleteBySeason(seasonId)

    for (const playerId of batterIds) {
      const stats = deriveBattingStats(playerId, scorableEvents)
      await this.seasonStatsRepo.upsert({
        seasonId,
        playerId,
        statType: 'batting' as StatType,
        stats: stats as unknown as Record<string, number>,
      })
    }

    for (const pitcherId of pitcherIds) {
      const stats = derivePitchingStats(pitcherId, scorableEvents)
      await this.seasonStatsRepo.upsert({
        seasonId,
        playerId: pitcherId,
        statType: 'pitching' as StatType,
        stats: stats as unknown as Record<string, number>,
      })
    }
  }
}

export const statRebuilderService = new StatRebuilderService()
