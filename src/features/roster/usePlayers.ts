import { liveQuery } from 'dexie'
import { useEffect, useState } from 'preact/hooks'
import { playerRepo } from '../../data/repositories'
import type { PlayerRow } from '../../data/schema'

export function usePlayers(teamId: string): PlayerRow[] | undefined {
  const [players, setPlayers] = useState<PlayerRow[] | undefined>(undefined)

  useEffect(() => {
    const subscription = liveQuery(() => playerRepo.findByTeam(teamId)).subscribe({
      next: setPlayers,
      error: (err) => console.error('usePlayers:', err),
    })
    return () => subscription.unsubscribe()
  }, [teamId])

  return players
}
