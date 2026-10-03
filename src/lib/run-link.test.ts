import test from "node:test";
import assert from "node:assert/strict";
import { decodeRunHash, encodeRunHash, normalizeRunLang } from "./run-link.ts";

const PY = 'print("Salam, dünya! ə ş ç ğ ı ö ü")\nfor i in range(3):\n    print(i)\n';

test("python round-trip (UTF-8, newline)", async () => {
  const h = await encodeRunHash("python", PY);
  assert.match(h, /^#l=python&c=[A-Za-z0-9_-]+(&z=1)?$/);
  const r = await decodeRunHash(h);
  assert.deepEqual(r, { ok: true, lang: "python", code: PY });
});

test("html round-trip, big code gets compressed", async () => {
  const html = "<!doctype html><html><body>" + "<p>Salam ə</p>".repeat(2000) + "</body></html>";
  const h = await encodeRunHash("html", html);
  assert.ok(h.includes("&z=1"));
  assert.ok(h.length < html.length / 5);
  const r = await decodeRunHash(h);
  assert.deepEqual(r, { ok: true, lang: "html", code: html });
});

test("errors are Azerbaijani, never throw", async () => {
  for (const h of ["", "#", "#l=python", "#l=cobol&c=AA", "#l=python&c=***", "#l=python&c=AAAA&z=1"]) {
    const r = await decodeRunHash(h);
    assert.equal(r.ok, false);
  }
});

test("lang aliases", () => {
  assert.equal(normalizeRunLang("PY"), "python");
  assert.equal(normalizeRunLang("js"), "javascript");
  assert.equal(normalizeRunLang("c"), null);
});
