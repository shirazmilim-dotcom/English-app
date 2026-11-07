import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, now, DAY, parseUser, logActivity, addWeakPoint, resolveWeakPoint, clampNum } from './db.js';
import { authRoutes, loadUser, requireAuth } from './auth.js';
import { emailEnabled } from './mailer.js';
import { aiEnabled, tutorTurn, tutorAssist, evaluateSpeech, assessDiagnosticSpeaking } from './ai.js';
import { serverTtsEnabled, serverSttEnabled, synthesize, transcribe } from './speech.js';
import { STAGES, LESSONS, LEVELS, levelIndex, stageOfLesson } from './content/lessons.js';
import { SCENARIOS, scenarioById } from './content/scenarios.js';
import { DIAG_LISTENING, DIAG_VOCAB, DIAG_SPEAKING, GOALS, INTERESTS } from './content/diagnostic.js';
import { VOCAB_PACKS } from './content/vocabPacks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(loadUser);

// הגנת CSRF: כל בקשה משנה מצב חייבת להגיע מקוד האפליקציה (כותרת מותאמת שדפדפן לא שולח בטפסים חוצי־אתרים)
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'english-app') return res.status(403).json({ error: 'בקשה לא מורשית' });
  next();
});

authRoutes(app);

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error(e);
    const status = e?.status && e.status >= 400 && e.status < 600 ? 502 : 500;
    res.status(status).json({ error: 'משהו השתבש בשרת. נסו שוב בעוד רגע.', detail: process.env.NODE_ENV === 'production' ? undefined : String(e.message || e) });
  });

// גרסת ניסיון בדפדפן (ללא מיקרופון): תשובות מוקלדות נחשבות למעבר שיעור ואבן דרך
const TYPED_OK = () => process.env.TRIAL_TYPED_OK === '1';

const getUser = (id) => parseUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
const arr = (v, max = 50) => (Array.isArray(v) ? v.slice(0, max) : []);
const str = (v, max = 2000) => String(v ?? '').slice(0, max);

// ---------- תצורה ----------
app.get('/api/config', (_req, res) =>
  res.json({
    ai: aiEnabled(),
    tts: serverTtsEnabled() ? 'server' : 'browser',
    stt: serverSttEnabled() ? 'server' : 'browser',
    email: emailEnabled(),
    pronunciation: false,
  })
);

// ---------- פרופיל ----------
app.put('/api/profile', requireAuth, (req, res) => {
  const b = req.body || {};
  const u = req.user;
  const goals = b.goals ? arr(b.goals, 10).map((g) => str(g, 40)) : u.goals;
  const interests = b.interests ? arr(b.interests, 10).map((g) => str(g, 40)) : u.interests;
  const dailyMinutes = b.dailyMinutes ? clampNum(b.dailyMinutes, 5, 120) : u.dailyMinutes;
  const settings = { ...u.settings };
  if (b.settings) {
    if (['guided', 'flow'].includes(b.settings.feedbackMode)) settings.feedbackMode = b.settings.feedbackMode;
    for (const k of ['showTranscript', 'showTranslation']) if (k in b.settings) settings[k] = !!b.settings[k];
  }
  let username = u.username;
  if (b.username && b.username.trim() !== u.username) {
    username = str(b.username, 30).trim();
    if (username.length < 2) return res.status(400).json({ error: 'שם משתמש קצר מדי' });
    if (db.prepare('SELECT 1 FROM users WHERE username = ? AND id != ?').get(username, u.id)) return res.status(409).json({ error: 'שם המשתמש תפוס' });
  }
  db.prepare('UPDATE users SET goals = ?, interests = ?, daily_minutes = ?, settings = ?, username = ? WHERE id = ?').run(
    JSON.stringify(goals), JSON.stringify(interests), dailyMinutes, JSON.stringify(settings), username, u.id
  );
  res.json({ user: getUser(u.id) });
});

app.delete('/api/profile', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.clearCookie('sid', { path: '/' });
  res.json({ ok: true });
});

