import { db } from '../db';
import type { GameStatRow, StatType } from '../schema';

type UpsertInput = Omit<GameStatRow, 'id' | 'computedAt'>;

class GameStatRepository {
  findByGame(gameId: string): Promise<GameStatRow[]> {
    return db.gameStats.where('gameId').equals(gameId).toArray();
  }

  findByGameAndPlayer(gameId: string, playerId: string, statType: StatType): Promise<GameStatRow | undefined> {
    return db.gameStats
      .where('[gameId+playerId+statType]')
      .equals([gameId, playerId, statType])
      .first();
  }

  async upsert(data: UpsertInput): Promise<GameStatRow> {
    const existing = await this.findByGameAndPlayer(data.gameId, data.playerId, data.statType);
    const now = Date.now();

    if (existing) {
      await db.gameStats.update(existing.id, { stats: data.stats, computedAt: now });
      return { ...existing, stats: data.stats, computedAt: now };
    }

    const row: GameStatRow = { ...data, id: crypto.randomUUID(), computedAt: now };
    await db.gameStats.add(row);
    return row;
  }

  async deleteByGame(gameId: string): Promise<void> {
    await db.gameStats.where('gameId').equals(gameId).delete();
  }
}

export const gameStatRepo = new GameStatRepository();
