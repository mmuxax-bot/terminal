const $ = s => document.querySelector(s);
const ed = $('#code'), lines = $('#lines'), hl = $('#hl'), out = $('#output'), runB = $('#run'), st = $('#status'), tm = $('#time'), inp = $('#input'), pick = $('#samples');
const LIMIT = 40, KEY = 'nibrascode.py.v3';
const SAMPLES = {
  'Salam dünya': ['ad = "NibrasCode"\nfor i in range(1, 4):\n    print(f"{i}. Salam, {ad}!")\n\nsum([10, 20, 30])', ''],
  'input() ilə': ['ad = input("Adınız: ")\nyas = int(input("Yaşınız: "))\nprint(f"Salam, {ad}! 10 ildən sonra {yas + 10} yaşında olacaqsan.")', ''],
  'Hesab makinesi': ['while True:\n    e = input("Hesab (çıxış: q): ")\n    if e.strip() == "q":\n        break\n    try:\n        print("=", eval(e))\n    except Exception as x:\n        print("Xəta:", x)', ''],
  'Siniflər (OOP)': ['class Heyvan:\n    def __init__(self, ad):\n        self.ad = ad\n        self._say = 0\n\n    def ses(self):\n        self._say += 1\n        return f"{self.ad} səs çıxarır ({self._say})"\n\nclass Pisik(Heyvan):\n    def ses(self):\n        return super().ses() + " — miyav!"\n\np = Pisik("Mırmır")\nprint(p.ses())\nprint(p.ses())', ''],
  'Rekursiya': ['from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)\n\nprint([fib(i) for i in range(15)])\nfib(80)', ''],
  'Data (Counter)': ['from collections import Counter\n\nmetn = "bismillahir rahmanir rahim"\nsay = Counter(metn.replace(" ", ""))\nfor h, n in say.most_common(5):\n    print(h, "█" * n, n)', '']
};
let W, ready = false, busy = false, waiting = false, t0, iv, to, tail = null, inQ = [], shown = 0, skip = 0, seed = 0, box = null;

