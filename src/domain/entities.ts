export type Mood = 1 | 2 | 3 | 4 | 5;
export interface Fast {
  id: string;
  startedAt: number; // epoch ms
  endedAt?: number;
  targetHours: number;
  protocolId: string;
  note?: string;
  mood?: Mood;
}
export interface WeightEntry { id: string; date: string; kg: number } // date: YYYY-MM-DD
export interface WaterEntry { id: string; date: string; ml: number }
export type ThemePref = 'system' | 'light' | 'dark';
export type LanguageCode = 'es-CO' | 'en' | 'pt-BR';
export interface UserProfile {
  heightCm?: number;
  goalWeightKg?: number;
  waterGoalMl: number;
  defaultProtocolId: string;
  notificationsEnabled: boolean;
  theme: ThemePref;
  customHours: number;
  language?: LanguageCode; // undefined = not chosen yet (detect)
}
export const DEFAULT_PROFILE: UserProfile = {
  waterGoalMl: 2000,
  defaultProtocolId: '16:8',
  notificationsEnabled: false,
  theme: 'system',
  customHours: 14,
};
