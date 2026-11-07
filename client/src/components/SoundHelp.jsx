import React, { useEffect, useState } from 'react';
import { speak } from '../lib/speech.js';
import { Modal } from './ui.jsx';

const WHY = {
  unsupported: 'הדפדפן או האפליקציה שבהם פתחת את העמוד לא תומכים בהשמעת קול.',
  novoices: 'לא נמצאו במכשיר קולות באנגלית להשמעה.',
  blocked: 'ההשמעה לא התחילה – כנראה שהמכשיר או האפליקציה חוסמים קול.',
  gesture: 'הדפדפן חסם השמעה אוטומטית. לחצו על כפתור ההשמעה 🔊.',
};

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /Android/i.test(navigator.userAgent);

/** חלון עזרה לבעיות שמע: נפתח אוטומטית כשההשמעה נחסמת, או מהקישור "לא שומעים?" */
export default function SoundHelp() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(null);
  const [test, setTest] = useState(null);
  useEffect(() => {
    let shown = false;
    const onProblem = (e) => {
      setKind(e.detail);
      if (!shown) {
        shown = true; // פותחים אוטומטית פעם אחת בכל טעינה, לא מציפים
        setOpen(true);
      }
    };
    const onOpen = () => {
      setKind(null);
      setOpen(true);
    };
    window.addEventListener('tts-problem', onProblem);
    window.addEventListener('open-sound-help', onOpen);
    return () => {
      window.removeEventListener('tts-problem', onProblem);
      window.removeEventListener('open-sound-help', onOpen);
    };
  }, []);
  const runTest = async () => {
    setTest('playing');
    try {
      await speak('Hello! Can you hear me? This is your English coach.', { rate: 0.95 });
      setTest('done');
    } catch {
      setTest('fail');
    }
  };
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="🔈 לא שומעים את ההשמעה?">
      {kind && <p className="warn-text">{WHY[kind]}</p>}
      <ul className="bullets">
        {(isIOS() || !isAndroid()) && (
          <li>
            <strong>באייפון:</strong> בדקו ש<strong>מתג השקט</strong> בצד הטלפון כבוי (אין פס כתום), והגבירו את עוצמת הקול. במצב שקט האייפון לא משמיע קול מאתרים.
          </li>
        )}
        {(isAndroid() || !isIOS()) && (
          <li>
            <strong>באנדרואיד:</strong> אם פתחתם את הקישור מתוך אפליקציה (Claude, וואטסאפ, Gmail), פתחו אותו בדפדפן <strong>Chrome</strong>. אם עדיין אין קול: הגדרות ← נגישות ← פלט המרת טקסט לדיבור, ובחרו במנוע של Google עם אנגלית.
          </li>
        )}
        <li>עדיין שקט? נסו לפתוח את הקישור ישירות בדפדפן (Safari / Chrome) ולא מתוך אפליקציה אחרת.</li>
        <li>בדקו שלא מחוברות אוזניות Bluetooth שכבויות או רחוקות.</li>
      </ul>
      <div className="row gap wrap">
        <button className="btn btn-primary grow" onClick={runTest} disabled={test === 'playing'}>
          {test === 'playing' ? 'משמיע…' : '▶ בדיקת שמע'}
        </button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>סגירה</button>
      </div>
      {test === 'done' && <p className="tiny muted">שמעת את המשפט? מעולה. אם לא – עברו על השלבים למעלה.</p>}
      {test === 'fail' && <p className="tiny warn-text">ההשמעה נכשלה במכשיר הזה. נסו לפתוח את הקישור בדפדפן אחר.</p>}
    </Modal>
  );
}

export function SoundHelpLink() {
  return (
    <button type="button" className="link-btn tiny" onClick={() => window.dispatchEvent(new Event('open-sound-help'))}>
      🔈 לא שומעים?
    </button>
  );
}
