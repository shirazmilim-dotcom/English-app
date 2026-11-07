import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { db, now, DAY, parseUser } from './db.js';
import { sendResetEmail, emailEnabled } from './mailer.js';

const scrypt = promisify(crypto.scrypt);
const SESSION_DAYS = 30;
export const COOKIE = 'sid';
const IS_PROD = process.env.NODE_ENV === 'production';

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(pw, stored) {
  const [alg, saltHex, keyHex] = String(stored).split('$');
  if (alg !== 'scrypt') return false;
  const key = await scrypt(pw, Buffer.from(saltHex, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(keyHex, 'hex');
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, now() + SESSION_DAYS * DAY);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: SESSION_DAYS * DAY, path: '/' });
}

export function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    const row = db
      .prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
      .get(sha256(token), now());
    if (row) req.user = parseUser(row);
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'יש להתחבר כדי להמשיך' });
  next();
}

// הגבלת קצב פשוטה לניסיונות התחברות/איפוס (בזיכרון)
const attempts = new Map();
function rateLimited(key, max = 10, windowMs = 15 * 60 * 1000) {
  const t = now();
  const list = (attempts.get(key) || []).filter((x) => t - x < windowMs);
  list.push(t);
  attempts.set(key, list);
  return list.length > max;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[\p{L}\p{N}_.\- ]{2,30}$/u;

export function authRoutes(app) {
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, username } = req.body || {};
    if (rateLimited(`reg:${req.ip}`, 20)) return res.status(429).json({ error: 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.' });
    if (!EMAIL_RE.test(String(email || ''))) return res.status(400).json({ error: 'כתובת האימייל לא תקינה' });
    if (!USERNAME_RE.test(String(username || '').trim())) return res.status(400).json({ error: 'שם משתמש: 2–30 תווים (אותיות, מספרים, רווח, נקודה או קו)' });
    if (String(password || '').length < 8) return res.status(400).json({ error: 'הסיסמה צריכה להכיל לפחות 8 תווים' });
    const exists = db.prepare('SELECT email, username FROM users WHERE email = ? OR username = ?').get(email.trim(), username.trim());
    if (exists) {
      const field = exists.email.toLowerCase() === email.trim().toLowerCase() ? 'האימייל' : 'שם המשתמש';
      return res.status(409).json({ error: `${field} כבר בשימוש` });
    }
    const hash = await hashPassword(password);
    const info = db
      .prepare('INSERT INTO users (email, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(email.trim(), username.trim(), hash, now());
    createSession(res, Number(info.lastInsertRowid));
    res.json({ user: parseUser(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)) });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (rateLimited(`login:${req.ip}`) || rateLimited(`login:${String(email).toLowerCase()}`))
      return res.status(429).json({ error: 'יותר מדי ניסיונות התחברות. נסו שוב בעוד 15 דקות.' });
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim());
    if (!row || !(await verifyPassword(String(password || ''), row.password_hash)))
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
    createSession(res, row.id);
    res.json({ user: parseUser(row) });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = req.cookies?.[COOKIE];
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => res.json({ user: req.user || null }));

  app.post('/api/auth/forgot', async (req, res) => {
    const email = String(req.body?.email || '').trim();
    if (rateLimited(`forgot:${req.ip}`, 5)) return res.status(429).json({ error: 'יותר מדי בקשות. נסו שוב מאוחר יותר.' });
    const row = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
    const generic = { ok: true, message: 'אם הכתובת רשומה אצלנו, נשלח אליה קישור לאיפוס הסיסמה (בתוקף לשעה).' };
    if (!row) return res.json(generic);
    const token = crypto.randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), row.id, now() + 60 * 60 * 1000);
    const base = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const link = `${base}/#/reset?token=${token}`;
    if (emailEnabled()) {
      try {
        await sendResetEmail(row.email, link);
      } catch (e) {
        console.error('[mail] failed to send reset email:', e.message);
      }
      return res.json(generic);
    }
    // אין שרת דואר מוגדר: בסביבת פיתוח מחזירים את הקישור ישירות (מסומן בבירור), ובייצור – רק ללוג השרת.
    console.log(`[mail:dev] password reset link for ${row.email}: ${link}`);
    if (!IS_PROD) return res.json({ ...generic, devResetLink: link });
    return res.json(generic);
  });

  app.post('/api/auth/reset', async (req, res) => {
    const { token, password } = req.body || {};
    if (String(password || '').length < 8) return res.status(400).json({ error: 'הסיסמה צריכה להכיל לפחות 8 תווים' });
    const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(String(token || '')));
    if (!row || row.used || row.expires_at < now()) return res.status(400).json({ error: 'הקישור לא תקף או שפג תוקפו. בקשו קישור חדש.' });
    db.prepare('UPDATE password_resets SET used = 1 WHERE token_hash = ?').run(row.token_hash);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), row.user_id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.user_id); // ניתוק כל המכשירים
    createSession(res, row.user_id);
    res.json({ ok: true });
  });
}
