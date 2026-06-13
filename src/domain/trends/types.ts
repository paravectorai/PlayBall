import type { BattingStats, PitchingStats } from '../stat-engine/types'

export interface BattingTrendWindow {
  gamesInWindow: number   // actual games contributing (≤ requested window size)
  stats: BattingStats     // count stats summed; rate stats recomputed from those sums
}

export interface PitchingTrendWindow {
  gamesInWindow: number
  stats: PitchingStats    // count stats summed; rate stats recomputed from those sums
}

export interface PlayerBattingTrends {
  last3: BattingTrendWindow
  last5: BattingTrendWindow
  seasonToDate: BattingTrendWindow
}

export interface PlayerPitchingTrends {
  last3: PitchingTrendWindow
  last5: PitchingTrendWindow
  seasonToDate: PitchingTrendWindow
}
