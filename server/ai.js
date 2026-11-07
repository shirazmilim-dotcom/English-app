// שכבת ה-AI: מורה לשיחה, הערכת דיבור ועזרה. משתמשת ב-Claude (Anthropic) בצד השרת בלבד.
// כשאין ANTHROPIC_API_KEY – מצב הדגמה מסומן: שורות כתובות מראש ומשוב מבוסס כללים פשוטים (לא AI).
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const EFFORT = process.env.CLAUDE_EFFORT || 'low'; // שיחה בזמן אמת – עדיפות לתגובה מהירה
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

let client = null;
const getClient = () => (client ??= new Anthropic());

let fallbacksSupported = true;

async function callClaude({ system, user, schema, maxTokens = 2000 }) {
  const base = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { effort: EFFORT, format: { type: 'json_schema', schema } },
  };
  let msg;
  try {
    msg = fallbacksSupported
      ? await getClient().beta.messages.create({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : await getClient().messages.create(base);
  } catch (e) {
    if (fallbacksSupported && e instanceof Anthropic.BadRequestError) {
      // ייתכן שהחשבון/הפלטפורמה לא תומכים ב-fallbacks – ננסה שוב בלעדיהם
      fallbacksSupported = false;
      msg = await getClient().messages.create(base);
    } else throw e;
  }
  if (msg.stop_reason === 'refusal') throw new Error('המודל סירב לבקשה');
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text);
}

// ---------- סכמות ----------
const FEEDBACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'corrections', 'natural_version', 'tip_he'],
  properties: {
    verdict: { type: 'string', enum: ['great', 'good', 'needs_fix'] },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['you_said', 'better', 'kind', 'explanation_he'],
        properties: {
          you_said: { type: 'string' },
          better: { type: 'string' },
          kind: { type: 'string', enum: ['error', 'improvement'] },
          explanation_he: { type: 'string' },
        },
      },
    },
    natural_version: { type: 'string' },
    tip_he: { type: 'string' },
  },
};

const TURN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'reply_he', 'reply_simple', 'goal_achieved', 'feedback', 'new_phrases'],
  properties: {
    reply: { type: 'string' },
    reply_he: { type: 'string' },
    reply_simple: { type: 'string' },
    goal_achieved: { type: 'boolean' },
    feedback: FEEDBACK_SCHEMA,
    new_phrases: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['en', 'he', 'example'], properties: { en: { type: 'string' }, he: { type: 'string' }, example: { type: 'string' } } },
    },
  },
};

const EVAL_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['task_achieved', 'uses_target', 'feedback', 'encouragement_he'],
  properties: {
    task_achieved: { type: 'boolean' },
    uses_target: { type: 'boolean' },
    feedback: FEEDBACK_SCHEMA,
    encouragement_he: { type: 'string' },
  },
};

const ASSIST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['en', 'he'],
  properties: { en: { type: 'string' }, he: { type: 'string' } },
};

const DIAG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['level', 'strengths_he', 'focus_he'],
  properties: {
    level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
    strengths_he: { type: 'string' },
    focus_he: { type: 'string' },
  },
};

// ---------- הנחיות ----------
const FEEDBACK_RULES = `Feedback rules (the learner is a Hebrew speaker; all explanations in simple, warm Hebrew):
- The learner's text comes from speech-to-text. NEVER correct punctuation, capitalization or spelling – those are transcription artifacts.
- Pick at most TWO corrections, the most important ones. Many answers need zero or one. Do not nitpick.
- kind "error" = a real grammatical/lexical mistake that a native speaker would notice or that hurts meaning (e.g. "I am agree", "He don't", wrong tense, Hebrew calque).
- kind "improvement" = the sentence is correct but a more natural phrasing exists. Make clear in explanation_he that the original was fine.
- verdict: "great" if natural and correct, "good" if understandable with small issues, "needs_fix" only for errors that block meaning.
- natural_version: how a friendly native speaker would say the same idea, at the learner's level (not much longer).
- tip_he: one short, encouraging sentence in Hebrew. Praise what was done well when possible.
- Never comment on accent or pronunciation – you only see text. The goal is intelligibility and confidence, not erasing an Israeli accent.`;

