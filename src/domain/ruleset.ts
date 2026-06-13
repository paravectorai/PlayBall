import type { GameRow } from '@/data/schema';

// ---------------------------------------------------------------------------
// RulesetConfig
// Stored as GameRow.ruleset (Record<string, unknown>).  Use isRulesetConfig()
// at the data-read boundary to narrow the raw field to this type.
// ---------------------------------------------------------------------------

export interface RulesetConfig {
  // Innings
  scheduledInnings: number;          // typically 6 for youth leagues
  // Run limits
  maxRunsPerInning: number | null;   // null = no limit; e.g. 5 for rec leagues
  mercyRuleRuns: number | null;      // run differential that ends the game early
  mercyRuleAfterInning: number | null; // earliest inning the mercy rule applies
  // Pitching
  pitchCountLimit: number | null;    // null = no pitch count enforcement
  // Base-running and lineup
  allowCourtesyRunner: boolean;      // substitute runner for catcher/pitcher
  allowFreeSubstitution: boolean;    // re-entry allowed for any player any time
  allowReEntry: boolean;             // player removed may re-enter once
  continuousBattingOrder: boolean;   // all players on roster bat in order
  dropThirdStrikeRule: boolean;      // uncaught third strike allows batter to run
  // Intentional walk
  automaticIntentionalWalk: boolean; // four-pitch IBB vs. signal-only
}

export const defaultRuleset: RulesetConfig = {
  scheduledInnings: 6,
  maxRunsPerInning: null,
  mercyRuleRuns: 10,
  mercyRuleAfterInning: 4,
  pitchCountLimit: null,
  allowCourtesyRunner: false,
  allowFreeSubstitution: false,
  allowReEntry: false,
  continuousBattingOrder: false,
  dropThirdStrikeRule: false,
  automaticIntentionalWalk: true,
};

// Type guard — validates that an unknown value conforms to RulesetConfig.
// Call this when reading GameRow.ruleset from the database.
export function isRulesetConfig(value: unknown): value is RulesetConfig {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.scheduledInnings === 'number' &&
    (v.maxRunsPerInning === null || typeof v.maxRunsPerInning === 'number') &&
    (v.mercyRuleRuns === null || typeof v.mercyRuleRuns === 'number') &&
    (v.mercyRuleAfterInning === null || typeof v.mercyRuleAfterInning === 'number') &&
    (v.pitchCountLimit === null || typeof v.pitchCountLimit === 'number') &&
    typeof v.allowCourtesyRunner === 'boolean' &&
    typeof v.allowFreeSubstitution === 'boolean' &&
    typeof v.allowReEntry === 'boolean' &&
    typeof v.continuousBattingOrder === 'boolean' &&
    typeof v.dropThirdStrikeRule === 'boolean' &&
    typeof v.automaticIntentionalWalk === 'boolean'
  );
}

// Narrowed GameRow with a typed ruleset field.
// Cast via: `row as TypedGameRow` only after isRulesetConfig(row.ruleset) passes.
export type TypedGameRow = Omit<GameRow, 'ruleset'> & { ruleset: RulesetConfig };
