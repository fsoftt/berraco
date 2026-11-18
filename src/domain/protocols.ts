/** Language-agnostic: texts live in i18n files under `protocols.<id>`. */
export interface Protocol { id: string; fastHours: number }
export const PROTOCOLS: Protocol[] = [
  { id: '13:11', fastHours: 13 },
  { id: '16:8', fastHours: 16 },
  { id: '18:6', fastHours: 18 },
  { id: '20:4', fastHours: 20 },
  { id: 'OMAD', fastHours: 23 },
  { id: '36h', fastHours: 36 },
  { id: '48h', fastHours: 48 },
  { id: 'custom', fastHours: 14 },
];
export function getProtocol(id: string): Protocol {
  return PROTOCOLS.find((p) => p.id === id) ?? PROTOCOLS[1];
}
export function targetHoursFor(id: string, customHours?: number): number {
  if (id === 'custom') return Math.min(168, Math.max(1, customHours ?? 14));
  return getProtocol(id).fastHours;
}
