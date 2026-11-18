import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PROFILE, type Fast, type UserProfile, type WaterEntry, type WeightEntry } from '../domain';
import type { Container } from '../infrastructure';
import { applyLanguage, normalizeLanguage } from '../i18n';

export interface AppData {
  ready: boolean;
  profile: UserProfile;
  fasts: Fast[]; // finished + active, sorted by start asc
  active?: Fast;
  weights: WeightEntry[];
  water: WaterEntry[];
}
interface Ctx extends AppData { container: Container; reload: () => Promise<void> }

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ container, children }: { container: Container; children: ReactNode }) {
  const [data, setData] = useState<AppData>({ ready: false, profile: DEFAULT_PROFILE, fasts: [], weights: [], water: [] });
  const uc = container.useCases;

  const reload = useCallback(async () => {
    const [profile, fasts, weights, water] = await Promise.all([uc.getProfile(), uc.listFasts(), uc.listWeights(), uc.listWater()]);
    setData({ ready: true, profile, fasts, active: fasts.find((f) => f.endedAt === undefined), weights, water });
  }, [uc]);

  useEffect(() => {
    void (async () => {
      const p = await uc.getProfile();
      const saved = normalizeLanguage(p.language);
      if (saved) applyLanguage(saved);
      else {
        // first run: persist the detected language (?lang= param or navigator)
        const { detectLanguage } = await import('../i18n');
        const lang = detectLanguage();
        await uc.updateProfile({ language: lang });
        applyLanguage(lang);
      }
      await reload();
    })();
  }, [uc, reload]);

  // keep the localStorage mirror in sync on load
  useEffect(() => {
    if (!data.ready) return;
    void uc.getActiveFast().then((a) => {
      try {
        if (a) localStorage.setItem('berraco.activeFast', JSON.stringify({ startedAt: a.startedAt, targetHours: a.targetHours }));
      } catch { /* ignore */ }
    });
  }, [data.ready, uc]);

  const value = useMemo(() => ({ ...data, container, reload }), [data, container, reload]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider missing');
  return c;
}