// ---------- אבחון ----------
const LEVEL_TEXT = {
  A1: { know: 'את/ה מכיר/ה מילים ומשפטים בסיסיים ויכול/ה להבין משפטים קצרים ופשוטים כשמדברים לאט.', focus: 'לבנות ביטחון במשפטים קצרים: להציג את עצמך, לבקש דברים פשוטים ולשאול שאלות.' },
  A2: { know: 'את/ה מסתדר/ת במצבים יומיומיים מוכרים – היכרות, קניות, הזמנה – ומבין/ה שיחות פשוטות.', focus: 'לספר על דברים שקרו (זמן עבר), לחבר משפטים ולהגיב מהר יותר בשיחה.' },
  B1: { know: 'את/ה יכול/ה לנהל שיחה על נושאים מוכרים, לספר חוויות ולהסתדר ברוב המצבים בטיול.', focus: 'להרחיב אוצר מילים, לנמק דעות ולהבין דיבור מהיר וטבעי יותר.' },
  B2: { know: 'את/ה מתקשר/ת בשטף סביר, מבין/ה את רוב הדיבור הטבעי ויכול/ה להביע ולנמק דעה.', focus: 'דיוק וניואנסים: ביטויים טבעיים, שפה מקצועית ושיחות מורכבות יותר.' },
  C1: { know: 'את/ה משתמש/ת באנגלית בגמישות, כולל ביטויים מורכבים ודיבור מהיר.', focus: 'ליטוש: ניסוחים אידיומטיים, שיחות מקצועיות מורכבות והבנת מבטאים שונים.' },
};

function estimateFromItems(answers, bank) {
  const byLevel = {};
  for (const a of answers) {
    const item = bank.find((i) => i.id === a.id);
    if (!item) continue;
    const r = (byLevel[item.level] ||= { c: 0, n: 0 });
    r.n++;
    if (Number(a.choice) === item.answer) r.c++;
  }
  let best = -1;
  for (const lv of LEVELS) {
    const r = byLevel[lv];
    if (r && r.c / r.n >= 0.5) best = Math.max(best, levelIndex(lv));
  }
  const total = Object.values(byLevel).reduce((s, r) => s + r.n, 0);
  const correct = Object.values(byLevel).reduce((s, r) => s + r.c, 0);
  return { level: total ? LEVELS[Math.max(0, best)] : null, correct, total };
}

app.get('/api/diagnostic', requireAuth, (_req, res) => {
  const strip = (b) => b.map(({ answer, ...rest }) => rest);
  res.json({ listening: strip(DIAG_LISTENING), vocab: strip(DIAG_VOCAB), speaking: DIAG_SPEAKING, goals: GOALS, interests: INTERESTS });
});

app.post('/api/diagnostic/check', requireAuth, (req, res) => {
  const { id, choice } = req.body || {};
  const item = [...DIAG_LISTENING, ...DIAG_VOCAB].find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'פריט לא נמצא' });
  res.json({ correct: Number(choice) === item.answer });
});

app.post('/api/diagnostic/complete', requireAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const u = req.user;
  const kind = b.kind === 'checkpoint' ? 'checkpoint' : 'initial';
  if (b.profile) {
    const p = b.profile;
    db.prepare('UPDATE users SET goals = ?, interests = ?, daily_minutes = ? WHERE id = ?').run(
      JSON.stringify(arr(p.goals, 10).map((g) => str(g, 40))),
      JSON.stringify(arr(p.interests, 10).map((g) => str(g, 40))),
      clampNum(p.dailyMinutes || 15, 5, 120),
      u.id
    );
  }
  if (b.skipped && kind === 'initial') {
    db.prepare("UPDATE users SET onboarded = 1, start_level = 'A1', level = 'A1' WHERE id = ?").run(u.id);
    db.prepare('INSERT INTO assessments (user_id, kind, level, details, created_at) VALUES (?, ?, ?, ?, ?)').run(u.id, 'skipped', 'A1', '{}', now());
    return res.json({ user: getUser(u.id), result: { level: 'A1', skipped: true } });
  }
  const listening = estimateFromItems(arr(b.listening, 20), DIAG_LISTENING);
  const vocab = estimateFromItems(arr(b.vocab, 20), DIAG_VOCAB);
  const spoken = arr(b.speaking, 5)
    .filter((s) => !s.typed)
    .map((s) => ({ ...DIAG_SPEAKING.find((d) => d.id === s.id), transcript: str(s.transcript, 2000), seconds: clampNum(s.seconds, 0, 300) }))
    .filter((s) => s.promptEn);
  let speaking = null;
  try {
    speaking = await assessDiagnosticSpeaking(spoken);
  } catch (e) {
    console.error('[diag] speaking assessment failed', e.message);
  }
  const parts = [];
  if (listening.level) parts.push({ w: 1, v: levelIndex(listening.level) });
  if (vocab.level) parts.push({ w: 1, v: levelIndex(vocab.level) });
  if (speaking?.level) parts.push({ w: 1.5, v: levelIndex(speaking.level) });
  const avg = parts.length ? parts.reduce((s, p) => s + p.w * p.v, 0) / parts.reduce((s, p) => s + p.w, 0) : 0;
  const level = LEVELS[Math.floor(avg + 0.25)]; // שמרני: מעגלים כלפי מטה אלא אם קרובים מאוד לרמה הבאה
  const pathLevel = LEVELS[Math.min(levelIndex(level), 3)];
  const speakingSeconds = spoken.reduce((s, x) => s + x.seconds, 0);
  const result = {
    level,
    pathLevel,
    skills: { listening, vocab, speaking: speaking ? { level: speaking.level, demo: speaking.demo } : null },
    knowHe: LEVEL_TEXT[level].know,
    focusHe: LEVEL_TEXT[level].focus,
    speakingStrengthsHe: speaking?.strengths_he || null,
    speakingFocusHe: speaking?.focus_he || null,
    spokenAnswers: spoken.length,
  };
  db.prepare('INSERT INTO assessments (user_id, kind, level, details, created_at) VALUES (?, ?, ?, ?, ?)').run(u.id, kind, level, JSON.stringify(result), now());
  logActivity(u.id, { kind: 'assessment', ref: kind, correct: listening.correct + vocab.correct, total: listening.total + vocab.total, speakingSeconds, durationSeconds: b.durationSec });
  if (kind === 'initial') {
    db.prepare('UPDATE users SET onboarded = 1, start_level = ?, level = ? WHERE id = ?').run(pathLevel, pathLevel, u.id);
  }
  res.json({ user: getUser(u.id), result });
}));

