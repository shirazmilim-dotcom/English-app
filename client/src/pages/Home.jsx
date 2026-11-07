import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../ctx.js';
import { Spinner, ErrorBox, ProgressBar, En } from '../components/ui.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export default function Home() {
  const { user } = useApp();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const load = () => {
    setError(null);
    api('/home').then(setD).catch(setError);
  };
  useEffect(load, []);
  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!d) return <Spinner />;

  const goalPct = Math.min(100, Math.round((d.todayMinutes / d.dailyGoal) * 100));
  const nextHref = d.next ? (d.next.type === 'lesson' ? `#/lesson/${d.next.id}` : `#/talk/${d.next.scenarioId}?milestone=1`) : '#/path';

  return (
    <div className="stack home">
      <section className="hello">
        <div>
          <h1>{greeting()}, {user.username} 👋</h1>
          <p className="muted">
            שלב {d.stage.id} · {d.stage.title} · {d.stage.done}/{d.stage.total} שיעורים
          </p>
        </div>
        <div className="streak" title="ימים רצופים עם תרגול">
          <span aria-hidden="true">🔥</span>
          <strong>{d.streak}</strong>
          <span className="tiny">ימים ברצף</span>
        </div>
      </section>

      <div className="daily card soft">
        <div className="row between">
          <span>המטרה היומית: {d.dailyGoal} דק׳</span>
          <strong>{d.todayMinutes} דק׳ היום</strong>
        </div>
        <ProgressBar value={goalPct} label="התקדמות במטרה היומית" />
        {goalPct >= 100 && <p className="tiny success-text">🎉 עמדת במטרה היומית!</p>}
      </div>

      <a href={nextHref} className="action-card primary">
        <span className="action-icon" aria-hidden="true">▶️</span>
        <div className="grow">
          <div className="action-title">ממשיכים ללמוד</div>
          {d.next ? (
            <div className="action-sub">
              {d.next.titleHe} · <En>{d.next.title}</En>
            </div>
          ) : (
            <div className="action-sub">סיימת את כל השיעורים הזמינים – אפשר לחזור ולתרגל במסלול</div>
          )}
        </div>
        <span className="chev" aria-hidden="true">‹</span>
      </a>

      <div className="action-grid">
        <a href="#/talk" className="action-card talk">
          <span className="action-icon" aria-hidden="true">💬</span>
          <div className="action-title">מתרגלים שיחה</div>
          <div className="action-sub">מורה AI שמדבר איתך במצבים אמיתיים</div>
        </a>
        <a href={d.vocab.due ? '#/words/review' : '#/words'} className="action-card words">
          <span className="action-icon" aria-hidden="true">📚</span>
          <div className="action-title">המילים שלי</div>
          <div className="action-sub">{d.vocab.due ? `${d.vocab.due} מילים מחכות לחזרה` : `${d.vocab.total} ביטויים במאגר`}</div>
          {d.vocab.due > 0 && <span className="pill-count">{d.vocab.due}</span>}
        </a>
      </div>

      {d.stage.milestone.unlocked && !d.stage.milestone.achieved && (
        <a href={`#/talk/${d.stage.milestone.scenarioId}?milestone=1`} className="milestone-cta">
          🏁 אבן הדרך של שלב {d.stage.id} פתוחה! שיחה אחת מוצלחת ותעבור/י לשלב הבא.
        </a>
      )}

      {d.weak.length > 0 && (
        <section className="card">
          <h3>💪 שווה לחזק</h3>
          <ul className="weak-list">
            {d.weak.map((w) => (
              <li key={w.tag}>
                <span>{w.label_he}</span>
                {w.ref ? <a href={`#/lesson/${w.ref}`} className="btn btn-small btn-ghost">לתרגל</a> : <a href="#/words/review" className="btn btn-small btn-ghost">לחזור</a>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
