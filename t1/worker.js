const BASES = ['https://cdn.jsdelivr.net/pyodide/v314.0.7/full/', 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'];
let py, fail;
async function boot() {
  for (const b of BASES) {
    try { const { loadPyodide } = await import(b + 'pyodide.mjs'); py = await loadPyodide({ indexURL: b }); break; }
    catch (e) { fail = e; }
  }
  if (!py) return postMessage({ t: 'fatal', e: String(fail) });
  try {
    py.globals.set('emit', (k, s) => postMessage({ t: 'out', k, s }));
    py.runPython(await (await fetch('./sandbox.py?v=4')).text());
    py.runPython("for _n in ALLOWED:\n    try: __import__(_n)\n    except Exception: pass");
    // Qat 2: şəbəkə/yaddaş API-lərini bağla (Pyodide artıq tam yüklənib)
    for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches', 'importScripts', 'Worker', 'SharedWorker', 'BroadcastChannel'])
      try { Object.defineProperty(self, k, { value: undefined, writable: false, configurable: false }); } catch {}
    postMessage({ t: 'ready', v: py.version });
  } catch (e) { postMessage({ t: 'fatal', e: String(e) }); }
}
onmessage = ({ data }) => {
  if (!py) return;
  const t0 = performance.now();
  let r;
  try {
    py.globals.set('_c', data.code);
    py.globals.set('_i', data.inputs);
    py.globals.set('_s', data.seed);
    r = JSON.parse(py.runPython('run(_c, list(_i), _s)'));
  } catch (e) { r = { ok: 0, name: 'Error', msg: String(e) }; }
  postMessage({ t: 'done', r, ms: Math.round(performance.now() - t0) });
};
boot();
