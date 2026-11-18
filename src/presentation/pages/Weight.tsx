import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, bmi, bmiCategory, fromDateKey, toDateKey } from '../../domain';
import { useApp } from '../AppContext';
import { useFormat } from '../hooks/hooks';

export function Weight() {
  const { t } = useTranslation();
  const f = useFormat();
  const { weights, profile, container, reload } = useApp();
  const uc = container.useCases;
  const today = toDateKey(Date.now());
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0]; const last = sorted[sorted.length - 1];
  const weekAgoKey = addDays(today, -7);
  const weekRef = [...sorted].reverse().find((w) => w.date <= weekAgoKey);
  const signed = (v: number) => `${v > 0 ? '+' : ''}${f.num(v)} kg`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(kg.replace(',', '.'));
    try { await uc.logWeight(v, date); setKg(''); setError(''); await reload(); } catch { setError(t('weight.invalid')); }
  };

  let progress: number | undefined;
  if (first && last && profile.goalWeightKg) {
    const total = first.kg - profile.goalWeightKg;
    progress = total === 0 ? 100 : Math.max(0, Math.min(100, ((first.kg - last.kg) / total) * 100));
  }
  const bmiVal = last && profile.heightCm ? bmi(last.kg, profile.heightCm) : undefined;

  return (
    <div className="page">
      <h1>{t('weight.title')}</h1>
      <form className="card" onSubmit={(e) => void submit(e)}>
        <h2 className="card-title">{t('weight.log')}</h2>
        <div className="row wrap">
          <label className="field grow"><span>{t('weight.kg')}</span>
            <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} required /></label>
          <label className="field grow"><span>{t('weight.date')}</span>
            <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required /></label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit">{t('common.add')}</button>
      </form>

      {last ? (
        <section className="card">
          <h2 className="card-title">{t('weight.current')}</h2>
          <p className="big-number">{f.num(last.kg)} kg</p>
          <dl className="kv">
            {first && first !== last && <><dt>{t('weight.vsFirst')}</dt><dd>{signed(last.kg - first.kg)}</dd></>}
            {weekRef && <><dt>{t('weight.vsWeek')}</dt><dd>{signed(last.kg - weekRef.kg)}</dd></>}
            <dt>{t('weight.bmi')}</dt>
            <dd>{bmiVal !== undefined ? `${f.num(bmiVal)} · ${t(`bmi.${bmiCategory(bmiVal)}`)}` : <span className="muted">{t('weight.needHeight')}</span>}</dd>
          </dl>
          {profile.goalWeightKg ? (
            <div>
              <div className="row between"><span>{t('weight.goalProgress')}</span><span className="muted">{t('weight.goal', { kg: f.num(profile.goalWeightKg) })}</span></div>
              <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress ?? 0)} aria-label={t('weight.goalProgress')}>
                <div style={{ width: `${progress ?? 0}%` }} />
              </div>
            </div>
          ) : <p className="muted small-text">{t('weight.noGoal')}</p>}
        </section>
      ) : <p className="card muted">{t('weight.empty')}</p>}

      {sorted.length > 0 && (
        <section>
          <h2 className="week">{t('weight.entries')}</h2>
          <ul className="list">
            {[...sorted].reverse().map((w) => (
              <li key={w.id} className="list-item row between center">
                <span><strong>{f.num(w.kg)} kg</strong> <span className="muted">· {f.date(fromDateKey(w.date))}</span></span>
                <button className="btn ghost small danger" aria-label={`${t('weight.deleteEntry')}: ${f.num(w.kg)} kg`} onClick={() => void uc.deleteWeight(w.id).then(reload)}>{t('common.delete')}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
