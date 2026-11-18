export function toDateKey(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(key: string, n: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}
export function weekStartKey(ts: number): string {
  const d = new Date(ts);
  const dow = (d.getDay() + 6) % 7; // monday = 0
  d.setDate(d.getDate() - dow);
  return toDateKey(d);
}
