import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { Spinner, ErrorBox, En, SpeakButton, FeedbackCard, ProgressBar, Notice, Confetti } from '../components/ui.jsx';
import Recorder from '../components/Recorder.jsx';
import { speak } from '../lib/speech.js';

const FALLBACK_HE = ['לנסוע', 'שולחן', 'מהר', 'לפעמים', 'חבר', 'עבודה', 'יקר', 'לשכוח', 'מזג אוויר', 'להחליט'];
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
const SESSION = 10;

export default function Review() {
  const [all, setAll] = useState(null);
  const [queue, setQueue] = useState([]);
  const [i, setI] = useState(0);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const load = () =>
    api('/vocab')
      .then((r) => {
        setAll(r.items);
        const due = r.items.filter((v) => v.due);
        // אם אין חזרות להיום – תרגול חופשי של המילים הפחות מוכרות
        const pool = due.length ? due : [...r.items].sort((a, b) => a.box - b.box);
        setQueue(shuffle(pool.slice(0, 30)).slice(0, SESSION));
      })
      .catch(setError);
  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!all) return <Spinner />;
  if (!queue.length)
    return (
      <div className="stack center-text">
        <h1>אין עדיין מילים לחזרה</h1>
        <p className="muted">השלימו שיעור או הוסיפו חבילת מילים, והן יופיעו כאן.</p>
        <a className="btn btn-primary" href="#/words">למילים שלי</a>
      </div>
    );
  if (i >= queue.length) {
    const good = results.filter((r) => r.recognized && r.produced).length;
    return (
      <div className="stack center-text pop-in">
        <Confetti show={good > 0} />
        <div className="summary-emoji" aria-hidden="true">🧠</div>
        <h1>סיימת סבב חזרה!</h1>
        <p>{good} מתוך {queue.length} ביטויים: זיהית נכון וגם השתמשת בהם במשפט משלך.</p>
        <p className="muted tiny">ביטויים שהיה בהם קושי יחזרו בקרוב, ואלה שהצלחת בהם – בעוד כמה ימים.</p>
        <a className="btn btn-primary btn-big" href="#/words">חזרה למילים שלי</a>
        <a className="btn btn-ghost" href="#/">למסך הבית</a>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="row gap">
        <a href="#/words" className="link-btn">✕</a>
        <div className="grow"><ProgressBar value={i} max={queue.length} label="התקדמות בחזרה" /></div>
        <span className="tiny muted">{i + 1}/{queue.length}</span>
      </div>
      <ReviewCard key={queue[i].id} v={queue[i]} all={all} onDone={(r) => { setResults((s) => [...s, r]); setI(i + 1); }} />
    </div>
  );
}

function ReviewCard({ v, all, onDone }) {
  const [phase, setPhase] = useState('recognize');
  const [picked, setPicked] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [saving, setSaving] = useState(false);
  const t0 = useRef(Date.now());
  const options = useMemo(() => {
    const others = shuffle([...new Set(all.filter((x) => x.id !== v.id && x.he !== v.he).map((x) => x.he))]);
    const distract = [...others, ...shuffle(FALLBACK_HE)].filter((x) => x !== v.he).slice(0, 3);
    return shuffle([v.he, ...distract]);
  }, [v.id]);
  useEffect(() => {
    speak(v.term).catch(() => {});
  }, [v.id]);

  const recognized = picked !== null && options[picked] === v.he;

  const submit = async (produced) => {
    setSaving(true);
    try {
      await api(`/vocab/${v.id}/review`, {
        method: 'POST',
        body: { recognized, produced, seconds: attempt?.seconds || 0, typed: attempt?.typed, durationSec: (Date.now() - t0.current) / 1000 },
      });
    } catch {
      /* לא חוסם את הזרימה; ננסה בפעם הבאה */
    }
    onDone({ recognized, produced });
  };

  const evaluate = async (r) => {
    setAttempt({ ...r, loading: true });
    try {
      const ev = await api('/speaking/evaluate', { method: 'POST', body: { vocabId: v.id, transcript: r.transcript } });
      setAttempt({ ...r, eval: ev, ok: ev.task_achieved && ev.uses_target });
    } catch (e) {
      setAttempt({ ...r, error: e });
    }
  };

  return (
    <div className="stack pop-in">
      <div className="review-term">
        <En className="term big">{v.term}</En>
        <SpeakButton text={v.term} />
      </div>
      {phase === 'recognize' && (
        <>
          <h3>מה הפירוש?</h3>
          <div className="options">
            {options.map((o, k) => (
              <button key={k} className={`option ${picked === k ? (o === v.he ? 'right' : 'wrong') : ''} ${picked !== null && o === v.he ? 'right' : ''}`} disabled={picked !== null} onClick={() => setPicked(k)}>
                {o}
              </button>
            ))}
          </div>
          {picked !== null && (
            <>
              {v.example && (
                <div className="example card soft">
                  <En block>{v.example}</En>
                  <SpeakButton text={v.example} small />
                </div>
              )}
              {recognized ? (
                <button className="btn btn-primary btn-big" onClick={() => setPhase('produce')}>עכשיו במשפט משלך ←</button>
              ) : (
                <>
                  <Notice kind="warn" icon="🔁">הפירוש הנכון: <strong>{v.he}</strong>. הביטוי יחזור בקרוב.</Notice>
                  <button className="btn btn-primary btn-big" disabled={saving} onClick={() => submit(false)}>הבא</button>
                </>
              )}
            </>
          )}
        </>
      )}
      {phase === 'produce' && (
        <>
          <h3>אמרו משפט חדש משלכם עם <En>{v.term}</En></h3>
          <p className="muted">לא לחזור על הדוגמה – לבנות משפט על החיים שלכם.</p>
          {!attempt && <Recorder onResult={evaluate} />}
          {attempt?.loading && <Spinner label="בודקים…" />}
          {attempt?.error && <ErrorBox error={attempt.error} onRetry={() => evaluate(attempt)} />}
          {attempt?.eval && (
            <FeedbackCard
              said={attempt.transcript}
              fb={attempt.eval.feedback}
              demo={attempt.eval.demo}
              onRetry={attempt.ok ? null : () => setAttempt(null)}
              extra={<p className={attempt.ok ? 'success-text' : 'warn-text'}>{attempt.ok ? '✓ שימוש נכון בביטוי!' : `נסו שוב – שלבו את "${v.term}" במשפט שלם.`}</p>}
            />
          )}
          <div className="row gap wrap">
            {attempt?.eval && (
              <button className="btn btn-primary grow" disabled={saving} onClick={() => submit(!!attempt.ok)}>הבא</button>
            )}
            {!attempt?.eval && (
              <button className="link-btn" onClick={() => submit(false)}>דילוג (הביטוי יחזור מחר)</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
