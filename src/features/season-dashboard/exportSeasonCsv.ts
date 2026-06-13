import type { PlayerSeasonData } from './useSeasonStats'

function fmtAvg(n: number): string {
  const s = n.toFixed(3)
  return s.startsWith('0.') ? s.slice(1) : s
}

function fmtIP(outsRecorded: number): string {
  return `${Math.floor(outsRecorded / 3)}.${outsRecorded % 3}`
}

function safeName(s: string): string {
  return s.replace(/[\s/\\:*?"<>|]+/g, '_')
}

export function buildSeasonCsv(players: PlayerSeasonData[]): string {
  const header = [
    '#', 'Name', 'G',
    'PA', 'AB', 'H', '2B', '3B', 'HR', 'R', 'RBI', 'BB', 'SO', 'SB',
    'AVG', 'OBP', 'SLG', 'OPS',
    'IP', 'ERA', 'WHIP',
  ].join(',')

  const rows = players.map(item => {
    const p = item.player
    const b = item.batting
    const pi = item.pitching

    const battingCols = b
      ? [
          item.gamesPlayed,
          b.plateAppearances, b.atBats, b.hits,
          b.doubles, b.triples, b.homeRuns,
          b.runs, b.runsBattedIn,
          b.walks + b.intentionalWalks,
          b.strikeouts, b.stolenBases,
          fmtAvg(b.battingAverage), fmtAvg(b.onBasePct), fmtAvg(b.sluggingPct), fmtAvg(b.ops),
        ]
      : [item.gamesPlayed, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']

    const pitchingCols = pi
      ? [fmtIP(pi.outsRecorded), pi.era.toFixed(2), pi.whip.toFixed(2)]
      : ['', '', '']

    const name = `"${p.firstName} ${p.lastName}"`
    return [p.jerseyNumber, name, ...battingCols, ...pitchingCols].join(',')
  })

  return [header, ...rows].join('\r\n')
}

export function downloadCsv(csv: string, teamName: string, seasonName: string): void {
  const filename = `${safeName(teamName)}_${safeName(seasonName)}_stats.csv`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