// ---------- מסלול ----------
function progressMap(userId) {
  const rows = db.prepare('SELECT * FROM lesson_progress WHERE user_id = ?').all(userId);
  return Object.fromEntries(rows.map((r) => [r.lesson_id, r]));
}
function milestoneSet(userId) {
  return new Set(db.prepare('SELECT stage_id FROM milestones WHERE user_id = ?').all(userId).map((r) => r.stage_id));
}

export function buildPath(user) {
  const prog = progressMap(user.id);
  const ms = milestoneSet(user.id);
  const startIdx = Math.min(levelIndex(user.startLevel || 'A1'), STAGES.length - 1);
  // gate: האם השיעור הבא ברצף פתוח. נפתח רק אחרי שהשיעור הקודם עבר, ובמעבר שלב – רק אחרי אבן הדרך.
  let gate = true;
  let prevStageComplete = true;
  const stages = STAGES.map((st, i) => {
    const below = i < startIdx;
    if (i > startIdx) gate = gate && prevStageComplete;
    const units = st.units.map((u) => {
      const lessons = u.lessons.map((lid) => {
        const p = prog[lid];
        const passed = !!p?.passed;
        const unlocked = below || passed || gate;
        if (!below) gate = gate && passed;
        const L = LESSONS[lid];
        return { id: lid, title: L.title, titleHe: L.titleHe, passed, unlocked, bestScore: p?.best_score || 0, attempts: p?.attempts || 0 };
      });
      return { id: u.id, title: u.title, canDo: u.canDo, lessons, done: lessons.every((l) => l.passed) };
    });
    const allPassed = units.every((u) => u.done);
    const milestone = { scenarioId: st.milestoneScenario, achieved: ms.has(st.id), unlocked: allPassed };
    const complete = allPassed && milestone.achieved;
    if (!below) prevStageComplete = complete;
    const status = complete ? 'complete' : below ? 'review' : units[0].lessons[0].unlocked ? 'current' : 'locked';
    return { id: st.id, level: st.level, title: st.title, subtitle: st.subtitle, units, milestone, status, belowStart: below };
  });
  const current = stages.find((s) => !s.belowStart && s.status !== 'complete') || stages[stages.length - 1];
  let next = null;
  for (const s of stages) {
    if (s.belowStart) continue;
    for (const u of s.units) for (const l of u.lessons) if (!next && l.unlocked && !l.passed) next = { type: 'lesson', id: l.id, title: l.title, titleHe: l.titleHe, unit: u.title, stage: s.id };
    if (!next && s.milestone.unlocked && !s.milestone.achieved) {
      const sc = scenarioById(s.milestone.scenarioId);
      next = { type: 'milestone', stage: s.id, scenarioId: sc.id, title: sc.titleEn, titleHe: `אבן דרך: ${sc.titleHe}` };
    }
  }
  return { startLevel: user.startLevel || 'A1', level: user.level, currentStage: current.id, stages, next };
}

