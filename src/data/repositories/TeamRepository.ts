import { db } from '../db';
import type { TeamRow } from '../schema';

type CreateInput = Omit<TeamRow, 'id' | 'createdAt'>;
type UpdateInput = Partial<CreateInput>;

class TeamRepository {
  findAll(): Promise<TeamRow[]> {
    return db.teams.orderBy('name').toArray();
  }

  findById(id: string): Promise<TeamRow | undefined> {
    return db.teams.get(id);
  }

  async create(data: CreateInput): Promise<TeamRow> {
    const row: TeamRow = { ...data, id: crypto.randomUUID(), createdAt: Date.now() };
    await db.teams.add(row);
    return row;
  }

  async update(id: string, changes: UpdateInput): Promise<void> {
    await db.teams.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await db.teams.delete(id);
  }
}

export const teamRepo = new TeamRepository();
