//#region node_modules/.nitro/vite/services/ssr/assets/python-runtime-DPuzWqGx.js
var PythonRuntime = class {
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
		const w = new Worker("/runtime/python.worker.js", { type: "module" });
		this.worker = w;
		w.onerror = () => {
			this.booting = false;
			this.emit({
				t: "fatal",
				e: "Python worker başlamadı."
			});
		};
		w.onmessage = ({ data }) => {
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
	run(code, inputs, seed) {
		this.worker?.postMessage({
			code,
			inputs,
			seed
		});
	}
	stop() {
		this.worker?.terminate();
		this.worker = null;
		this.ready = false;
		this.booting = false;
		this.ensure();
	}
};
var pythonRuntime = new PythonRuntime();
//#endregion
export { pythonRuntime as t };