app.get('/api/path', requireAuth, (req, res) => res.json(buildPath(req.user)));

// ---------- שיעורים ----------
app.get('/api/lessons/:id', requireAuth, (req, res) => {
  const L = LESSONS[req.params.id];
  if (!L) return res.status(404).json({ error: 'השיעור לא נמצא' });
  const p = buildPath(req.user);
  const meta = p.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).find((l) => l.id === L.id);
  if (!meta?.unlocked) return res.status(403).json({ error: 'השיעור עדיין נעול – השלימו קודם את השיעור הקודם במסלול.' });
  const where = stageOfLesson(L.id);
  res.json({ lesson: L, unit: where?.unit, stage: { id: where?.stage.id, title: where?.stage.title }, progress: meta });
});

app.post('/api/lessons/:id/complete', requireAuth, (req, res) => {
  const L = LESSONS[req.params.id];
  if (!L) return res.status(404).json({ error: 'השיעור לא נמצא' });
  const u = req.user;
  const b = req.body || {};
  // הבנת הנשמע – נבדק בשרת לפי התשובה הראשונה לכל שאלה
  const answers = arr(b.listening, 10);
  let lCorrect = 0;
  for (const q of L.listening.questions) {
    const a = answers.find((x) => x.qid === q.id);
    const ok = a && Number(a.choice) === q.answer;
    if (ok) lCorrect++;
    else addWeakPoint(u.id, `listen:${L.id}:${q.id}`, `הבנת הנשמע: ${L.titleHe}`, L.id);
  }
  const speaking = arr(b.speaking, 10).filter((s) => L.speaking.some((t) => t.id === s.taskId));
  const sAchieved = speaking.filter((s) => s.achieved).length;
  const spokenAloud = speaking.filter((s) => !s.typed).length;
  for (const t of L.speaking) {
    const s = speaking.find((x) => x.taskId === t.id);
    if (!s?.achieved) addWeakPoint(u.id, `speak:${L.id}:${t.id}`, `דיבור: ${t.promptHe}`, L.id);
    else resolveWeakPoint(u.id, `speak:${L.id}:${t.id}`);
  }
  const vocabUse = arr(b.vocabUse, 10).filter((v) => L.vocabUse.some((t) => t.term === v.term));
  const vAchieved = vocabUse.filter((v) => v.achieved).length;
  const score = Math.round(
    (lCorrect / L.listening.questions.length) * 40 + (sAchieved / L.speaking.length) * 40 + (vAchieved / L.vocabUse.length) * 20
  );
  const reasons = [];
  if (lCorrect < 2) reasons.push('לענות נכון על לפחות 2 משאלות ההבנה');
  if (sAchieved < 2) reasons.push('להשלים לפחות 2 משימות דיבור');
  if (vAchieved < 1) reasons.push('להשתמש לפחות במילה אחת במשפט משלך');
  if (spokenAloud < 1 && !TYPED_OK()) reasons.push('לבצע לפחות משימת דיבור אחת בקול (לא בהקלדה)');
  const passed = reasons.length === 0;
  if (passed) for (const q of L.listening.questions) resolveWeakPoint(u.id, `listen:${L.id}:${q.id}`);

  const prev = db.prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(u.id, L.id);
  const lastResult = JSON.stringify({ score, lCorrect, sAchieved, vAchieved, passed, at: now() });
  if (prev) {
    db.prepare('UPDATE lesson_progress SET passed = ?, best_score = ?, attempts = attempts + 1, last_result = ?, updated_at = ? WHERE user_id = ? AND lesson_id = ?').run(
      prev.passed || passed ? 1 : 0, Math.max(prev.best_score, score), lastResult, now(), u.id, L.id
    );
  } else {
    db.prepare('INSERT INTO lesson_progress (user_id, lesson_id, passed, best_score, attempts, last_result, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)').run(
      u.id, L.id, passed ? 1 : 0, score, lastResult, now()
    );
  }
  const speakingSeconds = [...speaking, ...vocabUse].filter((s) => !s.typed).reduce((s, x) => s + clampNum(x.seconds, 0, 300), 0) + clampNum(b.retellSeconds, 0, 300);
  logActivity(u.id, { kind: 'lesson', ref: L.id, correct: passed ? 1 : 0, total: 1, durationSeconds: b.durationSec, meta: { score } });
  logActivity(u.id, { kind: 'listening', ref: L.id, correct: lCorrect, total: L.listening.questions.length });
  logActivity(u.id, { kind: 'speaking_task', ref: L.id, correct: sAchieved + vAchieved, total: L.speaking.length + L.vocabUse.length, speakingSeconds });

  // אוצר המילים של השיעור נכנס למאגר האישי לחזרה מרווחת
  const ins = db.prepare('INSERT OR IGNORE INTO vocab (user_id, term, he, example, source, box, due_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)');
  let added = 0;
  for (const v of L.vocab) added += Number(ins.run(u.id, v.term, v.he, v.example, `שיעור: ${L.titleHe}`, now() + DAY, now()).changes);
  for (const v of vocabUse.filter((x) => x.achieved)) db.prepare('UPDATE vocab SET used_in_sentence = 1 WHERE user_id = ? AND term = ?').run(u.id, v.term);

  res.json({ passed, score, lCorrect, sAchieved, vAchieved, reasons, wordsAdded: added, path: buildPath(getUser(u.id)) });
});

