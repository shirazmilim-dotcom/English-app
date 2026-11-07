import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useApp, navigate } from '../ctx.js';
import { speak, stopSpeaking } from '../lib/speech.js';
import { Spinner, ErrorBox, En, SpeakButton, FeedbackCard, ProgressBar, Notice, Confetti, Mixed } from '../components/ui.jsx';
import Recorder from '../components/Recorder.jsx';

const BASE_RATE = { A1: 0.85, A2: 0.9, B1: 1, B2: 1, C1: 1 };
const STEPS = ['intro', 'vocab', 'listen', 'questions', 'vocabUse', 'speaking', 'summary'];
const STEP_LABEL = { intro: 'מטרה', vocab: 'מילים', listen: 'האזנה', questions: 'הבנה', vocabUse: 'שימוש במילים', speaking: 'דיבור', summary: 'סיכום' };

export default function Lesson({ id }) {
  const { config } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('intro');
  const [listenAnswers, setListenAnswers] = useState({}); // qid -> first choice
  const [retell, setRetell] = useState(null);
  const [vocabUse, setVocabUse] = useState({}); // term -> {achieved, seconds, typed}
  const [speaking, setSpeaking] = useState({}); // taskId -> {achieved, seconds, typed}
  const [summary, setSummary] = useState(null);
  const t0 = useRef(Date.now());

  const load = () => {
    setError(null);
    api(`/lessons/${id}`).then(setData).catch(setError);
  };
  useEffect(() => {
    load();
    return () => stopSpeaking();
  }, [id]);

  if (error && !data) return <ErrorBox error={error} onRetry={load} />;
  if (!data) return <Spinner />;
  const L = data.lesson;
  const rate = BASE_RATE[L.level] || 1;
  const go = (s) => {
    stopSpeaking();
    setStep(s);
    window.scrollTo(0, 0);
  };

  const complete = async () => {
    go('summary');
    setSummary({ loading: true });
    try {
      const totalSpoken = (retell && !retell.typed ? retell.seconds : 0);
      const r = await api(`/lessons/${id}/complete`, {
        method: 'POST',
        body: {
          listening: Object.entries(listenAnswers).map(([qid, choice]) => ({ qid, choice })),
          speaking: [
            ...Object.entries(speaking).map(([taskId, v]) => ({ taskId, ...v })),
          ],
          vocabUse: Object.entries(vocabUse).map(([term, v]) => ({ term, ...v })),
          retellSeconds: totalSpoken,
          durationSec: (Date.now() - t0.current) / 1000,
        },
      });
      setSummary(r);
    } catch (e) {
      setSummary({ error: e });
    }
  };

  return (
    <div className="lesson stack">
      <div className="lesson-top">
        <a href="#/path" className="link-btn" onClick={() => stopSpeaking()}>‹ למסלול</a>
        <div className="grow">
          <div className="tiny muted">
            {data.stage.id} · {data.unit?.title}
          </div>
          <h1 className="lesson-title">
            {L.titleHe} · <En>{L.title}</En>
          </h1>
        </div>
      </div>
      <div className="stepper" aria-label="שלבי השיעור">
        {STEPS.map((s, i) => (
          <span key={s} className={`step-dot ${s === step ? 'on' : STEPS.indexOf(step) > i ? 'done' : ''}`} title={STEP_LABEL[s]}>
            <span className="sr-only">{STEP_LABEL[s]}</span>
          </span>
        ))}
        <span className="tiny muted step-name">{STEP_LABEL[step]}</span>
      </div>

      {step === 'intro' && (
        <section className="stack pop-in">
          <div className="card goal-card">
            <span className="goal-icon" aria-hidden="true">🎯</span>
            <div>
              <div className="label">היכולת שנרכוש</div>
              <p className="goal-text">{data.unit?.canDo}</p>
              <p className="muted"><Mixed>{L.goalHe}</Mixed></p>
            </div>
          </div>
          <ol className="lesson-plan">
            <li>📚 {L.vocab.length} ביטויים חדשים בהקשר</li>
            <li>👂 האזנה לשיחה (קודם בלי טקסט) ו־{L.listening.questions.length} שאלות הבנה</li>
            <li>🗣️ שימוש בביטויים במשפטים שלך – בקול</li>
            <li>🎙️ {L.speaking.length} משימות דיבור עם משוב</li>
          </ol>
          <Notice kind="muted" icon="🏆">כדי לעבור את השיעור: לפחות 2 תשובות הבנה נכונות, 2 משימות דיבור שהושגו, ושימוש נכון בביטוי אחד לפחות.</Notice>
          <button className="btn btn-primary btn-big" onClick={() => go('vocab')}>מתחילים</button>
        </section>
      )}

      {step === 'vocab' && (
        <section className="stack pop-in">
          <h2>ביטויים לשיעור</h2>
          <p className="muted">השמיעו כל ביטוי, ואז אמרו אותו בקול בעצמכם. הביטויים יישמרו במאגר האישי שלכם בסוף השיעור.</p>
          <div className="vocab-cards">
            {L.vocab.map((v) => (
              <div key={v.term} className="vocab-card">
                <div className="row between gap-s">
                  <En className="term">{v.term}</En>
                  <SpeakButton text={v.term} small rate={rate} />
                </div>
                <div className="he-meaning">{v.he}</div>
                <div className="example">
                  <En block>{v.example}</En>
                  <SpeakButton text={v.example} small rate={rate} />
                </div>
                <div className="tiny muted">{v.exampleHe}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-big" onClick={() => go('listen')}>להאזנה</button>
        </section>
      )}

      {step === 'listen' && <ListenStep L={L} rate={rate} onNext={() => go('questions')} />}

      {step === 'questions' && (
        <QuestionsStep
          L={L}
          rate={rate}
          answers={listenAnswers}
          onAnswer={(qid, choice) => setListenAnswers((a) => (qid in a ? a : { ...a, [qid]: choice }))}
          retell={retell}
          setRetell={setRetell}
          lessonId={id}
          onNext={() => go('vocabUse')}
        />
      )}

      {step === 'vocabUse' && (
        <TaskList
          title="משתמשים בביטויים – במשפט משלכם"
          sub="המטרה: להראות שאתם יודעים להשתמש בביטוי במשפט חדש, לא רק לזהות אותו."
          tasks={L.vocabUse.map((v) => ({ key: v.term, term: v.term, he: L.vocab.find((x) => x.term === v.term)?.he, promptHe: v.promptHe }))}
          lessonId={id}
          results={vocabUse}
          setResult={(k, r) => setVocabUse((s) => ({ ...s, [k]: s[k]?.achieved ? { ...s[k], seconds: s[k].seconds + r.seconds } : r }))}
          kind="vocab"
          onNext={() => go('speaking')}
          demo={!config.ai}
        />
      )}

      {step === 'speaking' && (
        <TaskList
          title="משימות דיבור"
          sub="המורה שואל – אתם עונים בקול. אחרי כל תשובה תקבלו משוב קצר."
          tasks={L.speaking.map((t) => ({ key: t.id, ...t }))}
          lessonId={id}
          results={speaking}
          setResult={(k, r) => setSpeaking((s) => ({ ...s, [k]: s[k]?.achieved ? { ...s[k], seconds: s[k].seconds + r.seconds } : r }))}
          kind="speaking"
          rate={rate}
          onNext={complete}
          nextLabel="לסיום השיעור"
          demo={!config.ai}
        />
      )}

      {step === 'summary' && <Summary s={summary} L={L} retry={complete} restart={() => navigate(`/lesson/${id}?r=${Date.now()}`)} />}
    </div>
  );
}

function ListenStep({ L, rate, onNext }) {
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [current, setCurrent] = useState(-1);
  const stopRef = useRef(false);
  const playAll = async (r) => {
    if (playing) {
      stopRef.current = true;
      stopSpeaking();
      setPlaying(false);
      setCurrent(-1);
      return;
    }
    stopRef.current = false;
    setPlaying(true);
    for (let i = 0; i < L.listening.lines.length; i++) {
      if (stopRef.current) break;
      setCurrent(i);
      const line = L.listening.lines[i];
      try {
        await speak(line.text, { rate: r, voice: line.speaker === 'A' ? 0 : 1 });
      } catch {
        break;
      }
      await new Promise((res) => setTimeout(res, 250));
    }
    setPlaying(false);
    setCurrent(-1);
    if (!stopRef.current) setPlays((p) => p + 1);
  };
  useEffect(() => () => {
    stopRef.current = true;
    stopSpeaking();
  }, []);
  const speakers = [...new Map(L.listening.lines.map((l) => [l.speaker, l.name])).values()];
  return (
    <section className="stack pop-in">
      <h2>👂 האזנה ראשונה – בלי טקסט</h2>
      <p className="muted">{L.listening.titleHe}. הדוברים: {speakers.map((n, i) => <En key={n}>{n}{i < speakers.length - 1 ? ', ' : ''}</En>)}. נסו להבין את התמונה הכללית – לא כל מילה.</p>
      <button className={`play-big ${playing ? 'playing' : ''}`} onClick={() => playAll(rate)} aria-label={playing ? 'עצירה' : 'השמעת השיחה'}>
        <span aria-hidden="true">{playing ? '⏹' : '▶'}</span>
        <span>{playing ? `משמיע… (${current + 1}/${L.listening.lines.length})` : plays ? 'להשמיע שוב' : 'השמעת השיחה'}</span>
      </button>
      {!playing && (
        <button className="btn btn-ghost" onClick={() => playAll(rate * 0.75)}>🐢 השמעה איטית</button>
      )}
      <p className="tiny muted center-text">התמלול והתרגום ייפתחו אחרי שאלות ההבנה.</p>
      <button className="btn btn-primary btn-big" disabled={playing} onClick={onNext}>
        {plays ? 'לשאלות ההבנה' : 'דילוג לשאלות'}
      </button>
    </section>
  );
}

function QuestionsStep({ L, rate, answers, onAnswer, retell, setRetell, lessonId, onNext }) {
  const qs = L.listening.questions;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showT, setShowT] = useState(false);
  const [showHe, setShowHe] = useState(false);
  const done = i >= qs.length;
  const q = qs[i];
  const correct = picked !== null && picked === q?.answer;
  const pick = (k) => {
    if (picked !== null && correct) return;
    onAnswer(q.id, k);
    setPicked(k);
  };
  const highLevel = ['B1', 'B2', 'C1'].includes(L.level);
  return (
    <section className="stack pop-in">
      {!done ? (
        <>
          <div className="step-kicker">שאלה {i + 1} מתוך {qs.length}</div>
          {highLevel ? (
            <>
              <En block className="q-en">{q.q}</En>
              <p className="muted tiny">{q.qHe}</p>
            </>
          ) : (
            <>
              <h3>{q.qHe}</h3>
              <En block className="muted tiny">{q.q}</En>
            </>
          )}
          <div className="options">
            {q.options.map((o, k) => (
              <button
                key={k}
                className={`option ${picked === k ? (k === q.answer ? 'right' : 'wrong') : ''} ${picked !== null && correct && k === q.answer ? 'right' : ''}`}
                onClick={() => pick(k)}
                disabled={correct}
              >
                <En>{o}</En>
              </button>
            ))}
          </div>
          {picked !== null && (
            <Notice kind={correct ? 'success' : 'warn'} icon={correct ? '✅' : '🤔'}>
              {correct ? <Mixed>{q.explainHe}</Mixed> : 'לא בדיוק. נסו שוב, או השמיעו את השיחה מחדש.'}
            </Notice>
          )}
          <ListenAgain L={L} rate={rate} />
          {correct && (
            <button className="btn btn-primary btn-big" onClick={() => { setPicked(null); setI(i + 1); }}>
              {i + 1 < qs.length ? 'לשאלה הבאה' : 'המשך'}
            </button>
          )}
          {picked !== null && !correct && (
            <button className="link-btn" onClick={() => { setPicked(null); setI(i + 1); }}>לדלג לשאלה הבאה</button>
          )}
        </>
      ) : (
        <>
          <h2>עכשיו עם טקסט</h2>
          <div className="row gap wrap">
            <label className="toggle"><input type="checkbox" checked={showT} onChange={(e) => setShowT(e.target.checked)} /> הצגת תמלול</label>
            <label className="toggle"><input type="checkbox" checked={showHe} onChange={(e) => setShowHe(e.target.checked)} /> הצגת תרגום</label>
          </div>
          {(showT || showHe) && (
            <div className="dialogue">
              {L.listening.lines.map((l, k) => (
                <div key={k} className={`line speaker-${l.speaker}`}>
                  <div className="row gap-s">
                    <span className="speaker-name"><En>{l.name}</En></span>
                    {showT && <En block className="grow">{l.text}</En>}
                    {showT && <SpeakButton text={l.text} small rate={rate} voice={l.speaker === 'A' ? 0 : 1} slow />}
                  </div>
                  {showHe && <div className="he-line">{l.he}</div>}
                </div>
              ))}
            </div>
          )}
          <div className="card soft stack-s">
            <h3>🎙️ ספרו בקול מה שמעתם</h3>
            <p className="muted">במשפט או שניים באנגלית: מה קרה בשיחה? (תרגול חופשי – לא חובה)</p>
            {retell ? (
              <>
                <En block>“{retell.transcript}”</En>
                {retell.audioUrl && <audio controls src={retell.audioUrl} className="own-audio" />}
                <p className="tiny success-text">כל הכבוד! סיכום בעל פה הוא אחד התרגילים הכי טובים להבנה ולשטף.</p>
                <button className="link-btn" onClick={() => setRetell(null)}>🔁 להקליט שוב</button>
              </>
            ) : (
              <Recorder onResult={setRetell} compact label="לחצו וספרו בקצרה" />
            )}
          </div>
          <button className="btn btn-primary btn-big" onClick={onNext}>לשימוש בביטויים</button>
        </>
      )}
    </section>
  );
}

function ListenAgain({ L, rate }) {
  const [playing, setPlaying] = useState(false);
  const stop = useRef(false);
  const run = async (r) => {
    if (playing) {
      stop.current = true;
      stopSpeaking();
      return setPlaying(false);
    }
    stop.current = false;
    setPlaying(true);
    for (const line of L.listening.lines) {
      if (stop.current) break;
      try {
        await speak(line.text, { rate: r, voice: line.speaker === 'A' ? 0 : 1 });
      } catch {
        break;
      }
    }
    setPlaying(false);
  };
  useEffect(() => () => { stop.current = true; }, []);
  return (
    <div className="row gap-s center">
      <button className="btn btn-ghost btn-small" onClick={() => run(rate)}>{playing ? '⏹ עצירה' : '🔁 השמעה חוזרת'}</button>
      {!playing && <button className="btn btn-ghost btn-small" onClick={() => run(rate * 0.75)}>🐢 לאט</button>}
    </div>
  );
}

function TaskList({ title, sub, tasks, lessonId, results, setResult, kind, rate = 1, onNext, nextLabel = 'המשך', demo }) {
  const [i, setI] = useState(0);
  const t = tasks[i];
  const [attempt, setAttempt] = useState(null); // {transcript, audioUrl, typed, eval, loading, error}
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setAttempt(null);
    setShowHint(false);
    if (kind === 'speaking' && t?.promptEn) speak(t.promptEn, { rate, voice: 2 }).catch(() => {});
  }, [i]);

  const evaluate = async (r) => {
    setAttempt({ ...r, loading: true });
    try {
      const ev = await api('/speaking/evaluate', {
        method: 'POST',
        body: { lessonId, transcript: r.transcript, ...(kind === 'vocab' ? { term: t.term } : { taskId: t.key }) },
      });
      const achieved = kind === 'vocab' ? ev.task_achieved && ev.uses_target : ev.task_achieved;
      setResult(t.key, { achieved, seconds: r.typed ? 0 : r.seconds, typed: r.typed });
      setAttempt({ ...r, eval: ev, achieved });
    } catch (e) {
      setAttempt({ ...r, error: e });
    }
  };

  const done = results[t.key]?.achieved;
  return (
    <section className="stack pop-in" key={t.key}>
      <h2>{title}</h2>
      <p className="muted">{sub}</p>
      <div className="step-kicker">{i + 1} מתוך {tasks.length} {done && <span className="badge badge-ok">✓ הושג</span>}</div>
      <div className="prompt-card">
        {kind === 'vocab' ? (
          <>
            <div className="row gap-s">
              <En className="term">{t.term}</En>
              <SpeakButton text={t.term} small />
            </div>
            <div className="he-meaning">{t.he}</div>
            <p><Mixed>{t.promptHe}</Mixed></p>
          </>
        ) : (
          <>
            <div className="tutor-says">
              <span className="avatar-tutor" aria-hidden="true">🧑‍🏫</span>
              <En block className="prompt-en">{t.promptEn}</En>
              <SpeakButton text={t.promptEn} small rate={rate} voice={2} />
            </div>
            <p className="muted"><Mixed>{t.promptHe}</Mixed></p>
            {showHint ? (
              <div className="hint">💡 <En>{t.hintEn}</En></div>
            ) : (
              <button className="link-btn" onClick={() => setShowHint(true)}>💡 רמז</button>
            )}
          </>
        )}
      </div>

      {!attempt && <Recorder onResult={evaluate} />}
      {attempt?.loading && <Spinner label="בודקים את התשובה…" />}
      {attempt?.error && <ErrorBox error={attempt.error} onRetry={() => evaluate(attempt)} />}
      {attempt?.eval && (
        <>
          {attempt.audioUrl && (
            <div className="row gap-s">
              <span className="tiny muted">ההקלטה שלך:</span>
              <audio controls src={attempt.audioUrl} className="own-audio" />
            </div>
          )}
          <FeedbackCard
            said={attempt.transcript}
            fb={attempt.eval.feedback}
            demo={attempt.eval.demo}
            onRetry={() => setAttempt(null)}
            extra={
              <p className={attempt.achieved ? 'success-text' : 'warn-text'}>
                {attempt.achieved
                  ? `✓ ${attempt.eval.encouragement_he || 'המשימה הושגה!'}`
                  : kind === 'vocab' && !attempt.eval.uses_target
                  ? `כדי שזה ייחשב, השתמשו בביטוי "${t.term}" במשפט שלם משלכם.`
                  : attempt.eval.encouragement_he || 'נסו לענות במשפט מלא שעונה על השאלה.'}
              </p>
            }
          />
          {attempt.typed && <Notice kind="muted">תשובה מוקלדת: נספרת להבנה, אבל לא כתרגול דיבור.</Notice>}
        </>
      )}
      <div className="row gap wrap">
        {i + 1 < tasks.length ? (
          <button className="btn btn-primary grow" onClick={() => setI(i + 1)} disabled={attempt?.loading}>{attempt?.eval || done ? 'הבא' : 'דילוג'}</button>
        ) : (
          <button className="btn btn-primary grow" onClick={onNext} disabled={attempt?.loading}>{nextLabel}</button>
        )}
        {i > 0 && <button className="btn btn-ghost" onClick={() => setI(i - 1)}>הקודם</button>}
      </div>
      {demo && <p className="tiny muted">מצב הדגמה: ההערכה בודקת מילות מפתח ואורך תשובה בלבד – לא AI.</p>}
    </section>
  );
}

