import React, { useEffect, useRef, useState } from 'react';
import { startRecording, micErrorMessage, micSupported, sttSupported, stopSpeaking } from '../lib/speech.js';
import { Modal, Notice } from './ui.jsx';

const MAX_SECONDS = 60;
const getTyped = () => {
  try {
    return localStorage.getItem('typedMode') === '1';
  } catch {
    return false;
  }
};
const setTypedPref = (v) => {
  try {
    localStorage.setItem('typedMode', v ? '1' : '0');
  } catch {}
};
const micExplained = () => {
  try {
    return localStorage.getItem('micExplained') === '1';
  } catch {
    return true;
  }
};

/**
 * רכיב הדיבור המרכזי: כפתור מיקרופון גדול, חיווי הקלטה, עצירה, השמעה חוזרת של ההקלטה ותמלול חי.
 * onResult({ transcript, seconds, typed, audioUrl }) נקרא בסיום.
 */
export default function Recorder({ onResult, disabled, busy, label = 'לחצו ודברו', allowTyping = true, compact }) {
  const [state, setState] = useState('idle'); // idle | recording | processing
  const [typed, setTyped] = useState(getTyped);
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [explain, setExplain] = useState(false);
  const ctrl = useRef(null);
  const timer = useRef(null);
  const supported = micSupported() && sttSupported();
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => () => {
    ctrl.current?.cancel();
    clearInterval(timer.current);
  }, []);

  const begin = async () => {
    if (!micExplained()) return setExplain(true);
    setError(null);
    setInterim('');
    stopSpeaking();
    try {
      ctrl.current = await startRecording({ onInterim: setInterim, onLevel: setLevel });
      setState('recording');
      const t0 = Date.now();
      setElapsed(0);
      timer.current = setInterval(() => {
        const s = (Date.now() - t0) / 1000;
        setElapsed(s);
        if (s >= MAX_SECONDS) finish();
      }, 200);
    } catch (e) {
      setError(micErrorMessage(e));
      setState('idle');
    }
  };

  const finish = async () => {
    clearInterval(timer.current);
    if (!ctrl.current) return;
    const c = ctrl.current;
    ctrl.current = null;
    setState('processing');
    try {
      const r = await c.stop();
      setLevel(0);
      if (!r.transcript) {
        setError({ code: 'empty', he: 'לא הצלחנו לשמוע מילים באנגלית. נסו לדבר קרוב יותר למיקרופון, קצת יותר לאט – ושוב.' });
        setState('idle');
        return;
      }
      setState('idle');
      onResultRef.current({ transcript: r.transcript, seconds: r.seconds, typed: false, audioUrl: r.url });
    } catch (e) {
      setError(micErrorMessage(e));
      setState('idle');
    }
  };

  const toggleTyped = (v) => {
    setTyped(v);
    setTypedPref(v);
    setError(null);
  };

  const submitTyped = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    onResult({ transcript: t, seconds: 0, typed: true, audioUrl: null });
  };

  if (typed || !supported) {
    return (
      <div className="recorder typed">
        {!supported && !typed && (
          <Notice kind="warn" icon="🎙️">
            הדפדפן הזה לא תומך בזיהוי דיבור. לתרגול דיבור מומלץ Chrome, Edge או Safari. בינתיים אפשר לתרגל בהקלדה.
          </Notice>
        )}
        <Notice kind="muted" icon="⌨️">
          מצב הקלדה: זה תרגול כתיבה ולא תרגול דיבור, ולא נספר בדקות הדיבור.
        </Notice>
        <form className="typed-form" onSubmit={submitTyped}>
          <input
            dir="ltr"
            lang="en"
            className="input en-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer in English…"
            disabled={disabled || busy}
            autoComplete="off"
            aria-label="התשובה שלך באנגלית"
          />
          <button className="btn btn-primary" disabled={disabled || busy || !text.trim()}>
            {busy ? '…' : 'שליחה'}
          </button>
        </form>
        {supported && (
          <button className="link-btn" onClick={() => toggleTyped(false)}>
            🎙️ חזרה לדיבור
          </button>
        )}
      </div>
    );
  }

  const recording = state === 'recording';
  return (
    <div className={`recorder ${compact ? 'compact' : ''}`}>
      {error && (
        <Notice kind={error.code === 'empty' ? 'warn' : 'error'} icon={error.code === 'blocked' ? '🔒' : '🎙️'}>
          {error.he}
          {['blocked', 'nomic', 'unknown', 'network'].includes(error.code) && allowTyping && (
            <>
              {' '}
              <button className="link-btn" onClick={() => toggleTyped(true)}>
                מעבר לתרגול בהקלדה
              </button>
            </>
          )}
        </Notice>
      )}
      <div className="mic-area">
        <button
          type="button"
          className={`mic-btn ${recording ? 'recording' : ''} ${state === 'processing' || busy ? 'processing' : ''}`}
          style={{ '--level': level }}
          onClick={recording ? finish : begin}
          disabled={disabled || busy || state === 'processing'}
          aria-label={recording ? 'עצירת ההקלטה' : 'התחלת הקלטה'}
          aria-pressed={recording}
        >
          <span className="mic-ring" aria-hidden="true" />
          <span className="mic-icon" aria-hidden="true">{recording ? '■' : state === 'processing' || busy ? '…' : '🎙️'}</span>
        </button>
        <div className="mic-label" aria-live="polite">
          {recording ? (
            <>
              <span className="rec-dot" aria-hidden="true" /> מקליט… {Math.floor(elapsed)} שנ׳ · לחצו לעצירה
            </>
          ) : state === 'processing' ? (
            'מעבד את מה שאמרת…'
          ) : busy ? (
            'המורה חושב/ת…'
          ) : (
            label
          )}
        </div>
        {recording && interim && (
          <p className="interim en" dir="ltr" lang="en">
            {interim}
          </p>
        )}
      </div>
      {allowTyping && !recording && (
        <button className="link-btn center" onClick={() => toggleTyped(true)}>
          ⌨️ לא יכול/ה לדבר עכשיו? תרגול בהקלדה
        </button>
      )}
      <Modal open={explain} onClose={() => setExplain(false)} title="לפני שמתחילים לדבר 🎙️">
        <p>כדי לתרגל דיבור, נבקש מהדפדפן גישה למיקרופון.</p>
        <ul className="bullets">
          <li>ההקלטה משמשת רק לזיהוי מה שאמרת ולהשמעה חוזרת שלך.</li>
          <li>אנחנו <strong>לא שומרים הקלטות</strong>. נשמר רק הטקסט של התשובה לצורך משוב והתקדמות.</li>
          <li>זיהוי הדיבור מתבצע על ידי שירות הדיבור של הדפדפן או של שירות התמלול שהוגדר בשרת.</li>
          <li>אפשר לבטל את ההרשאה בכל רגע בהגדרות הדפדפן.</li>
        </ul>
        <div className="row gap">
          <button
            className="btn btn-primary grow"
            onClick={() => {
              try {
                localStorage.setItem('micExplained', '1');
              } catch {}
              setExplain(false);
              setTimeout(begin, 50);
            }}
          >
            הבנתי, אפשר להתחיל
          </button>
          <button className="btn btn-ghost" onClick={() => setExplain(false)}>
            לא עכשיו
          </button>
        </div>
      </Modal>
    </div>
  );
}