// ---------- הערכת משימת דיבור ----------
app.post('/api/speaking/evaluate', requireAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const transcript = str(b.transcript, 1500).trim();
  if (!transcript) return res.status(400).json({ error: 'לא התקבל טקסט להערכה' });
  let task;
  if (b.lessonId && LESSONS[b.lessonId]) {
    const L = LESSONS[b.lessonId];
    if (b.taskId) {
      const t = L.speaking.find((x) => x.id === b.taskId);
      if (t) task = { promptEn: t.promptEn, promptHe: t.promptHe, model: t.model, keywords: t.keywords };
    } else if (b.term) {
      const t = L.vocabUse.find((x) => x.term === b.term);
      if (t) task = { promptEn: `Use "${t.term}" in a sentence of your own.`, promptHe: t.promptHe, targetTerm: t.term, keywords: [] };
    }
  } else if (b.vocabId) {
    const v = db.prepare('SELECT * FROM vocab WHERE id = ? AND user_id = ?').get(Number(b.vocabId), req.user.id);
    if (v) task = { promptEn: `Use "${v.term}" (${v.he}) in a new sentence of your own.`, promptHe: `השתמש/י ב-"${v.term}" במשפט חדש משלך`, targetTerm: v.term, keywords: [] };
  }
  if (!task) return res.status(404).json({ error: 'המשימה לא נמצאה' });
  const out = await evaluateSpeech({ ...task, level: req.user.level, transcript });
  res.json(out);
}));

// ---------- מורה לשיחה ----------
app.get('/api/tutor/scenarios', requireAuth, (req, res) => {
  const ms = milestoneSet(req.user.id);
  const milestoneFor = Object.fromEntries(STAGES.map((s) => [s.milestoneScenario, s.id]));
  res.json({
    scenarios: SCENARIOS.map(({ demo, ...s }) => ({ ...s, opening: demo[0], milestoneStage: milestoneFor[s.id] || null, milestoneAchieved: ms.has(milestoneFor[s.id]) })),
  });
});

function sanitizeHistory(h) {
  return arr(h, 40).map((x) => ({ role: x.role === 'tutor' ? 'tutor' : 'user', text: str(x.text, 800) }));
}

const LEVEL_SHIFT = (lv, d) => LEVELS[Math.min(4, Math.max(0, levelIndex(lv) + (Number(d) || 0)))];

app.post('/api/tutor/turn', requireAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const scenario = scenarioById(b.scenarioId);
  if (!scenario) return res.status(404).json({ error: 'תרחיש לא נמצא' });
  const userText = str(b.userText, 1000).trim();
  if (!userText) return res.status(400).json({ error: 'לא התקבל טקסט' });
  const out = await tutorTurn({
    scenario,
    level: LEVEL_SHIFT(req.user.level, b.levelShift),
    interests: req.user.interests,
    history: sanitizeHistory(b.history),
    userText,
    turnIndex: clampNum(b.turnIndex, 0, 100),
  });
  res.json(out);
}));

