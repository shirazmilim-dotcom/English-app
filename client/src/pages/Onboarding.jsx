import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useApp, navigate } from '../ctx.js';
import { speak, stopSpeaking } from '../lib/speech.js';
import { Spinner, ErrorBox, En, ProgressBar, Notice, SpeakButton, Confetti, Mixed } from '../components/ui.jsx';
import Recorder from '../components/Recorder.jsx';
import { SoundHelpLink } from '../components/SoundHelp.jsx';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const MINUTES = [5, 10, 15, 20, 30];
const LEVEL_NAMES = { A1: 'מתחילים', A2: 'בסיסי', B1: 'בינוני', B2: 'בינוני־גבוה', C1: 'מתקדם' };

/** בוחר את הפריט הבא באבחון אדפטיבי: עולה רמה אחרי תשובה נכונה, יורד אחרי שגויה */
function pickNext(bank, used, levelIdx) {
  for (let d = 0; d < LEVELS.length; d++) {
    for (const li of [levelIdx + d, levelIdx - d]) {
      if (li < 0 || li >= LEVELS.length) continue;
      const item = bank.find((i) => i.level === LEVELS[li] && !used.has(i.id));
      if (item) return item;
    }
  }
  return null;
}

export default function Onboarding({ checkpoint }) {
  const { user, setUser } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(checkpoint ? 'listening' : 'welcome');
  const [profile, setProfile] = useState({ goals: user.goals || [], interests: user.interests || [], dailyMinutes: user.dailyMinutes || 15 });
  const [answers, setAnswers] = useState({ listening: [], vocab: [], speaking: [] });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const t0 = useRef(Date.now());

  const load = () => api('/diagnostic').then(setData).catch(setError);
  useEffect(() => {
    load();
  }, []);

  const startLevel = checkpoint ? Math.max(0, LEVELS.indexOf(user.level)) : 1;
  const n = checkpoint ? 4 : 6;

  const finish = async (skipped = false, speaking = answers.speaking) => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await api('/diagnostic/complete', {
        method: 'POST',
        timeout: 90000,
        body: {
          kind: checkpoint ? 'checkpoint' : 'initial',
          profile: checkpoint ? undefined : profile,
          skipped,
          listening: answers.listening,
          vocab: answers.vocab,
          speaking,
          durationSec: (Date.now() - t0.current) / 1000,
        },
      });
      if (skipped) {
        setUser(r.user);
        navigate('/');
        return;
      }
      setResult(r);
      setStep('result');
    } catch (e) {
      setError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !data) return <div className="center-page"><ErrorBox error={error} onRetry={load} /></div>;
  if (!data) return <div className="center-page"><Spinner /></div>;

  const steps = checkpoint ? ['listening', 'vocab', 'speaking', 'result'] : ['welcome', 'goals', 'interests', 'minutes', 'listening', 'vocab', 'speaking', 'result'];
  const idx = steps.indexOf(step);

  return (
    <div className="onboarding">
      <div className="ob-top">
        {checkpoint ? <a href="#/progress" className="link-btn">✕ יציאה</a> : <span className="brand"><span aria-hidden="true">🗣️</span> English Coach</span>}
        <ProgressBar value={idx} max={steps.length - 1} label="התקדמות באבחון" />
      </div>
      <div className="ob-body">
        {step === 'welcome' && (
          <div className="stack center-text pop-in">
            <div className="hero-emoji" aria-hidden="true">👋</div>
            <h1>היי {user.username}, נעים להכיר!</h1>
            <p className="lead">נתחיל באבחון קצר (כ־7 דקות) כדי לבנות לך מסלול שמתאים בדיוק לרמה ולמטרות שלך: כמה שאלות היכרות, האזנה, אוצר מילים וקצת דיבור.</p>
            <Notice kind="muted" icon="ℹ️">זו הערכה לימודית שעוזרת לנו לבחור נקודת התחלה – לא מבחן הסמכה רשמי. אין כאן "להיכשל".</Notice>
            <button className="btn btn-primary btn-big" onClick={() => setStep('goals')}>מתחילים</button>
            <button className="link-btn" onClick={() => setStep('skip')}>לדלג על האבחון ולהתחיל מרמת מתחילים</button>
          </div>
        )}
        {step === 'skip' && (
          <div className="stack center-text">
            <h2>להתחיל מההתחלה?</h2>
            <p>נתחיל בשלב A1. תמיד אפשר לעשות אבחון ביניים בהמשך ממסך ההתקדמות.</p>
            <ErrorBox error={error} />
            <button className="btn btn-primary btn-big" disabled={submitting} onClick={() => finish(true)}>כן, מתחילים ב־A1</button>
            <button className="link-btn" onClick={() => setStep('welcome')}>חזרה</button>
          </div>
        )}
        {step === 'goals' && (
          <ChoiceStep
            title="למה חשוב לך ללמוד אנגלית?"
            sub="אפשר לבחור כמה"
            options={data.goals.map((g) => ({ id: g.id, label: g.he }))}
            value={profile.goals}
            onChange={(goals) => setProfile({ ...profile, goals })}
            onNext={() => setStep('interests')}
          />
        )}
        {step === 'interests' && (
          <ChoiceStep
            title="מה מעניין אותך?"
            sub="נשלב את הנושאים האלה בשיחות ובמילים – בלי לוותר על הבסיס"
            options={data.interests.map((g) => ({ id: g.id, label: `${g.emoji} ${g.he}` }))}
            value={profile.interests}
            onChange={(interests) => setProfile({ ...profile, interests })}
            onNext={() => setStep('minutes')}
            grid
          />
        )}
        {step === 'minutes' && (
          <div className="stack pop-in">
            <h2>כמה זמן ביום מתאים לך?</h2>
            <p className="muted">עקביות חשובה יותר מכמות. גם 10 דקות ביום עושות הבדל.</p>
            <div className="chips big">
              {MINUTES.map((m) => (
                <button key={m} className={`chip ${profile.dailyMinutes === m ? 'on' : ''}`} onClick={() => setProfile({ ...profile, dailyMinutes: m })} aria-pressed={profile.dailyMinutes === m}>
                  {m} דק׳
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-big" onClick={() => setStep('listening')}>המשך לאבחון</button>
          </div>
        )}
        {step === 'listening' && (
          <QuizStep
            key="listening"
            kind="listening"
            bank={data.listening}
            n={n}
            startLevel={startLevel}
            onDone={(a) => {
              setAnswers((s) => ({ ...s, listening: a }));
              setStep('vocab');
            }}
          />
        )}
        {step === 'vocab' && (
          <QuizStep
            key="vocab"
            kind="vocab"
            bank={data.vocab}
            n={n}
            startLevel={startLevel}
            onDone={(a) => {
              setAnswers((s) => ({ ...s, vocab: a }));
              setStep('speaking');
            }}
          />
        )}
        {step === 'speaking' && (
          <SpeakingStep
            prompts={checkpoint ? data.speaking.slice(1) : data.speaking}
            submitting={submitting}
            error={error}
            onDone={(sp) => {
              setAnswers((s) => ({ ...s, speaking: sp }));
              finish(false, sp);
            }}
          />
        )}
        {step === 'result' && result && <Result result={result.result} checkpoint={checkpoint} onGo={() => { setUser(result.user); navigate(checkpoint ? '/progress' : '/path'); }} />}
      </div>
    </div>
  );
}

function ChoiceStep({ title, sub, options, value, onChange, onNext, grid }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="stack pop-in">
      <h2>{title}</h2>
      {sub && <p className="muted">{sub}</p>}
      <div className={`chips ${grid ? 'grid' : ''}`}>
        {options.map((o) => (
          <button key={o.id} className={`chip ${value.includes(o.id) ? 'on' : ''}`} onClick={() => toggle(o.id)} aria-pressed={value.includes(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <button className="btn btn-primary btn-big" onClick={onNext}>{value.length ? 'המשך' : 'דילוג'}</button>
    </div>
  );
}

function QuizStep({ kind, bank, n, startLevel, onDone }) {
  const [levelIdx, setLevelIdx] = useState(startLevel);
  const [used, setUsed] = useState(new Set());
  const [answers, setAnswers] = useState([]);
  const [item, setItem] = useState(() => pickNext(bank, new Set(), startLevel));
  const [plays, setPlays] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  const play = async () => {
    setPlaying(true);
    setError(null);
    try {
      await speak(item.audio, { rate: item.level === 'A1' ? 0.85 : 0.95 });
      setPlays((p) => p + 1);
    } catch {
      setError('ההשמעה נכשלה. אפשר לנסות שוב, או לדלג עם "לא יודע/ת".');
    }
    setPlaying(false);
  };

  const choose = async (choice) => {
    setBusy(true);
    setError(null);
    stopSpeaking();
    try {
      const r = await api('/diagnostic/check', { method: 'POST', body: { id: item.id, choice } });
      const nextAnswers = [...answers, { id: item.id, choice }];
      const nextUsed = new Set(used).add(item.id);
      const nextLevel = Math.max(0, Math.min(LEVELS.length - 1, levelIdx + (r.correct ? 1 : -1)));
      setAnswers(nextAnswers);
      setUsed(nextUsed);
      setLevelIdx(nextLevel);
      const next = nextAnswers.length < n ? pickNext(bank, nextUsed, nextLevel) : null;
      if (!next) return onDone(nextAnswers);
      setItem(next);
      setPlays(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!item) return null;
  return (
    <div className="stack pop-in" key={item.id}>
      <div className="step-kicker">{kind === 'listening' ? '👂 הבנת הנשמע' : '📖 אוצר מילים והבנת משפטים'} · שאלה {answers.length + 1} מתוך {n}</div>
      {kind === 'listening' ? (
        <>
          <h2>האזינו ובחרו את התשובה</h2>
          <p className="muted">אין טקסט – רק להקשיב. אפשר להשמיע עד 2 פעמים. <SoundHelpLink /></p>
          <button className={`play-big ${playing ? 'playing' : ''}`} onClick={play} disabled={playing || plays >= 2} aria-label="השמעת הקטע">
            <span aria-hidden="true">{playing ? '🔉' : '▶'}</span>
            <span>{playing ? 'משמיע…' : plays === 0 ? 'השמעה' : plays === 1 ? 'השמעה נוספת' : 'הושמע פעמיים'}</span>
          </button>
          <h3>{item.qHe}</h3>
        </>
      ) : (
        <>
          <h2>{item.qHe}</h2>
          <En block className="quiz-q">{item.q}</En>
        </>
      )}
      <div className="options">
        {item.options.map((o, i) => (
          <button key={i} className="option" disabled={busy || (kind === 'listening' && plays === 0)} onClick={() => choose(i)}>
            {/[a-z]/i.test(o) && !/[֐-׿]/.test(o) ? <En>{o}</En> : o}
          </button>
        ))}
      </div>
      {kind === 'listening' && plays === 0 && <p className="tiny muted center-text">השמיעו את הקטע כדי לענות</p>}
      <ErrorBox error={error} />
      <button className="link-btn" disabled={busy} onClick={() => choose(-1)}>לא יודע/ת – לשאלה הבאה</button>
    </div>
  );
}

function SpeakingStep({ prompts, onDone, submitting, error }) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const p = prompts[i];
  const next = () => {
    const all = [...results, { id: p.id, ...current }];
    setResults(all);
    setCurrent(null);
    if (i + 1 < prompts.length) setI(i + 1);
    else onDone(all.map((r) => ({ id: r.id, transcript: r.transcript, seconds: r.seconds, typed: r.typed })));
  };
  if (submitting)
    return (
      <div className="stack center-text">
        <Spinner label="מנתחים את התשובות ובונים לך מסלול…" />
      </div>
    );
  if (!p) return <ErrorBox error={error} onRetry={() => onDone(results)} />;
  return (
    <div className="stack pop-in" key={p.id}>
      <div className="step-kicker">🎙️ דיבור · משימה {i + 1} מתוך {prompts.length} (הקושי עולה)</div>
      <h2>ענו בקול, באנגלית</h2>
      <div className="prompt-card">
        <div className="row gap-s">
          <En block className="prompt-en">{p.promptEn}</En>
          <SpeakButton text={p.promptEn} small />
        </div>
        <p className="muted"><Mixed>{p.promptHe}</Mixed></p>
      </div>
      <p className="tiny muted">אין צורך בתשובה מושלמת. דברו כמה משפטים, כמו שאתם יכולים. אפשר לעצור ולהקליט שוב.</p>
      {!current ? (
        <Recorder onResult={setCurrent} label="לחצו ודברו (עד דקה)" />
      ) : (
        <div className="card soft stack-s pop-in">
          <span className="label">{current.typed ? 'מה שהקלדת:' : 'מה ששמענו:'}</span>
          <En block>{current.transcript}</En>
          {current.audioUrl && <audio controls src={current.audioUrl} className="own-audio" aria-label="ההקלטה שלך" />}
          {current.typed && <Notice kind="muted">תשובה מוקלדת לא נכנסת להערכת הדיבור.</Notice>}
          <div className="row gap wrap">
            <button className="btn btn-primary grow" onClick={next}>{i + 1 < prompts.length ? 'למשימה הבאה' : 'לסיום ולתוצאה'}</button>
            <button className="btn btn-ghost" onClick={() => setCurrent(null)}>🔁 להקליט שוב</button>
          </div>
        </div>
      )}
      <ErrorBox error={error} />
      <button className="link-btn" onClick={() => onDone(results.map((r) => ({ id: r.id, transcript: r.transcript, seconds: r.seconds, typed: r.typed })))}>
        לדלג על חלק הדיבור (ההערכה תתבסס על האזנה ואוצר מילים בלבד)
      </button>
    </div>
  );
}

function Result({ result, checkpoint, onGo }) {
  const [boom, setBoom] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBoom(false), 2500);
    return () => clearTimeout(t);
  }, []);
  const s = result.skills;
  return (
    <div className="stack pop-in">
      <Confetti show={boom} />
      <div className="center-text">
        <div className="level-badge big">{result.level}</div>
        <h1>{checkpoint ? 'תוצאת אבחון הביניים' : 'הערכת הרמה הראשונית שלך'}</h1>
        <p className="lead">רמה {result.level} – {LEVEL_NAMES[result.level]}</p>
        <Notice kind="muted" icon="ℹ️">הערכה לימודית לפי סולם CEFR, על בסיס מספר קטן של שאלות – לא תעודה רשמית. היא תתעדכן ככל שתתרגל/י.</Notice>
      </div>
      <div className="skills-grid">
        <SkillTile icon="👂" name="הבנת הנשמע" level={s.listening.level} sub={`${s.listening.correct}/${s.listening.total} תשובות נכונות`} />
        <SkillTile icon="📖" name="אוצר מילים ומבנים" level={s.vocab.level} sub={`${s.vocab.correct}/${s.vocab.total} תשובות נכונות`} />
        <SkillTile icon="🎙️" name="דיבור" level={s.speaking?.level} sub={s.speaking ? (s.speaking.demo ? 'הערכה גסה (מצב הדגמה)' : 'הערכת AI מתוך התשובות') : 'לא נבדק'} />
      </div>
      <div className="card">
        <h3>✅ מה כבר יש לך</h3>
        <p>{result.knowHe}</p>
        {result.speakingStrengthsHe && <p><Mixed>{result.speakingStrengthsHe}</Mixed></p>}
        <h3>🎯 במה כדאי להתמקד</h3>
        <p>{result.focusHe}</p>
        {result.speakingFocusHe && <p><Mixed>{result.speakingFocusHe}</Mixed></p>}
        <p className="tiny muted">אין כאן ציון הגייה: הערכת הגייה אמינה דורשת ניתוח של האודיו עצמו, ויכולת זו עדיין לא מחוברת.</p>
      </div>
      {!checkpoint && (
        <div className="card soft">
          <h3>🗺️ המסלול שלך</h3>
          <p>
            נתחיל בשלב <strong>{result.pathLevel}</strong>
            {result.level !== result.pathLevel && ' (השלב המתקדם ביותר שקיים כרגע)'}. שלבים קודמים פתוחים לחזרה, בלי חובה.
          </p>
        </div>
      )}
      <button className="btn btn-primary btn-big" onClick={onGo}>{checkpoint ? 'חזרה למסך ההתקדמות' : 'למסלול האישי שלי'}</button>
    </div>
  );
}

function SkillTile({ icon, name, level, sub }) {
  return (
    <div className="skill-tile">
      <span className="skill-icon" aria-hidden="true">{icon}</span>
      <div className="skill-name">{name}</div>
      <div className="skill-level">{level || '—'}</div>
      <div className="tiny muted">{sub}</div>
    </div>
  );
}
