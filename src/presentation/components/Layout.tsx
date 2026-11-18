import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HOUR, PHASES, elapsedMs } from '../../domain';
import { useApp } from '../AppContext';
import { useNow } from '../hooks/hooks';

const ICONS: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  history: 'M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  weight: 'M6 3h12l3 6-9 12L3 9zM3 9h18',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
};
function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function useBackgroundEffects() {
  const { t, i18n } = useTranslation();
  const { active, profile, container } = useApp();
  const minute = useNow(60_000, !!active);

  // App badge: elapsed hours
  useEffect(() => {
    container.badge.set(active ? Math.floor(elapsedMs(active.startedAt, Date.now()) / HOUR) : null);
  }, [active, minute, container.badge]);

  // Notifications while the app is open: target + each new phase
  useEffect(() => {
    const n = container.notifier;
    if (!active || !profile.notificationsEnabled || n.permission() !== 'granted') { n.cancelAll(); return; }
    const items: { at: number; title: string; body: string; tag: string }[] = [];
    const elapsedH = elapsedMs(active.startedAt, Date.now()) / HOUR;
    items.push({ at: active.startedAt + active.targetHours * HOUR, title: t('notif.targetTitle'), body: t('notif.targetBody', { hours: active.targetHours }), tag: 'target' });
    for (const p of PHASES) {
      if (p.fromHour <= 0 || p.fromHour <= elapsedH || p.fromHour > 96) continue;
      items.push({ at: active.startedAt + p.fromHour * HOUR, title: t('notif.phaseTitle', { phase: t(`phases.${p.id}.title`) }), body: t('notif.phaseBody', { hours: p.fromHour }), tag: p.id });
    }
    n.scheduleAll(items);
    return () => n.cancelAll();
  }, [active, profile.notificationsEnabled, container.notifier, t, i18n.language]);
}

export function Layout() {
  const { t } = useTranslation();
  useBackgroundEffects();
  const items = [['/', 'home'], ['/history', 'history'], ['/stats', 'stats'], ['/weight', 'weight'], ['/settings', 'settings']] as const;
  return (
    <div className="shell">
      <a className="skip" href="#main">{t('nav.home')}</a>
      <nav className="nav" aria-label={t('nav.main')}>
        <div className="brand"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="32" height="32" /><span>{t('app.name')}</span></div>
        {items.map(([to, key]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon name={key} /><span>{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </nav>
      <main id="main" className="main" tabIndex={-1}><Outlet /></main>
    </div>
  );
}
