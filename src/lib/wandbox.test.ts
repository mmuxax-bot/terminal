import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adaptJava, formatResult, resultFailed, splitFlags, wandboxBody } from "./wandbox.ts";

describe("wandbox helpers", () => {
  it("splits single-line flags into one option per line", () => {
    assert.deepEqual(splitFlags("-std=c17 -Wall  -Wextra\t-O2"), ["-std=c17", "-Wall", "-Wextra", "-O2"]);
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
