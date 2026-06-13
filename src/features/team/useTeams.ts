import { liveQuery } from 'dexie'
import { useEffect, useState } from 'preact/hooks'
import { teamRepo } from '../../data/repositories'
import type { TeamRow } from '../../data/schema'

export function useTeams(): TeamRow[] | undefined {
  const [teams, setTeams] = useState<TeamRow[] | undefined>(undefined)

  useEffect(() => {
    const subscription = liveQuery(() => teamRepo.findAll()).subscribe({
      next: setTeams,
      error: (err) => console.error('useTeams:', err),
    })
    return () => subscription.unsubscribe()
  }, [])

  return teams
}