function levelStyle(level) {
  return {
    A1: 'Use very short, simple sentences (max ~10 words), present simple, very common words. Speak slowly and clearly.',
    A2: 'Use short sentences and everyday vocabulary. Avoid idioms and complex tenses.',
    B1: 'Use natural everyday English with some common phrasal verbs. Keep replies to 1–2 sentences.',
    B2: 'Use natural, fluent English with idioms where appropriate. Keep replies to 1–3 sentences.',
    C1: 'Use rich, natural English. Keep replies concise (1–3 sentences).',
  }[level] || 'Use short, simple sentences.';
}

const clip = (s, n = 600) => String(s ?? '').slice(0, n);

function historyText(history) {
  return (history || [])
    .slice(-24)
    .map((h) => `${h.role === 'tutor' ? 'TUTOR' : 'LEARNER'}: ${clip(h.text)}`)
    .join('\n');
}

// ---------- מורה לשיחה ----------
export async function tutorTurn({ scenario, level, interests, history, userText, turnIndex }) {
  if (!aiEnabled()) return demoTutorTurn({ scenario, userText, turnIndex });
  const system = `You are a warm, encouraging English conversation tutor for Hebrew speakers, doing a spoken role-play.
Scenario: ${scenario.setting}
Your role: ${scenario.tutorRole}. Stay in character in "reply".
Learner goal: ${scenario.goalEn}
Learner CEFR level: ${level}. ${levelStyle(level)}
Learner interests: ${(interests || []).join(', ') || 'not specified'}.

Write "reply" as your next spoken line: react naturally to what the learner actually said, then move the conversation forward (usually with one question). It will be read aloud by text-to-speech, so no emojis, lists or stage directions.
"reply_he": a natural Hebrew translation of reply. "reply_simple": the same reply rephrased in simpler English.
"goal_achieved": true only once, looking at the whole conversation, the learner has accomplished every part of the goal.
"new_phrases": 0–2 useful phrases from this exchange worth saving (English, Hebrew meaning, short example sentence), only if genuinely useful at this level.
If the learner wrote in Hebrew or seems stuck, stay kind: answer briefly in character and gently invite them to try in English.

${FEEDBACK_RULES}`;
  const user = `Conversation so far:\n${historyText(history)}\n\nLEARNER (latest, transcribed from speech): ${clip(userText, 800)}`;
  const out = await callClaude({ system, user, schema: TURN_SCHEMA });
  return { ...out, demo: false };
}

export async function tutorAssist({ kind, scenario, level, history }) {
  const last = [...(history || [])].reverse().find((h) => h.role === 'tutor')?.text || '';
  if (!aiEnabled()) return demoAssist({ kind, scenario, history });
  const task = {
    hint: 'Give the learner ONE example of what they could say next (en), at their level, and in "he" a short Hebrew explanation of the idea behind it.',
    explain: 'Explain in Hebrew ("he") what the tutor\'s last line means and how the learner might respond. Put a key phrase from it in "en".',
    simpler: 'Rephrase the tutor\'s last line in much simpler English ("en") and translate it to Hebrew ("he").',
  }[kind];
  const system = `You help a Hebrew-speaking English learner (CEFR ${level}) during a role-play: ${scenario.setting}. ${task}`;
  const user = `Conversation so far:\n${historyText(history)}\n\nTutor's last line: ${clip(last)}`;
  return { ...(await callClaude({ system, user, schema: ASSIST_SCHEMA, maxTokens: 800 })), demo: false };
}

// ---------- הערכת משימת דיבור (בשיעור / שימוש במילה) ----------
export async function evaluateSpeech({ promptEn, promptHe, model, keywords, targetTerm, level, transcript }) {
  if (!aiEnabled()) return demoEvaluate({ keywords, targetTerm, transcript, model });
  const system = `You evaluate a short spoken answer by a Hebrew-speaking English learner (CEFR ${level}).
"task_achieved": true if the answer is a relevant, understandable attempt that does what the task asked (even with mistakes). Be fair, not harsh: communication matters more than perfection. False if it is off-topic, only one or two words when a sentence was needed, or not in English.
"uses_target": ${targetTerm ? `true if the learner used the target expression "${targetTerm}" (or a natural grammatical variant) correctly and meaningfully in a NEW sentence.` : 'always true (no target).'}
"encouragement_he": one short warm sentence in Hebrew.

${FEEDBACK_RULES}`;
  const user = `Task (English): ${clip(promptEn)}\nTask (Hebrew): ${clip(promptHe)}\n${model ? `Example of a good answer: ${clip(model)}\n` : ''}${targetTerm ? `Target expression: ${targetTerm}\n` : ''}\nLearner's answer (transcribed from speech): ${clip(transcript, 800)}`;
  return { ...(await callClaude({ system, user, schema: EVAL_SCHEMA })), demo: false };
}

