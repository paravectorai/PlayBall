import { useRoute } from './router'
import { TeamListScreen } from './features/team/TeamListScreen'
import { TeamDetailScreen } from './features/team/TeamDetailScreen'
import { RosterScreen } from './features/roster/RosterScreen'
import { SeasonDetailScreen } from './features/game-setup/SeasonDetailScreen'
import { GameSetupScreen } from './features/game-setup/GameSetupScreen'
import { LineupBuilderScreen } from './features/game-setup/LineupBuilderScreen'
import { LiveScoringScreen } from './features/live-scoring/LiveScoringScreen'
import { PlayLogScreen } from './features/play-log/PlayLogScreen'
import { GameSummaryScreen } from './features/game-summary/GameSummaryScreen'
import { SeasonDashboardScreen } from './features/season-dashboard/SeasonDashboardScreen'

export default function App() {
  const route = useRoute()

  if (route.page === 'season-dashboard') {
    return <SeasonDashboardScreen teamId={route.teamId} seasonId={route.seasonId} />
  }

  if (route.page === 'game-summary') {
    return <GameSummaryScreen teamId={route.teamId} seasonId={route.seasonId} gameId={route.gameId} />
  }

  if (route.page === 'play-log') {
    return <PlayLogScreen teamId={route.teamId} seasonId={route.seasonId} gameId={route.gameId} />
  }

  if (route.page === 'score') {
    return <LiveScoringScreen teamId={route.teamId} seasonId={route.seasonId} gameId={route.gameId} />
  }

  if (route.page === 'lineup') {
    return <LineupBuilderScreen teamId={route.teamId} seasonId={route.seasonId} gameId={route.gameId} />
  }

  if (route.page === 'new-game') {
    return <GameSetupScreen teamId={route.teamId} seasonId={route.seasonId} />
  }

  if (route.page === 'season') {
    return <SeasonDetailScreen teamId={route.teamId} seasonId={route.seasonId} />
  }

  if (route.page === 'roster') {
    return <RosterScreen teamId={route.teamId} />
  }

  if (route.page === 'team') {
    return <TeamDetailScreen teamId={route.teamId} />
  }

  return <TeamListScreen />
}
