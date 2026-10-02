// SQLite (sql.js, WebAssembly) — yaddaşda işləyən verilənlər bazası, fayl və şəbəkə əməliyyatı yoxdur.
const BASES = ['https://sql.js.org/dist/', 'https://cdn.jsdelivr.net/npm/sql.js@1/dist/'];
const SAMPLE = `
CREATE TABLE telebeler (id INTEGER PRIMARY KEY, ad TEXT NOT NULL, yas INTEGER, seher TEXT, bal REAL);
INSERT INTO telebeler VALUES (1,'Əli',19,'Bakı',91.5),(2,'Aysel',21,'Gəncə',78),(3,'Nigar',20,'Bakı',95),(4,'Rəşad',23,'Sumqayıt',66.5),(5,'Leyla',19,'Gəncə',84),(6,'Orxan',22,'Bakı',73),(7,'Səbinə',20,'Şəki',88),(8,'Tural',24,'Bakı',59);
CREATE TABLE kurslar (id INTEGER PRIMARY KEY, ad TEXT NOT NULL, muellim TEXT);
INSERT INTO kurslar VALUES (1,'Ərəb dili','Əhməd müəllim'),(2,'Quran təcvidi','Fatimə müəllimə'),(3,'Python','Kamran müəllim'),(4,'Veb dizayn','Aygün müəllimə');
CREATE TABLE qeydiyyat (telebe_id INTEGER REFERENCES telebeler(id), kurs_id INTEGER REFERENCES kurslar(id), qiymet INTEGER);
INSERT INTO qeydiyyat VALUES (1,1,90),(1,3,95),(2,1,70),(2,2,85),(3,1,98),(3,3,92),(3,4,94),(4,3,60),(5,2,88),(5,4,80),(6,1,75),(7,2,91),(7,3,86),(8,4,55);
`;
let SQL, db;
const cell = v => v instanceof Uint8Array ? '[BLOB ' + v.length + ' bayt]' : v;
function schema() {
  const r = db.exec("SELECT name,type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const list = (r[0] ? r[0].values : []).map(([name, type]) => {
    const c = db.exec('PRAGMA table_info("' + name.replace(/"/g, '""') + '")');
    return { name, type, cols: (c[0] ? c[0].values : []).map(v => ({ n: v[1], t: v[2], pk: v[5] })) };
  });
  postMessage({ t: 'schema', list });
}
function reset() { if (db) db.close(); db = new SQL.Database(); db.run('PRAGMA foreign_keys=ON;' + SAMPLE); schema(); }
function run(sql) {
  const t0 = performance.now(); let n = 0, it;
  try {
    it = db.iterateStatements(sql);
    for (const st of it) {
      n++; const cols = st.getColumnNames(), text = st.getSQL ? st.getSQL() : '';
      if (cols.length) {
        const rows = []; let more = false;
        while (st.step()) { if (rows.length >= 1000) { more = true; break; } rows.push(st.get().map(cell)); }
        postMessage({ t: 'rows', cols, rows, more, sql: text });
      } else { st.step(); postMessage({ t: 'ok', changes: db.getRowsModified(), sql: text }); }
    }
  } catch (e) { postMessage({ t: 'err', msg: String(e && e.message || e), n }); }
  finally { try { it && it.freemem && it.freemem(); } catch {} }
  try { schema(); } catch {}
  postMessage({ t: 'done', ms: Math.round(performance.now() - t0), n });
}
async function boot() {
  let err;
  for (const b of BASES) {
    try { importScripts(b + 'sql-wasm.js'); SQL = await initSqlJs({ locateFile: f => b + f }); break; } catch (e) { err = e; }
  }
  if (!SQL) return postMessage({ t: 'fatal', e: String(err) });
  reset(); postMessage({ t: 'ready' });
}
onmessage = ({ data: d }) => {
  if (!SQL) return;
  try {
    if (d.t === 'run') run(d.sql);
    else if (d.t === 'reset') { reset(); postMessage({ t: 'reset' }); }
    else if (d.t === 'export') postMessage({ t: 'file', data: db.export() });
  } catch (e) { postMessage({ t: 'err', msg: String(e.message || e), n: 0 }); postMessage({ t: 'done', ms: 0, n: 0 }); }
};
boot();
