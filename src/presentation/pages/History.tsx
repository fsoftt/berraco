import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { elapsedMs, fromDateKey, isCompleted, weekStartKey, type Fast, type Mood } from '../../domain';
import { useApp } from '../AppContext';
import { useFormat } from '../hooks/hooks';
import { fromLocalInput, toLocalInput } from '../hooks/util';
import { ConfirmDialog, Modal } from '../components/Modal';
import { MOOD_EMOJI, MoodPicker } from '../components/MoodPicker';

export function History() {
  const { t } = useTranslation();
  const f = useFormat();
  const { fasts, container, reload } = useApp();
  const uc = container.useCases;
  const [editing, setEditing] = useState<Fast | null>(null);
  const [deleting, setDeleting] = useState<Fast | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<Mood | undefined>();
  const [error, setError] = useState('');

  const groups = useMemo(() => {
    const map = new Map<string, Fast[]>();
    [...fasts].sort((a, b) => b.startedAt - a.startedAt).forEach((x) => {
      const k = weekStartKey(x.startedAt);
      map.set(k, [...(map.get(k) ?? []), x]);
    });
    return [...map.entries()];
  }, [fasts]);

  const open = (x: Fast) => {
    setEditing(x); setStart(toLocalInput(x.startedAt)); setEnd(x.endedAt ? toLocalInput(x.endedAt) : '');
    setNote(x.note ?? ''); setMood(x.mood); setError('');
  };
  const save = async () => {
    if (!editing) return;
    const s = fromLocalInput(start); const e = end ? fromLocalInput(end) : undefined;
    if (s === undefined) return;
    try {
      await uc.editFast(editing.id, { startedAt: s, endedAt: editing.endedAt !== undefined ? e : undefined, note: note.trim() || undefined, mood });
      setEditing(null); await reload();
    } catch (err) {
      const m = (err as Error).message;
      setError(m === 'end-before-start' ? t('history.endBeforeStart') : m === 'start-in-future' ? t('history.startInFuture') : t('errors.generic'));
    }
  };
  const remove = async () => { if (deleting) { await uc.deleteFast(deleting.id); setDeleting(null); setEditing(null); await reload(); } };

  return (
    <div className="page">
      <h1>{t('history.title')}</h1>
      {groups.length === 0 && <p className="card muted">{t('history.empty')}</p>}
      {groups.map(([week, items]) => (
        <section key={week} aria-label={t('history.week', { date: f.dayMonth(fromDateKey(week)) })}>
          <h2 className="week">{t('history.week', { date: f.dayMonth(fromDateKey(week)) })}</h2>
          <ul className="list">
            {items.map((x) => {
              const done = x.endedAt !== undefined;
              const dur = elapsedMs(x.startedAt, Date.now(), x.endedAt);
              return (
                <li key={x.id}>
                  <button className="list-item" onClick={() => open(x)}>
                    <div className="row between center">
                      <strong>{f.duration(dur)}</strong>
                      <span className={`badge ${!done ? 'info' : isCompleted(x) ? 'ok' : 'warn'}`}>
                        {!done ? t('history.active') : isCompleted(x) ? t('history.reached') : t('history.notReached')}
                      </span>
                    </div>
                    <div className="muted small-text">{f.dateTime(x.startedAt)} · {t('history.target', { hours: x.targetHours })} {x.mood ? MOOD_EMOJI[x.mood] : ''}</div>
                    {x.note && <div className="note">{x.note}</div>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {editing && (
        <Modal title={t('history.editTitle')} onClose={() => setEditing(null)}>
          <label className="field"><span>{t('history.start')}</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          {editing.endedAt !== undefined && (
            <label className="field"><span>{t('history.end')}</span>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          )}
          <div className="field"><span>{t('mood.label')}</span><MoodPicker value={mood} onChange={setMood} /></div>
          <label className="field"><span>{t('history.note')}</span>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="row between">
            <button className="btn danger ghost" onClick={() => setDeleting(editing)}>{t('common.delete')}</button>
            <div className="row">
              <button className="btn ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button className="btn" onClick={() => void save()}>{t('common.save')}</button>
            </div>
          </div>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title={t('history.deleteTitle')} body={t('history.deleteBody')} confirmLabel={t('common.delete')}
          onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
