import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createUseCases } from '../application';
import { BerracoDb, createRepositories } from './db';
import { uuidGenerator } from './platform';

describe('dexie repositories', () => {
  it('persists a fast and profile', async () => {
    const db = new BerracoDb('test-db');
    let now = 1_700_000_000_000;
    const uc = createUseCases({ ...createRepositories(db), clock: { now: () => now }, ids: uuidGenerator, mirror: { write: () => undefined } });
    await uc.startFast('16:8');
    expect((await uc.getActiveFast())?.targetHours).toBe(16);
    now += 3600_000;
    await uc.endFast({ mood: 5 });
    expect(await uc.getActiveFast()).toBeUndefined();
    await uc.updateProfile({ heightCm: 170, language: 'en' });
    expect((await uc.getProfile()).language).toBe('en');
    expect((await uc.exportData()).fasts.length).toBe(1);
  });
});
