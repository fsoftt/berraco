import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { splitDuration } from '../../domain';

export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}

/** Locale-aware formatting helpers. */
export function useFormat() {
  const { i18n, t } = useTranslation();
  const locale = i18n.language || 'es-CO';
  return useMemo(() => {
    const dt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
    const d = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
    const dShort = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const tm = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });
    const n1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const n0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    return {
      locale,
      dateTime: (ts: number) => dt.format(ts),
      date: (ts: number | Date) => d.format(ts),
      dayMonth: (ts: number | Date) => dShort.format(ts),
      time: (ts: number) => tm.format(ts),
      num: (v: number, digits: 0 | 1 = 1) => (digits === 1 ? n1 : n0).format(v),
      duration: (ms: number) => { const { h, m } = splitDuration(ms); return t('common.duration', { h, m: String(m).padStart(2, '0') }); },
      hours: (v: number) => t('common.hoursShort', { value: n1.format(v) }),
    };
  }, [locale, t]);
}

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; listeners.forEach((l) => l()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()); });
}
export function useInstallPrompt() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    deferred = null; listeners.forEach((l) => l());
  }, []);
  return { canInstall: deferred !== null, install };
}

export function applyTheme(theme: 'system' | 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', theme);
  try { localStorage.setItem('berraco.theme', theme); } catch { /* ignore */ }
}
