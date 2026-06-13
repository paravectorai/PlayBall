import { db } from '../db';
import type { PlayerRow } from '../schema';

type CreateInput = Omit<PlayerRow, 'id' | 'createdAt'>;
type UpdateInput = Partial<Omit<PlayerRow, 'id' | 'createdAt'>>;

class PlayerRepository {
  findByTeam(teamId: string): Promise<PlayerRow[]> {
    return db.players.where('teamId').equals(teamId).sortBy('jerseyNumber');
  }

  findActive(teamId: string): Promise<PlayerRow[]> {
    return db.players
      .where('teamId')
      .equals(teamId)
      .filter(p => p.isActive === 1)
      .sortBy('jerseyNumber');
  }

  findById(id: string): Promise<PlayerRow | undefined> {
    return db.players.get(id);
  }

  async create(data: CreateInput): Promise<PlayerRow> {
    const row: PlayerRow = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    await db.players.add(row);
    return row;
  }

  async update(id: string, changes: UpdateInput): Promise<void> {
    await db.players.update(id, changes);
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await db.players.update(id, { isActive: active ? 1 : 0 });
  }

  async delete(id: string): Promise<void> {
    await db.players.delete(id);
  }
}

export const playerRepo = new PlayerRepository();
