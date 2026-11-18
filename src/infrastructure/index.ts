import { createUseCases } from '../application';
import { BerracoDb, createRepositories } from './db';
import { WebNotifier, appBadge, localStorageMirror, systemClock, uuidGenerator } from './platform';

export * from './db';
export * from './platform';
export * from './file';

export function createContainer() {
  const db = new BerracoDb();
  const repos = createRepositories(db);
  const useCases = createUseCases({ ...repos, clock: systemClock, ids: uuidGenerator, mirror: localStorageMirror });
  return { db, useCases, notifier: new WebNotifier(), badge: appBadge, clock: systemClock };
}
export type Container = ReturnType<typeof createContainer>;
