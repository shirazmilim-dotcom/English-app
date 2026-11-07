import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../ctx.js';
import { Spinner, ErrorBox, En, Notice } from '../components/ui.jsx';

export default function TalkList() {
  const { config } = useApp();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const load = () => {
    setError(null);
    api('/tutor/scenarios').then((r) => setList(r.scenarios)).catch(setError);
  };
  useEffect(load, []);
  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!list) return <Spinner />;
  return (
    <div className="stack">
      <header>
        <h1>מתרגלים שיחה 💬</h1>
        <p className="muted">בחרו מצב, דברו עם המורה בקול – והוא יגיב ויתקדם לפי מה שאמרתם. אפשר לבקש רמז, הסבר בעברית או דיבור איטי יותר בכל רגע.</p>
      </header>
      {!config.ai && (
        <Notice kind="warn" icon="🧪">
          מצב הדגמה: השיחות מתנהלות לפי תסריט קבוע, והמשוב מבוסס כללים פשוטים. כדי שהמורה יגיב באופן טבעי למה שאמרתם, צריך לחבר מפתח Claude (ראו הגדרות).
        </Notice>
      )}
      <div className="scenario-grid">
        {list.map((s) => (
          <a key={s.id} href={`#/talk/${s.id}`} className="scenario-card">
            <span className="scenario-emoji" aria-hidden="true">{s.emoji}</span>
            <div className="grow">
              <div className="row between">
                <strong>{s.titleHe}</strong>
                <span className="level-badge small">{s.level}</span>
              </div>
              <En className="tiny muted">{s.titleEn}</En>
              <p className="tiny">{s.goalHe}</p>
              {s.milestoneStage && (
                <span className={`badge ${s.milestoneAchieved ? 'badge-ok' : ''}`}>🏁 אבן דרך לשלב {s.milestoneStage}{s.milestoneAchieved ? ' ✓' : ''}</span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
