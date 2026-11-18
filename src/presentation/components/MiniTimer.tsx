import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { elapsedMs, formatHMS, progressPercent, type Fast } from '../../domain';
import { useNow } from '../hooks/hooks';

interface PipApi { requestWindow(o?: { width?: number; height?: number }): Promise<Window> }
const getApi = (): PipApi | undefined => (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture;
export const pipSupported = () => typeof window !== 'undefined' && !!getApi();

function Content({ fast }: { fast: Fast }) {
  const now = useNow(1000);
  const el = elapsedMs(fast.startedAt, now);
  return (
    <div className="pip">
      <div className="pip-time">{formatHMS(el)}</div>
      <div className="pip-sub">{progressPercent(el, fast.targetHours)}% · {fast.targetHours} h</div>
    </div>
  );
}

/** Document Picture-in-Picture mini timer (hidden when unsupported). */
export function MiniTimer({ fast }: { fast: Fast }) {
  const { t } = useTranslation();
  const [win, setWin] = useState<Window | null>(null);
  if (!pipSupported()) return null;
  const open = async () => {
    try {
      const w = await getApi()!.requestWindow({ width: 260, height: 120 });
      [...document.styleSheets].forEach((s) => {
        try {
          const css = [...s.cssRules].map((r) => r.cssText).join('\n');
          const st = w.document.createElement('style'); st.textContent = css; w.document.head.appendChild(st);
        } catch { /* cross-origin sheet */ }
      });
      w.document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') ?? '');
      w.document.title = t('pip.title');
      w.addEventListener('pagehide', () => setWin(null));
      setWin(w);
    } catch { setWin(null); }
  };
  return (
    <>
      <button className="btn ghost small" onClick={() => void open()}>{t('home.miniTimer')}</button>
      {win && createPortal(<Content fast={fast} />, win.document.body)}
    </>
  );
}