app.post('/api/tutor/assist', requireAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const scenario = scenarioById(b.scenarioId);
  if (!scenario || !['hint', 'explain', 'simpler'].includes(b.kind)) return res.status(400).json({ error: 'בקשה לא תקינה' });
  res.json(await tutorAssist({ kind: b.kind, scenario, level: LEVEL_SHIFT(req.user.level, b.levelShift), history: sanitizeHistory(b.history) }));
}));

app.post('/api/tutor/finish', requireAuth, (req, res) => {
  const b = req.body || {};
  const scenario = scenarioById(b.scenarioId);
  if (!scenario) return res.status(404).json({ error: 'תרחיש לא נמצא' });
  const u = req.user;
  const userTurns = clampNum(b.userTurns, 0, 200);
  const spokenTurns = clampNum(b.spokenTurns, 0, 200);
  const goalAchieved = !!b.goalAchieved && userTurns >= 3;
  logActivity(u.id, {
    kind: 'conversation',
    ref: scenario.id,
    correct: goalAchieved ? 1 : 0,
    total: 1,
    speakingSeconds: b.speakingSeconds,
    durationSeconds: b.durationSec,
    meta: { userTurns, spokenTurns, demo: !aiEnabled() },
  });
  // אבן דרך: נדרשת השגת מטרת התרחיש בדיבור (לפחות 3 תורות בקול) ושכל שיעורי השלב הושלמו
  let milestone = null;
  const stage = STAGES.find((s) => s.milestoneScenario === scenario.id);
  if (stage && goalAchieved && (spokenTurns >= 3 || TYPED_OK())) {
    const p = buildPath(u);
    const st = p.stages.find((s) => s.id === stage.id);
    if (st && st.units.every((x) => x.done) && !st.milestone.achieved) {
      db.prepare('INSERT OR IGNORE INTO milestones (user_id, stage_id, achieved_at) VALUES (?, ?, ?)').run(u.id, stage.id, now());
      const nextLevel = LEVELS[Math.min(levelIndex(stage.level) + 1, 4)];
      if (levelIndex(nextLevel) > levelIndex(u.level)) db.prepare('UPDATE users SET level = ? WHERE id = ?').run(nextLevel, u.id);
      milestone = { stage: stage.id, title: stage.title, newLevel: nextLevel };
    }
  }
  res.json({ ok: true, goalAchieved, milestone, user: getUser(u.id) });
});

// ---------- אוצר מילים ----------
const BOX_DAYS = [1, 2, 4, 7, 15, 30, 60];

app.get('/api/vocab', requireAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM vocab WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const t = now();
  res.json({
    items: items.map((v) => ({ ...v, due: v.due_at <= t, known: v.box >= 3 && !!v.used_in_sentence })),
    dueCount: items.filter((v) => v.due_at <= t).length,
  });
});

app.post('/api/vocab', requireAuth, (req, res) => {
  const b = req.body || {};
  const term = str(b.term, 80).trim();
  const he = str(b.he, 120).trim();
  if (!term || !he) return res.status(400).json({ error: 'חסר ביטוי או תרגום' });
  const info = db
    .prepare('INSERT OR IGNORE INTO vocab (user_id, term, he, example, source, box, due_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)')
    .run(req.user.id, term, he, str(b.example, 300) || null, str(b.source, 80) || 'נשמר ידנית', now(), now());
  res.json({ added: info.changes > 0 });
});

app.delete('/api/vocab/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM vocab WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  if (!info.changes) return res.status(404).json({ error: 'לא נמצא' });
  res.json({ ok: true });
});

