const BASES = [
  "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/",
  "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/",
];

const PKG = {
  numpy: "numpy",
  np: "numpy",
  pandas: "pandas",
  pd: "pandas",
  matplotlib: "matplotlib",
  plt: "matplotlib",
  scipy: "scipy",
  sklearn: "scikit-learn",
  sympy: "sympy",
  PIL: "pillow",
  cv2: "opencv-python",
  networkx: "networkx",
  seaborn: "seaborn",
  statsmodels: "statsmodels",
  xarray: "xarray",
};

function detectPackages(code) {
  const found = new Set();
  const re = /(?:^|\n)\s*(?:from\s+([A-Za-z_][\w]*)|import\s+([A-Za-z_][\w]*))/g;
  let m;
  while ((m = re.exec(code))) {
    const n = m[1] || m[2];
    if (PKG[n]) found.add(PKG[n]);
  }
  if (found.has("matplotlib") || found.has("seaborn") || found.has("pandas")) {
    found.add("numpy");
  }
  return [...found];
}

let py;
let fail;

async function boot() {
  for (const b of BASES) {
    try {
      const { loadPyodide } = await import(b + "pyodide.mjs");
      py = await loadPyodide({ indexURL: b });
      break;
    } catch (e) {
      fail = e;
    }
  }
  if (!py) return postMessage({ t: "fatal", e: String(fail) });
  try {
    py.globals.set("emit", (k, s) => postMessage({ t: "out", k, s }));
    const src = await (await fetch("/runtime/sandbox.py")).text();
    py.runPython(src);
    py.runPython("for _n in ALLOWED:\n    try: __import__(_n)\n    except Exception: pass");
    postMessage({ t: "ready", v: py.version });
  } catch (e) {
    postMessage({ t: "fatal", e: String(e) });
  }
}

onmessage = async ({ data }) => {
  if (!py || !data) return;
  const t0 = performance.now();
  try {
    const pkgs = detectPackages(data.code || "");
    if (pkgs.length) {
      postMessage({ t: "pkg", names: pkgs });
      await py.loadPackage(pkgs);
    }
    py.globals.set("_c", data.code);
    py.globals.set("_i", data.inputs);
    py.globals.set("_s", data.seed);
    const r = JSON.parse(py.runPython("run(_c, list(_i), _s)"));
    postMessage({ t: "done", r, ms: Math.round(performance.now() - t0) });
  } catch (e) {
    postMessage({
      t: "done",
      r: { ok: 0, name: "Error", msg: String(e) },
      ms: Math.round(performance.now() - t0),
    });
  }
};

boot();
