// שירותי קול בצד השרת (אופציונלי): הקראה (TTS) ותמלול (STT) דרך OpenAI.
// ללא OPENAI_API_KEY הדפדפן משתמש ב-Web Speech API המובנה (חינמי, איכות משתנה לפי דפדפן).
// הקלטות לא נשמרות: האודיו מועבר לתמלול ונמחק מהזיכרון מיד.

export const serverTtsEnabled = () => !!process.env.OPENAI_API_KEY;
export const serverSttEnabled = () => !!process.env.OPENAI_API_KEY;

const TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const STT_MODEL = process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe';
const VOICES = ['coral', 'echo', 'sage', 'ash'];

// מטמון קטן בזיכרון כדי לא לשלם שוב על אותו משפט
const cache = new Map();
const CACHE_MAX = 300;

export async function synthesize(text, { speed = 1, voice = 0 } = {}) {
  const v = VOICES[Math.abs(Number(voice) || 0) % VOICES.length];
  const sp = Math.min(1.2, Math.max(0.6, Number(speed) || 1));
  const key = `${v}|${sp}|${text}`;
  if (cache.has(key)) return cache.get(key);
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: v,
      input: text,
      speed: sp,
      response_format: 'mp3',
      instructions:
        sp < 0.95
          ? 'Speak clearly and slowly, like a friendly English teacher talking to a learner. Natural American accent.'
          : 'Speak naturally and clearly, in a friendly tone. Natural American accent.',
    }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text().catch(() => '')}`);
  const buf = Buffer.from(await res.arrayBuffer());
  cache.set(key, buf);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return buf;
}

export async function transcribe(buffer, mimeType = 'audio/webm') {
  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), `speech.${ext}`);
  form.append('model', STT_MODEL);
  form.append('language', 'en');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`STT failed: ${res.status}`);
  const data = await res.json();
  return String(data.text || '').trim();
}
