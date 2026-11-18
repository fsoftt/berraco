import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps { title: string; onClose: () => void; children: ReactNode; variant?: 'sheet' | 'dialog' }

export function Modal({ title, onClose, children, variant = 'sheet' }: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((e) => !e.hasAttribute('disabled'));
    (focusables()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`modal ${variant}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ConfirmProps { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }
export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: ConfirmProps) {
  const { t } = useTranslation();
  return (
    <Modal title={title} onClose={onCancel} variant="dialog">
      <p className="muted">{body}</p>
      <div className="row end">
        <button className="btn ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
