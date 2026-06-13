import { db } from '../db';
import type { SeasonRow } from '../schema';

type CreateInput = Omit<SeasonRow, 'id' | 'createdAt'>;
type UpdateInput = Partial<CreateInput>;

class SeasonRepository {
  findAll(): Promise<SeasonRow[]> {
    return db.seasons.orderBy('year').reverse().toArray();
  }

  findByTeam(teamId: string): Promise<SeasonRow[]> {
    return db.seasons.where('teamId').equals(teamId).reverse().sortBy('year');
  }

  findById(id: string): Promise<SeasonRow | undefined> {
    return db.seasons.get(id);
  }

  async create(data: CreateInput): Promise<SeasonRow> {
    const row: SeasonRow = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    await db.seasons.add(row);
    return row;
  }

  async update(id: string, changes: UpdateInput): Promise<void> {
    await db.seasons.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await db.seasons.delete(id);
  }
}

export const seasonRepo = new SeasonRepository();
