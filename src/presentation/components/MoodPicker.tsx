import { useTranslation } from 'react-i18next';
import type { Mood } from '../../domain';

export const MOOD_EMOJI: Record<Mood, string> = { 1: '😣', 2: '😕', 3: '😐', 4: '🙂', 5: '🤩' };

export function MoodPicker({ value, onChange }: { value?: Mood; onChange: (m: Mood | undefined) => void }) {
  const { t } = useTranslation();
  return (
    <div className="mood-picker" role="radiogroup" aria-label={t('mood.label')}>
      {([1, 2, 3, 4, 5] as Mood[]).map((m) => (
        <button
          key={m} type="button" role="radio" aria-checked={value === m} aria-label={t(`mood.${m}`)} title={t(`mood.${m}`)}
          className={`mood ${value === m ? 'on' : ''}`} onClick={() => onChange(value === m ? undefined : m)}
        >{MOOD_EMOJI[m]}</button>
      ))}
    </div>
  );
}
