import Dexie from 'dexie';
import { db } from '../db';
import type { GameRow, GameStatus } from '../schema';

type CreateInput = Omit<GameRow, 'id' | 'createdAt'>;
type UpdateInput = Partial<Omit<GameRow, 'id' | 'createdAt'>>;

class GameRepository {
  findBySeason(seasonId: string): Promise<GameRow[]> {
    return db.games
      .where('[seasonId+gameDate]')
      .between([seasonId, Dexie.minKey], [seasonId, Dexie.maxKey])
      .reverse()
      .toArray();
  }

  findByStatus(status: GameStatus): Promise<GameRow[]> {
    return db.games.where('status').equals(status).toArray();
  }

  findById(id: string): Promise<GameRow | undefined> {
    return db.games.get(id);
  }

  async create(data: CreateInput): Promise<GameRow> {
    const row: GameRow = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    await db.games.add(row);
    return row;
  }

  async update(id: string, changes: UpdateInput): Promise<void> {
    await db.games.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await db.games.delete(id);
  }
}

export const gameRepo = new GameRepository();
