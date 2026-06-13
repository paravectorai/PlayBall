export interface SparklineSeries {
  values: number[]
  color: string
}

interface SparklineProps {
  series: SparklineSeries[]
  height?: number
  strokeWidth?: number
}

const PAD_X = 3
const PAD_Y = 4

export function Sparkline({ series, height = 40, strokeWidth = 1.5 }: SparklineProps) {
  const allValues = series.flatMap(s => s.values)
  if (allValues.length === 0) return null

  // Floor the Y axis at 0 so a small range doesn't appear as huge swings
  const minVal = 0
  const maxVal = Math.max(...allValues, 0.001)
  const range = maxVal - minVal

  const plotW = 100 - PAD_X * 2
  const plotH = height - PAD_Y * 2

  function getX(i: number, total: number): number {
    if (total <= 1) return PAD_X + plotW / 2
    return PAD_X + (i / (total - 1)) * plotW
  }

  function getY(v: number): number {
    return PAD_Y + (1 - (v - minVal) / range) * plotH
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {series.map((s, si) => {
        if (s.values.length < 2) return null
        const pts = s.values.map((v, i) => `${getX(i, s.values.length)},${getY(v)}`).join(' ')
        return (
          <g key={si}>
            <polyline
              points={pts}
              fill="none"
              stroke={s.color}
              stroke-width={strokeWidth}
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.9"
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={getX(i, s.values.length)}
                cy={getY(v)}
                r={i === s.values.length - 1 ? 2 : 1.2}
                fill={s.color}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
