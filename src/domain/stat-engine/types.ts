import type { GameStatRow, SeasonStatRow } from '@/data/schema';

// ---------------------------------------------------------------------------
// Batting stat interface
// Count stats reflect raw play-event accumulation; rate stats are floats.
// All rate stats are 0 when the denominator is 0 — never NaN or undefined.
// ---------------------------------------------------------------------------

export interface BattingStats {
  // Count stats
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runs: number;
  runsBattedIn: number;
  walks: number;
  intentionalWalks: number;
  hitByPitch: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  sacFlies: number;
  // Rate stats
  battingAverage: number;   // H / AB
  onBasePct: number;        // (H + BB + HBP) / (AB + BB + HBP + SF)
  sluggingPct: number;      // TB / AB
  ops: number;              // OBP + SLG
}

// ---------------------------------------------------------------------------
// Pitching stat interface
// outsRecorded is the canonical innings-pitched unit (3 outs = 1 full inning).
// Display helpers should format outsRecorded to "2.1" notation; never store
// the fractional display value.
// ---------------------------------------------------------------------------

export interface PitchingStats {
  // Count stats
  outsRecorded: number;    // integer outs; outsRecorded / 3 = full innings pitched
  battersFaced: number;
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walksAllowed: number;
  strikeouts: number;
  hitBatters: number;
  pitchCount: number;
  // Rate stats
  era: number;             // (earnedRuns / outsRecorded) * 27; 0 when outsRecorded = 0
  whip: number;            // (walksAllowed + hitsAllowed) / (outsRecorded / 3); 0 when outsRecorded = 0
}

// ---------------------------------------------------------------------------
// Fielding stat interface
// ---------------------------------------------------------------------------

export interface FieldingStats {
  putouts: number;
  assists: number;
  errors: number;
  doublePlays: number;
  fieldingPct: number;     // (PO + A) / (PO + A + E); 0 when all three are 0
}

// ---------------------------------------------------------------------------
// Typed row wrappers
// These narrow the generic `stats: Record<string, number>` field on the
// storage row types to the specific stat interfaces above.  Feature code and
// the stat engine should accept/return these narrowed types rather than the
// raw row types.
// ---------------------------------------------------------------------------

export type BattingGameStatRow = Omit<GameStatRow, 'statType' | 'stats'> & {
  statType: 'batting';
  stats: BattingStats;
};

export type PitchingGameStatRow = Omit<GameStatRow, 'statType' | 'stats'> & {
  statType: 'pitching';
  stats: PitchingStats;
};

export type FieldingGameStatRow = Omit<GameStatRow, 'statType' | 'stats'> & {
  statType: 'fielding';
  stats: FieldingStats;
};

export type TypedGameStatRow =
  | BattingGameStatRow
  | PitchingGameStatRow
  | FieldingGameStatRow;

export type BattingSeasonStatRow = Omit<SeasonStatRow, 'statType' | 'stats'> & {
  statType: 'batting';
  stats: BattingStats;
};

export type PitchingSeasonStatRow = Omit<SeasonStatRow, 'statType' | 'stats'> & {
  statType: 'pitching';
  stats: PitchingStats;
};

export type FieldingSeasonStatRow = Omit<SeasonStatRow, 'statType' | 'stats'> & {
  statType: 'fielding';
  stats: FieldingStats;
};

export type TypedSeasonStatRow =
  | BattingSeasonStatRow
  | PitchingSeasonStatRow
  | FieldingSeasonStatRow;
