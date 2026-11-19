import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HOUR, PHASES, PROTOCOLS, currentPhase, currentStreak, elapsedMs, expectedEnd, formatHMS, hoursToNextPhase, nextPhase,
  phaseIndexAt, progressPercent, remainingMs, targetHoursFor, toDateKey, type Mood,
} from '../../domain';
import { useApp } from '../AppContext';
import { useFormat, useInstallPrompt, useNow } from '../hooks/hooks';
import { fromLocalInput, toLocalInput } from '../hooks/util';
import { Ring } from '../components/Ring';
import { Modal } from '../components/Modal';
import { MoodPicker } from '../components/MoodPicker';
import { MiniTimer } from '../components/MiniTimer';

const WATER_STEP = 250;

export function Home() {
  const { t } = useTranslation();
  const f = useFormat();
  const { active, fasts, profile, water, container, reload } = useApp();
  const uc = container.useCases;
  const now = useNow(1000);
  const { canInstall, install, installed } = useInstallPrompt();
  const [protocol, setProtocol] = useState(profile.defaultProtocolId);
  const [ending, setEnding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState<Mood | undefined>();
  const [note, setNote] = useState('');
  const [startInput, setStartInput] = useState('');
  const [error, setError] = useState('');

  const targetHours = active ? active.targetHours : targetHoursFor(protocol, profile.customHours);
  const elapsed = active ? elapsedMs(active.startedAt, now) : 0;
  const hours = elapsed / HOUR;
  const percent = active ? progressPercent(elapsed, targetHours) : 0;
  const reached = !!active && elapsed >= targetHours * HOUR;
  const phase = currentPhase(hours);
  const next = nextPhase(hours);
  const toNext = hoursToNextPhase(hours);
  const today = toDateKey(now);
  const waterToday = water.filter((w) => w.date === today).reduce((a, w) => a + w.ml, 0);
  const streak = currentStreak(fasts, now);

  const start = async () => { await uc.startFast(protocol); await reload(); };
  const confirmEnd = async () => {
    await uc.endFast({ mood, note });
    setEnding(false); setMood(undefined); setNote(''); await reload();
  };
  const addWater = async () => { await uc.logWater(WATER_STEP); await reload(); };
  const saveStart = async () => {
    const ts = fromLocalInput(startInput);
    if (!active || ts === undefined) return;
    if (ts > Date.now()) { setError(t('home.futureError')); return; }
    await uc.editFast(active.id, { startedAt: ts }); setEditing(false); setError(''); await reload();
  };
  const setCustom = async (v: number) => { await uc.updateProfile({ customHours: v }); await reload(); };

  return (
    <div className="page">
      {installed && <div className="banner" role="status"><span>{t('settings.installDone')}</span></div>}
      {canInstall && (
        <div className="banner" role="region">
          <span>{t('home.installBanner')}</span>
          <button className="btn small" onClick={() => void install()}>{t('home.install')}</button>
        </div>
      )}

      <section className="card hero">
        <Ring percent={percent} label={t('home.ringLabel', { percent })}>
          {active ? (
            <>
              <span className="ring-caption">{t('home.elapsed')}</span>
              <span className="ring-time" aria-live="off">{formatHMS(elapsed)}</span>
              <span className="ring-percent">{t('home.percent', { value: percent })}</span>
              <span className="ring-caption">{reached ? t('home.reached') : t('home.remaining', { time: formatHMS(remainingMs(elapsed, targetHours)) })}</span>
            </>
          ) : (
            <>
              <span className="ring-time idle">{f.hours(targetHours)}</span>
              <span className="ring-caption">{t('home.idleHint')}</span>
            </>
          )}
        </Ring>

        {active && (
          <div className="meta">
            <div><span className="muted">{t('home.startedAt', { when: '' })}</span> <strong>{f.dateTime(active.startedAt)}</strong></div>
            <div><span className="muted">{t('home.expectedEnd', { when: '' })}</span> <strong>{f.dateTime(expectedEnd(active.startedAt, active.targetHours))}</strong></div>
            <div className="row center wrap">
              <button className="btn ghost small" onClick={() => { setStartInput(toLocalInput(active.startedAt)); setError(''); setEditing(true); }}>{t('home.editStart')}</button>
              <MiniTimer fast={active} />
            </div>
          </div>
        )}

        <div className="chips" role="radiogroup" aria-label={t('home.protocol')}>
          {PROTOCOLS.map((p) => {
            const sel = (active ? active.protocolId : protocol) === p.id;
            return (
              <button key={p.id} role="radio" aria-checked={sel} disabled={!!active && !sel} className={`chip ${sel ? 'on' : ''}`}
                title={t(`protocols.${p.id}.desc`)} onClick={() => { setProtocol(p.id); }}>
                {t(`protocols.${p.id}.label`)}
              </button>
            );
          })}
        </div>
        {!active && protocol === 'custom' && (
          <label className="field inline">
            <span>{t('home.customHours')}</span>
            <input type="number" inputMode="numeric" min={1} max={168} value={profile.customHours} onChange={(e) => void setCustom(Math.max(1, Math.min(168, Number(e.target.value) || 1)))} />
          </label>
        )}
        {!active && <p className="muted small-text">{t(`protocols.${protocol}.desc`)}</p>}

        {active
          ? <button className="btn big danger-soft" onClick={() => setEnding(true)}>{t('home.end')}</button>
          : <button className="btn big" onClick={() => void start()}>{t('home.start')}</button>}
      </section>

      {active && (
        <section className="card" aria-labelledby="phase-h">
          <h2 id="phase-h" className="card-title">{t('home.currentPhase')}</h2>
          <p className="phase-title">{t(`phases.${phase.id}.title`)}</p>
          <p className="muted">{t(`phases.${phase.id}.benefit`)}</p>
          <p className="next">
            {next && toNext !== undefined
              ? <><strong>{t('home.nextPhase')}:</strong> {t('home.inTime', { phase: t(`phases.${next.id}.title`), time: formatHMS(toNext * HOUR) })}</>
              : t('home.lastPhase')}
          </p>
        </section>
      )}

      <section className="card" aria-labelledby="water-h">
        <h2 id="water-h" className="card-title">{t('home.water')}</h2>
        <div className="row between center">
          <span>{t('home.waterProgress', { ml: f.num(waterToday, 0), goal: f.num(profile.waterGoalMl, 0) })}</span>
          <button className="btn small" onClick={() => void addWater()}>{t('home.addWater', { ml: WATER_STEP })}</button>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={profile.waterGoalMl} aria-valuenow={Math.min(waterToday, profile.waterGoalMl)} aria-label={t('home.water')}>
          <div style={{ width: `${Math.min(100, (waterToday / profile.waterGoalMl) * 100)}%` }} />
        </div>
      </section>

      <section className="card row between center" aria-label={t('home.streak')}>
        <h2 className="card-title nomargin">{t('home.streak')}</h2>
        <span className="streak">🔥 {t('home.streakDays', { count: streak })}</span>
      </section>

      <section className="card" aria-labelledby="phases-h">
        <details>
          <summary id="phases-h">{t('home.allPhases')}</summary>
          <ol className="phase-list">
            {PHASES.map((p, i) => {
              const reachedP = active ? i <= phaseIndexAt(hours) : false;
              return (
                <li key={p.id} className={reachedP ? 'reached' : ''}>
                  <div className="row between">
                    <strong>{t(`phases.${p.id}.title`)}</strong>
                    <span className="muted small-text">{p.toHour === Infinity ? `${p.fromHour} h+` : `${p.fromHour}-${p.toHour} h`}{reachedP ? ` · ${t('home.reachedPhase')}` : ''}</span>
                  </div>
                  <p className="muted small-text">{t(`phases.${p.id}.benefit`)}</p>
                </li>
              );
            })}
          </ol>
        </details>
      </section>

      {ending && (
        <Modal title={t('endSheet.title')} onClose={() => setEnding(false)}>
          <p className="muted">{t('endSheet.moodPrompt')}</p>
          <MoodPicker value={mood} onChange={setMood} />
          <label className="field">
            <span>{t('endSheet.note')}</span>
            <textarea rows={3} value={note} placeholder={t('endSheet.notePlaceholder')} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="row end">
            <button className="btn ghost" onClick={() => setEnding(false)}>{t('common.cancel')}</button>
            <button className="btn" onClick={() => void confirmEnd()}>{t('endSheet.confirm')}</button>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal title={t('home.editStart')} onClose={() => setEditing(false)} variant="dialog">
          <label className="field">
            <span>{t('home.startedAtLabel')}</span>
            <input type="datetime-local" value={startInput} max={toLocalInput(Date.now())} onChange={(e) => setStartInput(e.target.value)} />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="row end">
            <button className="btn ghost" onClick={() => setEditing(false)}>{t('common.cancel')}</button>
            <button className="btn" onClick={() => void saveStart()}>{t('common.save')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
