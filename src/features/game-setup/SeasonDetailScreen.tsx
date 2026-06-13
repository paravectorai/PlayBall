import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Badge } from '../../shared/ui/Badge'
import { gameRepo } from '../../data/repositories'
import { navigate } from '../../router'
import { useTeams } from '../team/useTeams'
import { useSeasons } from '../team/useSeasons'
import { useGames } from './useGames'
import type { GameRow } from '../../data/schema'

interface Props {
  teamId: string
  seasonId: string
}

function formatDate(isoDate: string): string {
  // Parse as local date to avoid UTC offset shifting the day
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function SeasonDetailScreen({ teamId, seasonId }: Props) {
  const teams = useTeams()
  const seasons = useSeasons(teamId)
  const games = useGames(seasonId)

  const team = teams?.find((t) => t.id === teamId)
  const season = seasons?.find((s) => s.id === seasonId)

  async function handleDelete(game: GameRow) {
    await gameRepo.delete(game.id)
  }

  const isLoading = teams === undefined || seasons === undefined || games === undefined

  return (
    <div class="min-h-screen bg-background pb-24">
      {/* Header */}
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'team', teamId })}
          >
            <span class="text-base">‹</span> {team ? team.name : 'Team'}
          </button>
          <h1 class="text-white text-xl font-bold leading-tight">
            {season ? season.name : <span class="inline-block h-6 w-40 bg-white/10 animate-pulse rounded" />}
          </h1>
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
        {/* Season Stats link */}
        <button
          class="w-full flex items-center justify-between px-4 py-3 rounded border border-border bg-surface min-h-[44px] hover:bg-gray-50 transition-colors"
          onClick={() => navigate({ page: 'season-dashboard', teamId, seasonId })}
        >
          <span class="text-sm font-semibold text-text-main">Season Stats</span>
          <span class="text-gray-400 text-base">›</span>
        </button>

        {/* Section header */}
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">Games</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate({ page: 'new-game', teamId, seasonId })}
          >
            + New Game
          </Button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div class="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} class="h-20 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && games.length === 0 && (
          <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span class="text-3xl">⚾</span>
            <p class="text-text-main font-semibold">No games yet</p>
            <p class="text-sm text-gray-500 max-w-xs">
              Create your first game to start tracking stats for this season.
            </p>
            <Button
              size="md"
              onClick={() => navigate({ page: 'new-game', teamId, seasonId })}
            >
              New Game
            </Button>
          </div>
        )}

        {/* Game list */}
        {!isLoading &&
          games.map((game) => (
            <Card key={game.id} padding={false}>
              <button
                class="w-full text-left flex items-center gap-3 px-4 py-3 min-h-[64px] hover:bg-gray-50 transition-colors rounded-t"
                onClick={() => navigate({ page: 'lineup', teamId, seasonId, gameId: game.id })}
              >
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-text-main truncate">vs. {game.opponent}</p>
                  <p class="text-xs text-gray-500 font-tnum">{formatDate(game.gameDate)}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <Badge variant={game.homeAway === 'home' ? 'success' : 'default'}>
                    {game.homeAway === 'home' ? 'HOME' : 'AWAY'}
                  </Badge>
                  <Badge
                    variant={
                      game.status === 'in_progress'
                        ? 'warning'
                        : game.status === 'completed'
                        ? 'success'
                        : 'default'
                    }
                  >
                    {game.status === 'scheduled'
                      ? 'Scheduled'
                      : game.status === 'in_progress'
                      ? 'Live'
                      : 'Final'}
                  </Badge>
                  <span class="text-gray-400 text-base">›</span>
                </div>
              </button>
              <div class="flex border-t border-border">
                {game.status !== 'completed' && (
                  <button
                    class="flex-1 min-h-[44px] text-sm text-primary font-medium hover:bg-primary/5 transition-colors px-4"
                    onClick={() => navigate({ page: 'score', teamId, seasonId, gameId: game.id })}
                  >
                    {game.status === 'in_progress' ? 'Continue Scoring' : 'Score'}
                  </button>
                )}
                {game.status !== 'scheduled' && (
                  <button
                    class="flex-1 min-h-[44px] text-sm text-primary font-medium hover:bg-primary/5 transition-colors px-4"
                    onClick={() => navigate({ page: 'game-summary', teamId, seasonId, gameId: game.id })}
                  >
                    Summary
                  </button>
                )}
                <button
                  class="flex-1 min-h-[44px] text-sm text-clay font-medium hover:bg-clay/5 transition-colors px-4 rounded-b"
                  onClick={() => handleDelete(game)}
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
}
