// Captures beforeinstallprompt as early as possible (imported first in main.tsx),
// before React mounts, so the event is never missed.
interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export type InstallResult = 'accepted' | 'dismissed' | 'unavailable';
export type Platform = 'ios' | 'samsung' | 'android' | 'other';

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; emit(); });
}

export function subscribeInstall(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
export function canPromptInstall(): boolean { return deferred !== null; }
export function wasInstalled(): boolean { return installed; }

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches === true || (navigator as { standalone?: boolean }).standalone === true;
}

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export async function runInstall(): Promise<InstallResult> {
  const ev = deferred;
  if (!ev) return 'unavailable';
  deferred = null; // a prompt event can be used only once
  emit();
  try {
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    return outcome;
  } catch { return 'dismissed'; }
}
