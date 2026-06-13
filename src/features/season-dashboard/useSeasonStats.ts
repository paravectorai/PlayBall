import { useEffect, useState } from 'preact/hooks'
import { seasonStatRepo } from '../../data/repositories/SeasonStatRepository'
import { playerRepo } from '../../data/repositories/PlayerRepository'
import { gameRepo } from '../../data/repositories/GameRepository'
import { gameStatRepo } from '../../data/repositories/GameStatRepository'
import type { PlayerRow } from '../../data/schema'
import type { BattingStats, PitchingStats } from '../../domain'
import type { BattingSeasonStatRow, PitchingSeasonStatRow } from '../../domain'

export interface PlayerGamePoint {
  gameDate: string
  avg: number
  obp: number
}

export interface PlayerSeasonData {
  player: PlayerRow
  gamesPlayed: number
  batting: BattingStats | null
  pitching: PitchingStats | null
  battingTimeSeries: PlayerGamePoint[]
}

export function useSeasonStats(
  teamId: string,
  seasonId: string,
): PlayerSeasonData[] | undefined {
  const [data, setData] = useState<PlayerSeasonData[] | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [seasonStats, players, games] = await Promise.all([
        seasonStatRepo.findBySeason(seasonId),
        playerRepo.findByTeam(teamId),
        gameRepo.findBySeason(seasonId),
      ])

      // Sort games chronologically (oldest first) for the time-series
      const sortedGames = [...games].sort((a, b) => a.gameDate.localeCompare(b.gameDate))

      // Load game-level stats per game in chronological order
      const statsByGame = await Promise.all(sortedGames.map(g => gameStatRepo.findByGame(g.id)))

      // Build gamesPlayed count and per-game batting time-series per player
      const gamesPlayedMap = new Map<string, number>()
      const battingTimeSeriesMap = new Map<string, PlayerGamePoint[]>()

      for (let i = 0; i < sortedGames.length; i++) {
        const game = sortedGames[i]
        const gameStats = statsByGame[i]
        for (const stat of gameStats) {
          if (stat.statType === 'batting') {
            const s = stat.stats as unknown as BattingStats
            gamesPlayedMap.set(stat.playerId, (gamesPlayedMap.get(stat.playerId) ?? 0) + 1)
            const points = battingTimeSeriesMap.get(stat.playerId) ?? []
            points.push({ gameDate: game.gameDate, avg: s.battingAverage, obp: s.onBasePct })
            battingTimeSeriesMap.set(stat.playerId, points)
          }
        }
      }

      // Index season stats by player
      const battingMap = new Map<string, BattingStats>()
      const pitchingMap = new Map<string, PitchingStats>()
      for (const row of seasonStats) {
        if (row.statType === 'batting') {
          battingMap.set(row.playerId, (row as unknown as BattingSeasonStatRow).stats)
        } else if (row.statType === 'pitching') {
          pitchingMap.set(row.playerId, (row as unknown as PitchingSeasonStatRow).stats)
        }
      }

      const playerIdsWithStats = new Set([...battingMap.keys(), ...pitchingMap.keys()])
      const playerMap = new Map(players.map(p => [p.id, p]))

      const result: PlayerSeasonData[] = []
      for (const playerId of playerIdsWithStats) {
        const player = playerMap.get(playerId)
        if (!player) continue
        result.push({
          player,
          gamesPlayed: gamesPlayedMap.get(playerId) ?? 0,
          batting: battingMap.get(playerId) ?? null,
          pitching: pitchingMap.get(playerId) ?? null,
          battingTimeSeries: battingTimeSeriesMap.get(playerId) ?? [],
        })
      }

      // Sort by jersey number ascending (numeric, then lexicographic fallback)
      result.sort((a, b) => {
        const an = parseInt(a.player.jerseyNumber, 10)
        const bn = parseInt(b.player.jerseyNumber, 10)
        if (!isNaN(an) && !isNaN(bn)) return an - bn
        return a.player.jerseyNumber.localeCompare(b.player.jerseyNumber)
      })

      if (!cancelled) setData(result)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [teamId, seasonId])

  return data
}
