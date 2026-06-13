import Dexie from 'dexie';
import { db } from '../db';
import type { PlayEventRow } from '../schema';

type CreateInput = Omit<PlayEventRow, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateInput = Partial<Omit<PlayEventRow, 'id' | 'gameId' | 'createdAt' | 'updatedAt'>>;

class PlayEventRepository {
  findByGame(gameId: string): Promise<PlayEventRow[]> {
    return db.playEvents.where('gameId').equals(gameId).toArray();
  }

  findByGameOrdered(gameId: string): Promise<PlayEventRow[]> {
    return db.playEvents
      .where('[gameId+sequenceNumber]')
      .between([gameId, Dexie.minKey], [gameId, Dexie.maxKey])
      .toArray();
  }

  findById(id: string): Promise<PlayEventRow | undefined> {
    return db.playEvents.get(id);
  }

  async nextSequenceNumber(gameId: string): Promise<number> {
    const last = await db.playEvents
      .where('[gameId+sequenceNumber]')
      .between([gameId, Dexie.minKey], [gameId, Dexie.maxKey])
      .last();
    return last ? last.sequenceNumber + 1 : 1;
  }

  async create(data: CreateInput): Promise<PlayEventRow> {
    const now = Date.now();
    const row: PlayEventRow = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await db.playEvents.add(row);
    return row;
  }

  async update(id: string, changes: UpdateInput): Promise<void> {
    await db.playEvents.update(id, { ...changes, updatedAt: Date.now() });
  }

  async delete(id: string): Promise<void> {
    await db.playEvents.delete(id);
  }

  async deleteByGame(gameId: string): Promise<void> {
    await db.playEvents.where('gameId').equals(gameId).delete();
  }
}

export const playEventRepo = new PlayEventRepository();
