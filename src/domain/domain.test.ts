import { describe, expect, it } from 'vitest';
import { PHASES, currentPhase, hoursToNextPhase, nextPhase, phaseIndexAt } from './phases';
import { currentStreak, longestStreak, isCompleted } from './streak';
import { bmi, bmiCategory } from './bmi';
import { computeStats } from './stats';
import { targetHoursFor, PROTOCOLS } from './protocols';
import { progressPercent, formatHMS, remainingMs, expectedEnd, splitDuration, HOUR } from './progress';
import { addDays, weekStartKey, toDateKey } from './dates';
import type { Fast } from './entities';

const at = (key: string, h = 12) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, h).getTime(); };
const fast = (endKey: string, hours: number, target = 16): Fast => {
  const end = at(endKey);
  return { id: endKey + hours, startedAt: end - hours * HOUR, endedAt: end, targetHours: target, protocolId: '16:8' };
};

describe('phases', () => {
  it('finds phase by hour', () => {
    expect(currentPhase(0).id).toBe('p0');
    expect(currentPhase(3.99).id).toBe('p0');
    expect(currentPhase(12).id).toBe('p12');
    expect(currentPhase(20).id).toBe('p18');
    expect(currentPhase(100).id).toBe('p48');
    expect(phaseIndexAt(-5)).toBe(0);
  });
  it('next phase and countdown', () => {
    expect(nextPhase(5)?.fromHour).toBe(8);
    expect(hoursToNextPhase(5)).toBe(3);
    expect(nextPhase(60)).toBeUndefined();
    expect(hoursToNextPhase(60)).toBeUndefined();
  });
  it('covers contiguous ranges', () => {
    for (let i = 1; i < PHASES.length; i++) expect(PHASES[i].fromHour).toBe(PHASES[i - 1].toHour);
  });
});

describe('protocols', () => {
  it('targets', () => {
    expect(targetHoursFor('16:8')).toBe(16);
    expect(targetHoursFor('OMAD')).toBe(23);
    expect(targetHoursFor('48h')).toBe(48);
    expect(targetHoursFor('custom', 30)).toBe(30);
    expect(targetHoursFor('custom', 0)).toBe(1);
    expect(targetHoursFor('nope')).toBe(16);
    expect(PROTOCOLS.length).toBe(8);
  });
});

describe('streaks', () => {
  const now = at('2026-03-10', 18);
  it('counts consecutive days', () => {
    expect(currentStreak([fast('2026-03-10', 17), fast('2026-03-09', 16), fast('2026-03-08', 18)], now)).toBe(3);
  });
  it('today pending does not break', () => {
    expect(currentStreak([fast('2026-03-09', 17), fast('2026-03-08', 17)], now)).toBe(2);
  });
  it('gap breaks', () => {
    expect(currentStreak([fast('2026-03-08', 17)], now)).toBe(0);
  });
  it('ignores incomplete', () => {
    expect(isCompleted(fast('2026-03-10', 10))).toBe(false);
    expect(currentStreak([fast('2026-03-10', 10)], now)).toBe(0);
  });
  it('longest', () => {
    const f = [fast('2026-03-01', 16), fast('2026-03-02', 16), fast('2026-03-03', 16), fast('2026-03-07', 16), fast('2026-03-08', 16)];
    expect(longestStreak(f)).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});

describe('bmi', () => {
  it('computes and categorizes', () => {
    expect(bmi(70, 175)).toBe(22.9);
    expect(bmiCategory(17)).toBe('under');
    expect(bmiCategory(22.9)).toBe('normal');
    expect(bmiCategory(27)).toBe('over');
    expect(bmiCategory(31)).toBe('obese');
  });
});

describe('stats', () => {
  it('computes', () => {
    const now = at('2026-03-10');
    const s = computeStats([fast('2026-03-10', 18), fast('2026-03-09', 10), fast('2026-03-08', 20)], now);
    expect(s.totalFasts).toBe(3);
    expect(s.averageHours).toBeCloseTo(16);
    expect(s.longestHours).toBe(20);
    expect(s.completionRate).toBe(67);
    expect(computeStats([], now).averageHours).toBe(0);
  });
  it('ignores active fast', () => {
    const active: Fast = { id: 'a', startedAt: 1, targetHours: 16, protocolId: '16:8' };
    expect(computeStats([active], 10).totalFasts).toBe(0);
  });
});

describe('progress and dates', () => {
  it('percent/format', () => {
    expect(progressPercent(8 * HOUR, 16)).toBe(50);
    expect(progressPercent(10, 0)).toBe(0);
    expect(formatHMS(3723000)).toBe('01:02:03');
    expect(remainingMs(20 * HOUR, 16)).toBe(0);
    expect(expectedEnd(0, 2)).toBe(2 * HOUR);
    expect(splitDuration(90 * 60000)).toEqual({ h: 1, m: 30 });
  });
  it('dates', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(weekStartKey(at('2026-03-11'))).toBe('2026-03-09');
    expect(toDateKey(at('2026-01-05'))).toBe('2026-01-05');
  });
});
