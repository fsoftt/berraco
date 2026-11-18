import type { ReactNode } from 'react';

interface Props { percent: number; label: string; children?: ReactNode }

/** Circular progress ring. Percent may exceed 100 (the ring just stays full). */
export function Ring({ percent, label, children }: Props) {
  const r = 108;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className="ring" role="img" aria-label={label}>
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ring-from)" />
            <stop offset="100%" stopColor="var(--ring-to)" />
          </linearGradient>
        </defs>
        <circle cx="130" cy="130" r={r} className="ring-track" />
        <circle
          cx="130" cy="130" r={r} className="ring-bar" stroke="url(#ringGrad)"
          strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 130 130)"
        />
      </svg>
      <div className="ring-inner">{children}</div>
    </div>
  );
}
