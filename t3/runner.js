// Sandbox iframe daxilində (qeyri-müəyyən mənşə) işləyir. İstifadəçi kodu Blob Worker-də icra olunur.
function engine(post) {
  const G = globalThis, st = G.setTimeout, si = G.setInterval, ct = G.clearTimeout, ci = G.clearInterval, LIMIT = 200000;
  let seq = 0, total = 0, depth = 0, finished = true; const waits = {}, active = new Set(), timers = {};
  const out = (k, s) => { total += s.length; if (total > LIMIT) throw new Error('Çıxış limiti aşıldı (200 000 simvol)'); post({ t: 'out', k, s }); };
  const fmt = v => {
    if (typeof v === 'string') return v;
    if (v === undefined || v === null || typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'function') return '[Function ' + (v.name || 'anonim') + ']';
    if (typeof v === 'bigint') return v + 'n';
    if (typeof v === 'symbol') return v.toString();
    if (v instanceof Error) return v.stack || String(v);
    const js = ind => {
      const seen = new WeakSet();
      return JSON.stringify(v, (k, x) => {
        if (typeof x === 'bigint') return x + 'n';
        if (typeof x === 'function') return '[Function]';
        if (x instanceof Map) return { Map: [...x] };
        if (x instanceof Set) return { Set: [...x] };
        if (x && typeof x === 'object') { if (seen.has(x)) return '[Circular]'; seen.add(x); }
        return x === undefined ? 'undefined' : x;
      }, ind);
    };
    try {
      const c = js(0);
      return c.length <= 72 ? c.replace(/^\[/, '[ ').replace(/\]$/, ' ]').replace(/^\{/, '{ ').replace(/\}$/, ' }').replace(/,/g, ', ').replace(/":/g, '": ') : js(2);
    } catch { return String(v); }
  };
  const line = (k, a) => out(k, '  '.repeat(depth) + a.map(fmt).join(' ').split('\n').join('\n' + '  '.repeat(depth)) + '\n');
  const table = d => {
    const rows = Array.isArray(d) ? d.map((r, i) => [i, r]) : Object.entries(d || {}), cols = [];
    rows.forEach(([, r]) => { if (r && typeof r === 'object') Object.keys(r).forEach(c => cols.includes(c) || cols.push(c)); });
    const head = ['(index)', ...cols, ...(rows.some(([, r]) => !r || typeof r !== 'object') ? ['Values'] : [])];
    const body = rows.map(([i, r]) => [i, ...cols.map(c => r && typeof r === 'object' && c in r ? fmt(r[c]) : ''), ...(head.includes('Values') ? [r && typeof r === 'object' ? '' : fmt(r)] : [])].map(String));
    const w = head.map((h, j) => Math.max(h.length, ...body.map(r => r[j].length)));
    const f = r => '│ ' + r.map((c, j) => c.padEnd(w[j])).join(' │ ') + ' │\n';
    out('o', f(head) + '├' + w.map(n => '─'.repeat(n + 2)).join('┼') + '┤\n' + body.map(f).join(''));
  };
  const input = (p = '') => { out('o', String(p)); return new Promise(r => { const id = ++seq; waits[id] = r; post({ t: 'need', id }); }); };
  const sandboxConsole = {
    log: (...a) => line('o', a), info: (...a) => line('o', a), debug: (...a) => line('o', a),
    warn: (...a) => line('w', a), error: (...a) => line('e', a), table, dir: a => line('o', [a]),
    assert: (c, ...a) => { if (!c) line('e', ['Assertion failed:', ...a]); },
    clear: () => post({ t: 'clear' }), group: (...a) => { if (a.length) line('o', a); depth++; }, groupEnd: () => { depth = Math.max(0, depth - 1); },
    time: (l = 'default') => { timers[l] = performance.now(); },
    timeEnd: (l = 'default') => { if (l in timers) { line('o', [l + ': ' + (performance.now() - timers[l]).toFixed(2) + ' ms']); delete timers[l]; } }
  };
  G.console = sandboxConsole; G.input = input; G.prompt = input; G.readline = input;
  G.alert = (...a) => line('o', ['[alert]', ...a]); G.sleep = ms => new Promise(r => G.setTimeout(r, ms));
  G.setTimeout = (f, ms, ...a) => { const id = st(() => { active.delete(id); if (typeof f === 'function') f(...a); }, ms); active.add(id); return id; };
  G.setInterval = (f, ms, ...a) => { const id = si(() => { if (typeof f === 'function') f(...a); }, ms); active.add(id); return id; };
  G.clearTimeout = id => { active.delete(id); ct(id); }; G.clearInterval = id => { active.delete(id); ci(id); };
  let off = 2;
  const finish = m => { if (finished) return; finished = true; post({ t: 'done', ...m }); };
  const fail = e => {
    const s = e && e.stack ? String(e.stack) : '', mm = s.match(/(?:<anonymous>|AsyncFunction):(\d+):\d+/), n = mm ? +mm[1] - off : 0;
    finish({ ok: 0, name: (e && e.name) || 'Error', msg: (e && e.message) || String(e), line: n > 0 ? n : null });
  };
  if (G.addEventListener) {
    G.addEventListener('error', ev => { ev.preventDefault && ev.preventDefault(); fail(ev.error || { message: ev.message }); });
    G.addEventListener('unhandledrejection', ev => { ev.preventDefault && ev.preventDefault(); fail(ev.reason); });
  }
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  async function run(code) {
    total = 0; depth = 0; finished = false; let fn, expr = false;
    try { fn = new AF('return (\n' + code + '\n)'); expr = true; off = 3; } catch { off = 2; try { fn = new AF(code); } catch (e) { return fail(e); } }
    let v;
    try { v = await fn(); } catch (e) { return fail(e); }
    if (expr && v !== undefined) post({ t: 'res', s: fmt(v) });
    await new Promise(r => { const iv = si(() => { if (finished || (!active.size && !Object.keys(waits).length)) { ci(iv); r(); } }, 30); });
    finish({ ok: 1 });
  }
  return { run, input: (id, v) => { const r = waits[id]; delete waits[id]; if (r) r(v); } };
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const send = m => parent.postMessage(m, '*');
  let eng, last = '', got = false;
  const local = () => engine(send);
  function make() {
    try {
      const src = `const E=(${engine.toString()})(postMessage);onmessage=e=>{const d=e.data;if(d.t==='run')E.run(d.code);else if(d.t==='input')E.input(d.id,d.v)};postMessage({t:'up'});`;
      const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      w.onmessage = e => { got = true; if (e.data.t !== 'up') send(e.data); };
      w.onerror = e => { e.preventDefault(); if (!got) { eng = local(); eng.run(last); } else send({ t: 'done', ok: 0, name: 'Error', msg: e.message || 'Worker xətası' }); };
      return { run: c => w.postMessage({ t: 'run', code: c }), input: (id, v) => w.postMessage({ t: 'input', id, v }) };
    } catch { return local(); }
  }
  eng = make();
  addEventListener('message', e => {
    if (e.source !== parent || !e.data) return;
    if (e.data.t === 'run') { last = e.data.code; eng.run(last); } else if (e.data.t === 'input') eng.input(e.data.id, e.data.v);
  });
  send({ t: 'ready' });
}
if (typeof module !== 'undefined') module.exports = { engine };
