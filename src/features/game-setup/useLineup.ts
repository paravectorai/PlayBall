import { liveQuery } from 'dexie'
import { useEffect, useState } from 'preact/hooks'
import { lineupRepo } from '../../data/repositories'
import type { LineupRow } from '../../data/schema'

export function useLineup(gameId: string): LineupRow[] | undefined {
  const [lineup, setLineup] = useState<LineupRow[] | undefined>(undefined)

  useEffect(() => {
    const subscription = liveQuery(() => lineupRepo.findByGame(gameId)).subscribe({
      next: setLineup,
      error: (err) => console.error('useLineup:', err),
    })
    return () => subscription.unsubscribe()
  }, [gameId])

  return lineup
}
