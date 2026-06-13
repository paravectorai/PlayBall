import { Card } from '../../shared/ui/Card'
import { Sparkline } from '../../shared/ui/Sparkline'
import { navigate } from '../../router'
import { useTeams } from '../team/useTeams'
import { useSeasons } from '../team/useSeasons'
import { useSeasonStats } from './useSeasonStats'
import { buildSeasonCsv, downloadCsv } from './exportSeasonCsv'
import { openPrintReport } from './printSeasonReport'
import { useStorageHealth } from '../storage/useStorageHealth'
import type { StorageHealth } from '../storage/useStorageHealth'
import type { PlayerGamePoint } from './useSeasonStats'
import type { BattingStats, PitchingStats } from '../../domain'

interface Props {
  teamId: string
  seasonId: string
}

function fmtAvg(n: number): string {
  if (n === 0) return '.000'
  const s = n.toFixed(3)
  return s.startsWith('0.') ? s.slice(1) : s
}

function fmtIP(outsRecorded: number): string {
  return `${Math.floor(outsRecorded / 3)}.${outsRecorded % 3}`
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div class="flex flex-col items-center px-3 py-2 min-w-[3rem]">
      <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 leading-none">
        {label}
      </span>
      <span class="text-sm font-bold font-tnum text-text-main mt-1 leading-none">{value}</span>
    </div>
  )
}

function BattingCard({
  gamesPlayed,
  batting,
}: {
  gamesPlayed: number
  batting: BattingStats
}) {
  return (
    <>
      <div class="px-4 pt-2.5 pb-1">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Batting
        </span>
      </div>
      {/* Highlight stats — always visible, 4-column grid */}
      <div class="grid grid-cols-4 divide-x divide-border border-b border-border">
        <StatCell label="G" value={String(gamesPlayed)} />
        <StatCell label="AVG" value={fmtAvg(batting.battingAverage)} />
        <StatCell label="OBP" value={fmtAvg(batting.onBasePct)} />
        <StatCell label="OPS" value={fmtAvg(batting.ops)} />
      </div>
      {/* Count stats — horizontal scroll */}
      <div class="overflow-x-auto">
        <div class="flex divide-x divide-border border-b border-border">
          <StatCell label="PA" value={String(batting.plateAppearances)} />
          <StatCell label="AB" value={String(batting.atBats)} />
          <StatCell label="H" value={String(batting.hits)} />
          <StatCell label="2B" value={String(batting.doubles)} />
          <StatCell label="3B" value={String(batting.triples)} />
          <StatCell label="HR" value={String(batting.homeRuns)} />
          <StatCell label="R" value={String(batting.runs)} />
          <StatCell label="RBI" value={String(batting.runsBattedIn)} />
          <StatCell label="BB" value={String(batting.walks + batting.intentionalWalks)} />
          <StatCell label="SO" value={String(batting.strikeouts)} />
          <StatCell label="SB" value={String(batting.stolenBases)} />
          <StatCell label="SLG" value={fmtAvg(batting.sluggingPct)} />
        </div>
      </div>
    </>
  )
}

function PitchingCard({ pitching }: { pitching: PitchingStats }) {
  return (
    <>
      <div class="px-4 pt-2.5 pb-1">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Pitching
        </span>
      </div>
      {/* Highlight stats */}
      <div class="grid grid-cols-4 divide-x divide-border border-b border-border">
        <StatCell label="IP" value={fmtIP(pitching.outsRecorded)} />
        <StatCell label="ERA" value={pitching.era.toFixed(2)} />
        <StatCell label="WHIP" value={pitching.whip.toFixed(2)} />
        <StatCell label="SO" value={String(pitching.strikeouts)} />
      </div>
      {/* Count stats */}
      <div class="overflow-x-auto">
        <div class="flex divide-x divide-border">
          <StatCell label="BF" value={String(pitching.battersFaced)} />
          <StatCell label="H" value={String(pitching.hitsAllowed)} />
          <StatCell label="R" value={String(pitching.runsAllowed)} />
          <StatCell label="ER" value={String(pitching.earnedRuns)} />
          <StatCell label="BB" value={String(pitching.walksAllowed)} />
        </div>
      </div>
    </>
  )
}

function TrendChart({ timeSeries }: { timeSeries: PlayerGamePoint[] }) {
  if (timeSeries.length < 2) return null

  const avgSeries = { values: timeSeries.map(p => p.avg), color: '#1B4332' }
  const obpSeries = { values: timeSeries.map(p => p.obp), color: '#D9480F' }

  return (
    <div class="border-t border-border px-4 pt-2.5 pb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Trend
        </span>
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1 text-[10px] text-gray-500">
            <svg width="12" height="2" viewBox="0 0 12 2" aria-hidden="true">
              <line x1="0" y1="1" x2="12" y2="1" stroke="#1B4332" stroke-width="2" stroke-linecap="round" />
            </svg>
            AVG
          </span>
          <span class="flex items-center gap-1 text-[10px] text-gray-500">
            <svg width="12" height="2" viewBox="0 0 12 2" aria-hidden="true">
              <line x1="0" y1="1" x2="12" y2="1" stroke="#D9480F" stroke-width="2" stroke-linecap="round" />
            </svg>
            OBP
          </span>
          <span class="text-[10px] text-gray-400">
            {timeSeries.length}G
          </span>
        </div>
      </div>
      <div class="h-10 w-full">
        <Sparkline series={[avgSeries, obpSeries]} height={40} />
      </div>
    </div>
  )
}

