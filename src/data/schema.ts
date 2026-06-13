// Row types for all IndexedDB tables. T-004 will add narrowed stat interfaces
// and live game domain types that extend these base rows.

export interface TeamRow {
  id: string;
  name: string;
  abbreviation: string;
  createdAt: number;
}

export interface SeasonRow {
  id: string;
  teamId: string;
  name: string;
  year: number;
  createdAt: number;
}

export interface PlayerRow {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  positions: string[];
  // 0 | 1 instead of boolean — IndexedDB boolean indexes are unreliable for false in some engines
  isActive: 0 | 1;
  createdAt: number;
}

export type GameStatus = 'scheduled' | 'in_progress' | 'completed';
export type HalfInning = 'top' | 'bottom';
export type HomeAway = 'home' | 'away';

export interface GameRow {
  id: string;
  seasonId: string;
  opponent: string;
  gameDate: string;           // ISO date: YYYY-MM-DD — indexed for chronological sort
  homeAway: HomeAway;
  inningsScheduled: number;   // typically 6 for youth leagues
  status: GameStatus;
  ruleset: Record<string, unknown>; // T-004 will narrow to RulesetConfig
  /** Set when the opponent has a registered roster; undefined = quick-score mode */
  opponentTeamId?: string;
  createdAt: number;
}

export interface LineupRow {
  id: string;
  gameId: string;
  playerId: string;
  battingOrder: number;  // 1-based; 0 = bench / not batting
  position: string;      // P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH, BN
  createdAt: number;
}

export type PlayOutcome =
  | 'single'
  | 'double'
  | 'triple'
  | 'home_run'
  | 'walk'
  | 'intentional_walk'
  | 'strikeout_swinging'
  | 'strikeout_looking'
  | 'hit_by_pitch'
  | 'field_out'
  | 'field_error'
  | 'sac_fly'
  | 'sac_bunt'
  | 'fielders_choice'
  | 'catcher_interference'
  | 'stolen_base'
  | 'caught_stealing'
  // Synthetic outcome used when scoring the opponent half-inning in quick-score mode.
  // No player stats are derived from events with this outcome.
  | 'opponent_score';

export interface RunnerState {
  first?: string;   // playerId occupying first base, or undefined
  second?: string;
  third?: string;
}

export interface PlayEventRow {
  id: string;
  gameId: string;
  sequenceNumber: number;    // monotonically increasing within a game; used for ordering + undo
  inning: number;
  halfInning: HalfInning;
  batterPlayerId: string;    // empty string for base-running-only events (steals)
  pitcherPlayerId: string;   // empty string for base-running-only events
  outcome: PlayOutcome;
  runnersBefore: RunnerState;  // stored as structured object, not JSON string
  runnersAfter: RunnerState;
  runsScored: number;
  rbiCount: number;
  outsRecorded: number;
  isEarnedRun: boolean;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export type StatType = 'batting' | 'pitching' | 'fielding';

export interface GameStatRow {
  id: string;
  gameId: string;
  playerId: string;
  statType: StatType;
  stats: Record<string, number>;  // T-004 will narrow: BattingStats | PitchingStats | FieldingStats
  computedAt: number;
}

export interface SeasonStatRow {
  id: string;
  seasonId: string;
  playerId: string;
  statType: StatType;
  stats: Record<string, number>;
  computedAt: number;
}
