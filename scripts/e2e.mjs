// End-to-end checks (Playwright + system Chrome) against a running app.
//   BASE=http://localhost:8080 node scripts/e2e.mjs [home html js sql c more python download mobile]
// Needs internet (Pyodide / sql.js CDN, wandbox.org).
import { chromium } from "playwright";
import { existsSync, mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE || "http://localhost:8080";
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync);
const MORE = {
  cpp: /Cəm = 15/, java: /\[1, 2, 3\]/, php: /Salam, NibrasCode!/, go: /Salam, NibrasCode!/, rust: /\[1, 4, 9\]/,
  node: /Salam, NibrasCode!/, ts: /Əli: 91/, ruby: /Salam, NibrasCode!/, perl: /Salam, NibrasCode!/, lua: /Salam, NibrasCode!/,
  bash: /Salam, NibrasCode!/, julia: /Salam, NibrasCode!/, r: /Orta bal: 88/, haskell: /Salam, NibrasCode!/,
};
const MORE_FILES = { cpp: "main.cpp", java: "Main.java", php: "main.php", go: "main.go", rust: "main.rs", node: "main.js", ts: "main.ts", ruby: "main.rb", perl: "main.pl", lua: "main.lua", bash: "main.sh", julia: "main.jl", r: "main.R", haskell: "main.hs" };
const ALL_ROUTES = ["/python", "/html", "/javascript", "/sql", "/c", ...Object.keys(MORE).map((k) => "/" + k)];
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + String(extra).replace(/\s+/g, " ").slice(0, 160) : ""}`);
};

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const errors = [];
function newCtx(opts = {}) {
  return browser.newContext({ viewport: { width: 1200, height: 800 }, acceptDownloads: true, ...opts }).then((c) => {
    c.on("page", (p) => p.on("pageerror", (e) => errors.push(p.url() + " :: " + e.message)));
    return c;
  });
}
const tests = process.argv.slice(2);
const want = (n) => !tests.length || tests.includes(n);

async function setEditor(page, text) {
  await page.locator(".cm-content").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(text);
}
async function runAndPopup(ctx, page, btn) {
  const [pop] = await Promise.all([ctx.waitForEvent("page", { timeout: 15000 }), btn.click()]);
  await pop.waitForLoadState();
  return pop;
}
async function outputOf(pop, re, timeout = 60000) {
  await pop.waitForFunction((src) => new RegExp(src).test(document.body.innerText), re.source, { timeout }).catch(() => {});
  return pop.evaluate(() => document.body.innerText);
}
const runBtn = (page) => page.getByRole("button", { name: /^(Başlat|Compile & Run)$/ }).first();
async function waitEnabled(page, timeout = 90000) {
  await page.waitForFunction(
    () => [...document.querySelectorAll("button")].some((b) => /^(Başlat|Compile & Run)$/.test(b.textContent.trim()) && !b.disabled),
    null,
    { timeout },
  );
}

// The code screen must contain only editor + toolbar + status line: no iframe, console, output, table, image.
async function assertNoInline(page, label) {
  const info = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      // the JS engine runs in an invisible 0x0 sandbox iframe (title "runner"); anything else/visible is a preview
      iframes: [...document.querySelectorAll("iframe")].filter((f) => {
        const r = f.getBoundingClientRect();
        return f.title !== "runner" || r.width > 1 || r.height > 1;
      }).length,
      tables: document.querySelectorAll("table").length,
      imgs: document.querySelectorAll("main img, .cm-editor ~ img, img[alt='Qrafik']").length,
      bridge: document.documentElement.outerHTML.includes("data-nibras-bridge"),
      words: (body.match(/\b(Konsol|Terminal|Output|Çıxış|Nəticə)\b|Kodu başladanda|Kodu işə salmaq üçün|Sorğunu yazıb/g) || []),
      editors: document.querySelectorAll(".cm-editor").length,
    };
  });
  check(`no inline preview/output on code screen: ${label}`, info.iframes === 0 && info.tables === 0 && info.imgs === 0 && !info.bridge && info.words.length === 0 && info.editors >= 1, JSON.stringify(info));
}

const ctx = await newCtx();

if (want("home")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/");
  const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  check("home: compact — 5 language cards + ONE 'Digər dillər' card", ["/python", "/html", "/javascript", "/sql", "/c", "/more"].every((h) => hrefs.includes(h)) && !hrefs.includes("/cpp") && !hrefs.includes("/java"), hrefs.join(","));
  const more = await ctx.newPage();
  await more.goto(BASE + "/more");
  const mh = await more.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  check("/more: one separate card per extra language (14)", Object.keys(MORE).every((k) => mh.includes("/" + k)), mh.join(","));
  await more.locator("a[href='/java']").click();
  await more.waitForSelector(".cm-content");
  check("/more: card opens that language's own lab", new URL(more.url()).pathname === "/java" && /Main\.java|class Main/.test(await more.locator(".cm-content").innerText()));
  await more.close();
  await page.close();
}

if (want("html")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/html");
  await page.waitForSelector(".cm-content");
  // the code screen has NO inline preview / output pane
  check("html: no inline preview iframe on the code screen", (await page.locator("iframe").count()) === 0);
  check("html: status line + reopen link present", (await page.getByRole("status").getByRole("link", { name: "Önizləməni aç" }).count()) === 1);
  // write a page that uses console + localStorage
  await page.getByRole("button", { name: "JS", exact: true }).click();
  await setEditor(page, `console.log("konsol-test", 21*2); localStorage.setItem("k","v"); document.body.insertAdjacentHTML("beforeend","<p id=ls>LS="+localStorage.getItem("k")+"</p>"); throw new Error("boom-test");`);
  const pop = await runAndPopup(ctx, page, runBtn(page));
  check("html: Başlat opens new /preview page", /\/preview\?lang=html/.test(pop.url()), pop.url());
  await pop.waitForSelector("iframe");
  const psb = await pop.locator("iframe").getAttribute("sandbox");
  check("html: new-page iframe sandboxed", !!psb && !psb.includes("allow-same-origin"), psb);
  const frame = pop.frames().find((f) => f !== pop.mainFrame());
  await frame.waitForSelector("#ls", { timeout: 8000 }).catch(() => {});
  const txt = await frame.evaluate(() => document.body.innerText).catch((err) => String(err));
  check("html: preview renders + localStorage shim works in sandbox", /LS=v/.test(txt), txt);
  const sameOriginBlocked = await frame.evaluate(() => { try { return typeof parent.document.title; } catch { return "blocked"; } });
  check("html: preview cannot touch parent DOM", sameOriginBlocked === "blocked", sameOriginBlocked);
  if (!(await pop.getByText("konsol-test 42").count())) await pop.getByRole("button", { name: /Konsol/ }).click(); // opens itself on errors
  const cons = await outputOf(pop, /konsol-test 42/, 5000);
  check("html: console.log + error shown in preview page console", /konsol-test 42/.test(cons) && /boom-test/.test(cons), cons.slice(-200));
  // live update
  await page.bringToFront();
  await page.getByRole("button", { name: "HTML", exact: true }).click();
  await setEditor(page, "<h1 id=live>LIVE-UPDATE-OK</h1>");
  await pop.waitForFunction(() => document.querySelector("iframe")?.getAttribute("srcdoc")?.includes("LIVE-UPDATE-OK"), null, { timeout: 8000 }).catch(() => {});
  const upd = await pop.locator("iframe").getAttribute("srcdoc");
  check("html: preview page live-updates while editing", /LIVE-UPDATE-OK/.test(upd || ""));
  check("html: no auto-open toggle anymore", (await page.getByLabel("Başlatda yeni səhifədə aç").count()) === 0);
  const st = await page.getByTestId("preview-status").innerText();
  check("html: status says preview opened in new page", /Önizləmə yeni səhifədə açıldı/.test(st), st);
  await pop.close();
  await page.close();
}

if (want("js")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/javascript");
  await page.waitForSelector(".cm-content");
  await waitEnabled(page, 20000);
  await setEditor(page, `console.log("js-out", [1,2,3].map(x=>x*x)); console.table([{a:1,b:2}]);`);
  const pop = await runAndPopup(ctx, page, runBtn(page));
  check("js: new page opens", /\/preview\?lang=javascript/.test(pop.url()), pop.url());
  const t = await outputOf(pop, /Hazırdır/, 15000);
  check("js: no inline console on the code screen", !/Konsol|Kodu başladanda nəticə/.test(await page.locator("body").innerText()));
  check("js: output shown in new page", /js-out \[ 1, 4, 9 \]/.test(t) && /\(index\)/.test(t) && /Hazırdır/.test(t), t.slice(-120));
  await pop.close();
  await page.close();
}

if (want("jsinput")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/javascript");
  await page.waitForSelector(".cm-content");
  await waitEnabled(page, 20000);
  await setEditor(page, `const ad = await input("Ad: "); console.log("Salam, " + ad + "!");`);
  const pop = await runAndPopup(ctx, page, runBtn(page));
  await page.getByLabel("Giriş").waitFor({ timeout: 10000 });
  check("js: input box appears on the code screen while waiting", true);
  const w = await outputOf(pop, /Giriş gözlənilir/, 8000);
  check("js: preview page shows 'waiting for input'", /Giriş gözlənilir/.test(w), w.slice(0, 120));
  await page.getByLabel("Giriş").fill("Əli");
  await page.getByLabel("Giriş").press("Enter");
  const t = await outputOf(pop, /Salam, Əli!/, 10000);
  check("js: answer reaches the program, result in new page", /Salam, Əli!/.test(t), t.slice(-100));
  await pop.close();
  await page.close();
}

if (want("blocked")) {
  const bctx = await newCtx();
  await bctx.addInitScript(() => { window.open = () => null; }); // pop-up blocker
  const page = await bctx.newPage();
  await page.goto(BASE + "/html");
  await page.waitForSelector(".cm-content");
  await runBtn(page).click();
  const st = await page.getByTestId("preview-status").innerText();
  check("blocked: clear message shown when pop-up is blocked", /blokladı/.test(st), st);
  const link = page.getByRole("status").getByRole("link", { name: "Önizləməni aç" });
  const [pop] = await Promise.all([bctx.waitForEvent("page", { timeout: 10000 }), link.click()]);
  await pop.waitForSelector("iframe", { timeout: 10000 });
  const doc = await pop.locator("iframe").getAttribute("srcdoc");
  check("blocked: 'Önizləməni aç' link opens the preview anyway (not blockable)", /preview\?lang=html/.test(pop.url()) && /Nibras/.test(doc || ""), pop.url());
  await bctx.close();
}

if (want("sql")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/sql");
  await page.waitForSelector(".cm-content");
  await waitEnabled(page, 60000);
  await setEditor(page, "SELECT ad, bal FROM telebeler ORDER BY bal DESC LIMIT 3;");
  const pop = await runAndPopup(ctx, page, runBtn(page));
  const t = await outputOf(pop, /Nigar/, 20000);
  check("sql: no inline result table on the code screen", (await page.locator("table").count()) === 0);
  check("sql: result table in new page", /Nigar/.test(t) && /95/.test(t) && /3 sətir/.test(t), t);
  await pop.close();
  await page.close();
}

if (want("c")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/c");
  await page.waitForSelector(".cm-content");
  const pop = await runAndPopup(ctx, page, runBtn(page));
  const t = await outputOf(pop, /Salam, NibrasCode!/, 40000);
  check("c: compile with default flags + output in new page", /Salam, NibrasCode!/.test(t) && !/unrecognized/.test(t), t);
  await pop.close();
  await page.close();
}

if (want("cfallback")) {
  const page = await ctx.newPage();
  await page.route("https://wandbox.org/**", (r) => r.abort()); // browser can't reach wandbox -> server function fallback
  await page.goto(BASE + "/c");
  await page.waitForSelector(".cm-content");
  const pop = await runAndPopup(ctx, page, runBtn(page));
  const t = await outputOf(pop, /Salam, NibrasCode!|Xidmət xətası/, 40000);
  check("c: server-side fallback works when browser cannot reach compiler", /Salam, NibrasCode!/.test(t) && !/Xidmət xətası/.test(t), t.slice(-150));
  await pop.close();
  await page.close();
}

if (want("rustcompiler")) {
  // 1) browser blocked -> server fallback picks a valid compiler from list.json and runs the sample
  const page = await ctx.newPage();
  await page.route("https://wandbox.org/**", (r) => r.abort());
  await page.goto(BASE + "/rust");
  await page.waitForSelector(".cm-content");
  const pop = await runAndPopup(ctx, page, runBtn(page));
  const t = await outputOf(pop, /\[1, 4, 9\]|Unknown compiler|Xidmət xətası/, 60000);
  check("rust: server fallback compiles+runs the sample", /\[1, 4, 9\]/.test(t) && !/Unknown compiler/.test(t), t.slice(-150));
  await pop.close();
  await page.close();
  // 2) a retired pinned name is replaced by the newest listed rust release (checked on the request itself)
  const p2 = await ctx.newPage();
  const seen = [];
  await p2.route("https://wandbox.org/api/list.json", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify([{ name: "rust-1.5.0" }, { name: "rust-1.99.2" }, { name: "rust-head" }]) }));
  await p2.route("https://wandbox.org/api/compile.json", (r) => {
    if (r.request().method() === "OPTIONS") return r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    seen.push(JSON.parse(r.request().postData() || "{}").compiler);
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ status: "0", program_output: "[1, 4, 9]\n" }) });
  });
  await p2.goto(BASE + "/rust");
  await p2.waitForSelector(".cm-content");
  const pop2 = await runAndPopup(ctx, p2, runBtn(p2));
  await outputOf(pop2, /\[1, 4, 9\]/, 30000);
  check("rust: retired compiler name replaced from list.json", seen[0] === "rust-1.99.2", JSON.stringify(seen));
  await pop2.close();
  await p2.close();
}

if (want("langs")) {
  // every extra language has its own route with only that language
  for (const [id, re] of Object.entries(MORE)) {
    const page = await ctx.newPage();
    await page.goto(BASE + "/" + id);
    await page.waitForSelector(".cm-content");
    check(`${id}: own lab, no language switcher`, (await page.locator("select[aria-label='Dil']").count()) === 0 && (await page.locator("h1,h2").count()) >= 0);
    await page.getByRole("button", { name: "Yüklə" }).first().click();
    const names = await page.getByRole("menuitem").allInnerTexts();
    check(`${id}: Yüklə menu offers ${MORE_FILES[id]}`, names.some((n) => n.includes(MORE_FILES[id])), names.join("|"));
    await page.keyboard.press("Escape");
    const pop = await runAndPopup(ctx, page, runBtn(page));
    const t = await outputOf(pop, re, 60000);
    check(`${id}: runs, output in new page`, re.test(t) && new URL(pop.url()).searchParams.get("lang") === id, t.slice(-90));
    await assertNoInline(page, `${id} after run`);
    await pop.close();
    await page.close();
  }
}

if (want("nopane")) {
  for (const [name, c] of [["desktop", ctx], ["mobile-390", await newCtx({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })]]) {
    for (const route of ALL_ROUTES) {
      const page = await c.newPage();
      await page.goto(BASE + route);
      await page.waitForSelector(".cm-content", { timeout: 30000 });
      await page.waitForTimeout(400);
      await assertNoInline(page, `${route} ${name} before run`);
      if (route === "/python") await waitEnabled(page, 120000).catch(() => {});
      if (route === "/sql" || route === "/javascript") await waitEnabled(page, 60000).catch(() => {});
      const [pop] = await Promise.all([c.waitForEvent("page", { timeout: 20000 }).catch(() => null), runBtn(page).click()]);
      await page.waitForTimeout(route === "/python" || route === "/sql" ? 3500 : ["/html", "/javascript"].includes(route) ? 1500 : 6000);
      await assertNoInline(page, `${route} ${name} after run`);
      check(`new page opened by Start: ${route} ${name}`, !!pop && /\/preview\?lang=/.test(pop.url()), pop?.url());
      await pop?.close();
      await page.close();
    }
  }
}

if (want("python")) {
  const page = await ctx.newPage();
  await page.goto(BASE + "/python");
  await page.waitForSelector(".cm-content");
  await waitEnabled(page, 120000);
  const pop = await runAndPopup(ctx, page, runBtn(page));
  const t = await outputOf(pop, /Salam, NibrasCode!\s+→ 60/, 30000);
  check("python: output in new page", /3\. Salam, NibrasCode!/.test(t) && /→ 60/.test(t), t);
  // matplotlib image reaches the new page
  await page.bringToFront();
  await page.locator("select[aria-label='Nümunələr']").selectOption("Qrafik (matplotlib)");
  await runBtn(page).click();
  await pop.bringToFront();
  await pop.waitForSelector("img", { timeout: 150000 }).catch(() => {});
  check("python: matplotlib image shown in new page", (await pop.locator("img").count()) > 0);
  await pop.close();
  await page.close();
}

if (want("download")) {
  const dir = mkdtempSync(join(tmpdir(), "dl-"));
  const page = await ctx.newPage();
  await page.goto(BASE + "/javascript");
  await page.waitForSelector(".cm-content");
  await setEditor(page, `console.log("Əli");\n`);
  await page.waitForTimeout(400);
  const grab = async (item) => {
    await page.getByRole("button", { name: "Yüklə" }).first().click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: item }).click()]);
    const path = join(dir, dl.suggestedFilename());
    await dl.saveAs(path);
    return { name: dl.suggestedFilename(), path };
  };
  const f = await grab(/main\.js/);
  check("download: current file name + content", f.name === "main.js" && (await readFile(f.path, "utf8")) === `console.log("Əli");\n`, f.name);
  const z = await grab(/Bütün fayllar/);
  const listing = execFileSync("unzip", ["-Z1", z.path]).toString().trim().split("\n");
  execFileSync("unzip", ["-tq", z.path]);
  check("download: language ZIP valid", z.name === "javascript-layihe.zip" && listing.includes("main.js"), listing.join(","));
  // visit html + python so all-languages zip has several folders
  await page.goto(BASE + "/html");
  await page.waitForSelector(".cm-content");
  await page.waitForTimeout(500);
  const hz = await (async () => {
    await page.getByRole("button", { name: "Yüklə" }).first().click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /Bütün fayllar/ }).click()]);
    const path = join(dir, "h.zip");
    await dl.saveAs(path);
    return path;
  })();
  const hl = execFileSync("unzip", ["-Z1", hz]).toString().trim().split("\n");
  const idx = execFileSync("unzip", ["-p", hz, "index.html"]).toString();
  check("download: HTML ZIP has linked index.html/style.css/script.js", ["index.html", "style.css", "script.js"].every((n) => hl.includes(n)) && /href="style\.css"/.test(idx), hl.join(","));
  await page.getByRole("button", { name: "Yüklə" }).first().click();
  const [dl2] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /Bütün dillər/ }).click()]);
  const az = join(dir, "all.zip");
  await dl2.saveAs(az);
  const al = execFileSync("unzip", ["-Z1", az]).toString().trim().split("\n");
  execFileSync("unzip", ["-tq", az]);
  check("download: all-languages ZIP has per-language folders", al.some((n) => n.startsWith("javascript/")) && al.some((n) => n.startsWith("html/")), al.join(","));
  const single = await (async () => {
    await page.getByRole("button", { name: "Yüklə" }).first().click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /^index\.html/ }).click()]);
    const p = join(dir, "i.html");
    await dl.saveAs(p);
    return readFile(p, "utf8");
  })();
  check("download: single-file index.html is self-contained", /<style>/.test(single) && !/data-nibras-bridge/.test(single));
  await page.close();
}

if (want("share")) {
  // Old iOS-style browser: no <a download>, but Web Share API with files -> must use the share sheet
  const sctx = await newCtx();
  await sctx.addInitScript(() => {
    delete HTMLAnchorElement.prototype.download;
    window.__shared = [];
    navigator.canShare = () => true;
    navigator.share = async (d) => { window.__shared.push((d.files || []).map((f) => f.name + ":" + f.type + ":" + f.size)); };
  });
  const page = await sctx.newPage();
  await page.goto(BASE + "/javascript");
  await page.waitForSelector(".cm-content");
  await setEditor(page, "console.log(1)");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Yüklə" }).first().click();
  await page.getByRole("menuitem", { name: /main\.js/ }).click();
  await page.waitForTimeout(500);
  let shared = await page.evaluate(() => window.__shared);
  check("share fallback: file handed to Web Share API when download attr unsupported", shared.length === 1 && /^main\.js:text\/javascript/.test(shared[0][0]), JSON.stringify(shared));
  await page.getByRole("button", { name: "Yüklə" }).first().click();
  await page.getByRole("menuitem", { name: /Bütün fayllar/ }).click();
  await page.waitForTimeout(500);
  shared = await page.evaluate(() => window.__shared);
  check("share fallback: ZIP shared as application/zip", shared.length === 2 && /^javascript-layihe\.zip:application\/zip/.test(shared[1][0]), JSON.stringify(shared[1]));
  await page.getByRole("button", { name: "Yüklə" }).first().click();
  check("share: explicit 'Paylaş' menu entry shown when sharing is available", (await page.getByRole("menuitem", { name: /Paylaş/ }).count()) === 1);
  await sctx.close();
}

if (want("mobile")) {
  const mctx = await newCtx({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    hasTouch: true,
    isMobile: true,
  });
  for (const path of ["/", "/more", ...ALL_ROUTES]) {
    const page = await mctx.newPage();
    await page.goto(BASE + path);
    await page.waitForTimeout(600);
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`mobile: no horizontal overflow ${path}`, o.sw <= o.cw + 1, `${o.sw}/${o.cw}`);
    if (path !== "/" && path !== "/more") {
      const dlBtn = page.getByRole("button", { name: "Yüklə" }).first();
      const box = await dlBtn.boundingBox();
      check(`mobile: Yüklə button visible & tappable ${path}`, !!box && box.width >= 40 && box.height >= 32 && box.x >= 0 && box.x + box.width <= 390, JSON.stringify(box));
    }
    await page.close();
  }
  const page = await mctx.newPage();
  await page.goto(BASE + "/javascript");
  await page.waitForSelector(".cm-content");
  await page.getByRole("button", { name: "Yüklə" }).first().tap();
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: /Bütün fayllar/ }).tap()]);
  check("mobile: ZIP download via tap", dl.suggestedFilename() === "javascript-layihe.zip", dl.suggestedFilename());
  await page.close();
  await mctx.close();
}

await browser.close();
const unexpected = errors.filter((e) => !/boom-test/.test(e)); // boom-test is thrown on purpose by the html test
console.log(unexpected.length ? "PAGEERRORS:\n" + unexpected.join("\n") : "no unexpected page errors");
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
