import Dexie from 'dexie';
import { db } from '../db';
import type { LineupRow } from '../schema';

type CreateInput = Omit<LineupRow, 'id' | 'createdAt'>;

class LineupRepository {
  findByGame(gameId: string): Promise<LineupRow[]> {
    return db.lineups
      .where('[gameId+battingOrder]')
      .between([gameId, Dexie.minKey], [gameId, Dexie.maxKey])
      .toArray();
  }

  findById(id: string): Promise<LineupRow | undefined> {
    return db.lineups.get(id);
  }

  async upsert(data: CreateInput): Promise<LineupRow> {
    const existing = await db.lineups
      .where('gameId').equals(data.gameId)
      .filter(l => l.playerId === data.playerId)
      .first();

    if (existing) {
      await db.lineups.update(existing.id, {
        battingOrder: data.battingOrder,
        position: data.position,
      });
      return { ...existing, battingOrder: data.battingOrder, position: data.position };
    }

    const row: LineupRow = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    await db.lineups.add(row);
    return row;
  }

  async deleteByGame(gameId: string): Promise<void> {
    await db.lineups.where('gameId').equals(gameId).delete();
  }

  async delete(id: string): Promise<void> {
    await db.lineups.delete(id);
  }
}

export const lineupRepo = new LineupRepository();
