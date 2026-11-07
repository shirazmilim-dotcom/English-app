import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Spinner, ErrorBox, ProgressBar, Notice } from '../components/ui.jsx';

const KIND = { initial: 'אבחון ראשוני', checkpoint: 'אבחון ביניים', skipped: 'התחלה ללא אבחון' };

export default function Progress() {
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const load = () => {
    setError(null);
    api('/progress').then(setD).catch(setError);
  };
  useEffect(load, []);
  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!d) return <Spinner />;

  const maxMin = Math.max(d.dailyGoal, ...d.last14.map((x) => x.minutes));
  const stage = d.currentStage;
  const stageLessons = stage.units.flatMap((u) => u.lessons);
  const lastCheck = [...d.assessments].reverse().find((a) => a.kind !== 'skipped');

  return (
    <div className="stack">
      <h1>ההתקדמות שלי 📈</h1>

      <section className="journey card">
        <div className="journey-step">
          <span className="label">התחלתי</span>
          <span className="level-badge">{d.startLevel}</span>
        </div>
        <span className="journey-arrow" aria-hidden="true">←</span>
        <div className="journey-step current">
          <span className="label">אני עכשיו</span>
          <span className="level-badge big">{stage.id}</span>
          <span className="tiny">{stage.title}</span>
        </div>
        <span className="journey-arrow" aria-hidden="true">←</span>
        <div className="journey-step">
          <span className="label">הצעד הבא</span>
          <span className="tiny strong">{d.next ? d.next.titleHe : 'סיימת את המסלול הזמין 🎉'}</span>
        </div>
      </section>
      <div className="card soft">
        <div className="row between">
          <span>שיעורים בשלב {stage.id}</span>
          <strong>{stageLessons.filter((l) => l.passed).length}/{stageLessons.length}</strong>
        </div>
        <ProgressBar value={stageLessons.filter((l) => l.passed).length} max={stageLessons.length} />
        <p className="tiny muted">אבן הדרך של השלב: {stage.milestone.achieved ? 'הושגה ✓' : stage.milestone.unlocked ? 'פתוחה – לשיחה!' : 'תיפתח אחרי כל השיעורים'}</p>
      </div>

      <h2>לפי מיומנות</h2>
      <div className="skills-grid">
        <div className="skill-tile">
          <span className="skill-icon" aria-hidden="true">🎙️</span>
          <div className="skill-name">דיבור</div>
          <div className="skill-level">{d.speaking.minutes} <small>דק׳</small></div>
          <div className="tiny muted">דיבור בפועל (זמן הקלטה)</div>
          <div className="tiny">{d.speaking.tasks.achieved}/{d.speaking.tasks.total} משימות דיבור הושגו</div>
          <div className="tiny">{d.speaking.conversations.count} שיחות · {d.speaking.conversations.goals} מטרות שיחה הושגו</div>
        </div>
        <div className="skill-tile">
          <span className="skill-icon" aria-hidden="true">👂</span>
          <div className="skill-name">הבנת הנשמע</div>
          <div className="skill-level">{d.listening.correct}/{d.listening.total}</div>
          <div className="tiny muted">תשובות נכונות בניסיון ראשון</div>
        </div>
        <div className="skill-tile">
          <span className="skill-icon" aria-hidden="true">📚</span>
          <div className="skill-name">אוצר מילים</div>
          <div className="skill-level">{d.vocab.known}<small>/{d.vocab.total}</small></div>
          <div className="tiny muted">ביטויים "שלי": זוהו שוב ושוב ושומשו במשפט</div>
          <div className="tiny">{d.vocab.usedInSentence} שומשו במשפט משלך</div>
        </div>
      </div>
      <p className="tiny muted">כל המספרים כאן נמדדים ישירות מהתרגול שלך. אין כאן "אחוזי שליטה" או ציון הגייה – אלה דורשים מדידה שאיננה קיימת עדיין.</p>

      <section className="card">
        <h3>זמן תרגול – 14 ימים אחרונים</h3>
        <div className="bars" role="img" aria-label="דקות תרגול ביום">
          {d.last14.map((x) => (
            <div key={x.day} className="bar-col" title={`${x.day}: ${x.minutes} דק׳`}>
              <div className={`bar ${x.minutes >= d.dailyGoal ? 'met' : ''}`} style={{ height: `${maxMin ? (x.minutes / maxMin) * 100 : 0}%` }} />
              <span className="bar-label">{Number(x.day.slice(-2))}</span>
            </div>
          ))}
        </div>
        <p className="tiny muted">🔥 {d.streak} ימים ברצף · מטרה יומית: {d.dailyGoal} דק׳ · {d.lessonsPassed} שיעורים הושלמו</p>
      </section>

      <section className="card">
        <h3>✅ יכולות שכבר רכשתי</h3>
        {d.canDos.length ? (
          <ul className="can-dos">{d.canDos.map((c) => <li key={c.text}><span className="level-badge small">{c.stage}</span> {c.text}</li>)}</ul>
        ) : (
          <p className="muted">כאן יופיעו יכולות מעשיות שהוכחת בשיעורים – למשל "אני יכול/ה להזמין במסעדה".</p>
        )}
      </section>

      <section className="card">
        <h3>💪 כדאי לחזק</h3>
        {d.weak.length ? (
          <ul className="weak-list">
            {d.weak.map((w) => (
              <li key={w.tag}>
                <span>{w.label_he}{w.count > 1 && <span className="tiny muted"> · {w.count} פעמים</span>}</span>
                {w.ref ? <a href={`#/lesson/${w.ref}`} className="btn btn-small btn-ghost">לתרגל</a> : <a href="#/words/review" className="btn btn-small btn-ghost">לחזור</a>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">אין כרגע נושאים פתוחים לחיזוק. 👏</p>
        )}
      </section>

      <section className="card">
        <h3>🧭 אבחונים לאורך זמן</h3>
        <ul className="assess-list">
          {d.assessments.map((a, i) => (
            <li key={i}>
              <span className="level-badge small">{a.level}</span> {KIND[a.kind] || a.kind}
              <span className="tiny muted"> · {new Date(a.createdAt).toLocaleDateString('he-IL')}</span>
              {a.details?.skills && (
                <span className="tiny muted">
                  {' '}· האזנה {a.details.skills.listening?.level || '—'} · מילים {a.details.skills.vocab?.level || '—'} · דיבור {a.details.skills.speaking?.level || 'לא נבדק'}
                </span>
              )}
            </li>
          ))}
        </ul>
        <Notice kind="muted" icon="ℹ️">אבחון ביניים קצר (כ־4 דקות) עוזר לראות שיפור לאורך זמן. {lastCheck && Date.now() - lastCheck.createdAt < 7 * 864e5 && 'מומלץ לחכות לפחות שבוע בין אבחונים.'}</Notice>
        <a href="#/checkpoint" className="btn btn-primary">לאבחון ביניים</a>
      </section>
    </div>
  );
}
