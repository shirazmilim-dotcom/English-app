import React, { useState } from 'react';
import { api } from '../api.js';
import { useApp, navigate } from '../ctx.js';
import { ErrorBox, Notice } from '../components/ui.jsx';

const INTERESTS = [
  ['travel', '✈️ טיולים'], ['food', '🍜 אוכל'], ['relationships', '💞 זוגיות ויחסים'], ['music', '🎵 מוזיקה'],
  ['business', '📈 עסקים'], ['social', '📱 רשתות חברתיות'], ['content', '🎬 יצירת תוכן'], ['daily', '🏡 חיי היום־יום'],
];

export default function Settings() {
  const { user, setUser, config } = useApp();
  const [f, setF] = useState({ username: user.username, interests: user.interests, dailyMinutes: user.dailyMinutes, settings: user.settings });
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const save = async () => {
    setError(null);
    try {
      const r = await api('/profile', { method: 'PUT', body: f });
      setUser(r.user);
      setMsg('נשמר ✓');
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setError(e);
    }
  };
  const toggleInterest = (id) => setF({ ...f, interests: f.interests.includes(id) ? f.interests.filter((x) => x !== id) : [...f.interests, id] });
  const setS = (k, v) => setF({ ...f, settings: { ...f.settings, [k]: v } });
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    navigate('/login');
    setUser(null);
  };
  const del = async () => {
    if (!confirm('למחוק את החשבון וכל ההתקדמות? אי אפשר לבטל את הפעולה.')) return;
    await api('/profile', { method: 'DELETE' });
    navigate('/login');
    setUser(null);
  };

  return (
    <div className="stack">
      <h1>פרופיל והגדרות</h1>
      <section className="card stack-s">
        <h3>פרופיל</h3>
        <label className="field"><span>שם משתמש</span><input className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></label>
        <div className="tiny muted" dir="ltr">{user.email}</div>
        <div className="row gap-s">רמה נוכחית במסלול: <span className="level-badge small">{user.level}</span></div>
      </section>
      <section className="card stack-s">
        <h3>תחומי עניין</h3>
        <div className="chips">
          {INTERESTS.map(([id, he]) => (
            <button key={id} className={`chip ${f.interests.includes(id) ? 'on' : ''}`} aria-pressed={f.interests.includes(id)} onClick={() => toggleInterest(id)}>{he}</button>
          ))}
        </div>
        <label className="field">
          <span>מטרה יומית (דקות)</span>
          <select className="input" value={f.dailyMinutes} onChange={(e) => setF({ ...f, dailyMinutes: Number(e.target.value) })}>
            {[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </section>
      <section className="card stack-s">
        <h3>שיחה עם המורה</h3>
        <div className="seg" role="group" aria-label="מצב משוב ברירת מחדל">
          <button className={f.settings.feedbackMode === 'guided' ? 'on' : ''} onClick={() => setS('feedbackMode', 'guided')}>תרגול מודרך</button>
          <button className={f.settings.feedbackMode === 'flow' ? 'on' : ''} onClick={() => setS('feedbackMode', 'flow')}>שיחה זורמת</button>
        </div>
        <p className="tiny muted">מודרך: משוב אחרי כל תשובה. זורמת: בלי הפרעות, משוב מרוכז בסוף.</p>
        <label className="toggle"><input type="checkbox" checked={f.settings.showTranscript} onChange={(e) => setS('showTranscript', e.target.checked)} /> להציג תמלול של המורה כברירת מחדל</label>
        <label className="toggle"><input type="checkbox" checked={f.settings.showTranslation} onChange={(e) => setS('showTranslation', e.target.checked)} /> להציג תרגום לעברית כברירת מחדל</label>
      </section>
      <ErrorBox error={error} />
      <button className="btn btn-primary btn-big" onClick={save}>{msg || 'שמירה'}</button>

      <section className="card stack-s">
        <h3>🔒 פרטיות והקלטות</h3>
        <ul className="bullets">
          <li>הקלטות קול <strong>לא נשמרות</strong>: הן נשארות בזיכרון הדפדפן להשמעה חוזרת ונמחקות עם סגירת הדף.</li>
          <li>{config.stt === 'server' ? 'התמלול מתבצע בשרת דרך שירות תמלול חיצוני; האודיו לא נשמר בשרת.' : 'זיהוי הדיבור מתבצע על ידי שירות הדיבור של הדפדפן (בכרום – שרתי Google, בספארי – Apple).'}</li>
          <li>נשמרים: טקסט התשובות לצורך משוב, תוצאות תרגול ומילים – גלויים רק לך.</li>
        </ul>
      </section>
      <section className="card stack-s">
        <h3>⚙️ שירותים מחוברים</h3>
        <ul className="status-list">
          <li>{config.ai ? '🟢' : '🟡'} מורה AI ומשוב: {config.ai ? 'Claude מחובר' : 'מצב הדגמה – שיחות כתובות מראש ומשוב מבוסס כללים (לא AI)'}</li>
          <li>{config.tts === 'server' ? '🟢' : '🟡'} הקראה: {config.tts === 'server' ? 'קול איכותי מהשרת' : 'קול מובנה של הדפדפן (איכות משתנה בין מכשירים)'}</li>
          <li>{config.stt === 'server' ? '🟢' : '🟡'} זיהוי דיבור: {config.stt === 'server' ? 'תמלול בשרת' : 'זיהוי דיבור של הדפדפן (Chrome / Edge / Safari)'}</li>
          <li>⚪ הערכת הגייה: לא פעילה. הערכה אמינה דורשת ניתוח של האודיו עצמו, ולכן לא מוצג ציון הגייה.</li>
          <li>{config.email ? '🟢' : '🟡'} שליחת מיילים (איפוס סיסמה): {config.email ? 'מחובר' : 'לא הוגדר'}</li>
        </ul>
      </section>
      <div className="row gap wrap">
        <button className="btn btn-ghost grow" onClick={logout}>יציאה מהחשבון</button>
        <a className="btn btn-ghost grow" href="#/onboarding">עדכון מטרות / אבחון מחדש</a>
      </div>
      <button className="link-btn danger" onClick={del}>מחיקת החשבון</button>
    </div>
  );
}
