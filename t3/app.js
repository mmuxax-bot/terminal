import { highlight } from './highlight.js';
const $ = s => document.querySelector(s);
const ed = $('#code'), lines = $('#lines'), hl = $('#hl'), out = $('#output'), runB = $('#run'), st = $('#status'), tm = $('#time'), pick = $('#samples');
const LIMIT = 40, KEY = 'nibrascode.js.v1';
const SAMPLES = {
  'Salam dünya': 'const ad = "NibrasCode";\nfor (let i = 1; i <= 3; i++) {\n  console.log(`${i}. Salam, ${ad}!`);\n}\n\n[10, 20, 30].reduce((a, b) => a + b, 0)',
  'input() ilə': 'const ad = await input("Adınız: ");\nconst yas = Number(await input("Yaşınız: "));\nconsole.log(`Salam, ${ad}! 10 ildən sonra ${yas + 10} yaşında olacaqsan.`);',
  'Hesab makinesi': 'while (true) {\n  const e = await input("Hesab (çıxış: q): ");\n  if (e.trim() === "q") break;\n  try {\n    console.log("=", eval(e));\n  } catch (x) {\n    console.log("Xəta:", x.message);\n  }\n}',
  'Siniflər (OOP)': 'class Heyvan {\n  #say = 0;\n  constructor(ad) { this.ad = ad; }\n  ses() { this.#say++; return `${this.ad} səs çıxarır (${this.#say})`; }\n}\nclass Pisik extends Heyvan {\n  ses() { return super.ses() + " — miyav!"; }\n}\nconst p = new Pisik("Mırmır");\nconsole.log(p.ses());\nconsole.log(p.ses());',
  'Async / Promise': 'const gozle = ms => new Promise(r => setTimeout(r, ms));\n\nasync function esas() {\n  console.log("Başladı…");\n  await gozle(800);\n  console.log("0.8 saniyə keçdi");\n  const netice = await Promise.all([1, 2, 3].map(async n => { await gozle(100 * n); return n * n; }));\n  console.log("Kvadratlar:", netice);\n}\nawait esas();',
  'Cədvəl (console.table)': 'const telebeler = [\n  { ad: "Əli", bal: 91 },\n  { ad: "Aysel", bal: 78 },\n  { ad: "Nigar", bal: 95 }\n];\nconsole.table(telebeler);\nconsole.log("Orta bal:", telebeler.reduce((s, t) => s + t.bal, 0) / telebeler.length);'
};
const HINT = {
  ReferenceError: 'Dəyişən və ya funksiya təyin edilməyib, yaxud adda hərf səhvi var.',
  SyntaxError: 'Yazılış xətası: mötərizə, dırnaq və ya nöqtəli vergül səhvi ola bilər.',
  TypeError: 'Dəyər tipi uyğun gəlmir (məs. undefined üzərində metod çağırmaq).',
  RangeError: 'Dəyər icazə verilən aralıqdan kənardadır (məs. sonsuz rekursiya).',
  Error: 'Proqram xəta atdı. Mesaja və sətir nömrəsinə baxın.'
};
let F, ready = false, busy = false, t0, iv, to, tail = null, box = null;

