import { useEffect, useState } from 'preact/hooks'

export type Route =
  | { page: 'teams' }
  | { page: 'team'; teamId: string }
  | { page: 'roster'; teamId: string }
  | { page: 'season'; teamId: string; seasonId: string }
  | { page: 'season-dashboard'; teamId: string; seasonId: string }
  | { page: 'new-game'; teamId: string; seasonId: string }
  | { page: 'lineup'; teamId: string; seasonId: string; gameId: string }
  | { page: 'score'; teamId: string; seasonId: string; gameId: string }
  | { page: 'play-log'; teamId: string; seasonId: string; gameId: string }
  | { page: 'game-summary'; teamId: string; seasonId: string; gameId: string }

function parseHash(): Route {
  const hash = window.location.hash.slice(1) || '/'
  const newGameMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)\/new-game$/)
  if (newGameMatch)
    return {
      page: 'new-game',
      teamId: decodeURIComponent(newGameMatch[1]),
      seasonId: decodeURIComponent(newGameMatch[2]),
    }
  const scoreMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)\/game\/([^/]+)\/score$/)
  if (scoreMatch)
    return {
      page: 'score' as const,
      teamId: decodeURIComponent(scoreMatch[1]),
      seasonId: decodeURIComponent(scoreMatch[2]),
      gameId: decodeURIComponent(scoreMatch[3]),
    }
  const playLogMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)\/game\/([^/]+)\/log$/)
  if (playLogMatch)
    return {
      page: 'play-log' as const,
      teamId: decodeURIComponent(playLogMatch[1]),
      seasonId: decodeURIComponent(playLogMatch[2]),
      gameId: decodeURIComponent(playLogMatch[3]),
    }
  const gameSummaryMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)\/game\/([^/]+)\/summary$/)
  if (gameSummaryMatch)
    return {
      page: 'game-summary' as const,
      teamId: decodeURIComponent(gameSummaryMatch[1]),
      seasonId: decodeURIComponent(gameSummaryMatch[2]),
      gameId: decodeURIComponent(gameSummaryMatch[3]),
    }
  const lineupMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)\/game\/([^/]+)\/lineup$/)
  if (lineupMatch)
    return {
      page: 'lineup',
      teamId: decodeURIComponent(lineupMatch[1]),
      seasonId: decodeURIComponent(lineupMatch[2]),
      gameId: decodeURIComponent(lineupMatch[3]),
    }
  const seasonDashboardMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)\/dashboard$/)
  if (seasonDashboardMatch)
    return {
      page: 'season-dashboard' as const,
      teamId: decodeURIComponent(seasonDashboardMatch[1]),
      seasonId: decodeURIComponent(seasonDashboardMatch[2]),
    }
  const seasonMatch = hash.match(/^\/team\/([^/]+)\/season\/([^/]+)$/)
  if (seasonMatch)
    return {
      page: 'season',
      teamId: decodeURIComponent(seasonMatch[1]),
      seasonId: decodeURIComponent(seasonMatch[2]),
    }
  const rosterMatch = hash.match(/^\/team\/([^/]+)\/roster$/)
  if (rosterMatch) return { page: 'roster', teamId: decodeURIComponent(rosterMatch[1]) }
  const teamMatch = hash.match(/^\/team\/([^/]+)$/)
  if (teamMatch) return { page: 'team', teamId: decodeURIComponent(teamMatch[1]) }
  return { page: 'teams' }
}

export function navigate(route: Route): void {
  if (route.page === 'score') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}/game/${encodeURIComponent(route.gameId)}/score`
  } else if (route.page === 'play-log') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}/game/${encodeURIComponent(route.gameId)}/log`
  } else if (route.page === 'game-summary') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}/game/${encodeURIComponent(route.gameId)}/summary`
  } else if (route.page === 'lineup') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}/game/${encodeURIComponent(route.gameId)}/lineup`
  } else if (route.page === 'new-game') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}/new-game`
  } else if (route.page === 'season-dashboard') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}/dashboard`
  } else if (route.page === 'season') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/season/${encodeURIComponent(route.seasonId)}`
  } else if (route.page === 'roster') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}/roster`
  } else if (route.page === 'team') {
    window.location.hash = `/team/${encodeURIComponent(route.teamId)}`
  } else {
    window.location.hash = '/'
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const handler = () => setRoute(parseHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return route
}
