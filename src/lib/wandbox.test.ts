import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import { adaptJava, formatResult, resultFailed, splitFlags, wandboxBody } from "./wandbox.ts";

describe("wandbox helpers", () => {
  it("splits single-line flags into one option per line", () => {
    assert.deepEqual(splitFlags("-std=c17 -Wall  -Wextra\t-O2"), [
      "-std=c17",
      "-Wall",
      "-Wextra",
      "-O2",
    ]);
    assert.deepEqual(splitFlags(`-DNAME="a b" -O2`), ["-DNAME=a b", "-O2"]);
    assert.deepEqual(splitFlags("   "), []);
  });

  it("builds the request body", () => {
    const b = wandboxBody({ code: "x", compiler: "gcc-head-c", stdin: "1", flags: "-std=c17 -O2" });
    assert.equal(b["compiler-option-raw"], "-std=c17\n-O2");
    assert.equal(b.save, false);
  });

  it("removes `public` from the main class for Java", () => {
    assert.equal(adaptJava("public class Main {}"), "class Main {}");
    assert.equal(adaptJava("import x;\npublic final class A{}"), "import x;\nfinal class A{}");
    assert.equal(adaptJava("class Main {}"), "class Main {}");
  });

  it("formats results", () => {
    assert.equal(formatResult({ status: "0", program_output: "hi\n" })[0].text, "hi\n");
    assert.equal(formatResult({ status: "0" })[0].tone, "r");
    assert.ok(formatResult({ compiler_error: "boom" })[0].text.startsWith("COMPILER ERROR"));
    assert.equal(resultFailed({ status: "0" }), false);
    assert.equal(resultFailed({ status: "1" }), true);
    assert.equal(resultFailed({ status: "0", signal: "Killed" }), true);
  });
});

import { compilerFamily, pickCompiler } from "./wandbox.ts";
import { MORE_LANGS } from "./more-langs.ts";
import { readFileSync, existsSync } from "node:fs";

test("compilerFamily", () => {
  assert.equal(compilerFamily("rust-1.82.0"), "rust");
  assert.equal(compilerFamily("openjdk-jdk-22+36"), "openjdk-jdk");
  assert.equal(compilerFamily("bash"), "bash");
  assert.equal(compilerFamily("gcc-head"), "gcc");
  assert.equal(compilerFamily("gcc-head-c"), "gcc-c");
});

test("pickCompiler keeps a listed name and replaces a retired one with the newest sibling", () => {
  const list = ["rust-1.9.0", "rust-1.85.0", "rust-1.100.1", "rust-head", "go-1.23.2"].map(
    (name) => ({ name }),
  );
  assert.equal(pickCompiler("rust-1.85.0", list), "rust-1.85.0");
  assert.equal(pickCompiler("rust-1.82.0", list), "rust-1.100.1");
  assert.equal(pickCompiler("rust-1.82.0", null), "rust-1.82.0");
  assert.equal(pickCompiler("zzz-1.0", list), "zzz-1.0");
  assert.equal(pickCompiler("rust-1.82.0", [{ name: "rust-head" }]), "rust-head");
});

test("every pinned compiler exists in a Wandbox list snapshot (when present)", () => {
  const snap = new URL("../../scripts/wandbox-list.snapshot.json", import.meta.url);
  if (!existsSync(snap)) return;
  const names = new Set(
    (JSON.parse(readFileSync(snap, "utf8")) as { name: string }[]).map((c) => c.name),
  );
  for (const l of MORE_LANGS) assert.ok(names.has(l.compiler), `${l.id}: ${l.compiler} not listed`);
});