// ---------- redaktor ----------
function paint() {
  hl.innerHTML = highlight('js', ed.value);
  lines.textContent = Array.from({ length: ed.value.split('\n').length }, (_, k) => k + 1).join('\n');
  sync(); try { localStorage.setItem(KEY, ed.value); } catch {}
}
const sync = () => { hl.scrollTop = lines.scrollTop = ed.scrollTop; hl.scrollLeft = ed.scrollLeft; };
ed.oninput = paint; ed.onscroll = sync;
ed.onkeydown = e => {
  const v = ed.value, a = ed.selectionStart, ls = v.lastIndexOf('\n', a - 1) + 1;
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  else if (e.key === 'Enter' && !e.shiftKey && a === ed.selectionEnd) {
    e.preventDefault(); const cur = v.slice(ls, a);
    ed.setRangeText('\n' + cur.match(/^ */)[0] + (/[{\[(]\s*$/.test(cur) ? '  ' : ''), a, ed.selectionEnd, 'end'); paint();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) { const n = (v.slice(ls).match(/^ {1,2}/) || [''])[0].length; if (n) { ed.setRangeText('', ls, ls + n, 'preserve'); ed.selectionStart = ed.selectionEnd = Math.max(ls, a - n); paint(); } }
    else { ed.setRangeText('  ', a, ed.selectionEnd, 'end'); paint(); }
  }
};

// ---------- icraçı (sandbox iframe) ----------
function status(s, t) { st.dataset.s = s; st.querySelector('em').textContent = t; }
function boot() {
  ready = false; runB.disabled = true; status('load', 'Hazırlanır…');
  if (F) F.remove();
  F = document.createElement('iframe'); F.sandbox = 'allow-scripts'; F.className = 'rf'; F.title = 'runner'; F.src = 'runner.html?v=1';
  document.body.append(F);
}
function put(s, k) {
  if (tail && tail.className === k) tail.textContent += s;
  else { tail = document.createElement('span'); tail.className = k; tail.textContent = s; out.append(tail); }
  out.scrollTop = out.scrollHeight;
}
function reset(msg) { out.textContent = msg || ''; tail = null; box = null; }
function removeBox() { if (box) { box.remove(); box = null; } }
function stopTimers() { clearTimeout(to); clearInterval(iv); }
function idle() { busy = false; removeBox(); stopTimers(); runB.textContent = '▶ Başlat'; runB.disabled = !ready; }
function arm() {
  stopTimers(); t0 = performance.now();
  iv = setInterval(() => tm.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s / ' + LIMIT + ' s', 100);
  to = setTimeout(() => { idle(); put(`\n⏱ Vaxt limiti: kod ${LIMIT} saniyədən çox işlədiyi üçün dayandırıldı.\n`, 'e'); boot(); }, LIMIT * 1000);
}
function done(d) {
  const ms = performance.now() - t0; idle(); tm.textContent = (ms / 1000).toFixed(2) + ' s';
  if (d.ok) { if (!out.textContent.trim()) put('Kod uğurla tamamlandı.', 'm'); status('ok', 'Hazırdır'); return; }
  if (out.textContent && !out.textContent.endsWith('\n')) put('\n', 'o');
  put(`✖ ${d.name}: ${d.msg}\n`, 'e');
  if (d.line) { const src = (ed.value.split('\n')[d.line - 1] || '').trim(); put(`  Sətir ${d.line}${src ? ': ' + src : ''}\n`, 'e'); }
  if (HINT[d.name]) put('💡 ' + HINT[d.name] + '\n', 'h');
  status('ok', 'Hazırdır');
}
function ask(id) {
  stopTimers(); status('run', 'Giriş gözlənilir…'); tail = null;
  box = document.createElement('input'); box.className = 'tin'; box.autocomplete = 'off'; box.enterKeyHint = 'send'; box.placeholder = 'yazın və Enter basın';
  out.append(box); out.scrollTop = out.scrollHeight; box.focus();
  box.onkeydown = e => {
    if (e.key !== 'Enter') return;
    const v = box.value; removeBox(); put(v + '\n', 'o'); status('run', 'İcra olunur…'); arm();
    F.contentWindow.postMessage({ t: 'input', id, v }, '*');
  };
}
addEventListener('message', ({ source, data: d }) => {
  if (!F || source !== F.contentWindow || !d) return;
  if (d.t === 'ready') { ready = true; runB.disabled = busy; status('ok', 'Hazırdır'); }
  else if (!busy) return;
  else if (d.t === 'out') put(d.s, d.k === 'w' ? 'h' : d.k);
  else if (d.t === 'clear') reset();
  else if (d.t === 'res') put('→ ' + d.s + '\n', 'r');
  else if (d.t === 'need') ask(d.id);
  else if (d.t === 'done') done(d);
});
function run() {
  if (busy) { idle(); put('\n■ İcra dayandırıldı.\n', 'm'); boot(); return; }
  if (!ready) return;
  busy = true; runB.textContent = '■ Dayandır'; reset(); status('run', 'İcra olunur…'); arm();
  F.contentWindow.postMessage({ t: 'run', code: ed.value }, '*');
}

// ---------- düymələr ----------
const flash = (b, t) => { const o = b.textContent; b.textContent = t; setTimeout(() => b.textContent = o, 1200); };
const copy = (t, b) => navigator.clipboard.writeText(t).then(() => flash(b, 'Kopyalandı ✓'), () => flash(b, 'Alınmadı'));
runB.onclick = run;
$('#copy').onclick = e => copy(ed.value, e.target);
$('#copyout').onclick = e => copy(out.textContent, e.target);
$('#clear').onclick = () => { ed.value = ''; paint(); reset('Redaktor təmizləndi.'); };
$('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ed.value], { type: 'text/javascript' })); a.download = 'main.js'; a.click(); URL.revokeObjectURL(a.href); };
Object.keys(SAMPLES).forEach(k => pick.add(new Option(k, k)));
pick.onchange = () => { if (SAMPLES[pick.value]) { ed.value = SAMPLES[pick.value]; paint(); } pick.value = ''; };
try { ed.value = localStorage.getItem(KEY) || SAMPLES['Salam dünya']; } catch { ed.value = SAMPLES['Salam dünya']; }
paint(); boot();
