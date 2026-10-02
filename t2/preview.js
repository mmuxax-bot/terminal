// Nəticə sandbox iframe-də (qeyri-müəyyən mənşə) işləyir: cookie/yaddaşa çıxışı yoxdur, səhifəni yönləndirə bilməz.
const KEY = 'nibrascode.html.preview.v1', f = document.getElementById('f');
let doc = '';
const empty = '<body style="font:16px system-ui;padding:24px;color:#555">Kod tapılmadı. Redaktorda «Başlat» düyməsini basın.</body>';
function show(d) { doc = d || empty; f.srcdoc = doc; }
function load() { try { show(localStorage.getItem(KEY)); } catch { show(''); } }
addEventListener('storage', e => { if (e.key === KEY) load(); });
addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.t === 'doc') show(e.data.doc); });
document.getElementById('reload').onclick = () => show(doc);
document.getElementById('dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' })); a.download = 'index.html'; a.click(); URL.revokeObjectURL(a.href); };
load();
try { if (opener) opener.postMessage({ t: 'ready' }, location.origin); } catch {}
