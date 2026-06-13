import { useEffect, useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { lineupRepo, gameRepo } from '../../data/repositories'
import { navigate } from '../../router'
import { useSeasons } from '../team/useSeasons'
import { usePlayers } from '../roster/usePlayers'
import { useLineup } from './useLineup'
import type { GameRow, PlayerRow } from '../../data/schema'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'BN']

interface Props {
  teamId: string
  seasonId: string
  gameId: string
}

interface PlayerWithLineup {
  player: PlayerRow
  battingOrder: number
  position: string
}

export function LineupBuilderScreen({ teamId, seasonId, gameId }: Props) {
  const seasons = useSeasons(teamId)
  const allPlayers = usePlayers(teamId)
  const lineup = useLineup(gameId)
  const [game, setGame] = useState<GameRow | undefined>(undefined)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    gameRepo.findById(gameId).then(setGame)
  }, [gameId])

  const season = seasons?.find((s) => s.id === seasonId)

  const isLoading = allPlayers === undefined || lineup === undefined

  const activePlayers = allPlayers?.filter((p) => p.isActive === 1) ?? []

  const playersWithLineup: PlayerWithLineup[] = activePlayers.map((player) => {
    const entry = lineup?.find((l) => l.playerId === player.id)
    return {
      player,
      battingOrder: entry?.battingOrder ?? 0,
      position: entry?.position ?? 'BN',
    }
  })

  const inLineup = [...playersWithLineup]
    .filter((p) => p.battingOrder > 0)
    .sort((a, b) => a.battingOrder - b.battingOrder)

  const bench = [...playersWithLineup]
    .filter((p) => p.battingOrder === 0)
    .sort((a, b) =>
      a.player.jerseyNumber.localeCompare(b.player.jerseyNumber, undefined, { numeric: true })
    )

  const usedSlots = new Set(inLineup.map((p) => p.battingOrder))

  function nextOpenSlot(): number {
    for (let i = 1; i <= 9; i++) {
      if (!usedSlots.has(i)) return i
    }
    return 0
  }

  async function save(playerId: string, battingOrder: number, position: string) {
    setSaving((s) => new Set(s).add(playerId))
    try {
      await lineupRepo.upsert({ gameId, playerId, battingOrder, position })
    } finally {
      setSaving((s) => {
        const next = new Set(s)
        next.delete(playerId)
        return next
      })
    }
  }

  function handleOrderChange(pw: PlayerWithLineup, delta: number) {
    const currentOrder = pw.battingOrder
    let newOrder: number

    if (currentOrder === 0 && delta > 0) {
      newOrder = nextOpenSlot()
      if (newOrder === 0) return
    } else {
      newOrder = Math.max(0, Math.min(9, currentOrder + delta))
    }

    if (newOrder === currentOrder) return

    if (newOrder > 0) {
      const conflict = playersWithLineup.find(
        (other) => other.player.id !== pw.player.id && other.battingOrder === newOrder
      )
      if (conflict) {
        // Swap: move the conflicting player to the vacated slot (or bench if moving to bench)
        save(conflict.player.id, currentOrder === 0 ? 0 : currentOrder, conflict.position)
      }
    }

    const defaultPos = pw.position === 'BN' && newOrder > 0 ? 'P' : pw.position
    save(pw.player.id, newOrder, defaultPos)
  }

  function handlePositionChange(pw: PlayerWithLineup, position: string) {
    save(pw.player.id, pw.battingOrder, position)
  }

  const hasLineup = inLineup.length > 0

  return (
    <div class="min-h-screen bg-background pb-28">
      {/* Header */}
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'season', teamId, seasonId })}
          >
            <span class="text-base">‹</span> {season ? season.name : 'Season'}
          </button>
          <h1 class="text-white text-xl font-bold leading-tight">Lineup</h1>
          {game && <p class="text-white/60 text-sm mt-0.5">vs. {game.opponent}</p>}
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Loading skeleton */}
        {isLoading && (
          <div class="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} class="h-28 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Start Scoring CTA — only shown once there is at least one batter in the lineup */}
        {!isLoading && hasLineup && (
          <Button
            size="lg"
            onClick={() => navigate({ page: 'score', teamId, seasonId, gameId })}
          >
            {game?.status === 'in_progress' ? 'Continue Scoring' : 'Start Scoring'}
          </Button>
        )}

        {/* No active players */}
        {!isLoading && activePlayers.length === 0 && (
          <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span class="text-3xl">⚾</span>
            <p class="text-text-main font-semibold">No active players</p>
            <p class="text-sm text-gray-500 max-w-xs">
              Add active players to the roster before building a lineup.
            </p>
            <Button size="md" onClick={() => navigate({ page: 'roster', teamId })}>
              Go to Roster
            </Button>
          </div>
        )}

        {/* Batting Order section */}
        {!isLoading && activePlayers.length > 0 && (
          <>
            <section class="flex flex-col gap-3">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Batting Order
              </h2>

              {inLineup.length === 0 && (
                <p class="text-sm text-gray-500 text-center py-2">
                  Tap + on a player below to add them to the batting order.
                </p>
              )}

              {inLineup.map((pw) => (
                <PlayerLineupCard
                  key={pw.player.id}
                  pw={pw}
                  saving={saving.has(pw.player.id)}
                  onOrderChange={(delta) => handleOrderChange(pw, delta)}
                  onPositionChange={(pos) => handlePositionChange(pw, pos)}
                />
              ))}
            </section>

            <section class="flex flex-col gap-3">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">Bench</h2>

              {bench.length === 0 ? (
                <p class="text-sm text-gray-500 text-center py-2">
                  All active players are in the batting order.
                </p>
              ) : (
                bench.map((pw) => (
                  <PlayerLineupCard
                    key={pw.player.id}
                    pw={pw}
                    saving={saving.has(pw.player.id)}
                    onOrderChange={(delta) => handleOrderChange(pw, delta)}
                    onPositionChange={(pos) => handlePositionChange(pw, pos)}
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

interface PlayerLineupCardProps {
  pw: PlayerWithLineup
  saving: boolean
  onOrderChange: (delta: number) => void
  onPositionChange: (position: string) => void
}

function PlayerLineupCard({ pw, saving, onOrderChange, onPositionChange }: PlayerLineupCardProps) {
  const { player, battingOrder, position } = pw
  const orderLabel = battingOrder === 0 ? 'BN' : String(battingOrder)

  return (
    <Card padding={false}>
      <div class="px-4 py-3 flex flex-col gap-2">
        {/* Top row: stepper + jersey + name */}
        <div class="flex items-center gap-3">
          {/* Batting order stepper */}
          <div class="flex items-center shrink-0">
            <button
              class="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg font-bold text-primary hover:bg-primary/5 rounded transition-colors disabled:opacity-40"
              onClick={() => onOrderChange(-1)}
              disabled={saving || battingOrder === 0}
              aria-label="Move earlier in batting order"
            >
              −
            </button>
            <span class="w-8 text-center font-bold font-tnum text-text-main text-sm">
              {orderLabel}
            </span>
            <button
              class="min-h-[44px] min-w-[44px] flex items-center justify-center text-lg font-bold text-primary hover:bg-primary/5 rounded transition-colors disabled:opacity-40"
              onClick={() => onOrderChange(1)}
              disabled={saving || battingOrder === 9}
              aria-label="Move later in batting order"
            >
              +
            </button>
          </div>

          {/* Jersey badge */}
          <div class="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-primary font-bold font-tnum text-xs">{player.jerseyNumber}</span>
          </div>

          {/* Name */}
          <p class="flex-1 font-semibold text-text-main truncate text-sm">
            {player.firstName} {player.lastName}
          </p>

          {/* Saving indicator */}
          {saving && (
            <span class="shrink-0 text-xs text-gray-400 animate-pulse">saving…</span>
          )}
        </div>

        {/* Position chips */}
        <div class="flex flex-wrap gap-1.5 pl-1">
          {POSITIONS.map((pos) => {
            const selected = position === pos
            return (
              <button
                key={pos}
                type="button"
                class={[
                  'min-h-[44px] min-w-[44px] px-2.5 text-xs font-medium rounded border transition-colors',
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-text-main border-border hover:border-primary hover:text-primary',
                ].join(' ')}
                onClick={() => !selected && onPositionChange(pos)}
                disabled={saving}
              >
                {pos}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