// ---------- אבחון דיבור ----------
export async function assessDiagnosticSpeaking(answers) {
  const valid = answers.filter((a) => String(a.transcript || '').trim());
  if (!valid.length) return null;
  if (!aiEnabled()) return { ...demoDiagnostic(valid), demo: true };
  const system = `You estimate the CEFR speaking level of a Hebrew-speaking English learner from transcripts of short spoken answers (prompts increase in difficulty).
Judge range of vocabulary and grammar, ability to give reasons/details, and coherence. The text is from speech-to-text: ignore punctuation/capitalization, and do not judge pronunciation.
This is an educational estimate, not a certification. Write strengths_he and focus_he in Hebrew: 1–2 short, concrete, encouraging sentences each.`;
  const user = valid
    .map((a, i) => `Prompt ${i + 1} (${a.level}): ${clip(a.promptEn)}\nAnswer (${Math.round(a.seconds || 0)}s): ${clip(a.transcript, 1200)}`)
    .join('\n\n');
  return { ...(await callClaude({ system, user, schema: DIAG_SCHEMA, maxTokens: 1000 })), demo: false };
}

// ======================= מצב הדגמה (ללא AI) =======================
const RULES = [
  { re: /\bi am agree\b/i, better: 'I agree', kind: 'error', he: 'ב-agree לא משתמשים ב-am: אומרים I agree.' },
  { re: /\b(he|she|it) (don't)\b/i, better: (m) => `${m[1]} doesn't`, kind: 'error', he: 'בגוף שלישי יחיד (he/she/it) אומרים doesn\'t.' },
  { re: /\b(he|she|it) (have)\b/i, better: (m) => `${m[1]} has`, kind: 'error', he: 'בגוף שלישי יחיד: has ולא have.' },
  { re: /\b(he|she) (like|want|work|live|go)\b/i, better: (m) => `${m[1]} ${m[2] === 'go' ? 'goes' : m[2] + 's'}`, kind: 'error', he: 'בהווה פשוט, בגוף שלישי יחיד מוסיפים s לפועל.' },
  { re: /\bi want\b/i, better: 'I\'d like', kind: 'improvement', he: 'I want תקין, אבל בהזמנה I\'d like נשמע מנומס יותר.' },
  { re: /\bgive me\b/i, better: 'Can I have', kind: 'improvement', he: 'Give me תקין דקדוקית, אבל עלול להישמע חד. Can I have מנומס יותר.' },
  { re: /\bi (go|eat|see|do) yesterday\b/i, better: (m) => `I ${{ go: 'went', eat: 'ate', see: 'saw', do: 'did' }[m[1].toLowerCase()]} yesterday`, kind: 'error', he: 'כשמדברים על אתמול משתמשים בזמן עבר.' },
  { re: /\bmore better\b/i, better: 'better', kind: 'error', he: 'better כבר אומר "יותר טוב" – לא צריך more.' },
  { re: /\bi am (\d+) years\b(?! old)/i, better: (m) => `I am ${m[1]} years old`, kind: 'improvement', he: 'בדרך כלל מוסיפים old: I\'m 30 years old (או פשוט I\'m 30).' },
];

export function demoFeedback(text) {
  const t = String(text || '');
  const corrections = [];
  let natural = t;
  for (const r of RULES) {
    const m = t.match(r.re);
    if (m && corrections.length < 2) {
      const better = typeof r.better === 'function' ? r.better(m) : r.better;
      corrections.push({ you_said: m[0], better, kind: r.kind, explanation_he: r.he });
      natural = natural.replace(m[0], better);
    }
  }
  const words = t.trim().split(/\s+/).filter(Boolean).length;
  const hasError = corrections.some((c) => c.kind === 'error');
  return {
    verdict: hasError ? 'good' : words >= 4 ? 'great' : 'good',
    corrections,
    natural_version: natural,
    tip_he: words < 4 ? 'נסו להוסיף עוד פרט אחד – משפט מלא נשמע טבעי יותר.' : hasError ? 'הרעיון ברור – תיקון קטן וזה מושלם.' : 'יופי! משפט ברור ומובן.',
  };
}

const norm = (s) => String(s || '').toLowerCase().replace(/[’`]/g, "'");

function demoTutorTurn({ scenario, userText, turnIndex }) {
  const lines = scenario.demo;
  const prev = lines[Math.min(turnIndex, lines.length - 1)];
  const next = lines[Math.min(turnIndex + 1, lines.length - 1)];
  const u = norm(userText);
  const onTask = !prev.expect.length || prev.expect.some((k) => u.includes(k));
  const reply = onTask ? next : { ...prev, en: `Sorry, could you say that again? ${prev.simple}`, he: `סליחה, אפשר לומר שוב? ${prev.he}` };
  return {
    reply: reply.en,
    reply_he: reply.he,
    reply_simple: reply.simple,
    goal_achieved: onTask && turnIndex + 1 >= lines.length - 1,
    feedback: demoFeedback(userText),
    new_phrases: [],
    advanced: onTask,
    demo: true,
  };
}

function demoAssist({ kind, scenario, history }) {
  const tutorTurns = (history || []).filter((h) => h.role === 'tutor').length;
  const line = scenario.demo[Math.max(0, Math.min(tutorTurns - 1, scenario.demo.length - 1))];
  if (kind === 'hint') return { en: line.hintEn, he: line.hintHe, demo: true };
  if (kind === 'explain') return { en: line.en, he: line.he, demo: true };
  return { en: line.simple, he: line.he, demo: true };
}

function demoEvaluate({ keywords = [], targetTerm, transcript, model }) {
  const u = norm(transcript);
  const words = u.split(/\s+/).filter(Boolean).length;
  const hit = !keywords.length || keywords.some((k) => u.includes(norm(k)));
  const targetCore = targetTerm ? norm(targetTerm).replace(/[…?.!]/g, '').split('/')[0].trim() : '';
  const usesTarget = targetTerm ? u.includes(targetCore) || targetCore.split(' ').filter((w) => w.length > 3).every((w) => u.includes(w)) : true;
  const fb = demoFeedback(transcript);
  if (model && fb.corrections.length === 0 && words < 4) fb.natural_version = model;
  return {
    task_achieved: words >= 3 && hit,
    uses_target: usesTarget && words >= 3,
    feedback: fb,
    encouragement_he: words >= 3 && hit ? 'כל הכבוד על הניסיון!' : 'נסו לענות במשפט מלא שקשור לשאלה.',
    demo: true,
  };
}

function demoDiagnostic(answers) {
  // הערכה גסה בלבד לפי אורך, מגוון מילים ושימוש בזמן עבר/מילות קישור – מסומנת כהדגמה
  const text = answers.map((a) => norm(a.transcript)).join(' ');
  const words = text.split(/\s+/).filter(Boolean);
  const unique = new Set(words).size;
  const connectors = ['because', 'but', 'so', 'although', 'however', 'which', 'when', 'if'].filter((c) => words.includes(c)).length;
  const past = /\b(went|was|were|did|had|saw|visited|\w+ed)\b/.test(text);
  let score = 0;
  if (words.length > 20) score++;
  if (unique > 30) score++;
  if (connectors >= 2) score++;
  if (past) score++;
  if (words.length > 70 && connectors >= 3) score++;
  const level = ['A1', 'A1', 'A2', 'B1', 'B1', 'B2'][score];
  return {
    level,
    strengths_he: 'ענית בקול על השאלות – זה הצעד הכי חשוב.',
    focus_he: connectors < 2 ? 'נסו לחבר משפטים עם because / but / so כדי להרחיב תשובות.' : 'המשיכו להרחיב תשובות עם דוגמאות ופרטים.',
  };
}
