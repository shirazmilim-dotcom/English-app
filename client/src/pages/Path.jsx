import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Spinner, ErrorBox, En } from '../components/ui.jsx';

const STATUS = { complete: 'הושלם', current: 'בתהליך', locked: 'נעול', review: 'לחזרה (לפי האבחון)' };

export default function PathPage() {
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const load = () => {
    setError(null);
    api('/path').then(setP).catch(setError);
  };
  useEffect(load, []);
  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!p) return <Spinner />;
  return (
    <div className="stack">
      <header>
        <h1>המסלול שלי</h1>
        <p className="muted">
          התחלת בשלב {p.startLevel} · כעת בשלב {p.currentStage}. כל שלב מסתיים ב"אבן דרך" – שיחה שבה מוכיחים את היכולת.
        </p>
      </header>
      <ol className="path">
        {p.stages.map((s) => (
          <li key={s.id} className={`stage stage-${s.status} ${s.id === p.currentStage ? 'is-current' : ''}`}>
            <div className="stage-head">
              <span className="level-badge">{s.level}</span>
              <div className="grow">
                <h2>{s.title}</h2>
                <p className="muted tiny">{s.subtitle}</p>
              </div>
              <span className={`status status-${s.status}`}>{STATUS[s.status]}</span>
            </div>
            <div className="units">
              {s.units.map((u) => (
                <div key={u.id} className="unit">
                  <div className="unit-title">
                    <span aria-hidden="true">{u.done ? '✅' : '🎯'}</span> {u.title}
                  </div>
                  <p className="can-do">{u.canDo}</p>
                  {u.lessons.map((l) =>
                    l.unlocked ? (
                      <a key={l.id} href={`#/lesson/${l.id}`} className={`lesson-row ${l.passed ? 'passed' : ''}`}>
                        <span className="lesson-dot" aria-hidden="true">{l.passed ? '★' : '▶'}</span>
                        <span className="grow">
                          {l.titleHe} · <En>{l.title}</En>
                        </span>
                        <span className="tiny muted">{l.passed ? `${l.bestScore} נק׳ · חזרה` : l.attempts ? 'לנסות שוב' : 'התחלה'}</span>
                      </a>
                    ) : (
                      <div key={l.id} className="lesson-row locked" aria-disabled="true">
                        <span className="lesson-dot" aria-hidden="true">🔒</span>
                        <span className="grow">{l.titleHe}</span>
                      </div>
                    )
                  )}
                </div>
              ))}
              <div className={`milestone ${s.milestone.achieved ? 'done' : s.milestone.unlocked ? 'open' : ''}`}>
                <span aria-hidden="true">🏁</span>
                <div className="grow">
                  <strong>אבן דרך:</strong> שיחה מלאה בדיבור והשגת מטרת התרחיש
                </div>
                {s.milestone.achieved ? (
                  <span className="tiny">הושגה ✓</span>
                ) : s.milestone.unlocked ? (
                  <a className="btn btn-small btn-primary" href={`#/talk/${s.milestone.scenarioId}?milestone=1`}>לשיחה</a>
                ) : (
                  <span className="tiny muted">נפתחת אחרי כל השיעורים</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="tiny muted">רוצה לתרגל משהו אחר? אפשר תמיד לחזור על שיעורים שהושלמו ולתרגל שיחה חופשית במסך "שיחה".</p>
    </div>
  );
}
