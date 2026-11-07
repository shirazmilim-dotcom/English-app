import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'app.db');
if (DB_PATH !== ':memory:') fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  onboarded INTEGER NOT NULL DEFAULT 0,
  start_level TEXT,
  level TEXT NOT NULL DEFAULT 'A1',
  goals TEXT NOT NULL DEFAULT '[]',
  interests TEXT NOT NULL DEFAULT '[]',
  daily_minutes INTEGER NOT NULL DEFAULT 15,
  settings TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  level TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  passed INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_result TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS milestones (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  achieved_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, stage_id)
);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref TEXT,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  speaking_seconds REAL NOT NULL DEFAULT 0,
  duration_seconds REAL NOT NULL DEFAULT 0,
  meta TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id, created_at);
CREATE TABLE IF NOT EXISTS vocab (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  he TEXT NOT NULL,
  example TEXT,
  source TEXT,
  box INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  used_in_sentence INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, term)
);
CREATE TABLE IF NOT EXISTS weak_points (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  label_he TEXT NOT NULL,
  ref TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  resolved INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, tag)
);
`);

export const now = () => Date.now();
export const DAY = 24 * 60 * 60 * 1000;

export function parseUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    onboarded: !!row.onboarded,
    startLevel: row.start_level,
    level: row.level,
    goals: JSON.parse(row.goals),
    interests: JSON.parse(row.interests),
    dailyMinutes: row.daily_minutes,
    settings: { feedbackMode: 'guided', showTranscript: true, showTranslation: false, ...JSON.parse(row.settings) },
    createdAt: row.created_at,
  };
}

export function logActivity(userId, a) {
  db.prepare(
    `INSERT INTO activity (user_id, kind, ref, correct, total, speaking_seconds, duration_seconds, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    a.kind,
    a.ref ?? null,
    a.correct ?? 0,
    a.total ?? 0,
    clampNum(a.speakingSeconds, 0, 3600),
    clampNum(a.durationSeconds, 0, 4 * 3600),
    a.meta ? JSON.stringify(a.meta) : null,
    now()
  );
}

export function addWeakPoint(userId, tag, labelHe, ref) {
  db.prepare(
    `INSERT INTO weak_points (user_id, tag, label_he, ref, count, resolved, updated_at) VALUES (?, ?, ?, ?, 1, 0, ?)
     ON CONFLICT(user_id, tag) DO UPDATE SET count = count + 1, resolved = 0, updated_at = excluded.updated_at, label_he = excluded.label_he`
  ).run(userId, tag, labelHe, ref ?? null, now());
}

export function resolveWeakPoint(userId, tag) {
  db.prepare('UPDATE weak_points SET resolved = 1, updated_at = ? WHERE user_id = ? AND tag = ?').run(now(), userId, tag);
}

export function clampNum(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
