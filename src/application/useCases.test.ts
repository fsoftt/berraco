import { describe, expect, it } from 'vitest';
import { createUseCases, validateImport, type Deps } from './useCases';
import { DEFAULT_PROFILE, type Fast, type UserProfile } from '../domain';

function memDeps(now = { t: 1_000_000_000_000 }) {
  let fasts: Fast[] = []; let profile: UserProfile = { ...DEFAULT_PROFILE };
  let n = 0; let mirrored: unknown = 'init';
  const list = <T extends { id: string }>(a: () => T[], s: (v: T[]) => void) => ({
    list: async () => a(), put: async (e: T) => { s([...a().filter((x) => x.id !== e.id), e]); },
    remove: async (id: string) => { s(a().filter((x) => x.id !== id)); }, replaceAll: async (v: T[]) => s(v),
  });
  let w: any[] = []; let wa: any[] = [];
  const deps: Deps = {
    fasts: { ...list(() => fasts, (v) => (fasts = v)), get: async (id) => fasts.find((f) => f.id === id), getActive: async () => fasts.find((f) => f.endedAt === undefined) },
    weights: list(() => w, (v) => (w = v)), water: list(() => wa, (v) => (wa = v)),
    profile: { get: async () => profile, save: async (p) => { profile = p; } },
    clock: { now: () => now.t }, ids: { next: () => `id${++n}` }, mirror: { write: (v) => { mirrored = v; } },
  };
  return { deps, now, mirror: () => mirrored };
}

describe('use cases', () => {
  it('start, end and mirror', async () => {
    const { deps, now, mirror } = memDeps();
    const uc = createUseCases(deps);
    await uc.startFast('18:6');
    expect(mirror()).toEqual({ startedAt: now.t, targetHours: 18 });
    await expect(uc.startFast('16:8')).rejects.toThrow('already-active');
    now.t += 3600_000;
    const done = await uc.endFast({ mood: 4, note: ' ok ' });
    expect(done.note).toBe('ok');
    expect(mirror()).toBeNull();
    expect((await uc.getStats()).totalFasts).toBe(1);
  });
  it('discard removes active fast without saving it', async () => {
    const { deps, mirror } = memDeps();
    const uc = createUseCases(deps);
    await uc.startFast('16:8');
    await uc.discardFast();
    expect(await uc.getActiveFast()).toBeUndefined();
    expect((await uc.listFasts()).length).toBe(0);
    expect(mirror()).toBeNull();
    await expect(uc.discardFast()).rejects.toThrow('no-active');
  });
  it('edit validation', async () => {
    const { deps, now } = memDeps();
    const uc = createUseCases(deps);
    const f = await uc.startFast('16:8');
    await expect(uc.editFast(f.id, { startedAt: now.t + 1000 })).rejects.toThrow('start-in-future');
    await expect(uc.editFast(f.id, { endedAt: f.startedAt - 1 })).rejects.toThrow('end-before-start');
  });
  it('export/import roundtrip and validation', async () => {
    const { deps } = memDeps();
    const uc = createUseCases(deps);
    await uc.startFast('16:8'); await uc.logWeight(70, '2026-01-01'); await uc.logWater(250);
    const data = JSON.parse(JSON.stringify(await uc.exportData()));
    const other = createUseCases(memDeps().deps);
    await other.importData(data);
    expect((await other.listWeights()).length).toBe(1);
    expect(() => validateImport({ app: 'x' })).toThrow();
    expect(() => validateImport({ ...data, fasts: [{ id: 1 }] })).toThrow();
    await other.deleteAll();
    expect((await other.listFasts()).length).toBe(0);
  });
  it('rejects absurd weight', async () => {
    const uc = createUseCases(memDeps().deps);
    await expect(uc.logWeight(5, '2026-01-01')).rejects.toThrow();
  });
});
