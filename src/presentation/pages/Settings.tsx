import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROTOCOLS, type LanguageCode, type ThemePref } from '../../domain';
import { downloadJson, readJsonFile } from '../../infrastructure';
import { LANGUAGES, applyLanguage } from '../../i18n';
import { useApp } from '../AppContext';
import { applyTheme, useInstallPrompt } from '../hooks/hooks';
import { ConfirmDialog } from '../components/Modal';

const numOrUndef = (v: string) => { const n = Number(v.replace(',', '.')); return v.trim() === '' || !Number.isFinite(n) || n <= 0 ? undefined : n; };

export function Settings() {
  const { t } = useTranslation();
  const { profile, container, reload } = useApp();
  const uc = container.useCases;
  const { canInstall, install } = useInstallPrompt();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [msgErr, setMsgErr] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const perm = container.notifier.permission();

  const update = async (patch: Parameters<typeof uc.updateProfile>[0]) => { await uc.updateProfile(patch); await reload(); };
  const say = (m: string, err = false) => { setMsg(m); setMsgErr(err); };

  const toggleNotif = async (on: boolean) => {
    if (on) {
      const p = await container.notifier.requestPermission();
      if (p !== 'granted') { say(p === 'unsupported' ? t('settings.notifUnsupported') : t('settings.notifDenied'), true); await update({ notificationsEnabled: false }); return; }
    }
    await update({ notificationsEnabled: on });
  };
  const doExport = async () => downloadJson(`berraco-${new Date().toISOString().slice(0, 10)}.json`, await uc.exportData());
  const doImport = async (file?: File) => {
    if (!file) return;
    try {
      await uc.importData(await readJsonFile(file));
      const p = await uc.getProfile();
      if (p.language) applyLanguage(p.language);
      applyTheme(p.theme); await reload(); say(t('settings.importOk'));
    } catch { say(t('settings.importError'), true); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const doDeleteAll = async () => { await uc.deleteAll(); applyTheme('system'); setConfirmDel(false); await reload(); say(t('settings.deleted')); };

  return (
    <div className="page">
      <h1>{t('settings.title')}</h1>
      {msg && <p className={msgErr ? 'error' : 'ok-msg'} role="status">{msg}</p>}

      <section className="card">
        <h2 className="card-title">{t('settings.profile')}</h2>
        <label className="field"><span>{t('settings.height')}</span>
          <input type="number" inputMode="decimal" min={50} max={260} value={profile.heightCm ?? ''} onChange={(e) => void update({ heightCm: numOrUndef(e.target.value) })} /></label>
        <label className="field"><span>{t('settings.goalWeight')}</span>
          <input type="number" inputMode="decimal" min={20} max={500} step="0.1" value={profile.goalWeightKg ?? ''} onChange={(e) => void update({ goalWeightKg: numOrUndef(e.target.value) })} /></label>
        <label className="field"><span>{t('settings.waterGoal')}</span>
          <input type="number" inputMode="numeric" min={250} step={50} value={profile.waterGoalMl} onChange={(e) => void update({ waterGoalMl: numOrUndef(e.target.value) ?? 2000 })} /></label>
        <label className="field"><span>{t('settings.defaultProtocol')}</span>
          <select value={profile.defaultProtocolId} onChange={(e) => void update({ defaultProtocolId: e.target.value })}>
            {PROTOCOLS.map((p) => <option key={p.id} value={p.id}>{t(`protocols.${p.id}.label`)}</option>)}
          </select></label>
        {profile.defaultProtocolId === 'custom' && (
          <label className="field"><span>{t('settings.customHours')}</span>
            <input type="number" min={1} max={168} value={profile.customHours} onChange={(e) => void update({ customHours: Math.min(168, numOrUndef(e.target.value) ?? 14) })} /></label>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">{t('settings.notifications')}</h2>
        <label className="switch">
          <input type="checkbox" role="switch" checked={profile.notificationsEnabled && perm === 'granted'} onChange={(e) => void toggleNotif(e.target.checked)} />
          <span>{t('settings.notifications')}</span>
        </label>
        <p className="muted small-text">{t('settings.notificationsDesc')}</p>
        {perm === 'denied' && <p className="error">{t('settings.notifDenied')}</p>}
        {perm === 'unsupported' && <p className="error">{t('settings.notifUnsupported')}</p>}
      </section>

      <section className="card">
        <h2 className="card-title">{t('settings.appearance')}</h2>
        <label className="field"><span>{t('settings.theme')}</span>
          <select value={profile.theme} onChange={(e) => { const th = e.target.value as ThemePref; applyTheme(th); void update({ theme: th }); }}>
            {(['system', 'light', 'dark'] as const).map((x) => <option key={x} value={x}>{t(`settings.themes.${x}`)}</option>)}
          </select></label>
        <label className="field"><span>{t('settings.language')}</span>
          <select value={profile.language ?? 'es-CO'} onChange={(e) => { const l = e.target.value as LanguageCode; applyLanguage(l); void update({ language: l }); }}>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select></label>
      </section>

      <section className="card">
        <h2 className="card-title">{t('settings.install')}</h2>
        {canInstall
          ? <button className="btn" onClick={() => void install()}>{t('settings.installBtn')}</button>
          : <p className="muted small-text">{t('settings.installUnavailable')}</p>}
      </section>

      <section className="card">
        <h2 className="card-title">{t('settings.data')}</h2>
        <div className="row wrap">
          <button className="btn ghost" onClick={() => void doExport()}>{t('settings.export')}</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>{t('settings.import')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label={t('settings.import')} onChange={(e) => void doImport(e.target.files?.[0])} />
          <button className="btn danger ghost" onClick={() => setConfirmDel(true)}>{t('settings.deleteAll')}</button>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">{t('settings.about')}</h2>
        <p><strong>{t('app.name')}</strong> · {t('app.tagline')}</p>
        <p className="muted small-text">{t('settings.privacy')}</p>
        <p className="muted small-text" role="note">{t('settings.disclaimer')}</p>
        <p className="muted small-text">{t('settings.version', { v: '1.0.0' })}</p>
      </section>

      {confirmDel && (
        <ConfirmDialog title={t('settings.deleteAllTitle')} body={t('settings.deleteAllBody')} confirmLabel={t('settings.deleteAll')}
          onConfirm={() => void doDeleteAll()} onCancel={() => setConfirmDel(false)} />
      )}
    </div>
  );
}
