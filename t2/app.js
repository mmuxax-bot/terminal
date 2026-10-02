import { highlight } from './highlight.js';
const $ = s => document.querySelector(s);
const ed = $('#code'), lines = $('#lines'), hl = $('#hl'), pick = $('#samples'), msg = $('#msg');
const KEY = 'nibrascode.html.v1', PKEY = 'nibrascode.html.preview.v1';
const SAMPLES = {
  'Boş şablon': { html: '<h1>Salam, NibrasCode!</h1>\n<p>Bu mənim ilk səhifəmdir.</p>', css: 'body {\n  font-family: system-ui, sans-serif;\n  text-align: center;\n  padding: 40px;\n  background: #f4f7fb;\n}\nh1 { color: #0b7a6e; }', js: '' },
  'Kart dizaynı': { html: '<div class="card">\n  <div class="avatar">N</div>\n  <h2>Nibras Akademiyası</h2>\n  <p>Ərəb dili və proqramlaşdırma</p>\n  <a href="#" class="btn">Ətraflı</a>\n</div>', css: 'body {\n  margin: 0; min-height: 100vh; display: grid; place-items: center;\n  background: linear-gradient(135deg, #06101d, #0b4244);\n  font-family: system-ui, sans-serif;\n}\n.card {\n  width: 280px; padding: 28px; text-align: center; color: #fff;\n  background: #ffffff14; border: 1px solid #ffffff30;\n  border-radius: 20px; backdrop-filter: blur(10px);\n}\n.avatar {\n  width: 64px; height: 64px; margin: 0 auto 12px; border-radius: 50%;\n  display: grid; place-items: center; font-size: 28px; font-weight: 800;\n  background: #27dbc5; color: #04231f;\n}\n.btn {\n  display: inline-block; margin-top: 12px; padding: 10px 22px;\n  border-radius: 999px; background: #27dbc5; color: #04231f;\n  text-decoration: none; font-weight: 700;\n}\n.btn:hover { transform: translateY(-2px); }', js: '' },
  'Sayğac (JS)': { html: '<h1 id="n">0</h1>\n<button id="plus">+1</button>\n<button id="reset">Sıfırla</button>', css: 'body { font-family: system-ui; text-align: center; padding: 50px; }\nh1 { font-size: 80px; margin: 0 0 20px; }\nbutton { font-size: 18px; padding: 10px 20px; margin: 4px; border: 0; border-radius: 10px; background: #27dbc5; cursor: pointer; }', js: 'let n = 0;\nconst el = document.getElementById("n");\ndocument.getElementById("plus").onclick = () => el.textContent = ++n;\ndocument.getElementById("reset").onclick = () => el.textContent = n = 0;' },
  'Grid + animasiya': { html: '<div class="grid">\n  <div></div><div></div><div></div>\n  <div></div><div></div><div></div>\n</div>', css: 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b1928; }\n.grid { display: grid; grid-template-columns: repeat(3, 80px); gap: 12px; }\n.grid div {\n  height: 80px; border-radius: 16px; background: #27dbc5;\n  animation: pulse 1.6s ease-in-out infinite;\n}\n.grid div:nth-child(even) { background: #3ea8ff; animation-delay: .4s; }\n@keyframes pulse { 50% { transform: scale(.7); opacity: .5; } }', js: '' }
};
let S = { html: '', css: '', js: '' }, tab = 'html';
const IND = '  ';

function paint() {
  S[tab] = ed.value;
  hl.innerHTML = highlight(tab, ed.value);
  lines.textContent = Array.from({ length: ed.value.split('\n').length }, (_, k) => k + 1).join('\n');
  sync(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
}
const sync = () => { hl.scrollTop = lines.scrollTop = ed.scrollTop; hl.scrollLeft = ed.scrollLeft; };
function setTab(t) {
  S[tab] = ed.value; tab = t; ed.value = S[t];
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  paint(); ed.scrollTop = 0;
}
ed.oninput = paint; ed.onscroll = sync;
ed.onkeydown = e => {
  const v = ed.value, a = ed.selectionStart, ls = v.lastIndexOf('\n', a - 1) + 1;
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  else if (e.key === 'Enter' && !e.shiftKey && a === ed.selectionEnd) {
    e.preventDefault(); const cur = v.slice(ls, a);
    const open = /\{\s*$/.test(cur) || /<(?!\/)(?!(?:meta|link|br|hr|img|input)\b)[A-Za-z][^<>]*[^\/<>]>\s*$/.test(cur);
    ed.setRangeText('\n' + cur.match(/^ */)[0] + (open ? IND : ''), a, ed.selectionEnd, 'end'); paint();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) { const n = (v.slice(ls).match(/^ {1,2}/) || [''])[0].length; if (n) { ed.setRangeText('', ls, ls + n, 'preserve'); ed.selectionStart = ed.selectionEnd = Math.max(ls, a - n); paint(); } }
    else { ed.setRangeText(IND, a, ed.selectionEnd, 'end'); paint(); }
  }
};

// ---------- sənədin yığılması ----------
function build() {
  const { html, css, js } = S, st = css.trim() ? `<style>\n${css}\n</style>` : '', sc = js.trim() ? `<script>\n${js}\n<\/script>` : '';
  if (/<html[\s>]/i.test(html)) {
    let d = html;
    d = st ? (/<\/head>/i.test(d) ? d.replace(/<\/head>/i, () => st + '\n</head>') : st + d) : d;
    return sc ? (/<\/body>/i.test(d) ? d.replace(/<\/body>/i, () => sc + '\n</body>') : d + sc) : d;
  }
  return `<!doctype html>\n<html lang="az">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>NibrasCode</title>\n${st}\n</head>\n<body>\n${html}\n${sc}\n</body>\n</html>`;
}
let win = null, lastDoc = '';
function note(t) { msg.textContent = t; setTimeout(() => msg.textContent = '', 3500); }
function run() {
  S[tab] = ed.value; lastDoc = build();
  try { localStorage.setItem(PKEY, lastDoc); } catch {}
  win = window.open('preview.html', 'nc_preview');
  if (!win) return note('Brauzer yeni pəncərəni blokladı — pop-up icazəsi verin.');
  win.focus(); try { win.postMessage({ t: 'doc', doc: lastDoc }, location.origin); } catch {}
}
addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.t === 'ready' && e.source && lastDoc) e.source.postMessage({ t: 'doc', doc: lastDoc }, location.origin); });

// ---------- düymələr ----------
const flash = (b, t) => { const o = b.textContent; b.textContent = t; setTimeout(() => b.textContent = o, 1200); };
$('#run').onclick = run;
$('#copy').onclick = e => navigator.clipboard.writeText(ed.value).then(() => flash(e.target, 'Kopyalandı ✓'), () => flash(e.target, 'Alınmadı'));
$('#clear').onclick = () => { S = { html: '', css: '', js: '' }; ed.value = ''; paint(); note('Hamısı təmizləndi.'); };
$('#dl').onclick = () => { S[tab] = ed.value; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([build()], { type: 'text/html' })); a.download = 'index.html'; a.click(); URL.revokeObjectURL(a.href); };
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.t));
Object.keys(SAMPLES).forEach(k => pick.add(new Option(k, k)));
pick.onchange = () => { if (SAMPLES[pick.value]) { S = { ...SAMPLES[pick.value] }; ed.value = S[tab]; paint(); } pick.value = ''; };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s.html === 'string') S = { html: s.html, css: s.css || '', js: s.js || '' }; else throw 0; } catch { S = { ...SAMPLES['Kart dizaynı'] }; }
ed.value = S[tab]; paint();
