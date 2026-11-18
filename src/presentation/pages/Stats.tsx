import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { HOUR, addDays, computeStats, fromDateKey, targetHoursFor, toDateKey } from '../../domain';
import { useApp } from '../AppContext';
import { useFormat } from '../hooks/hooks';

export function Stats() {
  const { t } = useTranslation();
  const f = useFormat();
  const { fasts, weights, water, profile } = useApp();
  const [range, setRange] = useState<14 | 30>(14);
  const now = Date.now();
  const stats = useMemo(() => computeStats(fasts, now), [fasts, now]);
  const today = toDateKey(now);
  const days = useMemo(() => Array.from({ length: range }, (_, i) => addDays(today, i - range + 1)), [range, today]);
  const label = (k: string) => f.dayMonth(fromDateKey(k));

  const durData = days.map((d) => ({
    day: label(d),
    hours: Math.round(fasts.filter((x) => x.endedAt !== undefined && toDateKey(x.endedAt) === d).reduce((a, x) => a + (x.endedAt! - x.startedAt) / HOUR, 0) * 10) / 10,
  }));
  const waterData = days.map((d) => ({ day: label(d), ml: water.filter((w) => w.date === d).reduce((a, w) => a + w.ml, 0) }));
  const weightData = [...weights].sort((a, b) => a.date.localeCompare(b.date)).filter((w) => w.date >= days[0]).map((w) => ({ day: label(w.date), kg: w.kg }));
  const target = targetHoursFor(profile.defaultProtocolId, profile.customHours);
  const grid = 'var(--border)'; const axis = { fontSize: 11, fill: 'var(--muted)' };
  const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' } };

  const kpis: [string, string][] = [
    [t('stats.kpi.streak'), t('home.streakDays', { count: stats.currentStreak })],
    [t('stats.kpi.longestStreak'), t('home.streakDays', { count: stats.longestStreak })],
    [t('stats.kpi.average'), f.hours(stats.averageHours)],
    [t('stats.kpi.longest'), f.hours(stats.longestHours)],
    [t('stats.kpi.total'), f.num(stats.totalFasts, 0)],
    [t('stats.kpi.completion'), t('home.percent', { value: stats.completionRate })],
  ];

  return (
    <div className="page">
      <div className="row between center">
        <h1>{t('stats.title')}</h1>
        <div className="seg" role="radiogroup" aria-label={t('stats.range')}>
          {([14, 30] as const).map((r) => (
            <button key={r} role="radio" aria-checked={range === r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{t(`stats.range${r}`)}</button>
          ))}
        </div>
      </div>

      <div className="kpis">
        {kpis.map(([k, v]) => <div className="kpi" key={k}><span className="muted small-text">{k}</span><strong>{v}</strong></div>)}
      </div>

      <section className="card" aria-labelledby="c1">
        <h2 id="c1" className="card-title">{t('stats.durations')}</h2>
        <div className="chart"><ResponsiveContainer>
          <BarChart data={durData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="day" tick={axis} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={axis} />
            <Tooltip {...tip} formatter={(v: number) => [f.hours(v), t('stats.hours')]} />
            <ReferenceLine y={target} stroke="var(--danger)" strokeDasharray="4 4" label={{ value: t('stats.target'), fill: 'var(--muted)', fontSize: 11, position: 'insideTopRight' }} />
            <Bar dataKey="hours" fill="var(--accent)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </section>

      <section className="card" aria-labelledby="c2">
        <h2 id="c2" className="card-title">{t('stats.weightChart')}</h2>
        {weightData.length ? (
          <div className="chart"><ResponsiveContainer>
            <LineChart data={weightData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="day" tick={axis} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={axis} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip {...tip} />
              {profile.goalWeightKg && <ReferenceLine y={profile.goalWeightKg} stroke="var(--ok)" strokeDasharray="4 4" label={{ value: t('stats.goal'), fill: 'var(--muted)', fontSize: 11, position: 'insideTopRight' }} />}
              <Line type="monotone" dataKey="kg" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer></div>
        ) : <p className="muted">{t('stats.empty')}</p>}
      </section>

      <section className="card" aria-labelledby="c3">
        <h2 id="c3" className="card-title">{t('stats.waterChart')}</h2>
        <div className="chart"><ResponsiveContainer>
          <BarChart data={waterData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="day" tick={axis} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tick={axis} />
            <Tooltip {...tip} />
            <ReferenceLine y={profile.waterGoalMl} stroke="var(--danger)" strokeDasharray="4 4" />
            <Bar dataKey="ml" fill="var(--water)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </section>
    </div>
  );
}
