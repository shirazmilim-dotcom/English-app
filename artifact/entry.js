// גרסת ניסיון שרצה כולה בדפדפן (כ-Artifact ב-claude.ai)
globalThis.__ENV = { TRIAL_TYPED_OK: '1', DB_PATH: 'browser' };
globalThis.process = { env: globalThis.__ENV, cwd: () => '/' };
window.__TRIAL__ = true;

const sample = await Promise.race([
  window.claude?.use ? window.claude.use('sample').catch(() => null) : Promise.resolve(null),
  new Promise((r) => setTimeout(() => r(null), 5000)),
]);
if (sample) process.env.ANTHROPIC_API_KEY = 'via-claude-sample';

await import('../client/src/main.jsx');
