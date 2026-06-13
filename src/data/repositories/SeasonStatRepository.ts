import { db } from '../db';
import type { SeasonStatRow, StatType } from '../schema';

type UpsertInput = Omit<SeasonStatRow, 'id' | 'computedAt'>;

class SeasonStatRepository {
  findBySeason(seasonId: string): Promise<SeasonStatRow[]> {
    return db.seasonStats.where('seasonId').equals(seasonId).toArray();
  }

  findBySeasonAndPlayer(seasonId: string, playerId: string, statType: StatType): Promise<SeasonStatRow | undefined> {
    return db.seasonStats
      .where('[seasonId+playerId+statType]')
      .equals([seasonId, playerId, statType])
      .first();
  }

  async upsert(data: UpsertInput): Promise<SeasonStatRow> {
    const existing = await this.findBySeasonAndPlayer(data.seasonId, data.playerId, data.statType);
    const now = Date.now();

    if (existing) {
      await db.seasonStats.update(existing.id, { stats: data.stats, computedAt: now });
      return { ...existing, stats: data.stats, computedAt: now };
    }

    const row: SeasonStatRow = { ...data, id: crypto.randomUUID(), computedAt: now };
    await db.seasonStats.add(row);
    return row;
  }

  async deleteBySeason(seasonId: string): Promise<void> {
    await db.seasonStats.where('seasonId').equals(seasonId).delete();
  }
}

export const seasonStatRepo = new SeasonStatRepository();
