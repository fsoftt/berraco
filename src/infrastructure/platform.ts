import type { ActiveFastMirror, BadgeService, Clock, IdGenerator, Notifier, NotifyPermission } from '../application';

export const systemClock: Clock = { now: () => Date.now() };
export const uuidGenerator: IdGenerator = {
  next: () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
};

export const ACTIVE_FAST_KEY = 'berraco.activeFast';
/** Plain JSON in localStorage so a future native Android widget can read it. */
export const localStorageMirror: ActiveFastMirror = {
  write(f) {
    try {
      if (f) localStorage.setItem(ACTIVE_FAST_KEY, JSON.stringify({ startedAt: f.startedAt, targetHours: f.targetHours }));
      else localStorage.removeItem(ACTIVE_FAST_KEY);
    } catch { /* storage unavailable */ }
  },
};

export const appBadge: BadgeService = {
  set(n) {
    try {
      const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
      if (n && n > 0) void nav.setAppBadge?.(n)?.catch(() => undefined);
      else void nav.clearAppBadge?.()?.catch(() => undefined);
    } catch { /* unsupported */ }
  },
};

export class WebNotifier implements Notifier {
  private timers: number[] = [];
  permission(): NotifyPermission {
    return typeof Notification === 'undefined' ? 'unsupported' : (Notification.permission as NotifyPermission);
  }
  async requestPermission(): Promise<NotifyPermission> {
    if (typeof Notification === 'undefined') return 'unsupported';
    return (await Notification.requestPermission()) as NotifyPermission;
  }
  async show(title: string, body: string, tag?: string): Promise<void> {
    if (this.permission() !== 'granted') return;
    const opts = { body, tag, icon: `${import.meta.env.BASE_URL}pwa-192x192.png`, badge: `${import.meta.env.BASE_URL}pwa-192x192.png` };
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) { await reg.showNotification(title, opts); return; }
    } catch { /* fall through */ }
    try { new Notification(title, opts); } catch { /* ignore */ }
  }
  scheduleAll(items: { at: number; title: string; body: string; tag: string }[]): void {
    this.cancelAll();
    const now = Date.now();
    for (const it of items) {
      const delay = it.at - now;
      if (delay <= 0 || delay > 2_000_000_000) continue;
      this.timers.push(window.setTimeout(() => void this.show(it.title, it.body, it.tag), delay));
    }
  }
  cancelAll(): void { this.timers.forEach((t) => window.clearTimeout(t)); this.timers = []; }
}