// ---------- redaktor ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KW = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const CO = new Set(['True', 'False', 'None', 'self', 'cls']);
const BI = new Set('print input len range int float str list dict set tuple sum min max abs sorted enumerate zip map filter round isinstance type super bool any all reversed'.split(' '));
const TOK = /(#.*)|("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|[rbfRBF]{0,2}"(?:\\.|[^"\\\n])*"?|[rbfRBF]{0,2}'(?:\\.|[^'\\\n])*'?)|(\b\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?\b)|(@\w+)|([A-Za-z_]\w*)/g;
function paint() {
  const v = ed.value; let o = '', i = 0, m; TOK.lastIndex = 0;
  while ((m = TOK.exec(v))) {
    o += esc(v.slice(i, m.index)); i = TOK.lastIndex;
    const t = m[0]; let c = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'd' : '';
    if (m[5]) c = KW.has(t) ? 'k' : CO.has(t) ? 'n' : BI.has(t) ? 'b' : (/^\s*\(/.test(v.slice(i, i + 3)) ? 'f' : '');
    o += c ? `<span class="${c}">${esc(t)}</span>` : esc(t);
  }
  hl.innerHTML = o + esc(v.slice(i)) + '\n';
  lines.textContent = Array.from({ length: v.split('\n').length }, (_, k) => k + 1).join('\n');
  sync(); try { localStorage.setItem(KEY, JSON.stringify([v, inp.value])); } catch {}
}
const sync = () => { hl.scrollTop = lines.scrollTop = ed.scrollTop; hl.scrollLeft = ed.scrollLeft; };
ed.oninput = paint; inp.oninput = paint; ed.onscroll = sync;
ed.onkeydown = e => {
  const v = ed.value, a = ed.selectionStart, ls = v.lastIndexOf('\n', a - 1) + 1;
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  else if (e.key === 'Enter' && !e.shiftKey && ed.selectionStart === ed.selectionEnd) {
    e.preventDefault(); const cur = v.slice(ls, a), ind = cur.match(/^ */)[0] + (/:\s*$/.test(cur) ? '    ' : '');
    ed.setRangeText('\n' + ind, a, ed.selectionEnd, 'end'); paint();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) { const n = (v.slice(ls).match(/^ {1,4}/) || [''])[0].length; if (n) { ed.setRangeText('', ls, ls + n, 'preserve'); ed.selectionStart = ed.selectionEnd = Math.max(ls, a - n); paint(); } }
    else { ed.setRangeText('    ', a, ed.selectionEnd, 'end'); paint(); }
  }
};
function setCode(c, i = '') { ed.value = c; inp.value = i; paint(); }

// ---------- worker ----------
function status(s, t) { st.dataset.s = s; st.querySelector('em').textContent = t; }
function boot() {
  ready = false; runB.disabled = true; status('load', 'Python yüklənir…');
  W = new Worker('./worker.js?v=4', { type: 'module' });
  W.onerror = () => { status('err', 'Yükləmə xətası'); put('Worker başlamadı. Faylların HTTPS üzərindən və eyni qovluqdan açıldığını yoxlayın.', 'e'); };
  W.onmessage = ({ data: d }) => {
    if (d.t === 'ready') { ready = true; runB.disabled = false; status('ok', 'Python hazırdır'); }
    else if (d.t === 'out') { let s = d.s; if (skip) { const c = Math.min(skip, s.length); skip -= c; s = s.slice(c); } if (s) { put(s, d.k); shown += s.length; } }
    else if (d.t === 'fatal') { status('err', 'Yükləmə xətası'); put('Python yüklənmədi: ' + d.e, 'e'); }
    else if (d.t === 'done') done(d.r, d.ms);
  };
}
function put(s, k) {
  if (tail && tail.className === k) tail.textContent += s;
  else { tail = document.createElement('span'); tail.className = k; tail.textContent = s; out.append(tail); }
  out.scrollTop = out.scrollHeight;
}
function reset(msg) { out.textContent = msg || ''; tail = null; }
function idle() { busy = false; clearTimeout(to); clearInterval(iv); runB.textContent = '▶ Başlat'; runB.disabled = !ready; }
const HINT = {
  NameError: 'Dəyişən və ya funksiya əvvəlcədən təyin edilməyib, yaxud adda hərf səhvi var.',
  SyntaxError: 'Yazılış xətası: mötərizə, dırnaq və ya ":" işarəsini yoxlayın.',
  IndentationError: 'Boşluqlar (indent) düz deyil — hər blok 4 boşluqla sürüşməlidir.',
  TypeError: 'Dəyər tipi uyğun gəlmir (məs. mətn + rəqəm). str() və ya int() işlədin.',
  ValueError: 'Dəyər düzgün formatda deyil (məs. int("abc")).',
  ZeroDivisionError: 'Sıfıra bölmək olmaz.',
  IndexError: 'Siyahıda belə indeks yoxdur.',
  KeyError: 'Lüğətdə belə açar yoxdur.',
  EOFError: 'input() üçün dəyər çatmır — "input() dəyərləri" bölməsinə yazın.',
  PermissionError: 'Təhlükəsiz rejimdə bu əməliyyata icazə verilmir.',
  ImportError: 'Bu modul təhlükəsiz rejimdə mövcud deyil.',
  ModuleNotFoundError: 'Bu modul təhlükəsiz rejimdə mövcud deyil.',
  RecursionError: 'Sonsuz rekursiya — dayanma şərti əlavə edin.',
  AttributeError: 'Bu obyektdə belə atribut/metod yoxdur.'
};
function done(r, ms) {
  if (r.need) return ask();
  idle(); tm.textContent = (ms / 1000).toFixed(2) + ' s';
  if (r.ok) { if (r.res) put('→ ' + r.res + '\n', 'r'); if (!out.textContent.trim()) put('Kod uğurla tamamlandı.', 'm'); status('ok', 'Hazırdır'); }
  else {
    if (out.textContent && !out.textContent.endsWith('\n')) put('\n', 'o');
    put(`✖ ${r.name}: ${r.msg}\n`, 'e');
    if (r.line) put(`  Sətir ${r.line}${r.src ? ': ' + r.src : ''}\n`, 'e');
    if (HINT[r.name]) put('💡 ' + HINT[r.name] + '\n', 'h');
  }
}
function removeBox() { if (box) { box.remove(); box = null; } waiting = false; }
function send() {
  clearTimeout(to); clearInterval(iv); t0 = performance.now();
  iv = setInterval(() => tm.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' s / ' + LIMIT + ' s', 100);
  to = setTimeout(() => { W.terminate(); removeBox(); idle(); put(`\n⏱ Vaxt limiti: kod ${LIMIT} saniyədən çox işlədiyi üçün dayandırıldı.\n`, 'e'); boot(); }, LIMIT * 1000);
  W.postMessage({ code: ed.value, inputs: inQ, seed });
}
// input(): proqram yenidən başladılır (eyni seed ilə), artıq göstərilmiş çıxış atlanır
function ask() {
  clearTimeout(to); clearInterval(iv); waiting = true; status('run', 'Giriş gözlənilir…'); tail = null;
  box = document.createElement('input'); box.className = 'tin'; box.autocomplete = 'off'; box.enterKeyHint = 'send'; box.placeholder = 'yazın və Enter basın';
  out.append(box); out.scrollTop = out.scrollHeight; box.focus();
  box.onkeydown = e => {
    if (e.key !== 'Enter') return;
    const v = box.value; removeBox(); put(v + '\n', 'o'); shown += v.length + 1; inQ.push(v); skip = shown;
    status('run', 'İcra olunur…'); send();
  };
}
function run() {
  if (busy) {
    if (waiting) { removeBox(); idle(); put('\n■ İcra dayandırıldı.\n', 'm'); return; }
    W.terminate(); idle(); put('\n■ İcra dayandırıldı.\n', 'm'); boot(); return;
  }
  if (!ready) return;
  busy = true; runB.textContent = '■ Dayandır'; reset(); inQ = inp.value ? inp.value.split(/\r?\n/) : []; shown = skip = 0;
  seed = Math.floor(Math.random() * 1e9); status('run', 'İcra olunur…'); send();
}

// ---------- düymələr ----------
const flash = (b, t) => { const o = b.textContent; b.textContent = t; setTimeout(() => b.textContent = o, 1200); };
const copy = (t, b) => navigator.clipboard.writeText(t).then(() => flash(b, 'Kopyalandı ✓'), () => flash(b, 'Alınmadı'));
runB.onclick = run;
$('#copy').onclick = e => copy(ed.value, e.target);
$('#copyout').onclick = e => copy(out.textContent, e.target);
$('#clear').onclick = () => { setCode(''); reset('Redaktor təmizləndi.'); };
$('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ed.value], { type: 'text/x-python' })); a.download = 'main.py'; a.click(); URL.revokeObjectURL(a.href); };
Object.keys(SAMPLES).forEach(k => pick.add(new Option(k, k)));
pick.onchange = () => { if (SAMPLES[pick.value]) setCode(...SAMPLES[pick.value]); pick.value = ''; };
try { const s = JSON.parse(localStorage.getItem(KEY)); setCode(s[0], s[1]); } catch { setCode(...SAMPLES['Salam dünya']); }
boot();
