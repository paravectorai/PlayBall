import type { PlayerSeasonData } from './useSeasonStats'

function fmtAvg(n: number): string {
  const s = n.toFixed(3)
  return s.startsWith('0.') ? s.slice(1) : s
}

function fmtIP(outsRecorded: number): string {
  return `${Math.floor(outsRecorded / 3)}.${outsRecorded % 3}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildRow(item: PlayerSeasonData): string {
  const p = item.player
  const b = item.batting
  const pi = item.pitching

  const g = String(item.gamesPlayed)
  const avg = b ? fmtAvg(b.battingAverage) : ''
  const obp = b ? fmtAvg(b.onBasePct) : ''
  const ops = b ? fmtAvg(b.ops) : ''
  const pa = b ? String(b.plateAppearances) : ''
  const ab = b ? String(b.atBats) : ''
  const h = b ? String(b.hits) : ''
  const d = b ? String(b.doubles) : ''
  const t = b ? String(b.triples) : ''
  const hr = b ? String(b.homeRuns) : ''
  const r = b ? String(b.runs) : ''
  const rbi = b ? String(b.runsBattedIn) : ''
  const bb = b ? String(b.walks + b.intentionalWalks) : ''
  const so = b ? String(b.strikeouts) : ''
  const sb = b ? String(b.stolenBases) : ''
  const slg = b ? fmtAvg(b.sluggingPct) : ''
  const ip = pi ? fmtIP(pi.outsRecorded) : ''
  const era = pi ? pi.era.toFixed(2) : ''
  const whip = pi ? pi.whip.toFixed(2) : ''

  const cells = [
    p.jerseyNumber, esc(`${p.firstName} ${p.lastName}`),
    g, avg, obp, ops, pa, ab, h, d, t, hr, r, rbi, bb, so, sb, slg,
    ip, era, whip,
  ]

  return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`
}

export function openPrintReport(
  players: PlayerSeasonData[],
  teamName: string,
  seasonName: string,
): void {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const rows = players.map(buildRow).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(teamName)} – ${esc(seasonName)} Season Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 10pt;
    color: #181C20;
    background: #fff;
    padding: 0.75in;
  }
  .report-header {
    background: #1B4332;
    color: #fff;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 4px;
  }
  .report-header h1 { font-size: 16pt; font-weight: 700; }
  .report-header p { font-size: 9pt; opacity: 0.75; margin-top: 2px; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  thead th {
    background: #1B4332;
    color: #fff;
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 5px 4px;
    text-align: center;
    white-space: nowrap;
  }
  thead th:nth-child(2) { text-align: left; }
  tbody tr:nth-child(even) { background: #f7f9ff; }
  tbody td {
    padding: 4px;
    text-align: center;
    border-bottom: 1px solid #E9ECEF;
    font-size: 8.5pt;
    white-space: nowrap;
  }
  tbody td:first-child { font-weight: 700; color: #1B4332; }
  tbody td:nth-child(2) { text-align: left; font-weight: 500; }
  .divider-col { border-left: 2px solid #1B4332; }
  @media print {
    body { padding: 0.5in; }
    .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tbody tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="report-header">
  <h1>${esc(teamName)}</h1>
  <p>${esc(seasonName)} &nbsp;&bull;&nbsp; Printed ${esc(dateStr)}</p>
</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Name</th><th>G</th>
      <th>AVG</th><th>OBP</th><th>OPS</th>
      <th>PA</th><th>AB</th><th>H</th>
      <th>2B</th><th>3B</th><th>HR</th>
      <th>R</th><th>RBI</th><th>BB</th><th>SO</th><th>SB</th><th>SLG</th>
      <th class="divider-col">IP</th><th>ERA</th><th>WHIP</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}
