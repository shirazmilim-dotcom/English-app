import React, { useState, useEffect } from 'react';
import { speak, stopSpeaking } from '../lib/speech.js';

/** טקסט באנגלית בתוך מסך עברי – מבודד כיוון כדי שסימני פיסוק לא "יקפצו" */
export function En({ children, block, className = '', ...rest }) {
  const Tag = block ? 'p' : 'bdi';
  return (
    <Tag dir="ltr" lang="en" className={`en ${block ? 'en-block' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Spinner({ label = 'טוען…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error-box" role="alert">
      <span aria-hidden="true">⚠️</span>
      <div className="grow">{typeof error === 'string' ? error : error.message}</div>
      {onRetry && (
        <button className="btn btn-small btn-ghost" onClick={onRetry}>
          נסו שוב
        </button>
      )}
    </div>
  );
}

export function Notice({ kind = 'info', children, icon }) {
  return (
    <div className={`notice notice-${kind}`}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <div className="grow">{children}</div>
    </div>
  );
}

let playingSetter = null;
/** כפתור השמעה לטקסט באנגלית, כולל מצב טעינה וטיפול בשגיאות */
export function SpeakButton({ text, rate = 1, voice = 0, label, small, slow = true, className = '' }) {
  const [state, setState] = useState('idle');
  useEffect(() => () => state === 'playing' && stopSpeaking(), []); // eslint-disable-line
  const play = async (r) => {
    if (state === 'playing') {
      stopSpeaking();
      return setState('idle');
    }
    playingSetter?.('idle');
    playingSetter = setState;
    setState('playing');
    try {
      await speak(text, { rate: r, voice });
      setState('idle');
    } catch (e) {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };
  return (
    <span className={`speak-group ${className}`}>
      <button type="button" className={`btn-icon ${small ? 'small' : ''} ${state === 'playing' ? 'active' : ''}`} onClick={() => play(rate)} aria-label={label || 'השמעה'} title={label || 'השמעה'}>
        {state === 'playing' ? '⏹' : state === 'error' ? '⚠️' : '🔊'}
      </button>
      {slow && (
        <button type="button" className={`btn-icon ${small ? 'small' : ''}`} onClick={() => play(Math.max(0.6, rate * 0.7))} aria-label="השמעה איטית" title="השמעה איטית">
          🐢
        </button>
      )}
      {state === 'error' && <span className="tiny muted">ההשמעה נכשלה</span>}
    </span>
  );
}

export function ProgressBar({ value, max = 100, label }) {
  const pct = max ? Math.round((Math.min(value, max) / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

const VERDICT = {
  great: { he: 'מצוין!', icon: '🌟', cls: 'great' },
  good: { he: 'יפה מאוד', icon: '👍', cls: 'good' },
  needs_fix: { he: 'כמעט – בואו נדייק', icon: '🛠️', cls: 'fix' },
};

/** כרטיס משוב: מה נאמר, עד שני תיקונים, הסבר בעברית, ניסוח טבעי עם השמעה ואפשרות לנסות שוב */
export function FeedbackCard({ said, fb, demo, onRetry, extra }) {
  if (!fb) return null;
  const v = VERDICT[fb.verdict] || VERDICT.good;
  const same = norm(fb.natural_version) === norm(said);
  return (
    <div className={`feedback feedback-${v.cls} pop-in`}>
      <div className="feedback-head">
        <span className="feedback-icon" aria-hidden="true">{v.icon}</span>
        <strong>{v.he}</strong>
        {demo && <span className="badge badge-demo" title="משוב מבוסס כללים פשוטים, לא AI">משוב הדגמה</span>}
      </div>
      {said && (
        <div className="feedback-row">
          <span className="label">מה אמרת:</span>
          <En block className="said">“{said}”</En>
        </div>
      )}
      {fb.corrections?.length > 0 && (
        <ul className="corrections">
          {fb.corrections.map((c, i) => (
            <li key={i} className={`correction ${c.kind}`}>
              <span className={`tag tag-${c.kind}`}>{c.kind === 'error' ? 'טעות לתיקון' : 'אפשר לשפר'}</span>
              <div className="corr-line">
                <En className="strike">{c.you_said}</En> <span aria-hidden="true">←</span> <En className="better">{c.better}</En>
              </div>
              <p className="corr-explain"><Mixed>{c.explanation_he}</Mixed></p>
            </li>
          ))}
        </ul>
      )}
      {fb.natural_version && !same && (
        <div className="feedback-row natural">
          <span className="label">איך זה נשמע טבעי:</span>
          <div className="row gap-s wrap">
            <En block className="natural-text">{fb.natural_version}</En>
            <SpeakButton text={fb.natural_version} small label="השמעת הניסוח הטבעי" />
          </div>
        </div>
      )}
      {fb.tip_he && <p className="feedback-tip">💡 <Mixed>{fb.tip_he}</Mixed></p>}
      {extra}
      {onRetry && (
        <button className="btn btn-ghost btn-small" onClick={onRetry}>
          🔁 לומר שוב ולתרגל
        </button>
      )}
    </div>
  );
}
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();

export function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({ length: 24 });
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((_, i) => (
        <span key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--h': `${(i * 47) % 360}` }} />
      ))}
    </div>
  );
}

/** טקסט עברי שמשולבים בו ביטויים באנגלית: עוטף כל רצף לטיני בבידוד כיוון כדי שהסדר לא יתהפך */
const LATIN_RUN = /([A-Za-z][A-Za-z0-9'’?!.,…:\-/ ]*[A-Za-z0-9?!.…'’]|[A-Za-z])/g;
export function Mixed({ children }) {
  const text = String(children ?? '');
  if (!/[A-Za-z]/.test(text)) return text;
  return text.split(LATIN_RUN).map((part, i) =>
    i % 2 ? (
      <bdi key={i} dir="ltr" lang="en" className="en">
        {part}
      </bdi>
    ) : (
      part
    )
  );
}
