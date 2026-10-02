import { highlight } from './highlight.js';
const $ = s => document.querySelector(s);
const ed = $('#code'), lines = $('#lines'), hl = $('#hl'), out = $('#output'), runB = $('#run'), st = $('#status'), tm = $('#time'), pick = $('#samples'), tbs = $('#tables');
const LIMIT = 40, KEY = 'nibrascode.sql.v1';
const SAMPLES = {
  'Hamısını göstər': 'SELECT * FROM telebeler;',
  'Filtr və sıralama': "SELECT ad, yas, bal\nFROM telebeler\nWHERE seher = 'Bakı' AND bal >= 70\nORDER BY bal DESC;",
  'JOIN (3 cədvəl)': 'SELECT t.ad AS telebe, k.ad AS kurs, q.qiymet\nFROM qeydiyyat q\nJOIN telebeler t ON t.id = q.telebe_id\nJOIN kurslar k ON k.id = q.kurs_id\nORDER BY q.qiymet DESC;',
  'GROUP BY (qrup)': 'SELECT seher, COUNT(*) AS say, ROUND(AVG(bal), 1) AS orta_bal, MAX(bal) AS ən_yüksək\nFROM telebeler\nGROUP BY seher\nHAVING COUNT(*) >= 1\nORDER BY orta_bal DESC;',
  'CREATE + INSERT': "CREATE TABLE IF NOT EXISTS kitablar (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  ad TEXT NOT NULL,\n  muellif TEXT,\n  qiymet REAL DEFAULT 0\n);\n\nINSERT INTO kitablar (ad, muellif, qiymet) VALUES\n  ('Riyazus-Salihin', 'İmam Nəvəvi', 12.5),\n  ('Kəlilə və Dimnə', 'İbn əl-Müqəffə', 8),\n  ('Əl-Ərəbiyyə bəyn yədeyk', 'Abdurrahman', 15);\n\nSELECT * FROM kitablar ORDER BY qiymet;",
  'Alt sorğu / CTE': 'WITH orta AS (\n  SELECT telebe_id, AVG(qiymet) AS o FROM qeydiyyat GROUP BY telebe_id\n)\nSELECT t.ad, ROUND(orta.o, 1) AS orta_qiymet\nFROM orta JOIN telebeler t ON t.id = orta.telebe_id\nWHERE orta.o > (SELECT AVG(qiymet) FROM qeydiyyat)\nORDER BY orta_qiymet DESC;'
};
const HINTS = [
  [/no such table/i, 'Belə cədvəl yoxdur. «Cədvəllər» bölməsinə baxın və adı düzgün yazın.'],
  [/no such column/i, 'Belə sütun yoxdur. Cədvəlin sütun adlarını «Cədvəllər» bölməsində yoxlayın.'],
  [/syntax error/i, 'Yazılış xətası: vergül, mötərizə, dırnaq və ya açar sözün düzgünlüyünü yoxlayın.'],
  [/already exists/i, 'Bu adda cədvəl artıq var. CREATE TABLE IF NOT EXISTS və ya DB sıfırla işlədin.'],
  [/UNIQUE|PRIMARY KEY/i, 'Bu dəyər artıq mövcuddur (təkrar ola bilməz).'],
  [/NOT NULL/i, 'Bu sütun boş qala bilməz.'],
  [/FOREIGN KEY/i, 'Əlaqəli cədvəldə belə qeyd yoxdur.'],
  [/ambiguous/i, 'Sütun adı bir neçə cədvəldə var — cədvəl adı ilə yazın (t.ad).']
];
let W, ready = false, busy = false, t0, iv, to, tail = null, got = 0;

// ---------- redaktor ----------
function paint() {
  hl.innerHTML = highlight('sql', ed.value);
  lines.textContent = Array.from({ length: ed.value.split('\n').length }, (_, k) => k + 1).join('\n');
  sync(); try { localStorage.setItem(KEY, ed.value); } catch {}
}
const sync = () => { hl.scrollTop = lines.scrollTop = ed.scrollTop; hl.scrollLeft = ed.scrollLeft; };
ed.oninput = paint; ed.onscroll = sync;
ed.onkeydown = e => {
  const v = ed.value, a = ed.selectionStart, ls = v.lastIndexOf('\n', a - 1) + 1;
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  else if (e.key === 'Enter' && !e.shiftKey && a === ed.selectionEnd) { e.preventDefault(); ed.setRangeText('\n' + v.slice(ls, a).match(/^ */)[0], a, ed.selectionEnd, 'end'); paint(); }
  else if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) { const n = (v.slice(ls).match(/^ {1,2}/) || [''])[0].length; if (n) { ed.setRangeText('', ls, ls + n, 'preserve'); ed.selectionStart = ed.selectionEnd = Math.max(ls, a - n); paint(); } }
    else { ed.setRangeText('  ', a, ed.selectionEnd, 'end'); paint(); }
  }
};