app.post('/api/vocab/:id/review', requireAuth, (req, res) => {
  const v = db.prepare('SELECT * FROM vocab WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!v) return res.status(404).json({ error: 'לא נמצא' });
  const b = req.body || {};
  const recognized = !!b.recognized;
  const produced = b.produced === true;
  let box = v.box;
  let due;
  if (recognized && produced) {
    box = Math.min(box + 1, BOX_DAYS.length - 1);
    due = now() + BOX_DAYS[box] * DAY;
  } else if (recognized) {
    due = now() + DAY; // זיהה אבל לא הפיק משפט – חוזרים מחר
  } else {
    box = 0;
    due = now() + 10 * 60 * 1000; // טעות – חוזרים עוד באותו יום
    addWeakPoint(req.user.id, `vocab:${v.term}`, `מילה: ${v.term}`, null);
  }
  if (recognized && produced) resolveWeakPoint(req.user.id, `vocab:${v.term}`);
  db.prepare('UPDATE vocab SET box = ?, due_at = ?, correct_count = correct_count + ?, wrong_count = wrong_count + ?, used_in_sentence = MAX(used_in_sentence, ?) WHERE id = ?').run(
    box, due, recognized && produced ? 1 : 0, recognized ? 0 : 1, produced ? 1 : 0, v.id
  );
  logActivity(req.user.id, {
    kind: 'vocab_review',
    ref: v.term,
    correct: recognized && produced ? 1 : 0,
    total: 1,
    speakingSeconds: b.typed ? 0 : b.seconds,
    durationSeconds: b.durationSec,
  });
  res.json({ box, dueAt: due });
});

app.get('/api/vocab/packs', requireAuth, (req, res) => {
  const mine = new Set(db.prepare('SELECT term FROM vocab WHERE user_id = ?').all(req.user.id).map((r) => r.term.toLowerCase()));
  res.json({
    packs: INTERESTS.map((i) => ({ ...i, items: (VOCAB_PACKS[i.id] || []).map((w) => ({ ...w, saved: mine.has(w.term.toLowerCase()) })), selected: req.user.interests.includes(i.id) })),
  });
});

app.post('/api/vocab/packs/:id/add', requireAuth, (req, res) => {
  const pack = VOCAB_PACKS[req.params.id];
  if (!pack) return res.status(404).json({ error: 'חבילה לא נמצאה' });
  const name = INTERESTS.find((i) => i.id === req.params.id)?.he;
  const ins = db.prepare('INSERT OR IGNORE INTO vocab (user_id, term, he, example, source, box, due_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)');
  let added = 0;
  for (const w of pack) added += Number(ins.run(req.user.id, w.term, w.he, w.example, `נושא: ${name}`, now(), now()).changes);
  res.json({ added });
});

// ---------- התקדמות ובית ----------
function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function activityStats(userId) {
  const rows = db.prepare('SELECT * FROM activity WHERE user_id = ?').all(userId);
  const sum = (kind, f) => rows.filter((r) => !kind || r.kind === kind).reduce((s, r) => s + r[f], 0);
  const days = {};
  for (const r of rows) {
    const k = dayKey(r.created_at);
    days[k] = (days[k] || 0) + r.duration_seconds;
  }
  // רצף ימים: ימים רצופים עם פעילות, עד היום (או אתמול)
  let streak = 0;
  const t = new Date();
  const todayKey = dayKey(t.getTime());
  let cursor = days[todayKey] ? t.getTime() : t.getTime() - DAY;
  while (days[dayKey(cursor)]) {
    streak++;
    cursor -= DAY;
  }
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const k = dayKey(Date.now() - i * DAY);
    last14.push({ day: k, minutes: Math.round((days[k] || 0) / 60) });
  }
  return {
    rows,
    speakingMinutes: Math.round(sum(null, 'speaking_seconds') / 60),
    speakingSeconds: Math.round(sum(null, 'speaking_seconds')),
    listening: { correct: sum('listening', 'correct'), total: sum('listening', 'total') },
    speakingTasks: { achieved: sum('speaking_task', 'correct'), total: sum('speaking_task', 'total') },
    conversations: { count: rows.filter((r) => r.kind === 'conversation').length, goals: sum('conversation', 'correct') },
    todayMinutes: Math.round((days[todayKey] || 0) / 60),
    streak,
    last14,
  };
}

function weakList(userId, limit = 5) {
  // מאחדים נקודות חולשה עם אותה תווית (למשל כמה שאלות הבנה מאותו שיעור)
  return db
    .prepare(
      `SELECT MIN(tag) AS tag, label_he, ref, SUM(count) AS count, MAX(updated_at) AS u FROM weak_points
       WHERE user_id = ? AND resolved = 0 GROUP BY label_he, ref ORDER BY count DESC, u DESC LIMIT ?`
    )
    .all(userId, limit)
    .map((w) => ({ tag: w.tag, label_he: w.label_he, ref: w.ref, count: w.count, lessonTitle: w.ref && LESSONS[w.ref] ? LESSONS[w.ref].titleHe : null }));
}

