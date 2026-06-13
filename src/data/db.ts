import Dexie, { type Table } from 'dexie';
import type {
  TeamRow,
  SeasonRow,
  PlayerRow,
  GameRow,
  LineupRow,
  PlayEventRow,
  GameStatRow,
  SeasonStatRow,
} from './schema';

export class StitchDatabase extends Dexie {
  teams!: Table<TeamRow, string>;
  seasons!: Table<SeasonRow, string>;
  players!: Table<PlayerRow, string>;
  games!: Table<GameRow, string>;
  lineups!: Table<LineupRow, string>;
  playEvents!: Table<PlayEventRow, string>;
  gameStats!: Table<GameStatRow, string>;
  seasonStats!: Table<SeasonStatRow, string>;

  constructor() {
    super('StitchDB');
    this.version(1).stores({
      teams:       'id, name, createdAt',
      seasons:     'id, teamId, year, createdAt',
      players:     'id, teamId, jerseyNumber, isActive, createdAt',
      games:       'id, seasonId, gameDate, status, createdAt',
      lineups:     'id, gameId, playerId, battingOrder',
      playEvents:  'id, gameId, sequenceNumber, inning, batterPlayerId, pitcherPlayerId, createdAt',
      gameStats:   'id, [gameId+playerId+statType], gameId, playerId',
      seasonStats: 'id, [seasonId+playerId+statType], seasonId, playerId',
    });
    // Version 2: add compound indexes to support native cursor ordering (removes JS-side sortBy)
    this.version(2).stores({
      teams:       'id, name, createdAt',
      seasons:     'id, teamId, year, createdAt',
      players:     'id, teamId, jerseyNumber, isActive, createdAt',
      games:       'id, seasonId, gameDate, status, createdAt, [seasonId+gameDate]',
      lineups:     'id, gameId, playerId, battingOrder, [gameId+battingOrder]',
      playEvents:  'id, gameId, sequenceNumber, inning, batterPlayerId, pitcherPlayerId, createdAt, [gameId+sequenceNumber]',
      gameStats:   'id, [gameId+playerId+statType], gameId, playerId',
      seasonStats: 'id, [seasonId+playerId+statType], seasonId, playerId',
    });
    // Version 3: GameRow gains optional opponentTeamId (sparse field — no new index required).
    // Store definitions unchanged; Dexie version bump ensures schema version is recorded in IDB.
    this.version(3).stores({
      teams:       'id, name, createdAt',
      seasons:     'id, teamId, year, createdAt',
      players:     'id, teamId, jerseyNumber, isActive, createdAt',
      games:       'id, seasonId, gameDate, status, createdAt, [seasonId+gameDate]',
      lineups:     'id, gameId, playerId, battingOrder, [gameId+battingOrder]',
      playEvents:  'id, gameId, sequenceNumber, inning, batterPlayerId, pitcherPlayerId, createdAt, [gameId+sequenceNumber]',
      gameStats:   'id, [gameId+playerId+statType], gameId, playerId',
      seasonStats: 'id, [seasonId+playerId+statType], seasonId, playerId',
    });
  }
}

export const db = new StitchDatabase();
