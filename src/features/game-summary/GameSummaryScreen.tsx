import { useEffect, useState } from 'preact/hooks'
import { Badge } from '../../shared/ui/Badge'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { navigate } from '../../router'
import {
  gameRepo,
  gameStatRepo,
  lineupRepo,
  playEventRepo,
  playerRepo,
} from '../../data/repositories'
import { useSeasons } from '../team/useSeasons'
import type { BattingGameStatRow, PitchingGameStatRow } from '../../domain'
import type { GameRow, HalfInning, LineupRow, PlayEventRow, PlayerRow } from '../../data/schema'

interface Props {
  teamId: string
  seasonId: string
  gameId: string
}

function fmtDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtIP(outsRecorded: number): string {
  return `${Math.floor(outsRecorded / 3)}.${outsRecorded % 3}`
}

function fmtAvg(n: number): string {
  if (n === 0) return '.000'
  const s = n.toFixed(3)
  return s.startsWith('0.') ? s.slice(1) : s
}

export function GameSummaryScreen({ teamId, seasonId, gameId }: Props) {
  const seasons = useSeasons(teamId)
  const [game, setGame] = useState<GameRow | null>(null)
  const [players, setPlayers] = useState<PlayerRow[] | undefined>(undefined)
  const [lineup, setLineup] = useState<LineupRow[] | undefined>(undefined)
  const [events, setEvents] = useState<PlayEventRow[] | undefined>(undefined)
  const [battingRows, setBattingRows] = useState<BattingGameStatRow[] | undefined>(undefined)
  const [pitchingRows, setPitchingRows] = useState<PitchingGameStatRow[] | undefined>(undefined)

  const season = seasons?.find(s => s.id === seasonId)

  useEffect(() => {
    async function load() {
      const [g, ps, lu, evts, allStats] = await Promise.all([
        gameRepo.findById(gameId),
        playerRepo.findByTeam(teamId),
        lineupRepo.findByGame(gameId),
        playEventRepo.findByGameOrdered(gameId),
        gameStatRepo.findByGame(gameId),
      ])
      setGame(g ?? null)
      setPlayers(ps)
      setLineup(lu)
      setEvents(evts)
      setBattingRows(
        (allStats.filter(s => s.statType === 'batting') as unknown as BattingGameStatRow[]).sort(
          (a, b) => {
            const ao = lu.find(l => l.playerId === a.playerId)?.battingOrder ?? 99
            const bo = lu.find(l => l.playerId === b.playerId)?.battingOrder ?? 99
            return ao - bo
          },
        ),
      )
      setPitchingRows(
        allStats.filter(s => s.statType === 'pitching') as unknown as PitchingGameStatRow[],
      )
    }
    load()
  }, [gameId, teamId])

  const isLoading =
    !game ||
    players === undefined ||
    lineup === undefined ||
    events === undefined ||
    battingRows === undefined ||
    pitchingRows === undefined

  if (isLoading) {
    return (
      <div class="min-h-screen bg-background">
        <div class="h-28 bg-primary animate-pulse" />
        <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} class="h-24 rounded border border-border bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Line score: sum runsScored per inning
  const ourHalf: HalfInning = game.homeAway === 'home' ? 'bottom' : 'top'
  const opponentHalf: HalfInning = ourHalf === 'bottom' ? 'top' : 'bottom'
  const maxInning = Math.max(game.inningsScheduled, ...events.map(e => e.inning), 1)
  const inningsArr = Array.from({ length: maxInning }, (_, i) => i + 1)
  const runsPerInning = inningsArr.map(inn =>
    events
      .filter(e => e.halfInning === ourHalf && e.inning === inn)
      .reduce((sum, e) => sum + e.runsScored, 0),
  )
  const oppRunsPerInning = inningsArr.map(inn =>
    events
      .filter(e => e.halfInning === opponentHalf && e.inning === inn)
      .reduce((sum, e) => sum + e.runsScored, 0),
  )
  // Only count hits from official play events (batting rows already exclude opponent_score)
  const totalRuns = runsPerInning.reduce((s, r) => s + r, 0)
  const oppTotalRuns = oppRunsPerInning.reduce((s, r) => s + r, 0)
  const totalHits = battingRows.reduce((sum, r) => sum + r.stats.hits, 0)

  // Totals for batting footer
  const batTotals = {
    atBats:       battingRows.reduce((s, r) => s + r.stats.atBats, 0),
    runs:         battingRows.reduce((s, r) => s + r.stats.runs, 0),
    hits:         battingRows.reduce((s, r) => s + r.stats.hits, 0),
    doubles:      battingRows.reduce((s, r) => s + r.stats.doubles, 0),
    triples:      battingRows.reduce((s, r) => s + r.stats.triples, 0),
    homeRuns:     battingRows.reduce((s, r) => s + r.stats.homeRuns, 0),
    runsBattedIn: battingRows.reduce((s, r) => s + r.stats.runsBattedIn, 0),
    walks:        battingRows.reduce((s, r) => s + r.stats.walks + r.stats.intentionalWalks, 0),
    strikeouts:   battingRows.reduce((s, r) => s + r.stats.strikeouts, 0),
  }

  const thCls = 'px-2 py-2 font-medium text-gray-500 text-center min-w-[2rem]'
  const tdCls = 'px-2 py-2 text-center text-text-main'
  const tdBoldCls = 'px-2 py-2 text-center font-semibold text-text-main'

  return (
    <div class="min-h-screen bg-background pb-24">
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'play-log', teamId, seasonId, gameId })}
          >
            <span class="text-base">‹</span> Play Log
          </button>
          <h1 class="text-white text-xl font-bold">Game Summary</h1>
          <p class="text-white/60 text-sm mt-0.5">
            vs. {game.opponent}
            {season ? ` · ${season.name}` : ''} · {fmtDate(game.gameDate)}
          </p>
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Status badges */}
        <div class="flex items-center gap-2">
          <Badge variant={game.homeAway === 'home' ? 'success' : 'default'}>
            {game.homeAway === 'home' ? 'HOME' : 'AWAY'}
          </Badge>
          <Badge
            variant={
              game.status === 'completed'
                ? 'success'
                : game.status === 'in_progress'
                ? 'warning'
                : 'default'
            }
          >
            {game.status === 'scheduled'
              ? 'Scheduled'
              : game.status === 'in_progress'
              ? 'In Progress'
              : 'Final'}
          </Badge>
        </div>

        {/* Line Score */}
        <section>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Line Score
          </h2>
          <Card padding={false}>
            <div class="overflow-x-auto">
              <table class="w-full text-xs font-tnum whitespace-nowrap">
                <thead>
                  <tr class="border-b border-border">
                    <th class="text-left px-3 py-2 font-medium text-gray-500 min-w-[3rem]" />
                    {inningsArr.map(i => (
                      <th key={i} class={thCls}>{i}</th>
                    ))}
                    <th class="px-2 py-2 font-bold text-text-main text-center min-w-[2rem] border-l border-border">
                      R
                    </th>
                    <th class="px-2 py-2 font-bold text-text-main text-center min-w-[2rem]">H</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="px-3 py-2 font-semibold text-text-main text-left text-xs">Us</td>
                    {runsPerInning.map((r, i) => (
                      <td key={i} class={tdCls}>{r}</td>
                    ))}
                    <td class="px-2 py-2 text-center font-bold text-text-main border-l border-border">
                      {totalRuns}
                    </td>
                    <td class="px-2 py-2 text-center font-bold text-text-main">{totalHits}</td>
                  </tr>
                  <tr class="border-t border-border">
                    <td class="px-3 py-2 font-semibold text-clay text-left text-xs">
                      {game.opponent.length > 10 ? game.opponent.slice(0, 10) + '…' : game.opponent}
                    </td>
                    {oppRunsPerInning.map((r, i) => (
                      <td key={i} class={`${tdCls} text-clay`}>{r}</td>
                    ))}
                    <td class="px-2 py-2 text-center font-bold text-clay border-l border-border">
                      {oppTotalRuns}
                    </td>
                    <td class="px-2 py-2 text-center text-gray-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Batting */}
        <section>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Batting
          </h2>
          {battingRows.length === 0 ? (
            <Card>
              <p class="text-sm text-gray-400 text-center py-4">No batting stats recorded yet</p>
            </Card>
          ) : (
            <Card padding={false}>
              <div class="overflow-x-auto">
                <table class="w-full text-xs font-tnum whitespace-nowrap">
                  <thead>
                    <tr class="border-b border-border">
                      <th class="text-left px-3 py-2 font-medium text-gray-500 min-w-[7rem]">
                        Player
                      </th>
                      <th class={thCls}>AB</th>
                      <th class={thCls}>R</th>
                      <th class={thCls}>H</th>
                      <th class={thCls}>2B</th>
                      <th class={thCls}>3B</th>
                      <th class={thCls}>HR</th>
                      <th class={thCls}>RBI</th>
                      <th class={thCls}>BB</th>
                      <th class={thCls}>SO</th>
                      <th class="px-2 py-2 font-medium text-gray-500 text-center min-w-[3rem]">
                        AVG
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {battingRows.map(row => {
                      const player = players.find(p => p.id === row.playerId)
                      const s = row.stats
                      return (
                        <tr key={row.id} class="border-b border-border last:border-b-0">
                          <td class="px-3 py-2 text-left">
                            <span class="text-gray-400 mr-1">#{player?.jerseyNumber}</span>
                            <span class="text-text-main font-medium">
                              {player
                                ? `${player.firstName} ${player.lastName[0]}.`
                                : '—'}
                            </span>
                          </td>
                          <td class={tdCls}>{s.atBats}</td>
                          <td class={tdCls}>{s.runs}</td>
                          <td class={tdCls}>{s.hits}</td>
                          <td class={tdCls}>{s.doubles}</td>
                          <td class={tdCls}>{s.triples}</td>
                          <td class={tdCls}>{s.homeRuns}</td>
                          <td class={tdCls}>{s.runsBattedIn}</td>
                          <td class={tdCls}>{s.walks + s.intentionalWalks}</td>
                          <td class={tdCls}>{s.strikeouts}</td>
                          <td class={`${tdCls} font-semibold`}>{fmtAvg(s.battingAverage)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr class="border-t-2 border-border bg-gray-50">
                      <td class="px-3 py-2 font-semibold text-text-main text-left text-xs">
                        TOTALS
                      </td>
                      <td class={tdBoldCls}>{batTotals.atBats}</td>
                      <td class={tdBoldCls}>{batTotals.runs}</td>
                      <td class={tdBoldCls}>{batTotals.hits}</td>
                      <td class={tdBoldCls}>{batTotals.doubles}</td>
                      <td class={tdBoldCls}>{batTotals.triples}</td>
                      <td class={tdBoldCls}>{batTotals.homeRuns}</td>
                      <td class={tdBoldCls}>{batTotals.runsBattedIn}</td>
                      <td class={tdBoldCls}>{batTotals.walks}</td>
                      <td class={tdBoldCls}>{batTotals.strikeouts}</td>
                      <td class="px-2 py-2 text-center text-gray-400">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </section>

        {/* Pitching */}
        <section>
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Pitching
          </h2>
          {pitchingRows.length === 0 ? (
            <Card>
              <p class="text-sm text-gray-400 text-center py-4">No pitching stats recorded yet</p>
            </Card>
          ) : (
            <Card padding={false}>
              <div class="overflow-x-auto">
                <table class="w-full text-xs font-tnum whitespace-nowrap">
                  <thead>
                    <tr class="border-b border-border">
                      <th class="text-left px-3 py-2 font-medium text-gray-500 min-w-[7rem]">
                        Player
                      </th>
                      <th class="px-2 py-2 font-medium text-gray-500 text-center min-w-[2.5rem]">
                        IP
                      </th>
                      <th class={thCls}>H</th>
                      <th class={thCls}>R</th>
                      <th class={thCls}>ER</th>
                      <th class={thCls}>BB</th>
                      <th class={thCls}>SO</th>
                      <th class="px-2 py-2 font-medium text-gray-500 text-center min-w-[3rem]">
                        ERA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pitchingRows.map(row => {
                      const player = players.find(p => p.id === row.playerId)
                      const s = row.stats
                      return (
                        <tr key={row.id} class="border-b border-border last:border-b-0">
                          <td class="px-3 py-2 text-left">
                            <span class="text-gray-400 mr-1">#{player?.jerseyNumber}</span>
                            <span class="text-text-main font-medium">
                              {player
                                ? `${player.firstName} ${player.lastName[0]}.`
                                : '—'}
                            </span>
                          </td>
                          <td class={tdCls}>{fmtIP(s.outsRecorded)}</td>
                          <td class={tdCls}>{s.hitsAllowed}</td>
                          <td class={tdCls}>{s.runsAllowed}</td>
                          <td class={tdCls}>{s.earnedRuns}</td>
                          <td class={tdCls}>{s.walksAllowed}</td>
                          <td class={tdCls}>{s.strikeouts}</td>
                          <td class={`${tdCls} font-semibold`}>{s.era.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        {/* Bottom nav */}
        <div class="flex gap-3 pt-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate({ page: 'season', teamId, seasonId })}
          >
            ← Season
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate({ page: 'play-log', teamId, seasonId, gameId })}
          >
            Play Log
          </Button>
          <Button
            size="md"
            onClick={() => navigate({ page: 'score', teamId, seasonId, gameId })}
          >
            {game.status === 'in_progress' ? 'Continue Scoring' : 'Scoring'}
          </Button>
        </div>
      </div>
    </div>
  )
}