function Summary({ s, L, retry, restart }) {
  if (!s || s.loading) return <Spinner label="שומרים את ההתקדמות…" />;
  if (s.error) return <ErrorBox error={s.error} onRetry={retry} />;
  const nextLesson = s.path?.next;
  return (
    <section className="stack pop-in center-text">
      <Confetti show={s.passed} />
      <div className="summary-emoji" aria-hidden="true">{s.passed ? '🏆' : '💪'}</div>
      <h2>{s.passed ? 'השיעור הושלם!' : 'כמעט שם!'}</h2>
      <div className="score-ring" style={{ '--p': s.score }}>
        <span>{s.score}</span>
      </div>
      <div className="summary-stats">
        <div><strong>{s.lCorrect}/{L.listening.questions.length}</strong><span>הבנת הנשמע</span></div>
        <div><strong>{s.sAchieved}/{L.speaking.length}</strong><span>משימות דיבור</span></div>
        <div><strong>{s.vAchieved}/{L.vocabUse.length}</strong><span>שימוש בביטויים</span></div>
      </div>
      {s.passed ? (
        <p>יכולת חדשה בכיס. {s.wordsAdded > 0 && `${s.wordsAdded} ביטויים נוספו למאגר שלך לחזרה מרווחת.`}</p>
      ) : (
        <Notice kind="warn" icon="🎯">
          כדי לעבור את השיעור צריך עוד:
          <ul className="bullets">{s.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          הנושאים שהיה בהם קושי נשמרו ונחזור אליהם.
        </Notice>
      )}
      <div className="stack-s">
        {s.passed && nextLesson ? (
          <a className="btn btn-primary btn-big" href={nextLesson.type === 'lesson' ? `#/lesson/${nextLesson.id}` : `#/talk/${nextLesson.scenarioId}?milestone=1`}>
            הבא: {nextLesson.titleHe}
          </a>
        ) : !s.passed ? (
          <button className="btn btn-primary btn-big" onClick={restart}>לנסות שוב את השיעור</button>
        ) : null}
        <a className="btn btn-ghost" href="#/talk">לתרגל שיחה חופשית</a>
        <a className="btn btn-ghost" href="#/path">חזרה למסלול</a>
      </div>
    </section>
  );
}
