import type { Fast } from './entities';
import { HOUR } from './progress';
import { addDays, toDateKey } from './dates';

export function isCompleted(f: Fast): boolean {
  return f.endedAt !== undefined && f.endedAt - f.startedAt >= f.targetHours * HOUR;
}
/** Day keys (by end date) with at least one completed fast. */
export function completedDays(fasts: Fast[]): Set<string> {
  const s = new Set<string>();
  fasts.filter(isCompleted).forEach((f) => s.add(toDateKey(f.endedAt!)));
  return s;
}
/** Consecutive days with a completed fast. Today may still be pending without breaking the streak. */
export function currentStreak(fasts: Fast[], now: number): number {
  const days = completedDays(fasts);
  const today = toDateKey(now);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) { n++; cursor = addDays(cursor, -1); }
  return n;
}
export function longestStreak(fasts: Fast[]): number {
  const sorted = [...completedDays(fasts)].sort();
  let best = 0, run = 0, prev: string | undefined;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
