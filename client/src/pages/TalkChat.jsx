import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../ctx.js';
import { speak, stopSpeaking } from '../lib/speech.js';
import { Spinner, ErrorBox, En, SpeakButton, FeedbackCard, Notice, Confetti, Mixed } from '../components/ui.jsx';
import Recorder from '../components/Recorder.jsx';

const TUTOR_VOICE = 2;

export default function TalkChat({ id }) {
  const { user, setUser, config, route } = useApp();
  const isMilestone = route.query.milestone === '1';
  const [sc, setSc] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(user.settings.feedbackMode || 'guided');
  const [showT, setShowT] = useState(user.settings.showTranscript !== false);
  const [showHe, setShowHe] = useState(!!user.settings.showTranslation);
  const [levelShift, setLevelShift] = useState(0);
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [turnError, setTurnError] = useState(null);
  const [goal, setGoal] = useState(false);
  const [assist, setAssist] = useState(null); // {kind, loading, en, he}
  const [saved, setSaved] = useState({});
  const [finished, setFinished] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [demoFlag, setDemoFlag] = useState(!config.ai);
  const stats = useRef({ speakingSeconds: 0, spokenTurns: 0, userTurns: 0, t0: Date.now() });
  const endRef = useRef(null);

  useEffect(() => {
    api('/tutor/scenarios')
      .then((r) => {
        const s = r.scenarios.find((x) => x.id === id);
        if (!s) throw new Error('התרחיש לא נמצא');
        setSc(s);
      })
      .catch(setError);
    return () => stopSpeaking();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs.length, busy, assist]);

  if (error) return <ErrorBox error={error} />;
  if (!sc) return <Spinner />;

  const tutorSay = (text) => speak(text, { voice: TUTOR_VOICE, rate: levelShift < 0 ? 0.85 : 1 }).catch(() => {});

  const start = () => {
    setStarted(true);
    stats.current.t0 = Date.now();
    const o = sc.opening;
    setMsgs([{ role: 'tutor', text: o.en, he: o.he, simple: o.simple }]);
    tutorSay(o.en);
  };

  const send = async (r) => {
    setTurnError(null);
    setAssist(null);
    const userMsg = { role: 'user', text: r.transcript, audioUrl: r.audioUrl, typed: r.typed };
    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    const userTurnIndex = msgs.filter((m) => m.role === 'user').length;
    // תור הדגמה מתקדם רק כשהתשובה רלוונטית – סופרים כמה תורות של המורה "התקדמו"
    const tutorAdvanced = msgs.filter((m) => m.role === 'tutor' && !m.repeat).length - 1;
    setMsgs((m) => [...m, userMsg]);
    setBusy(true);
    stats.current.userTurns++;
    if (!r.typed) {
      stats.current.spokenTurns++;
      stats.current.speakingSeconds += r.seconds;
    }
    try {
      const out = await api('/tutor/turn', {
        method: 'POST',
        timeout: 60000,
        body: { scenarioId: id, history, userText: r.transcript, levelShift, turnIndex: config.ai ? userTurnIndex : tutorAdvanced },
      });
      setDemoFlag(!!out.demo);
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...userMsg, feedback: out.feedback, demo: out.demo };
        copy.push({ role: 'tutor', text: out.reply, he: out.reply_he, simple: out.reply_simple, phrases: out.new_phrases, repeat: out.demo && out.advanced === false });
        return copy;
      });
      if (out.goal_achieved) setGoal(true);
      tutorSay(out.reply);
    } catch (e) {
      setMsgs((m) => m.slice(0, -1));
      stats.current.userTurns--;
      if (!r.typed) {
        stats.current.spokenTurns--;
        stats.current.speakingSeconds -= r.seconds;
      }
      setTurnError(e);
    } finally {
      setBusy(false);
    }
  };

  const help = async (kind) => {
    const last = [...msgs].reverse().find((m) => m.role === 'tutor');
    if (kind === 'slow') {
      speak(last.text, { voice: TUTOR_VOICE, rate: 0.7 }).catch(() => {});
      return;
    }
    if (kind === 'simpler' && last.simple && !config.ai) {
      setAssist({ kind, en: last.simple, he: last.he });
      speak(last.simple, { voice: TUTOR_VOICE, rate: 0.85 }).catch(() => {});
      return;
    }
    setAssist({ kind, loading: true });
    try {
      const r = await api('/tutor/assist', { method: 'POST', body: { scenarioId: id, kind, levelShift, history: msgs.map((m) => ({ role: m.role, text: m.text })) } });
      setAssist({ kind, ...r });
      if (kind === 'simpler') speak(r.en, { voice: TUTOR_VOICE, rate: 0.85 }).catch(() => {});
    } catch (e) {
      setAssist({ kind, error: e });
    }
  };

  const savePhrase = async (p) => {
    try {
      await api('/vocab', { method: 'POST', body: { term: p.en, he: p.he, example: p.example, source: `שיחה: ${sc.titleHe}` } });
      setSaved((s) => ({ ...s, [p.en]: true }));
    } catch {
      setSaved((s) => ({ ...s, [p.en]: 'err' }));
    }
  };

  const finish = async () => {
    stopSpeaking();
    setFinished({ loading: true });
    try {
      const r = await api('/tutor/finish', {
        method: 'POST',
        body: {
          scenarioId: id,
          userTurns: stats.current.userTurns,
          spokenTurns: stats.current.spokenTurns,
          speakingSeconds: stats.current.speakingSeconds,
          goalAchieved: goal,
          durationSec: (Date.now() - stats.current.t0) / 1000,
        },
      });
      setFinished(r);
      if (r.user) setUser(r.user);
    } catch (e) {
      setFinished({ error: e });
    }
  };

  const lastTutorIdx = msgs.map((m) => m.role).lastIndexOf('tutor');
  const userMsgs = msgs.filter((m) => m.role === 'user');

  if (finished) {
    return (
      <div className="stack pop-in">
        {finished.loading && <Spinner label="שומרים את השיחה…" />}
        {finished.error && <ErrorBox error={finished.error} onRetry={finish} />}
        {finished.ok && (
          <>
            <Confetti show={!!finished.milestone || finished.goalAchieved} />
            <div className="center-text">
              <div className="summary-emoji" aria-hidden="true">{finished.milestone ? '🏁' : finished.goalAchieved ? '🎯' : '👏'}</div>
              <h1>{finished.milestone ? `עברת את אבן הדרך של שלב ${finished.milestone.stage}!` : finished.goalAchieved ? 'המטרה הושגה!' : 'כל הכבוד על השיחה!'}</h1>
              <p className="muted">
                {stats.current.spokenTurns} תורות בדיבור · {Math.round(stats.current.speakingSeconds)} שניות של דיבור
              </p>
              {finished.milestone && <p>פתחת את השלב הבא במסלול. 🎉</p>}
              {isMilestone && !finished.milestone && (
                <Notice kind="muted" icon="🏁">
                  כדי לעבור את אבן הדרך צריך להשיג את מטרת השיחה עם לפחות 3 תשובות בקול, אחרי שהשלמת את כל שיעורי השלב.
                </Notice>
              )}
            </div>
            {mode === 'flow' && userMsgs.some((m) => m.feedback) && (
              <section className="stack">
                <h2>המשוב שלך מהשיחה</h2>
                {userMsgs
                  .filter((m) => m.feedback && (m.feedback.corrections?.length || m.feedback.verdict !== 'great'))
                  .slice(0, 6)
                  .map((m, i) => (
                    <FeedbackCard key={i} said={m.text} fb={m.feedback} demo={m.demo} />
                  ))}
                {userMsgs.every((m) => !m.feedback?.corrections?.length) && <p>לא נמצאו טעויות משמעותיות – מצוין! 🌟</p>}
              </section>
            )}
            <div className="stack-s">
              <a className="btn btn-primary btn-big" href={`#/talk/${id}?n=${Date.now()}`}>שיחה נוספת</a>
              <a className="btn btn-ghost" href="#/talk">לשיחות אחרות</a>
              <a className="btn btn-ghost" href="#/">למסך הבית</a>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-head">
        <a href="#/talk" className="link-btn" onClick={() => stopSpeaking()}>‹</a>
        <span className="scenario-emoji small" aria-hidden="true">{sc.emoji}</span>
        <div className="grow">
          <strong>{sc.titleHe}</strong> {isMilestone && <span className="badge">🏁 אבן דרך</span>}
          <div className="tiny muted">🎯 {sc.goalHe}</div>
        </div>
        {started && (
          <button className="btn btn-small btn-ghost" onClick={finish} disabled={busy}>סיום</button>
        )}
      </div>

      <div className="chat-tools">
        <div className="seg" role="group" aria-label="מצב משוב">
          <button className={mode === 'guided' ? 'on' : ''} onClick={() => setMode('guided')} aria-pressed={mode === 'guided'}>תרגול מודרך</button>
          <button className={mode === 'flow' ? 'on' : ''} onClick={() => setMode('flow')} aria-pressed={mode === 'flow'}>שיחה זורמת</button>
        </div>
        <label className="toggle small"><input type="checkbox" checked={showT} onChange={(e) => setShowT(e.target.checked)} /> תמלול</label>
        <label className="toggle small"><input type="checkbox" checked={showHe} onChange={(e) => setShowHe(e.target.checked)} /> תרגום</label>
        {config.ai && (
          <div className="seg small" role="group" aria-label="רמת קושי">
            <button className={levelShift < 0 ? 'on' : ''} onClick={() => setLevelShift(levelShift < 0 ? 0 : -1)}>קל יותר</button>
            <button className={levelShift > 0 ? 'on' : ''} onClick={() => setLevelShift(levelShift > 0 ? 0 : 1)}>מאתגר</button>
          </div>
        )}
      </div>

      {!started ? (
        <div className="stack pop-in chat-intro">
          <div className="card">
            <p>{mode === 'guided' ? 'תרגול מודרך: אחרי כל תשובה תקבלו משוב קצר.' : 'שיחה זורמת: מדברים בלי הפרעות – המשוב מחכה לכם בסוף.'}</p>
            <h3>ביטויים שיעזרו לכם</h3>
            <ul className="phrase-list">
              {sc.phrases.map((p) => (
                <li key={p.en}>
                  <En>{p.en}</En> <span className="muted">– {p.he}</span> <SpeakButton text={p.en} small slow={false} />
                </li>
              ))}
            </ul>
          </div>
          {demoFlag && <Notice kind="warn" icon="🧪">מצב הדגמה: המורה עוקב אחרי תסריט קבוע ולא מגיב באופן חופשי.</Notice>}
          <button className="btn btn-primary btn-big" onClick={start}>🎙️ מתחילים לדבר</button>
        </div>
      ) : (
        <>
          <div className="chat-log" aria-live="polite">
            {msgs.map((m, i) =>
              m.role === 'tutor' ? (
                <div key={i} className="bubble-row tutor">
                  <span className="avatar-tutor" aria-hidden="true">🧑‍🏫</span>
                  <div className="bubble tutor">
                    {showT || revealed[i] ? <En block>{m.text}</En> : (
                      <button className="link-btn" onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}>👁️ הצגת הטקסט</button>
                    )}
                    {showHe && m.he && <div className="he-line">{m.he}</div>}
                    <div className="bubble-actions">
                      <SpeakButton text={m.text} small voice={TUTOR_VOICE} />
                    </div>
                    {m.phrases?.length > 0 && (
                      <div className="phrase-chips">
                        {m.phrases.map((p) => (
                          <button key={p.en} className="chip small" disabled={!!saved[p.en]} onClick={() => savePhrase(p)} title={p.he}>
                            {saved[p.en] === true ? '✓ נשמר' : '＋'} <En>{p.en}</En>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="bubble-row user">
                  <div className="bubble user">
                    <En block>{m.text}</En>
                    <div className="bubble-meta">
                      {m.typed ? <span className="tiny">⌨️ הוקלד</span> : m.audioUrl && <audio controls src={m.audioUrl} className="own-audio small" aria-label="ההקלטה שלך" />}
                    </div>
                  </div>
                  {mode === 'guided' && m.feedback && <FeedbackCard fb={m.feedback} demo={m.demo} said={null} />}
                </div>
              )
            )}
            {busy && (
              <div className="bubble-row tutor">
                <span className="avatar-tutor" aria-hidden="true">🧑‍🏫</span>
                <div className="bubble tutor typing"><span /><span /><span /></div>
              </div>
            )}
            {assist && (
              <div className="assist-box pop-in">
                {assist.loading ? <Spinner label="רגע…" /> : assist.error ? <ErrorBox error={assist.error} /> : (
                  <>
                    <div className="label">{{ hint: '💡 רמז – אפשר לומר למשל:', explain: '🇮🇱 הסבר בעברית', simpler: '✏️ בניסוח פשוט יותר' }[assist.kind]}</div>
                    {assist.en && (
                      <div className="row gap-s">
                        <En block>{assist.en}</En>
                        <SpeakButton text={assist.en} small />
                      </div>
                    )}
                    {assist.he && <p><Mixed>{assist.he}</Mixed></p>}
                  </>
                )}
                <button className="link-btn" onClick={() => setAssist(null)}>סגירה</button>
              </div>
            )}
            {goal && (
              <div className="goal-banner pop-in">
                🎯 מטרת השיחה הושגה! אפשר להמשיך לדבר או ללחוץ "סיום".
                <button className="btn btn-small btn-primary" onClick={finish}>סיום ושמירה</button>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-input">
            <ErrorBox error={turnError} />
            <div className="assist-row" role="group" aria-label="עזרה">
              <button className="chip small" onClick={() => help('hint')} disabled={busy || lastTutorIdx < 0}>💡 רמז</button>
              <button className="chip small" onClick={() => help('explain')} disabled={busy || lastTutorIdx < 0}>🇮🇱 הסבר בעברית</button>
              <button className="chip small" onClick={() => help('slow')} disabled={busy || lastTutorIdx < 0}>🐢 לאט יותר</button>
              <button className="chip small" onClick={() => help('simpler')} disabled={busy || lastTutorIdx < 0}>✏️ פשוט יותר</button>
            </div>
            <Recorder onResult={send} busy={busy} label="לחצו ודברו" compact />
          </div>
        </>
      )}
    </div>
  );
}
