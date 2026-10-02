export type SqlCol = { n: string; t: string; pk: number };
export type SqlTable = { name: string; type: string; cols: SqlCol[] };

export type SqlMsg =
  | { t: "engine" }
  | { t: "ready" }
  | { t: "fatal"; e: string }
  | { t: "schema"; list: SqlTable[] }
  | { t: "rows"; cols: string[]; rows: unknown[][]; more?: boolean; sql?: string }
  | { t: "ok"; changes: number; sql?: string }
  | { t: "err"; msg: string; n: number }
  | { t: "done"; ms: number; n: number }
  | { t: "reset" }
  | { t: "file"; data: Uint8Array }
  | { t: "persist"; data: Uint8Array };

type Listener = (msg: SqlMsg) => void;

const IDB_NAME = "nibrascode-sql";
const IDB_STORE = "kv";

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(): Promise<Uint8Array | null> {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const q = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get("db");
      q.onsuccess = () => resolve((q.result as Uint8Array) ?? null);
      q.onerror = () => reject(q.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(data: Uint8Array) {
  try {
    const db = await idbOpen();
    await new Promise<void>((resolve, reject) => {
      const q = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(data, "db");
      q.onsuccess = () => resolve();
      q.onerror = () => reject(q.error);
    });
  } catch {
    /* ignore */
  }
}

class SqlRuntime {
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

  private emit(msg: SqlMsg) {
    this.listeners.forEach((fn) => fn(msg));
  }

  ensure() {
    if (this.worker || this.booting) return;
    this.booting = true;
    this.ready = false;
    const w = new Worker("/runtime/sql.worker.js");
    this.worker = w;
    w.onerror = () => {
      this.booting = false;
      this.emit({ t: "fatal", e: "SQLite worker başlamadı." });
    };
    w.onmessage = async ({ data }: MessageEvent<SqlMsg>) => {
      if (data.t === "engine") {
        const saved = await idbGet();
        if (saved && saved.length) w.postMessage({ t: "restore", data: saved });
        else w.postMessage({ t: "init" });
        return;
      }
      if (data.t === "ready") {
        this.ready = true;
        this.booting = false;
      }
      if (data.t === "fatal") {
        this.booting = false;
        this.ready = false;
      }
      if (data.t === "persist") {
        void idbSet(data.data);
        return;
      }
      this.emit(data);
    };
  }

  run(sql: string) {
    this.worker?.postMessage({ t: "run", sql });
  }

  reset() {
    this.worker?.postMessage({ t: "reset" });
  }

  exportDb() {
    this.worker?.postMessage({ t: "export" });
  }

  stop() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.booting = false;
    this.ensure();
  }
}

export const sqlRuntime = new SqlRuntime();
