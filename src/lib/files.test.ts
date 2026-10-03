import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, makeZip, mimeFor, safeFileName, zipPath } from "./files.ts";

describe("files", () => {
  it("crc32 matches the reference value", () => {
    assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
    assert.equal(crc32(new Uint8Array()), 0);
  });

  it("mimeFor maps extensions", () => {
    assert.equal(mimeFor("index.html"), "text/html");
    assert.equal(mimeFor("main.PY"), "text/x-python");
    assert.equal(mimeFor("query.sql"), "application/sql");
    assert.equal(mimeFor("x.unknown"), "application/octet-stream");
    assert.equal(mimeFor("noext"), "application/octet-stream");
  });

  it("safeFileName strips separators", () => {
    assert.equal(safeFileName("../a/b:c.txt"), "_a_b_c.txt");
    assert.equal(safeFileName("   "), "file.txt");
  });

  it("zipPath removes traversal", () => {
    assert.equal(zipPath("/../a//b/./c.txt"), "a/b/c.txt");
  });

  it("makeZip produces an archive that python's zipfile can read back", () => {
    const files = [
      { name: "main.py", content: "print('Salam, Əli!')\n" },
      { name: "html/index.html", content: "<h1>Başlıq ö ğ ü ı</h1>" },
      { name: "html/index.html", content: "dup" },
      { name: "bin.dat", content: new Uint8Array([0, 1, 2, 255, 254]) },
      { name: "empty.txt", content: "" },
    ];
    const bytes = makeZip(files, new Date(2026, 9, 3, 18, 30, 10));
    const dir = mkdtempSync(join(tmpdir(), "zip-"));
    const zp = join(dir, "t.zip");
    writeFileSync(zp, bytes);
    const out = execFileSync("python3", [
      "-c",
      `import zipfile,json,sys
z=zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None
print(json.dumps({n:z.read(n).hex() for n in z.namelist()}))`,
      zp,
    ]).toString();
    const got = JSON.parse(out) as Record<string, string>;
    assert.deepEqual(Object.keys(got), [
      "main.py",
      "html/index.html",
      "html/index (2).html",
      "bin.dat",
      "empty.txt",
    ]);
    assert.equal(Buffer.from(got["main.py"], "hex").toString("utf8"), "print('Salam, Əli!')\n");
    assert.equal(
      Buffer.from(got["html/index.html"], "hex").toString("utf8"),
      "<h1>Başlıq ö ğ ü ı</h1>",
    );
    assert.equal(got["bin.dat"], "000102fffe");
    assert.equal(got["empty.txt"], "");
    // also the system unzip must accept it
    execFileSync("unzip", ["-tq", zp]);
    assert.ok(readFileSync(zp).length === bytes.length);
  });
});
