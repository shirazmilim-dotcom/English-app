// קול בדפדפן: הקראה (TTS) והקלטה + זיהוי דיבור (STT).
// אם השרת מוגדר עם שירות קול – משתמשים בו (איכות גבוהה ועקבית). אחרת – Web Speech API של הדפדפן.
import { api } from '../api.js';

let config = { tts: 'browser', stt: 'browser' };
export const setSpeechConfig = (c) => (config = { ...config, ...c });

// ---------------- הקראה ----------------
let currentAudio = null;
const audioCache = new Map();

export const ttsSupported = () => config.tts === 'server' || 'speechSynthesis' in window;

function pickVoices() {
  const all = window.speechSynthesis?.getVoices?.() || [];
  const en = all.filter((v) => /^en[-_]/i.test(v.lang));
  const pref = (re) => en.filter((v) => re.test(v.name));
  const nice = [...pref(/natural|neural|google|samantha|aria|jenny|guy|daniel|karen|moira/i), ...en];
  const us = nice.filter((v) => /en[-_]US/i.test(v.lang));
  return [...new Set([...us, ...nice])];
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => pickVoices();
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

/** משמיע טקסט באנגלית. rate: 0.6–1.2. voice: אינדקס דובר (לשיחות עם כמה דמויות). */
export async function speak(text, { rate = 1, voice = 0 } = {}) {
  stopSpeaking();
  if (!text) return;
  if (config.tts === 'server') {
    const key = `${voice}|${rate}|${text}`;
    let url = audioCache.get(key);
    if (!url) {
      const blob = await api('/speech/tts', { method: 'POST', body: { text, speed: rate, voice } });
      url = URL.createObjectURL(blob);
      audioCache.set(key, url);
    }
    const audio = new Audio(url);
    currentAudio = audio;
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onpause = resolve;
      audio.onerror = () => reject(new Error('audio'));
      audio.play().catch(reject);
    });
    return;
  }
  if (!window.speechSynthesis) throw new Error('no-tts');
  await new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voices = pickVoices();
    if (voices.length) u.voice = voices[voice % Math.min(voices.length, 3)];
    u.lang = u.voice?.lang || 'en-US';
    u.rate = rate;
    u.pitch = voice % 2 ? 0.95 : 1.05;
    // רשת ביטחון: יש דפדפנים שלא מפעילים onend – משחררים אחרי הזמן המשוער
    const words = text.split(/\s+/).length;
    const safety = setTimeout(resolve, ((words * 0.45) / rate + 2.5) * 1000);
    u.onend = () => { clearTimeout(safety); resolve(); };
    u.onerror = () => { clearTimeout(safety); resolve(); };
    window.speechSynthesis.speak(u);
    // באג ידוע בכרום: הקראה ארוכה נעצרת – "דחיפה" תקופתית
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) return clearInterval(keepAlive);
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
    u.addEventListener('end', () => clearInterval(keepAlive));
  });
}

// ---------------- הקלטה וזיהוי דיבור ----------------
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export function sttSupported() {
  return config.stt === 'server' ? !!window.MediaRecorder : !!SR;
}
export const micSupported = () => !!navigator.mediaDevices?.getUserMedia;

export function micErrorMessage(err) {
  const n = err?.name || err?.message || '';
  if (/NotAllowed|Permission|not-allowed|SecurityError/i.test(n))
    return { code: 'blocked', he: 'הגישה למיקרופון חסומה. כדי לדבר, אפשרו גישה למיקרופון בהגדרות הדפדפן (סמל המנעול ליד כתובת האתר) ורעננו את הדף.' };
  if (/NotFound|DevicesNotFound|audio-capture/i.test(n)) return { code: 'nomic', he: 'לא נמצא מיקרופון. חברו מיקרופון או אוזניות עם מיקרופון ונסו שוב.' };
  if (/NotReadable|TrackStart/i.test(n)) return { code: 'busy', he: 'המיקרופון תפוס על ידי אפליקציה אחרת. סגרו אותה ונסו שוב.' };
  if (/network/i.test(n)) return { code: 'network', he: 'זיהוי הדיבור דורש חיבור לאינטרנט. בדקו את החיבור ונסו שוב.' };
  return { code: 'unknown', he: 'לא הצלחנו להפעיל את המיקרופון. נסו שוב, או עברו לתרגול בהקלדה.' };
}

/**
 * מתחיל הקלטה. מחזיר בקר עם stop() שמחזיר { transcript, url, seconds }.
 * ההקלטה נשמרת רק בזיכרון הדפדפן (להשמעה חוזרת) ולא נשלחת לשמירה בשרת.
 */
export async function startRecording({ onInterim, onLevel } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const started = performance.now();
  const chunks = [];
  let recorder = null;
  try {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.start(250);
  } catch {
    recorder = null;
  }

  // מד עוצמה לחיווי ויזואלי
  let ctx, raf;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 256;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    const tick = () => {
      an.getByteTimeDomainData(data);
      let max = 0;
      for (const v of data) max = Math.max(max, Math.abs(v - 128));
      onLevel?.(Math.min(1, max / 60));
      raf = requestAnimationFrame(tick);
    };
    tick();
  } catch {
    /* אין חיווי עוצמה – לא קריטי */
  }

  // זיהוי דיבור בדפדפן (כשאין תמלול בשרת)
  let rec = null;
  let finalText = '';
  let interimText = '';
  let recError = null;
  let recEnded = Promise.resolve();
  if (config.stt !== 'server' && SR) {
    rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += (finalText ? ' ' : '') + r[0].transcript.trim();
        else interimText += r[0].transcript;
      }
      onInterim?.((finalText + ' ' + interimText).trim());
    };
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') recError = e;
    };
    recEnded = new Promise((resolve) => (rec.onend = resolve));
    try {
      rec.start();
    } catch (e) {
      recError = e;
    }
  }

  const cleanup = () => {
    cancelAnimationFrame(raf);
    ctx?.close().catch(() => {});
    stream.getTracks().forEach((t) => t.stop());
  };

  return {
    async stop() {
      const seconds = (performance.now() - started) / 1000;
      const recStopped = recorder
        ? new Promise((resolve) => {
            recorder.onstop = resolve;
            recorder.state !== 'inactive' ? recorder.stop() : resolve();
          })
        : Promise.resolve();
      if (rec) {
        try {
          rec.stop();
        } catch {}
      }
      await recStopped;
      await Promise.race([recEnded, new Promise((r) => setTimeout(r, 1500))]);
      cleanup();
      const blob = chunks.length ? new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }) : null;
      const url = blob ? URL.createObjectURL(blob) : null;
      let transcript = (finalText || interimText).trim();
      if (config.stt === 'server' && blob) {
        const res = await api('/speech/transcribe', { method: 'POST', raw: blob, headers: { 'Content-Type': blob.type || 'audio/webm' }, timeout: 30000 });
        transcript = res.text;
      }
      if (!transcript && recError) throw recError;
      return { transcript, url, seconds };
    },
    cancel() {
      try {
        rec?.abort();
      } catch {}
      try {
        recorder?.state !== 'inactive' && recorder?.stop();
      } catch {}
      cleanup();
    },
  };
}
