export type PyResult = {
  ok?: number;
  res?: string | null;
  need?: number;
  name?: string;
  msg?: string;
  line?: number;
  src?: string;
};

export type PyMsg =
  | { t: "ready"; v?: string }
  | { t: "out"; k: string; s: string }
  | { t: "fatal"; e: string }
  | { t: "done"; r: PyResult; ms: number }
  | { t: "pkg"; names: string[] };

type Listener = (msg: PyMsg) => void;

class PythonRuntime {
  worker: Worker | null = null;
  ready = false;
  booting = false;
  listeners = new Set<Listener>();

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(msg: PyMsg) {
    this.listeners.forEach((fn) => fn(msg));
  }

  ensure() {
    if (this.worker || this.booting) return;
    this.booting = true;
    this.ready = false;
    const w = new Worker("/runtime/python.worker.js", { type: "module" });
    this.worker = w;
    w.onerror = () => {
      this.booting = false;
      this.emit({ t: "fatal", e: "Python worker başlamadı." });
    };
    w.onmessage = ({ data }: MessageEvent<PyMsg>) => {
      if (data.t === "ready") {
        this.ready = true;
        this.booting = false;
      }
      if (data.t === "fatal") {
        this.booting = false;
        this.ready = false;
      }
      this.emit(data);
    };
  }

  run(code: string, inputs: string[], seed: number) {
    this.worker?.postMessage({ code, inputs, seed });
  }

  stop() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.booting = false;
    this.ensure();
  }
}

export const pythonRuntime = new PythonRuntime();
