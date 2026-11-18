import {
  DEFAULT_PROFILE, computeStats, targetHoursFor, toDateKey,
  type Fast, type Mood, type Stats, type UserProfile, type WaterEntry, type WeightEntry,
} from '../domain';
import type {
  ActiveFastMirror, Clock, FastRepository, IdGenerator, ProfileRepository, WaterRepository, WeightRepository,
} from './ports';

export interface Deps {
  fasts: FastRepository; weights: WeightRepository; water: WaterRepository; profile: ProfileRepository;
  clock: Clock; ids: IdGenerator; mirror: ActiveFastMirror;
}
export interface ExportData {
  app: 'berraco'; version: 1; exportedAt: number;
  fasts: Fast[]; weights: WeightEntry[]; water: WaterEntry[]; profile: UserProfile;
}

export class FastError extends Error {}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function validateImport(raw: unknown): ExportData {
  if (!isObj(raw) || raw.app !== 'berraco' || raw.version !== 1) throw new Error('invalid-format');
  const arr = (k: string) => { const v = raw[k]; if (!Array.isArray(v)) throw new Error('invalid-format'); return v as unknown[]; };
  const fasts = arr('fasts').map((f): Fast => {
    if (!isObj(f) || !isStr(f.id) || !isNum(f.startedAt) || !isNum(f.targetHours) || !isStr(f.protocolId)) throw new Error('invalid-fast');
    if (f.endedAt !== undefined && !isNum(f.endedAt)) throw new Error('invalid-fast');
    return {
      id: f.id, startedAt: f.startedAt, endedAt: f.endedAt as number | undefined, targetHours: f.targetHours,
      protocolId: f.protocolId, note: isStr(f.note) ? f.note : undefined,
      mood: isNum(f.mood) && f.mood >= 1 && f.mood <= 5 ? (f.mood as Mood) : undefined,
    };
  });
  const weights = arr('weights').map((w): WeightEntry => {
    if (!isObj(w) || !isStr(w.id) || !isStr(w.date) || !isNum(w.kg)) throw new Error('invalid-weight');
    return { id: w.id, date: w.date, kg: w.kg };
  });
  const water = arr('water').map((w): WaterEntry => {
    if (!isObj(w) || !isStr(w.id) || !isStr(w.date) || !isNum(w.ml)) throw new Error('invalid-water');
    return { id: w.id, date: w.date, ml: w.ml };
  });
  if (!isObj(raw.profile)) throw new Error('invalid-format');
  const profile = { ...DEFAULT_PROFILE, ...(raw.profile as Partial<UserProfile>) };
  if (!isNum(profile.waterGoalMl)) throw new Error('invalid-profile');
  return { app: 'berraco', version: 1, exportedAt: isNum(raw.exportedAt) ? raw.exportedAt : 0, fasts, weights, water, profile };
}

export function createUseCases(d: Deps) {
  const syncMirror = async () => {
    const a = await d.fasts.getActive();
    d.mirror.write(a ? { startedAt: a.startedAt, targetHours: a.targetHours } : null);
  };
  return {
    getActiveFast: () => d.fasts.getActive(),
    async startFast(protocolId: string, startedAt?: number): Promise<Fast> {
      if (await d.fasts.getActive()) throw new FastError('already-active');
      const p = await d.profile.get();
      const fast: Fast = {
        id: d.ids.next(), startedAt: startedAt ?? d.clock.now(),
        targetHours: targetHoursFor(protocolId, p.customHours), protocolId,
      };
      await d.fasts.put(fast); await syncMirror();
      return fast;
    },
    async endFast(extra: { mood?: Mood; note?: string } = {}): Promise<Fast> {
      const a = await d.fasts.getActive();
      if (!a) throw new FastError('no-active');
      const done: Fast = { ...a, endedAt: Math.max(a.startedAt, d.clock.now()), mood: extra.mood, note: extra.note?.trim() || undefined };
      await d.fasts.put(done); await syncMirror();
      return done;
    },
    async editFast(id: string, patch: Partial<Pick<Fast, 'startedAt' | 'endedAt' | 'note' | 'mood' | 'targetHours' | 'protocolId'>>): Promise<Fast> {
      const f = await d.fasts.get(id);
      if (!f) throw new FastError('not-found');
      const next = { ...f, ...patch };
      if (next.endedAt !== undefined && next.endedAt < next.startedAt) throw new FastError('end-before-start');
      if (next.startedAt > d.clock.now()) throw new FastError('start-in-future');
      await d.fasts.put(next); await syncMirror();
      return next;
    },
    async deleteFast(id: string) { await d.fasts.remove(id); await syncMirror(); },
    listFasts: () => d.fasts.list(),
    async logWeight(kg: number, date: string) {
      if (!(kg > 20 && kg < 500)) throw new Error('invalid-weight');
      const e: WeightEntry = { id: d.ids.next(), date, kg };
      await d.weights.put(e); return e;
    },
    deleteWeight: (id: string) => d.weights.remove(id),
    listWeights: () => d.weights.list(),
    async logWater(ml: number, date?: string) {
      const e: WaterEntry = { id: d.ids.next(), date: date ?? toDateKey(d.clock.now()), ml };
      await d.water.put(e); return e;
    },
    listWater: () => d.water.list(),
    getProfile: () => d.profile.get(),
    async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
      const p = { ...(await d.profile.get()), ...patch };
      await d.profile.save(p); return p;
    },
    async getStats(): Promise<Stats> { return computeStats(await d.fasts.list(), d.clock.now()); },
    async exportData(): Promise<ExportData> {
      return {
        app: 'berraco', version: 1, exportedAt: d.clock.now(),
        fasts: await d.fasts.list(), weights: await d.weights.list(), water: await d.water.list(), profile: await d.profile.get(),
      };
    },
    async importData(raw: unknown) {
      const data = validateImport(raw);
      await d.fasts.replaceAll(data.fasts); await d.weights.replaceAll(data.weights);
      await d.water.replaceAll(data.water); await d.profile.save(data.profile);
      await syncMirror();
    },
    async deleteAll() {
      await d.fasts.replaceAll([]); await d.weights.replaceAll([]); await d.water.replaceAll([]);
      await d.profile.save({ ...DEFAULT_PROFILE }); await syncMirror();
    },
  };
}
export type UseCases = ReturnType<typeof createUseCases>;
