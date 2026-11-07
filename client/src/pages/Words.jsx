import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Spinner, ErrorBox, En, SpeakButton, Notice } from '../components/ui.jsx';

const BOX_LABEL = ['חדשה', 'בלמידה', 'בלמידה', 'כמעט שלי', 'שלי', 'שלי', 'שלי'];

export default function Words() {
  const [tab, setTab] = useState('mine');
  const [data, setData] = useState(null);
  const [packs, setPacks] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    setError(null);
    api('/vocab').then(setData).catch(setError);
    api('/vocab/packs').then((r) => setPacks(r.packs)).catch(setError);
  };
  useEffect(load, []);

  if (error && !data) return <ErrorBox error={error} onRetry={load} />;
  if (!data) return <Spinner />;

  const items = data.items.filter((v) => !filter || v.term.toLowerCase().includes(filter.toLowerCase()) || v.he.includes(filter));
  const known = data.items.filter((v) => v.known).length;

  const remove = async (id) => {
    if (!confirm('למחוק את הביטוי מהמאגר?')) return;
    await api(`/vocab/${id}`, { method: 'DELETE' }).catch(() => {});
    load();
  };
  const addPack = async (id) => {
    await api(`/vocab/packs/${id}/add`, { method: 'POST' }).catch(setError);
    load();
  };

  return (
    <div className="stack">
      <header>
        <h1>המילים שלי 📚</h1>
        <p className="muted">
          {data.items.length} ביטויים במאגר · {known} כבר "שלך" (זוהו נכון כמה פעמים ושומשו במשפט משלך)
        </p>
      </header>
      <a href="#/words/review" className={`action-card ${data.dueCount ? 'primary' : ''}`}>
        <span className="action-icon" aria-hidden="true">🔁</span>
        <div className="grow">
          <div className="action-title">חזרה מרווחת</div>
          <div className="action-sub">{data.dueCount ? `${data.dueCount} ביטויים מחכים לחזרה עכשיו` : 'אין חזרות להיום – אפשר לתרגל בכל זאת'}</div>
        </div>
        <span className="chev" aria-hidden="true">‹</span>
      </a>
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>המאגר שלי</button>
        <button role="tab" aria-selected={tab === 'packs'} className={tab === 'packs' ? 'on' : ''} onClick={() => setTab('packs')}>לפי תחומי עניין</button>
      </div>

      {tab === 'mine' && (
        <>
          <div className="row gap">
            <input className="input grow" placeholder="חיפוש…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="חיפוש במאגר" />
            <button className="btn btn-ghost" onClick={() => setAdding(!adding)}>＋ הוספה</button>
          </div>
          {adding && <AddWord onDone={() => { setAdding(false); load(); }} />}
          {!data.items.length && (
            <Notice icon="🌱">המאגר ריק בינתיים. ביטויים נכנסים אליו אוטומטית בסוף כל שיעור, משיחות עם המורה (כפתור ＋), או מחבילות לפי תחומי עניין.</Notice>
          )}
          <ul className="word-list">
            {items.map((v) => (
              <li key={v.id} className="word-row">
                <div className="grow">
                  <div className="row gap-s">
                    <En className="term">{v.term}</En>
                    <SpeakButton text={v.term} small slow={false} />
                  </div>
                  <div>{v.he}</div>
                  {v.example && <En block className="tiny muted">{v.example}</En>}
                  <div className="tiny muted">{v.source}</div>
                </div>
                <div className="word-side">
                  <span className={`box-badge b${Math.min(v.box, 4)}`}>{BOX_LABEL[v.box]}</span>
                  {v.used_in_sentence ? <span className="tiny" title="השתמשת בביטוי במשפט משלך">🗣️ ✓</span> : null}
                  {v.due && <span className="tiny warn-text">לחזרה</span>}
                  <button className="link-btn tiny" onClick={() => remove(v.id)} aria-label={`מחיקת ${v.term}`}>מחיקה</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'packs' && (
        <div className="stack">
          <p className="muted">חבילות קצרות של ביטויים שימושיים לפי נושא. הנושאים שבחרת מסומנים ב־⭐. אפשר לעדכן תחומי עניין בהגדרות.</p>
          {!packs ? <Spinner /> : packs.map((p) => {
            const savedCount = p.items.filter((i) => i.saved).length;
            return (
              <details key={p.id} className="pack" open={p.selected}>
                <summary>
                  <span>{p.emoji} {p.he} {p.selected && '⭐'}</span>
                  <span className="tiny muted">{savedCount}/{p.items.length} במאגר</span>
                </summary>
                <ul className="phrase-list">
                  {p.items.map((w) => (
                    <li key={w.term}>
                      <En>{w.term}</En> <span className="muted">– {w.he}</span> <SpeakButton text={w.term} small slow={false} />
                      <En block className="tiny muted">{w.example}</En>
                    </li>
                  ))}
                </ul>
                {savedCount < p.items.length && <button className="btn btn-primary btn-small" onClick={() => addPack(p.id)}>הוספת החבילה למאגר שלי</button>}
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddWord({ onDone }) {
  const [f, setF] = useState({ term: '', he: '', example: '' });
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/vocab', { method: 'POST', body: f });
      onDone();
    } catch (err) {
      setError(err);
    }
  };
  return (
    <form className="card soft stack-s" onSubmit={submit}>
      <input className="input" dir="ltr" lang="en" placeholder="English word or phrase" value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })} required aria-label="ביטוי באנגלית" />
      <input className="input" placeholder="משמעות בעברית" value={f.he} onChange={(e) => setF({ ...f, he: e.target.value })} required aria-label="משמעות בעברית" />
      <input className="input" dir="ltr" lang="en" placeholder="Example sentence (optional)" value={f.example} onChange={(e) => setF({ ...f, example: e.target.value })} aria-label="משפט לדוגמה" />
      <ErrorBox error={error} />
      <button className="btn btn-primary">שמירה</button>
    </form>
  );
}
