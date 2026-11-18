/** Language-agnostic: titles/benefits live in i18n files under `phases.<id>.title|benefit`. */
export interface Phase { id: string; fromHour: number; toHour: number }
export const PHASES: Phase[] = [
  { id: 'p0', fromHour: 0, toHour: 4 },
  { id: 'p4', fromHour: 4, toHour: 8 },
  { id: 'p8', fromHour: 8, toHour: 12 },
  { id: 'p12', fromHour: 12, toHour: 16 },
  { id: 'p16', fromHour: 16, toHour: 18 },
  { id: 'p18', fromHour: 18, toHour: 24 },
  { id: 'p24', fromHour: 24, toHour: 36 },
  { id: 'p36', fromHour: 36, toHour: 48 },
  { id: 'p48', fromHour: 48, toHour: Infinity },
];
export function phaseIndexAt(hours: number): number {
  const h = Math.max(0, hours);
  let idx = 0;
  PHASES.forEach((p, i) => { if (h >= p.fromHour) idx = i; });
  return idx;
}
export function currentPhase(hours: number): Phase { return PHASES[phaseIndexAt(hours)]; }
export function nextPhase(hours: number): Phase | undefined { return PHASES[phaseIndexAt(hours) + 1]; }
/** Hours until next phase, or undefined if in the last one. */
export function hoursToNextPhase(hours: number): number | undefined {
  const n = nextPhase(hours);
  return n ? Math.max(0, n.fromHour - hours) : undefined;
}