// ---------- worker ----------
function status(s, t) { st.dataset.s = s; st.querySelector('em').textContent = t; }
function boot() {
  ready = false; runB.disabled = true; status('load', 'SQLite yüklənir…');
  W = new Worker('./worker.js?v=1');
  W.onerror = () => { status('err', 'Yükləmə xətası'); put('Worker başlamadı. Faylların HTTPS üzərindən açıldığını yoxlayın.\n', 'e'); };
  W.onmessage = ({ data: d }) => {
    if (d.t === 'ready') { ready = true; runB.disabled = false; status('ok', 'SQLite hazırdır'); }
    else if (d.t === 'fatal') { status('err', 'Yükləmə xətası'); put('SQLite yüklənmədi: ' + d.e + '\n', 'e'); }
    else if (d.t === 'schema') drawSchema(d.list);
    else if (d.t === 'rows') showRows(d);
    else if (d.t === 'ok') { got++; put(`✓ ${/^\s*(insert|update|delete|replace)/i.test(d.sql) ? d.changes + ' sətir təsirləndi' : 'Tamamlandı'}\n`, 'r'); }
    else if (d.t === 'err') showErr(d);
    else if (d.t === 'done') finish(d);
    else if (d.t === 'reset') { reset(); put('✓ Nümunə bazası bərpa olundu.', 'r'); }
    else if (d.t === 'file') {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([d.data], { type: 'application/x-sqlite3' })); a.download = 'nibrascode.sqlite'; a.click(); URL.revokeObjectURL(a.href);
    }
  };
}
function put(s, k) {
  if (tail && tail.className === k) tail.textContent += s;
  else { tail = document.createElement('span'); tail.className = k; tail.textContent = s; out.append(tail); }
  out.scrollTop = out.scrollHeight;
}
function reset(msg) { out.textContent = msg || ''; tail = null; }
function idle() { busy = false; clearTimeout(to); clearInterval(iv); runB.textContent = '▶ Başlat'; runB.disabled = !ready; }
function node(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function showRows(d) {
  got++; tail = null;
  const w = node('div', 'rt'), t = node('table'), h = node('tr');
  d.cols.forEach(c => h.append(node('th', '', c))); t.append(h);
  d.rows.forEach(r => { const tr = node('tr'); r.forEach(v => tr.append(v === null ? node('td', 'nl', 'NULL') : node('td', typeof v === 'number' ? 'nm' : '', String(v).slice(0, 300)))); t.append(tr); });
  t.append(node('caption', '', `${d.rows.length} sətir${d.more ? ' (ilk 1000 göstərilir)' : ''}`));
  w.append(t); out.append(w); out.scrollTop = out.scrollHeight;
}
function showErr(d) {
  tail = null; put(`✖ SQL xətası${d.n ? ' (' + d.n + '-ci əmr)' : ''}: ${d.msg}\n`, 'e');
  const h = HINTS.find(([re]) => re.test(d.msg)); if (h) put('💡 ' + h[1] + '\n', 'h');
}
function finish(d) {
  idle(); tm.textContent = (d.ms / 1000).toFixed(2) + ' s'; status('ok', 'SQLite hazırdır');
  if (!out.querySelector('.rt') && !out.textContent.trim()) put('Əmr icra olundu (nəticə cədvəli yoxdur).', 'm');
}
function drawSchema(list) {
  tbs.replaceChildren(...list.map(t => {
    const b = node('div', 'tb'), btn = node('button', '', t.name + (t.type === 'view' ? ' (view)' : ''));
    btn.onclick = () => { ed.setRangeText(`SELECT * FROM ${t.name} LIMIT 20;`, ed.selectionEnd, ed.selectionEnd, 'end'); paint(); ed.focus(); };
    b.append(btn); t.cols.forEach(c => { const r = node('div', '', ''); if (c.pk) r.append(node('i', '', '🔑 ')); r.append(document.createTextNode(`${c.n} ${c.t}`)); b.append(r); });
    return b;
  }));
  if (!list.length) tbs.textContent = 'Hələ cədvəl yoxdur.';
}
function run() {
  if (busy) { idle(); put('\n■ İcra dayandırıldı. Baza nümunə vəziyyətinə qayıdır…\n', 'm'); W.terminate(); boot(); return; }
  if (!ready) return;
  const sel = ed.value.slice(ed.selectionStart, ed.selectionEnd), sql = sel.trim() ? sel : ed.value;
  if (!sql.trim()) return;
  busy = true; got = 0; runB.textContent = '■ Dayandır'; reset(); status('run', 'İcra olunur…'); t0 = performance.now();
  iv = setInterval(() => tm.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s / ' + LIMIT + ' s', 100);
  to = setTimeout(() => { idle(); put(`\n⏱ Vaxt limiti: sorğu ${LIMIT} saniyədən çox işlədiyi üçün dayandırıldı. Baza nümunə vəziyyətinə qayıdır.\n`, 'e'); W.terminate(); boot(); }, LIMIT * 1000);
  W.postMessage({ t: 'run', sql });
}

// ---------- düymələr ----------
const flash = (b, t) => { const o = b.textContent; b.textContent = t; setTimeout(() => b.textContent = o, 1200); };
const copy = (t, b) => navigator.clipboard.writeText(t).then(() => flash(b, 'Kopyalandı ✓'), () => flash(b, 'Alınmadı'));
runB.onclick = run;
$('#copy').onclick = e => copy(ed.value, e.target);
$('#copyout').onclick = e => copy(out.innerText || out.textContent, e.target);
$('#clear').onclick = () => { ed.value = ''; paint(); reset('Redaktor təmizləndi.'); };
$('#rst').onclick = () => { if (ready && !busy) W.postMessage({ t: 'reset' }); };
$('#dl').onclick = () => { if (ready && !busy) W.postMessage({ t: 'export' }); };
Object.keys(SAMPLES).forEach(k => pick.add(new Option(k, k)));
pick.onchange = () => { if (SAMPLES[pick.value]) { ed.value = SAMPLES[pick.value]; paint(); } pick.value = ''; };
try { ed.value = localStorage.getItem(KEY) || SAMPLES['JOIN (3 cədvəl)']; } catch { ed.value = SAMPLES['JOIN (3 cədvəl)']; }
paint(); boot();
