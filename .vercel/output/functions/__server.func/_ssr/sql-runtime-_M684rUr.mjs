//#region node_modules/.nitro/vite/services/ssr/assets/sql-runtime-_M684rUr.js
var IDB_NAME = "nibrascode-sql";
var IDB_STORE = "kv";
function idbOpen() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(IDB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function idbGet() {
	try {
		const db = await idbOpen();
		return await new Promise((resolve, reject) => {
			const q = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get("db");
			q.onsuccess = () => resolve(q.result ?? null);
			q.onerror = () => reject(q.error);
		});
	} catch {
		return null;
	}
}
async function idbSet(data) {
	try {
		const db = await idbOpen();
		await new Promise((resolve, reject) => {
			const q = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(data, "db");
			q.onsuccess = () => resolve();
			q.onerror = () => reject(q.error);
		});
	} catch {}
}
var SqlRuntime = class {
	worker = null;
	ready = false;
	booting = false;
	listeners = /* @__PURE__ */ new Set();
	on(fn) {
		this.listeners.add(fn);
		return () => {
			this.listeners.delete(fn);
		};
	}
	emit(msg) {
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
			this.emit({
				t: "fatal",
				e: "SQLite worker başlamadı."
			});
		};
		w.onmessage = async ({ data }) => {
			if (data.t === "engine") {
				const saved = await idbGet();
				if (saved && saved.length) w.postMessage({
					t: "restore",
					data: saved
				});
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
				idbSet(data.data);
				return;
			}
			this.emit(data);
		};
	}
	run(sql) {
		this.worker?.postMessage({
			t: "run",
			sql
		});
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
};
var sqlRuntime = new SqlRuntime();
//#endregion
export { sqlRuntime as t };
