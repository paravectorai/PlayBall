import { liveQuery } from 'dexie'
import { useEffect, useState } from 'preact/hooks'
import { gameRepo } from '../../data/repositories'
import type { GameRow } from '../../data/schema'

export function useGames(seasonId: string): GameRow[] | undefined {
  const [games, setGames] = useState<GameRow[] | undefined>(undefined)

  useEffect(() => {
    const subscription = liveQuery(() => gameRepo.findBySeason(seasonId)).subscribe({
      next: setGames,
      error: (err) => console.error('useGames:', err),
    })
    return () => subscription.unsubscribe()
  }, [seasonId])

  return games
}
