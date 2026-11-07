// node:sqlite (DatabaseSync) מעל sql.js – SQLite אמיתי בדפדפן, נשמר ב-localStorage של המכשיר.
import wasmBase64 from 'virtual:sql-wasm';

const KEY = 'english-coach-trial-db-v1';
const bytes = Uint8Array.from(atob(wasmBase64), (c) => c.charCodeAt(0));
const SQL = await window.initSqlJs({ wasmBinary: bytes.buffer });

function loadSaved() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  } catch {}
  return null;
}
let saveTimer = null;
function scheduleSave(db) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = db.export();
      let bin = '';
      for (let i = 0; i < data.length; i += 0x8000) bin += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
      localStorage.setItem(KEY, btoa(bin));
    } catch {}
  }, 300);
}
export function resetTrialDb() {
  try { localStorage.removeItem(KEY); } catch {}
}

export class DatabaseSync {
  constructor() {
    const saved = loadSaved();
    this.db = saved ? new SQL.Database(saved) : new SQL.Database();
  }
  exec(sql) {
    this.db.exec(sql.replace(/PRAGMA journal_mode = WAL;/i, ''));
    scheduleSave(this.db);
  }
  prepare(sql) {
    const db = this.db;
    const self = this;
    const norm = (p) => p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v));
    return {
      get(...p) {
        const st = db.prepare(sql);
        try {
          st.bind(norm(p));
          return st.step() ? st.getAsObject() : undefined;
        } finally { st.free(); }
      },
      all(...p) {
        const st = db.prepare(sql);
        const rows = [];
        try {
          st.bind(norm(p));
          while (st.step()) rows.push(st.getAsObject());
        } finally { st.free(); }
        return rows;
      },
      run(...p) {
        db.run(sql, norm(p));
        const changes = db.getRowsModified();
        const id = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0];
        scheduleSave(db);
        return { changes, lastInsertRowid: id };
      },
    };
  }
}
export default { DatabaseSync };
