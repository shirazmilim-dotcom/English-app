import React, { useCallback, useEffect, useState } from 'react';
import { AppCtx, useApp } from './ctx.js';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api } from './api.js';
import { setSpeechConfig } from './lib/speech.js';
import { Spinner, ErrorBox } from './components/ui.jsx';
import AuthPage from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import PathPage from './pages/Path.jsx';
import Lesson from './pages/Lesson.jsx';
import TalkList from './pages/TalkList.jsx';
import TalkChat from './pages/TalkChat.jsx';
import Words from './pages/Words.jsx';
import Review from './pages/Review.jsx';
import Progress from './pages/Progress.jsx';
import Settings from './pages/Settings.jsx';


function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || '/';
  const [p, q] = h.split('?');
  return { path: p, parts: p.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(q || '')) };
}

const NAV = [
  { to: '/', icon: '🏠', he: 'בית' },
  { to: '/path', icon: '🗺️', he: 'מסלול' },
  { to: '/talk', icon: '💬', he: 'שיחה' },
  { to: '/words', icon: '📚', he: 'המילים שלי' },
  { to: '/progress', icon: '📈', he: 'התקדמות' },
];

function Shell({ route, children }) {
  const { user, config } = useApp();
  const active = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
  return (
    <div className="shell">
      <header className="topbar">
        <a href="#/" className="brand" aria-label="מסך הבית">
          <span aria-hidden="true">🗣️</span> English Coach
        </a>
        <nav className="topnav" aria-label="ניווט ראשי">
          {NAV.map((n) => (
            <a key={n.to} href={`#${n.to}`} className={active(n.to) ? 'active' : ''} aria-current={active(n.to) ? 'page' : undefined}>
              {n.he}
            </a>
          ))}
        </nav>
        <a href="#/settings" className="avatar" aria-label="הגדרות ופרופיל" title="הגדרות ופרופיל">
          {user.username.slice(0, 1).toUpperCase()}
        </a>
      </header>
      {!config.ai && (
        <div className="demo-banner" role="note">
          <strong>מצב הדגמה:</strong> לא הוגדר מפתח AI, ולכן המורה משתמש בשיחות כתובות מראש ובמשוב מבוסס כללים פשוטים.{' '}
          <a href="#/settings">פרטים</a>
        </div>
      )}
      <main className="main">{children}</main>
      <nav className="bottomnav" aria-label="ניווט ראשי">
        {NAV.map((n) => (
          <a key={n.to} href={`#${n.to}`} className={active(n.to) ? 'active' : ''} aria-current={active(n.to) ? 'page' : undefined}>
            <span className="bn-icon" aria-hidden="true">{n.icon}</span>
            <span className="bn-label">{n.he}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(parseHash());
  const [user, setUser] = useState(undefined);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  const boot = useCallback(async () => {
    setError(null);
    try {
      const [c, me] = await Promise.all([api('/config'), api('/auth/me')]);
      setConfig(c);
      setSpeechConfig(c);
      setUser(me.user);
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => {
    boot();
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [boot]);

  if (error)
    return (
      <div className="center-page">
        <ErrorBox error={error} onRetry={boot} />
      </div>
    );
  if (user === undefined || !config)
    return (
      <div className="center-page">
        <Spinner />
      </div>
    );

  const ctx = { user, setUser, config, route };
  const offline = !online && <div className="offline-banner" role="status">אין חיבור לאינטרנט – חלק מהפעולות לא יעבדו עד שהחיבור יחזור.</div>;

  if (!user) {
    return (
      <AppCtx.Provider value={ctx}>
        {offline}
        <AuthPage route={route} />
      </AppCtx.Provider>
    );
  }
  if (!user.onboarded || route.parts[0] === 'onboarding') {
    return (
      <AppCtx.Provider value={ctx}>
        {offline}
        <Onboarding />
      </AppCtx.Provider>
    );
  }

  const [a, b] = route.parts;
  let page;
  if (!a) page = <Home />;
  else if (a === 'path') page = <PathPage />;
  else if (a === 'lesson' && b) page = <Lesson key={b + (route.query.r || '')} id={b} />;
  else if (a === 'talk' && b) page = <TalkChat key={b + (route.query.n || '')} id={b} />;
  else if (a === 'talk') page = <TalkList />;
  else if (a === 'words' && b === 'review') page = <Review />;
  else if (a === 'words') page = <Words />;
  else if (a === 'progress') page = <Progress />;
  else if (a === 'settings') page = <Settings />;
  else if (a === 'checkpoint') page = <Onboarding checkpoint />;
  else page = <Home />;

  if (a === 'checkpoint')
    return (
      <AppCtx.Provider value={ctx}>
        {offline}
        {page}
      </AppCtx.Provider>
    );

  return (
    <AppCtx.Provider value={ctx}>
      {offline}
      <Shell route={route}>{page}</Shell>
    </AppCtx.Provider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
