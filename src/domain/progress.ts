export const HOUR = 3600_000;
export function elapsedMs(startedAt: number, now: number, endedAt?: number): number {
  return Math.max(0, (endedAt ?? now) - startedAt);
}
export function progressPercent(elapsed: number, targetHours: number): number {
  if (targetHours <= 0) return 0;
  return Math.round((elapsed / (targetHours * HOUR)) * 100);
}
export function remainingMs(elapsed: number, targetHours: number): number {
  return Math.max(0, targetHours * HOUR - elapsed);
}
export function expectedEnd(startedAt: number, targetHours: number): number {
  return startedAt + targetHours * HOUR;
}
export function formatHMS(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
/** Numeric split, formatted by the presentation layer. */
export function splitDuration(ms: number): { h: number; m: number } {
  const m = Math.round(Math.max(0, ms) / 60000);
  return { h: Math.floor(m / 60), m: m % 60 };
}