app.get('/api/home', requireAuth, (req, res) => {
  const u = req.user;
  const p = buildPath(u);
  const st = activityStats(u.id);
  const due = db.prepare('SELECT COUNT(*) AS n FROM vocab WHERE user_id = ? AND due_at <= ?').get(u.id, now()).n;
  const total = db.prepare('SELECT COUNT(*) AS n FROM vocab WHERE user_id = ?').get(u.id).n;
  const stage = p.stages.find((s) => s.id === p.currentStage);
  res.json({
    next: p.next,
    level: u.level,
    stage: { id: stage.id, title: stage.title, done: stage.units.flatMap((x) => x.lessons).filter((l) => l.passed).length, total: stage.units.flatMap((x) => x.lessons).length, milestone: stage.milestone },
    vocab: { due, total },
    todayMinutes: st.todayMinutes,
    dailyGoal: u.dailyMinutes,
    streak: st.streak,
    weak: weakList(u.id, 3),
  });
});

app.get('/api/progress', requireAuth, (req, res) => {
  const u = req.user;
  const p = buildPath(u);
  const st = activityStats(u.id);
  const vocabRows = db.prepare('SELECT box, used_in_sentence FROM vocab WHERE user_id = ?').all(u.id);
  const assessments = db.prepare('SELECT kind, level, details, created_at FROM assessments WHERE user_id = ? ORDER BY created_at').all(u.id);
  const canDos = [];
  for (const s of p.stages) for (const x of s.units) if (x.done) canDos.push({ stage: s.id, text: x.canDo });
  const lessonsPassed = p.stages.flatMap((s) => s.units.flatMap((x) => x.lessons)).filter((l) => l.passed).length;
  const nextStage = p.stages.find((s) => !s.belowStart && s.status !== 'complete');
  res.json({
    startLevel: p.startLevel,
    level: u.level,
    currentStage: p.stages.find((s) => s.id === p.currentStage),
    next: p.next,
    nextStage: nextStage ? { id: nextStage.id, title: nextStage.title } : null,
    lessonsPassed,
    lessonsTotal: p.stages.flatMap((s) => s.units.flatMap((x) => x.lessons)).length,
    milestones: p.stages.filter((s) => s.milestone.achieved).map((s) => s.id),
    speaking: { minutes: st.speakingMinutes, seconds: st.speakingSeconds, tasks: st.speakingTasks, conversations: st.conversations },
    listening: st.listening,
    vocab: { total: vocabRows.length, known: vocabRows.filter((v) => v.box >= 3 && v.used_in_sentence).length, usedInSentence: vocabRows.filter((v) => v.used_in_sentence).length },
    canDos,
    weak: weakList(u.id, 6),
    assessments: assessments.map((a) => ({ kind: a.kind, level: a.level, createdAt: a.created_at, details: JSON.parse(a.details) })),
    streak: st.streak,
    last14: st.last14,
    dailyGoal: u.dailyMinutes,
  });
});

// ---------- קול ----------
app.post('/api/speech/tts', requireAuth, wrap(async (req, res) => {
  if (!serverTtsEnabled()) return res.status(501).json({ error: 'הקראה בצד השרת לא מוגדרת' });
  const text = str(req.body?.text, 600).trim();
  if (!text) return res.status(400).json({ error: 'אין טקסט' });
  const buf = await synthesize(text, { speed: req.body?.speed, voice: req.body?.voice });
  res.set('Content-Type', 'audio/mpeg').set('Cache-Control', 'private, max-age=86400').send(buf);
}));

app.post('/api/speech/transcribe', requireAuth, express.raw({ type: ['audio/*', 'video/webm', 'application/octet-stream'], limit: '8mb' }), wrap(async (req, res) => {
  if (!serverSttEnabled()) return res.status(501).json({ error: 'תמלול בצד השרת לא מוגדר' });
  if (!req.body?.length) return res.status(400).json({ error: 'לא התקבל אודיו' });
  const text = await transcribe(req.body, req.get('Content-Type') || 'audio/webm');
  res.json({ text }); // האודיו לא נשמר
}));

// ---------- קבצים סטטיים ----------
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use('/api', (_req, res) => res.status(404).json({ error: 'לא נמצא' }));

const PORT = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`English Coach server on http://localhost:${PORT}`);
    console.log(`  AI tutor: ${aiEnabled() ? 'Claude (' + (process.env.CLAUDE_MODEL || 'claude-opus-5-5') + ')' : 'DEMO MODE (no ANTHROPIC_API_KEY)'}`);
    console.log(`  Voice: TTS=${serverTtsEnabled() ? 'OpenAI' : 'browser'}, STT=${serverSttEnabled() ? 'OpenAI' : 'browser'}`);
    console.log(`  Email: ${emailEnabled() ? 'SMTP' : 'not configured (reset links logged to console)'}`);
  });
}
