import type { Fast } from './entities';
import { HOUR } from './progress';
import { currentStreak, isCompleted, longestStreak } from './streak';

export interface Stats {
  totalFasts: number; averageHours: number; longestHours: number;
  completionRate: number; currentStreak: number; longestStreak: number;
}
export function computeStats(fasts: Fast[], now: number): Stats {
  const done = fasts.filter((f) => f.endedAt !== undefined);
  const durs = done.map((f) => (f.endedAt! - f.startedAt) / HOUR);
  const sum = durs.reduce((a, b) => a + b, 0);
  return {
    totalFasts: done.length,
    averageHours: durs.length ? sum / durs.length : 0,
    longestHours: durs.length ? Math.max(...durs) : 0,
    completionRate: done.length ? Math.round((done.filter(isCompleted).length / done.length) * 100) : 0,
    currentStreak: currentStreak(fasts, now),
    longestStreak: longestStreak(fasts),
  };
}
