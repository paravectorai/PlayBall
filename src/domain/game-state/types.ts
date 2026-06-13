import type { HalfInning, PlayOutcome, RunnerState } from '@/data/schema';

// ---------------------------------------------------------------------------
// Live game domain types
// These model the in-memory state of an active game.  They are never stored
// directly in IndexedDB — the persistence layer stores play_events rows and
// rebuilds this state on load.
// ---------------------------------------------------------------------------

export interface LiveLineupEntry {
  battingOrder: number;  // 1-based; all active batters must have a unique order
  playerId: string;
  position: string;      // P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH, BN
}

export interface LiveInningState {
  inning: number;
  halfInning: HalfInning;
  outs: number;          // 0–2 within the inning
  runsScored: number;    // runs scored so far this half-inning
  playsRecorded: number; // plate appearances + base-running events in this half-inning
}

// Context provided to the outcome button grid and runner advancement UI.
// Calculated fresh after every play is saved.
export interface LivePlayContext {
  batterPlayerId: string;
  pitcherPlayerId: string;
  runners: RunnerState;
  outs: number;
  inning: number;
  halfInning: HalfInning;
}

// Top-level live game state held in the Zustand store during an active game.
// Everything needed to render the scoreboard HUD without additional DB queries.
export interface LiveGameState {
  gameId: string;
  // Inning / outs / runners
  currentInning: number;
  halfInning: HalfInning;
  outs: number;           // 0–2
  runners: RunnerState;
  // Score — each team's cumulative runs
  homeScore: number;
  awayScore: number;
  /** Runs scored by the opponent (derived from opponent-half play events). */
  opponentRuns: number;
  // Batting order
  lineupOrdered: LiveLineupEntry[];    // sorted by battingOrder ascending
  currentBatterIndex: number;          // index into lineupOrdered (wraps around)
  // Pitching
  currentPitcherPlayerId: string;
  // Undo support
  lastPlayEventId: string | null;
  // Session control
  isGameOver: boolean;
  isPaused: boolean;
  /**
   * Scoring mode for the current half-inning:
   * - 'our_half'        — our team is batting; show outcome grid
   * - 'opponent_quick'  — opponent at bat, no roster; show +/– run counter
   * - 'opponent_lineup' — opponent at bat, roster loaded (Phase 4; reserved)
   */
  scoringMode: 'our_half' | 'opponent_quick' | 'opponent_lineup';
}

// Outcome of a recorded play — returned by PlayRecorderService so the UI
// can update LiveGameState and display a confirmation toast.
export interface RecordedPlayResult {
  playEventId: string;
  outcome: PlayOutcome;
  runnersAfter: RunnerState;
  runsScored: number;
  outsAfter: number;
  inningAdvanced: boolean;   // true if the inning changed after this play
  gameOver: boolean;
}
