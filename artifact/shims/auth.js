// אימות מקומי לגרסת הניסיון: החשבונות נשמרים במסד הנתונים שבדפדפן הזה בלבד.
import { db, now, parseUser } from '../../server/db.js';

const SKEY = 'english-coach-trial-uid';
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(pw, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${hex(salt)}$${hex(bits)}`;
}
async function verify(pw, stored) {
  const [, salt] = String(stored).split('$');
  return (await hashPassword(pw, salt)) === stored;
}
const getSession = () => { try { return Number(localStorage.getItem(SKEY)) || null; } catch { return null; } };
const setSession = (id) => { try { id ? localStorage.setItem(SKEY, String(id)) : localStorage.removeItem(SKEY); } catch {} };
globalThis.__trialClearSession = () => setSession(null);

export function loadUser(req, _res, next) {
  const id = getSession();
  if (id) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (row) req.user = parseUser(row);
  }
  next();
}
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'יש להתחבר כדי להמשיך' });
  next();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function authRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    const { email = '', password = '', username = '' } = req.body || {};
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'כתובת האימייל לא תקינה' });
    if (username.trim().length < 2) return res.status(400).json({ error: 'שם משתמש: לפחות 2 תווים' });
    if (password.length < 8) return res.status(400).json({ error: 'הסיסמה צריכה להכיל לפחות 8 תווים' });
    if (db.prepare('SELECT 1 FROM users WHERE email = ? OR username = ?').get(email.trim(), username.trim()))
      return res.status(409).json({ error: 'האימייל או שם המשתמש כבר בשימוש במכשיר הזה' });
    const info = db.prepare('INSERT INTO users (email, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(email.trim(), username.trim(), await hashPassword(password), now());
    setSession(info.lastInsertRowid);
    res.json({ user: parseUser(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)) });
  });
  app.post('/api/auth/login', async (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
    if (!row || !(await verify(password, row.password_hash))) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    setSession(row.id);
    res.json({ user: parseUser(row) });
  });
  app.post('/api/auth/logout', (_req, res) => { setSession(null); res.json({ ok: true }); });
  app.get('/api/auth/me', (req, res) => res.json({ user: req.user || null }));
  app.post('/api/auth/forgot', (_req, res) =>
    res.json({ ok: true, message: 'בגרסת הניסיון אין שליחת מיילים: החשבונות שמורים רק בדפדפן הזה. אפשר פשוט לפתוח חשבון חדש.' })
  );
  app.post('/api/auth/reset', (_req, res) => res.status(400).json({ error: 'לא זמין בגרסת הניסיון' }));
}
