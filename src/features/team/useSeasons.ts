import { liveQuery } from 'dexie'
import { useEffect, useState } from 'preact/hooks'
import { seasonRepo } from '../../data/repositories'
import type { SeasonRow } from '../../data/schema'

export function useSeasons(teamId: string): SeasonRow[] | undefined {
  const [seasons, setSeasons] = useState<SeasonRow[] | undefined>(undefined)

  useEffect(() => {
    const subscription = liveQuery(() => seasonRepo.findByTeam(teamId)).subscribe({
      next: setSeasons,
      error: (err) => console.error('useSeasons:', err),
    })
    return () => subscription.unsubscribe()
  }, [teamId])

  return seasons
}