function StorageHealthBanner({
  health,
  onExport,
}: {
  health: StorageHealth
  onExport: () => void
}) {
  const storageWarn = health.usageMB >= 40
  const persistWarn = health.persistenceGranted === false

  if (!storageWarn && !persistWarn) return null

  return (
    <div
      class="rounded border border-clay/30 bg-clay/10 px-4 py-3 flex items-start gap-3"
      role="alert"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-clay shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-clay">
          {storageWarn
            ? `Storage nearly full — ${health.usageMB.toFixed(1)} MB used`
            : 'Storage not protected'}
        </p>
        <p class="text-xs text-clay/80 mt-0.5">
          {storageWarn
            ? 'Export your season stats to keep a backup before storage fills up.'
            : 'Your browser may clear this data at any time. Export to keep a backup.'}
        </p>
      </div>
      <button
        class="shrink-0 text-xs font-semibold text-clay underline min-h-[44px] px-1 flex items-center"
        onClick={onExport}
        aria-label="Export season stats as CSV"
      >
        Export CSV
      </button>
    </div>
  )
}

export function SeasonDashboardScreen({ teamId, seasonId }: Props) {
  const teams = useTeams()
  const seasons = useSeasons(teamId)
  const playerStats = useSeasonStats(teamId, seasonId)
  const storageHealth = useStorageHealth()

  const team = teams?.find(t => t.id === teamId)
  const season = seasons?.find(s => s.id === seasonId)

  const isLoading = playerStats === undefined

  function handleExport() {
    if (!playerStats || playerStats.length === 0) return
    const csv = buildSeasonCsv(playerStats)
    downloadCsv(csv, team?.name ?? 'Team', season?.name ?? 'Season')
  }

  function handlePrint() {
    if (!playerStats || playerStats.length === 0) return
    openPrintReport(playerStats, team?.name ?? 'Team', season?.name ?? 'Season')
  }

  return (
    <div class="min-h-screen bg-background pb-24">
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'season', teamId, seasonId })}
          >
            <span class="text-base">‹</span>{' '}
            {season ? season.name : 'Season'}
          </button>
          <div class="flex items-center justify-between">
            <h1 class="text-white text-xl font-bold">Season Stats</h1>
            {!isLoading && playerStats.length > 0 && (
              <div class="flex items-center gap-1 -mr-2">
                <button
                  class="flex items-center gap-1 text-white/80 text-sm font-medium min-h-[44px] px-2"
                  onClick={handlePrint}
                  aria-label="Print season report"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                  </svg>
                  Print
                </button>
                <button
                  class="flex items-center gap-1 text-white/80 text-sm font-medium min-h-[44px] px-2"
                  onClick={handleExport}
                  aria-label="Export season stats as CSV"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11" />
                  </svg>
                  CSV
                </button>
              </div>
            )}
          </div>
          {team && season && (
            <p class="text-white/60 text-sm mt-0.5">
              {team.name} · {season.name}
            </p>
          )}
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
        {storageHealth?.isWarning && (
          <StorageHealthBanner health={storageHealth} onExport={handleExport} />
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} class="h-32 rounded border border-border bg-surface animate-pulse" />
            ))}
          </>
        )}

        {/* Empty state */}
        {!isLoading && playerStats.length === 0 && (
          <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span class="text-3xl">📊</span>
            <p class="text-text-main font-semibold">No stats yet</p>
            <p class="text-sm text-gray-500 max-w-xs">
              Complete a game and save plays to see season stats here.
            </p>
          </div>
        )}

        {/* Player stat cards */}
        {!isLoading &&
          playerStats.map(item => (
            <Card key={item.player.id} padding={false}>
              {/* Player header */}
              <div class="px-4 py-3 border-b border-border flex items-center gap-2 min-h-[44px]">
                <span class="text-sm font-bold text-primary font-tnum w-8 shrink-0">
                  #{item.player.jerseyNumber}
                </span>
                <span class="text-sm font-semibold text-text-main">
                  {item.player.firstName} {item.player.lastName}
                </span>
              </div>

              {item.batting && (
                <BattingCard gamesPlayed={item.gamesPlayed} batting={item.batting} />
              )}

              {item.batting && (
                <TrendChart timeSeries={item.battingTimeSeries} />
              )}

              {item.pitching && <PitchingCard pitching={item.pitching} />}
            </Card>
          ))}
      </div>
    </div>
  )
}
