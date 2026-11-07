// בדיקות API מקצה לקצה: הרשמה, הפרדה בין חשבונות, אבחון, מסלול, שיעור, אוצר מילים, שיחה ואבן דרך.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
delete process.env.ANTHROPIC_API_KEY; // מצב הדגמה – בדיקות דטרמיניסטיות
delete process.env.OPENAI_API_KEY;

let server, base;
before(async () => {
  const { app } = await import('../server/index.js');
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

function client() {
  let cookie = '';
  return async (path, { method = 'GET', body, headers = {} } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'X-Requested-With': 'english-app', 'Content-Type': 'application/json', cookie, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };
}

const A = client();
const B = client();

test('register, login, me', async () => {
  let r = await A('/auth/register', { method: 'POST', body: { email: 'a@test.com', username: 'Dana', password: 'password123' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.onboarded, false);
  r = await A('/auth/register', { method: 'POST', body: { email: 'A@test.com', username: 'Other', password: 'password123' } });
  assert.equal(r.status, 409, 'duplicate email (case-insensitive)');
  r = await A('/auth/register', { method: 'POST', body: { email: 'x@test.com', username: 'X', password: 'short' } });
  assert.equal(r.status, 400);
  r = await B('/auth/register', { method: 'POST', body: { email: 'b@test.com', username: 'Ben', password: 'password456' } });
  assert.equal(r.status, 200);
  r = await A('/auth/me');
  assert.equal(r.data.user.email, 'a@test.com');
});

test('CSRF header required and auth required', async () => {
  const res = await fetch(base + '/vocab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 403);
  const anon = client();
  assert.equal((await anon('/path')).status, 401);
});

test('initial diagnostic is adaptive and builds a path', async () => {
  const d = await A('/diagnostic');
  assert.ok(d.data.listening.length >= 10);
  assert.equal(d.data.listening[0].answer, undefined, 'answers are not leaked');
  const { DIAG_LISTENING, DIAG_VOCAB } = await import('../server/content/diagnostic.js');
  // משתמשת שעונה נכון עד B1 ושגוי מעל
  const ans = (bank) => bank.map((i) => ({ id: i.id, choice: ['A1', 'A2', 'B1'].includes(i.level) ? i.answer : (i.answer + 1) % 3 }));
  const r = await A('/diagnostic/complete', {
    method: 'POST',
    body: {
      kind: 'initial',
      profile: { goals: ['travel'], interests: ['food', 'travel'], dailyMinutes: 10 },
      listening: ans(DIAG_LISTENING),
      vocab: ans(DIAG_VOCAB),
      speaking: [
        { id: 'sp1', transcript: 'My name is Dana and I live in Haifa. I like cooking.', seconds: 8 },
        { id: 'sp2', transcript: 'Last weekend I went to the beach with my friends and we had a great time because the weather was nice.', seconds: 12 },
        { id: 'sp3', transcript: 'I prefer working from home because I save time, but sometimes I feel lonely so I go to the office.', seconds: 14 },
      ],
    },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.result.skills.listening.level, 'B1');
  assert.equal(r.data.result.skills.vocab.level, 'B1');
  assert.ok(r.data.result.skills.speaking.demo, 'speaking estimate is marked demo without AI');
  assert.equal(r.data.user.onboarded, true);
  assert.equal(r.data.user.interests.join(','), 'food,travel');
  const p = await A('/path');
  assert.equal(p.data.startLevel, r.data.result.pathLevel);
});

test('skip diagnostic starts at A1', async () => {
  const r = await B('/diagnostic/complete', { method: 'POST', body: { kind: 'initial', skipped: true } });
  assert.equal(r.data.user.level, 'A1');
  const p = await B('/path');
  const a1 = p.data.stages[0];
  assert.equal(a1.units[0].lessons[0].unlocked, true);
  assert.equal(a1.units[1].lessons[0].unlocked, false, 'second lesson locked until first passed');
  assert.equal(p.data.stages[1].units[0].lessons[0].unlocked, false);
  assert.equal(p.data.next.id, 'a1-intro');
  assert.equal((await B('/lessons/a1-cafe')).status, 403, 'locked lesson cannot be opened');
});

test('lesson completion requires demonstrated ability', async () => {
  const { LESSONS } = await import('../server/content/lessons.js');
  const L = LESSONS['a1-intro'];
  // ניסיון חלש: רק לחיצות
  let r = await B('/lessons/a1-intro/complete', { method: 'POST', body: { listening: [], speaking: [], vocabUse: [] } });
  assert.equal(r.data.passed, false);
  assert.ok(r.data.reasons.length >= 3);
  // כל המשימות בהקלדה – לא עובר (נדרש דיבור בקול)
  r = await B('/lessons/a1-intro/complete', {
    method: 'POST',
    body: {
      listening: L.listening.questions.map((q) => ({ qid: q.id, choice: q.answer })),
      speaking: L.speaking.map((t) => ({ taskId: t.id, achieved: true, typed: true, seconds: 0 })),
      vocabUse: [{ term: L.vocabUse[0].term, achieved: true, typed: true }],
    },
  });
  assert.equal(r.data.passed, false);
  assert.match(r.data.reasons.join(' '), /בקול/);
  // ניסיון אמיתי
  r = await B('/lessons/a1-intro/complete', {
    method: 'POST',
    body: {
      listening: L.listening.questions.map((q) => ({ qid: q.id, choice: q.answer })),
      speaking: L.speaking.map((t) => ({ taskId: t.id, achieved: true, typed: false, seconds: 6 })),
      vocabUse: [{ term: L.vocabUse[0].term, achieved: true, seconds: 4 }],
      durationSec: 600,
    },
  });
  assert.equal(r.data.passed, true);
  assert.equal(r.data.score, 90);
  assert.ok((await B("/vocab")).data.items.length >= 6, "lesson phrases saved to personal vocab");
  assert.equal(r.data.path.next.id, 'a1-cafe', 'next lesson unlocked');
});

test('speaking evaluation (demo) distinguishes on-task answers', async () => {
  let r = await B('/speaking/evaluate', { method: 'POST', body: { lessonId: 'a1-intro', taskId: 's2', transcript: 'I am from Haifa and I live in Tel Aviv' } });
  assert.equal(r.data.task_achieved, true);
  assert.equal(r.data.demo, true);
  r = await B('/speaking/evaluate', { method: 'POST', body: { lessonId: 'a1-intro', taskId: 's2', transcript: 'banana' } });
  assert.equal(r.data.task_achieved, false);
  r = await B('/speaking/evaluate', { method: 'POST', body: { lessonId: 'a1-intro', taskId: 's3', transcript: 'He don\'t work, i am agree' } });
  assert.ok(r.data.feedback.corrections.length <= 2);
  assert.ok(r.data.feedback.corrections.some((c) => c.kind === 'error'));
});

test('vocabulary is private per user and spaced repetition updates', async () => {
  const a = await A('/vocab');
  const b = await B('/vocab');
  assert.equal(a.data.items.length, 0, 'A sees none of B\'s words');
  assert.ok(b.data.items.length >= 5);
  const item = b.data.items[0];
  // A cannot review / delete B's item
  assert.equal((await A(`/vocab/${item.id}/review`, { method: 'POST', body: { recognized: true, produced: true } })).status, 404);
  assert.equal((await A(`/vocab/${item.id}`, { method: 'DELETE' })).status, 404);
  assert.equal((await A('/speaking/evaluate', { method: 'POST', body: { vocabId: item.id, transcript: 'x y z' } })).status, 404);
  const r = await B(`/vocab/${item.id}/review`, { method: 'POST', body: { recognized: true, produced: true, seconds: 3 } });
  assert.equal(r.data.box, 1);
  const w = await B(`/vocab/${item.id}/review`, { method: 'POST', body: { recognized: false } });
  assert.equal(w.data.box, 0);
  const packs = await A('/vocab/packs/food/add', { method: 'POST' });
  assert.equal(packs.data.added, 6);
});

test('tutor conversation (demo) and milestone gating', async () => {
  const sc = await B('/tutor/scenarios');
  const cafe = sc.data.scenarios.find((s) => s.id === 'cafe');
  assert.equal(cafe.milestoneStage, 'A1');
  // תשובה לא רלוונטית – המורה מבקש שוב
  let t = await B('/tutor/turn', { method: 'POST', body: { scenarioId: 'cafe', history: [{ role: 'tutor', text: cafe.opening.en }], userText: 'banana', turnIndex: 0 } });
  assert.equal(t.data.advanced, false);
  t = await B('/tutor/turn', { method: 'POST', body: { scenarioId: 'cafe', history: [], userText: 'Can I have a latte please', turnIndex: 0 } });
  assert.equal(t.data.advanced, true);
  assert.match(t.data.reply, /size/i);
  const h = await B('/tutor/assist', { method: 'POST', body: { scenarioId: 'cafe', kind: 'hint', history: [{ role: 'tutor', text: 'x' }] } });
  assert.ok(h.data.en);
  // אבן דרך לפני שהשיעורים הושלמו – לא נספרת
  let f = await B('/tutor/finish', { method: 'POST', body: { scenarioId: 'cafe', userTurns: 5, spokenTurns: 5, speakingSeconds: 40, goalAchieved: true } });
  assert.equal(f.data.milestone, null);
  // משלימים את השיעור השני של A1
  const { LESSONS } = await import('../server/content/lessons.js');
  const L = LESSONS['a1-cafe'];
  await B('/lessons/a1-cafe/complete', {
    method: 'POST',
    body: {
      listening: L.listening.questions.map((q) => ({ qid: q.id, choice: q.answer })),
      speaking: L.speaking.map((x) => ({ taskId: x.id, achieved: true, seconds: 5 })),
      vocabUse: L.vocabUse.map((x) => ({ term: x.term, achieved: true, seconds: 4 })),
    },
  });
  let p = await B('/path');
  assert.equal(p.data.next.type, 'milestone');
  assert.equal(p.data.stages[1].units[0].lessons[0].unlocked, false, 'A2 locked until milestone');
  // שיחה מוקלדת לא מספיקה לאבן דרך
  f = await B('/tutor/finish', { method: 'POST', body: { scenarioId: 'cafe', userTurns: 5, spokenTurns: 1, goalAchieved: true } });
  assert.equal(f.data.milestone, null);
  f = await B('/tutor/finish', { method: 'POST', body: { scenarioId: 'cafe', userTurns: 5, spokenTurns: 5, speakingSeconds: 45, goalAchieved: true, durationSec: 300 } });
  assert.equal(f.data.milestone.stage, 'A1');
  assert.equal(f.data.user.level, 'A2');
  p = await B('/path');
  assert.equal(p.data.stages[0].status, 'complete');
  assert.equal(p.data.stages[1].units[0].lessons[0].unlocked, true);
});

test('progress reflects measured activity only', async () => {
  const r = await B('/progress');
  assert.equal(r.data.lessonsPassed, 2);
  assert.ok(r.data.speaking.seconds > 0);
  assert.ok(r.data.canDos.length === 2);
  assert.ok(r.data.listening.total >= 9);
  const home = await B('/home');
  assert.ok(home.data.streak >= 1);
  const ra = await A('/progress');
  assert.equal(ra.data.lessonsPassed, 0, 'A does not see B\'s progress');
});

test('password reset flow', async () => {
  const r = await A('/auth/forgot', { method: 'POST', body: { email: 'a@test.com' } });
  assert.ok(r.data.devResetLink);
  const token = new URL(r.data.devResetLink.replace('/#/', '/')).searchParams.get('token');
  const C = client();
  let x = await C('/auth/reset', { method: 'POST', body: { token, password: 'newpassword1' } });
  assert.equal(x.status, 200);
  x = await C('/auth/reset', { method: 'POST', body: { token, password: 'again12345' } });
  assert.equal(x.status, 400, 'token single-use');
  assert.equal((await A('/auth/me')).data.user, null, 'old sessions revoked');
  const D = client();
  assert.equal((await D('/auth/login', { method: 'POST', body: { email: 'a@test.com', password: 'password123' } })).status, 401);
  assert.equal((await D('/auth/login', { method: 'POST', body: { email: 'a@test.com', password: 'newpassword1' } })).status, 200);
  const unknown = await D('/auth/forgot', { method: 'POST', body: { email: 'nobody@test.com' } });
  assert.equal(unknown.data.devResetLink, undefined, 'no account enumeration');
});
