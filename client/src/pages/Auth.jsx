import React, { useState } from 'react';
import { api } from '../api.js';
import { useApp, navigate } from '../ctx.js';
import { ErrorBox, Notice, En } from '../components/ui.jsx';

export default function AuthPage({ route }) {
  const mode = { register: 'register', forgot: 'forgot', reset: 'reset' }[route.parts[0]] || 'login';
  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="hero-emoji" aria-hidden="true">🗣️</div>
        <h1>מדברים אנגלית. בביטחון.</h1>
        <p className="lead">מורה AI שמדבר איתך, הבנת הנשמע ואוצר מילים אישי – מסלול שמתחיל בדיוק ברמה שלך.</p>
        <ul className="hero-points">
          <li>🎙️ שיחות קוליות במצבים אמיתיים: מסעדה, טיול, עבודה</li>
          <li>👂 האזנה מדורגת עם האטה, תמלול ותרגום</li>
          <li>📚 מילים שנלמדות מתוך מה שמעניין אותך</li>
        </ul>
        <En block className="hero-en">“Speak first. Perfect later.”</En>
      </section>
      <section className="auth-card card">
        {mode === 'login' && <Login />}
        {mode === 'register' && <Register />}
        {mode === 'forgot' && <Forgot />}
        {mode === 'reset' && <Reset token={route.query.token} />}
      </section>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

function Login() {
  const { setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, submit } = useSubmit(async () => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    navigate('/');
    setUser(r.user);
  });
  return (
    <form onSubmit={submit} className="stack">
      <h2>כניסה</h2>
      <Field label="אימייל" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Field label="סיסמה" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <ErrorBox error={error} />
      <button className="btn btn-primary btn-big" disabled={busy}>{busy ? 'נכנסים…' : 'כניסה'}</button>
      <div className="row between wrap">
        <a href="#/forgot">שכחתי סיסמה</a>
        <a href="#/register">אין לי חשבון – הרשמה</a>
      </div>
    </form>
  );
}

function Register() {
  const { setUser } = useApp();
  const [f, setF] = useState({ username: '', email: '', password: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, error, submit } = useSubmit(async () => {
    const r = await api('/auth/register', { method: 'POST', body: f });
    navigate('/onboarding');
    setUser(r.user);
  });
  return (
    <form onSubmit={submit} className="stack">
      <h2>פתיחת חשבון</h2>
      <Field label="שם משתמש (איך נקרא לך)" value={f.username} onChange={set('username')} autoComplete="nickname" required minLength={2} maxLength={30} />
      <Field label="אימייל" type="email" dir="ltr" autoComplete="email" value={f.email} onChange={set('email')} required />
      <Field label="סיסמה (לפחות 8 תווים)" type="password" dir="ltr" autoComplete="new-password" value={f.password} onChange={set('password')} required minLength={8} />
      <ErrorBox error={error} />
      <button className="btn btn-primary btn-big" disabled={busy}>{busy ? 'יוצרים חשבון…' : 'יוצאים לדרך'}</button>
      <p className="tiny muted">הסיסמה נשמרת מוצפנת (scrypt). המידע שלך גלוי רק לך.</p>
      <a href="#/login">כבר יש לי חשבון – כניסה</a>
    </form>
  );
}

function Forgot() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(null);
  const { busy, error, submit } = useSubmit(async () => {
    setDone(await api('/auth/forgot', { method: 'POST', body: { email } }));
  });
  return (
    <form onSubmit={submit} className="stack">
      <h2>איפוס סיסמה</h2>
      {done ? (
        <>
          <Notice kind="success" icon="📬">{done.message}</Notice>
          {done.devResetLink && (
            <Notice kind="warn" icon="🧪">
              מצב פיתוח – לא הוגדר שרת דואר, לכן הקישור מוצג כאן במקום להישלח במייל:{' '}
              <a href={done.devResetLink.slice(done.devResetLink.indexOf('#'))}>לאיפוס הסיסמה</a>
            </Notice>
          )}
        </>
      ) : (
        <>
          <p>הזינו את האימייל שאיתו נרשמתם, ונשלח קישור לבחירת סיסמה חדשה.</p>
          <Field label="אימייל" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <ErrorBox error={error} />
          <button className="btn btn-primary btn-big" disabled={busy}>{busy ? 'שולחים…' : 'שליחת קישור'}</button>
        </>
      )}
      <a href="#/login">חזרה לכניסה</a>
    </form>
  );
}

function Reset({ token }) {
  const { setUser } = useApp();
  const [password, setPassword] = useState('');
  const { busy, error, submit } = useSubmit(async () => {
    await api('/auth/reset', { method: 'POST', body: { token, password } });
    const me = await api('/auth/me');
    navigate('/');
    setUser(me.user);
  });
  return (
    <form onSubmit={submit} className="stack">
      <h2>בחירת סיסמה חדשה</h2>
      <Field label="סיסמה חדשה (לפחות 8 תווים)" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      <ErrorBox error={error} />
      <button className="btn btn-primary btn-big" disabled={busy || !token}>{busy ? 'שומרים…' : 'שמירה וכניסה'}</button>
      {!token && <Notice kind="warn">חסר קוד איפוס בקישור. בקשו קישור חדש.</Notice>}
    </form>
  );
}
