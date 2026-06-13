import type { PlayOutcome, RunnerState } from '../../data/schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RunnerDest = 'out' | '1st' | '2nd' | '3rd' | 'scored'

/** Per-runner destination for the runner advancement panel. null = no runner at that base. */
export interface RunnerDestinations {
  batter: RunnerDest | null    // null = base-running-only event (SB/CS)
  from1st: RunnerDest | null   // null = no runner on 1st
  from2nd: RunnerDest | null
  from3rd: RunnerDest | null
}

export interface DefaultAdvancement {
  destinations: RunnerDestinations
  runsScored: number
  outsRecorded: number
  rbiCount: number
  needsRunnerInput: boolean
}

// ---------------------------------------------------------------------------
// Outcome metadata
// ---------------------------------------------------------------------------

export const OUTCOME_LABELS: Record<PlayOutcome, { short: string; full: string }> = {
  single:               { short: '1B',     full: 'Single' },
  double:               { short: '2B',     full: 'Double' },
  triple:               { short: '3B',     full: 'Triple' },
  home_run:             { short: 'HR',     full: 'Home Run' },
  walk:                 { short: 'BB',     full: 'Walk' },
  intentional_walk:     { short: 'IBB',    full: 'Int. Walk' },
  hit_by_pitch:         { short: 'HBP',    full: 'Hit by Pitch' },
  catcher_interference: { short: 'CI',     full: 'Catcher Int.' },
  strikeout_swinging:   { short: 'K',      full: 'Strikeout (Swing)' },
  strikeout_looking:    { short: 'Kc',     full: 'Strikeout (Look)' },
  field_out:            { short: 'Out',    full: 'Field Out' },
  field_error:          { short: 'E',      full: 'Error' },
  sac_fly:              { short: 'SF',     full: 'Sac Fly' },
  sac_bunt:             { short: 'SAC',    full: 'Sac Bunt' },
  fielders_choice:      { short: 'FC',     full: "Fielder's Choice" },
  stolen_base:          { short: 'SB',     full: 'Stolen Base' },
  caught_stealing:      { short: 'CS',     full: 'Caught Stealing' },
  // Synthetic outcome for quick-scored opponent runs; never shown via the play outcome grid
  opponent_score:       { short: 'OPP',   full: 'Opponent Runs (manual)' },
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function countRunners(runners: RunnerState): number {
  return (runners.first ? 1 : 0) + (runners.second ? 1 : 0) + (runners.third ? 1 : 0)
}

/** Apply force-advance logic for walk/HBP/IBB/CI: batter to 1st, forced runners advance. */
function walkForceAdvance(
  runnersBefore: RunnerState,
  batterPlayerId: string
): { runnersAfter: RunnerState; runsScored: number } {
  const r1 = runnersBefore.first
  const r2 = runnersBefore.second
  const r3 = runnersBefore.third
  const after: RunnerState = { first: batterPlayerId }
  let runs = 0

  if (r1) {
    after.second = r1
    if (r2) {
      after.third = r2
      if (r3) {
        runs = 1 // bases were loaded, r3 is forced home
      }
    } else {
      after.third = r3 // r3 stays (not forced)
    }
  } else {
    after.second = r2
    after.third = r3
  }

  return { runnersAfter: after, runsScored: runs }
}

// ---------------------------------------------------------------------------
// Default advancement computation
// ---------------------------------------------------------------------------

export function computeDefaultAdvancement(
  outcome: PlayOutcome,
  runnersBefore: RunnerState,
  batterPlayerId: string
): DefaultAdvancement {
  const r1 = runnersBefore.first ?? null
  const r2 = runnersBefore.second ?? null
  const r3 = runnersBefore.third ?? null
  const hasRunners = countRunners(runnersBefore) > 0

  switch (outcome) {
    // --- Plate appearance outcomes: batter out, runners stay ---
    case 'strikeout_swinging':
    case 'strikeout_looking':
    case 'field_out':
      return {
        destinations: {
          batter: 'out',
          from1st: r1 ? '1st' : null,
          from2nd: r2 ? '2nd' : null,
          from3rd: r3 ? '3rd' : null,
        },
        runsScored: 0,
        outsRecorded: 1,
        rbiCount: 0,
        needsRunnerInput: false,
      }

    // --- Home run: everyone scores ---
    case 'home_run': {
      const runs = 1 + countRunners(runnersBefore)
      return {
        destinations: {
          batter: 'scored',
          from1st: r1 ? 'scored' : null,
          from2nd: r2 ? 'scored' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 0,
        rbiCount: runs,
        needsRunnerInput: false,
      }
    }

    // --- Triple: all runners score, batter to 3rd ---
    case 'triple': {
      const runs = countRunners(runnersBefore)
      return {
        destinations: {
          batter: '3rd',
          from1st: r1 ? 'scored' : null,
          from2nd: r2 ? 'scored' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 0,
        rbiCount: runs,
        needsRunnerInput: false,
      }
    }

    // --- Double: batter to 2nd, defaults: r3 scores, r2 scores, r1 to 3rd ---
    case 'double': {
      const runs = (r3 ? 1 : 0) + (r2 ? 1 : 0)
      return {
        destinations: {
          batter: '2nd',
          from1st: r1 ? '3rd' : null,
          from2nd: r2 ? 'scored' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 0,
        rbiCount: runs,
        needsRunnerInput: hasRunners,
      }
    }

    // --- Single: batter to 1st, defaults: r3 scores, r2 to 3rd, r1 to 2nd ---
    case 'single': {
      const runs = r3 ? 1 : 0
      return {
        destinations: {
          batter: '1st',
          from1st: r1 ? '2nd' : null,
          from2nd: r2 ? '3rd' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 0,
        rbiCount: runs,
        needsRunnerInput: hasRunners,
      }
    }

    // --- Walk / IBB / HBP / CI: force advance ---
    case 'walk':
    case 'intentional_walk':
    case 'hit_by_pitch':
    case 'catcher_interference': {
      const { runnersAfter, runsScored } = walkForceAdvance(runnersBefore, batterPlayerId)
      return {
        destinations: stateToDestinations(runnersBefore, runnersAfter, batterPlayerId, runsScored),
        runsScored,
        outsRecorded: 0,
        rbiCount: runsScored,
        needsRunnerInput: false,
      }
    }

    // --- Field error: batter to 1st, same defaults as single; no RBIs ---
    case 'field_error': {
      const runs = r3 ? 1 : 0
      return {
        destinations: {
          batter: '1st',
          from1st: r1 ? '2nd' : null,
          from2nd: r2 ? '3rd' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 0,
        rbiCount: 0,  // no RBIs on errors
        needsRunnerInput: hasRunners,
      }
    }

    // --- Sac fly: batter out, runner from 3rd scores by default ---
    case 'sac_fly': {
      const runs = r3 ? 1 : 0
      return {
        destinations: {
          batter: 'out',
          from1st: r1 ? '1st' : null,
          from2nd: r2 ? '2nd' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 1,
        rbiCount: runs,
        needsRunnerInput: hasRunners,
      }
    }

    // --- Sac bunt: batter out, runners force-advance one base ---
    case 'sac_bunt': {
      const runs = r3 ? 1 : 0
      return {
        destinations: {
          batter: 'out',
          from1st: r1 ? '2nd' : null,
          from2nd: r2 ? '3rd' : null,
          from3rd: r3 ? 'scored' : null,
        },
        runsScored: runs,
        outsRecorded: 1,
        rbiCount: runs,
        needsRunnerInput: false,
      }
    }

    // --- Fielder's choice: batter to 1st, runner on 1st is out by default ---
    case 'fielders_choice': {
      return {
        destinations: {
          batter: '1st',
          from1st: r1 ? 'out' : null,
          from2nd: r2 ? '2nd' : null,
          from3rd: r3 ? '3rd' : null,
        },
        runsScored: 0,
        outsRecorded: 1,
        rbiCount: 0,
        needsRunnerInput: hasRunners,
      }
    }

    // --- Stolen base: runner advances (need panel to pick which runner + base) ---
    case 'stolen_base':
      return {
        destinations: {
          batter: null,
          from1st: r1 ? '2nd' : null,   // default: r1 steals 2nd
          from2nd: r2 ? '2nd' : null,   // unchanged if not stealing
          from3rd: r3 ? '3rd' : null,
        },
        runsScored: 0,
        outsRecorded: 0,
        rbiCount: 0,
        needsRunnerInput: true,
      }

    // --- Caught stealing: runner is out ---
    case 'caught_stealing':
      return {
        destinations: {
          batter: null,
          from1st: r1 ? 'out' : null,   // default: r1 was caught stealing
          from2nd: r2 ? '2nd' : null,
          from3rd: r3 ? '3rd' : null,
        },
        runsScored: 0,
        outsRecorded: 1,
        rbiCount: 0,
        needsRunnerInput: true,
      }

    // --- opponent_score: synthetic event; should never reach this path ---
    case 'opponent_score':
      return {
        destinations: { batter: null, from1st: null, from2nd: null, from3rd: null },
        runsScored: 0,
        outsRecorded: 0,
        rbiCount: 0,
        needsRunnerInput: false,
      }
  }
}

// ---------------------------------------------------------------------------
// Convert destinations → RunnerState + counts
// ---------------------------------------------------------------------------

export function destinationsToRunnerState(
  dests: RunnerDestinations,
  runnersBefore: RunnerState,
  batterPlayerId: string
): { runnersAfter: RunnerState; runsScored: number; outsRecorded: number } {
  const after: RunnerState = {}
  let runs = 0
  let outs = 0

  function applyDest(dest: RunnerDest, playerId: string) {
    if (dest === '1st') after.first = playerId
    else if (dest === '2nd') after.second = playerId
    else if (dest === '3rd') after.third = playerId
    else if (dest === 'scored') runs++
    else if (dest === 'out') outs++
  }

  if (dests.batter !== null) applyDest(dests.batter, batterPlayerId)
  if (dests.from1st !== null && runnersBefore.first) applyDest(dests.from1st, runnersBefore.first)
  if (dests.from2nd !== null && runnersBefore.second) applyDest(dests.from2nd, runnersBefore.second)
  if (dests.from3rd !== null && runnersBefore.third) applyDest(dests.from3rd, runnersBefore.third)

  return { runnersAfter: after, runsScored: runs, outsRecorded: outs }
}

/** Build a RunnerDestinations map from before/after states (used for walk force advance). */
function stateToDestinations(
  before: RunnerState,
  after: RunnerState,
  batterPlayerId: string,
  runsScored: number
): RunnerDestinations {
  function findDest(playerId: string | undefined): RunnerDest {
    if (!playerId) return 'out'
    if (after.first === playerId) return '1st'
    if (after.second === playerId) return '2nd'
    if (after.third === playerId) return '3rd'
    return 'scored'
  }

  return {
    batter: findDest(batterPlayerId),
    from1st: before.first ? findDest(before.first) : null,
    from2nd: before.second ? findDest(before.second) : null,
    from3rd: before.third
      ? (runsScored > 0 &&
         after.first !== before.third &&
         after.second !== before.third &&
         after.third !== before.third
           ? 'scored'
           : findDest(before.third))
      : null,
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Returns true if two runners share the same non-null destination base. */
export function hasBaseConflict(dests: RunnerDestinations): boolean {
  const bases: RunnerDest[] = []
  for (const d of [dests.batter, dests.from1st, dests.from2nd, dests.from3rd]) {
    if (d === null || d === 'out' || d === 'scored') continue
    if (bases.includes(d)) return true
    bases.push(d)
  }
  return false
}

// ---------------------------------------------------------------------------
// Toast message builder
// ---------------------------------------------------------------------------

export function buildToastMessage(
  outcome: PlayOutcome,
  runsScored: number,
  outsRecorded: number
): string {
  const label = OUTCOME_LABELS[outcome].full
  const parts: string[] = [label]
  if (runsScored === 1) parts.push('1 run')
  else if (runsScored > 1) parts.push(`${runsScored} runs`)
  if (outsRecorded > 0 && outcome !== 'home_run') {
    // Show current outs context in the toast via caller
  }
  return parts.join(' · ')
}
