import Dexie, { type Table } from 'dexie';
import {
  DEFAULT_PROFILE, type Fast, type UserProfile, type WaterEntry, type WeightEntry,
} from '../domain';
import type {
  FastRepository, ProfileRepository, WaterRepository, WeightRepository,
} from '../application';

interface ProfileRow extends UserProfile { key: 'profile' }

export class BerracoDb extends Dexie {
  fasts!: Table<Fast, string>;
  weights!: Table<WeightEntry, string>;
  water!: Table<WaterEntry, string>;
  profile!: Table<ProfileRow, string>;
  constructor(name = 'berraco') {
    super(name);
    this.version(1).stores({
      fasts: 'id,startedAt,endedAt',
      weights: 'id,date',
      water: 'id,date',
      profile: 'key',
    });
  }
}

export function createRepositories(db: BerracoDb) {
  const fasts: FastRepository = {
    list: () => db.fasts.orderBy('startedAt').toArray(),
    get: (id) => db.fasts.get(id),
    getActive: async () => (await db.fasts.toArray()).find((f) => f.endedAt === undefined),
    put: async (f) => { await db.fasts.put(f); },
    remove: (id) => db.fasts.delete(id),
    replaceAll: (items) => db.transaction('rw', db.fasts, async () => { await db.fasts.clear(); await db.fasts.bulkPut(items); }),
  };
  const weights: WeightRepository = {
    list: () => db.weights.orderBy('date').toArray(),
    put: async (e) => { await db.weights.put(e); },
    remove: (id) => db.weights.delete(id),
    replaceAll: (items) => db.transaction('rw', db.weights, async () => { await db.weights.clear(); await db.weights.bulkPut(items); }),
  };
  const water: WaterRepository = {
    list: () => db.water.orderBy('date').toArray(),
    put: async (e) => { await db.water.put(e); },
    remove: (id) => db.water.delete(id),
    replaceAll: (items) => db.transaction('rw', db.water, async () => { await db.water.clear(); await db.water.bulkPut(items); }),
  };
  const profile: ProfileRepository = {
    get: async () => {
      const row = await db.profile.get('profile');
      if (!row) return { ...DEFAULT_PROFILE };
      const { key: _k, ...rest } = row;
      return { ...DEFAULT_PROFILE, ...rest };
    },
    save: async (p) => { await db.profile.put({ ...p, key: 'profile' }); },
  };
  return { fasts, weights, water, profile };
}
