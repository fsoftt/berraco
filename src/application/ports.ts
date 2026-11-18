import type { Fast, UserProfile, WaterEntry, WeightEntry } from '../domain';

export interface FastRepository {
  list(): Promise<Fast[]>;
  get(id: string): Promise<Fast | undefined>;
  getActive(): Promise<Fast | undefined>;
  put(fast: Fast): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(fasts: Fast[]): Promise<void>;
}
export interface WeightRepository {
  list(): Promise<WeightEntry[]>;
  put(e: WeightEntry): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(items: WeightEntry[]): Promise<void>;
}
export interface WaterRepository {
  list(): Promise<WaterEntry[]>;
  put(e: WaterEntry): Promise<void>;
  remove(id: string): Promise<void>;
  replaceAll(items: WaterEntry[]): Promise<void>;
}
export interface ProfileRepository {
  get(): Promise<UserProfile>;
  save(p: UserProfile): Promise<void>;
}
export interface Clock { now(): number }
export interface IdGenerator { next(): string }
export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';
export interface Notifier {
  permission(): NotifyPermission;
  requestPermission(): Promise<NotifyPermission>;
  show(title: string, body: string, tag?: string): Promise<void>;
  /** Schedule while the app is open. Replaces previous schedules. */
  scheduleAll(items: { at: number; title: string; body: string; tag: string }[]): void;
  cancelAll(): void;
}
export interface BadgeService { set(n: number | null): void }
/** Mirrors the active fast to a place a native widget can read. */
export interface ActiveFastMirror { write(f: { startedAt: number; targetHours: number } | null): void }
