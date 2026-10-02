var e=[{id:`python`,path:`/python`,label:`Python`,short:`PY`,file:`main.py`,blurb:`CPython, numpy, pandas, qrafik`,detail:`Brauzerdə tam Python — elmi kitabxanalar daxil.`},{id:`html`,path:`/html`,label:`HTML / CSS`,short:`WEB`,file:`index.html`,blurb:`Terminal + tam açıq səhifə`,detail:`HTML, CSS və JS — terminal, konsol və məhdudiyyətsiz yeni səhifə.`},{id:`javascript`,path:`/javascript`,label:`JavaScript`,short:`JS`,file:`main.js`,blurb:`Sandbox, input, async`,detail:`Worker-də təhlükəsiz icra, tam konsol API.`},{id:`sql`,path:`/sql`,label:`SQL`,short:`SQL`,file:`query.sql`,blurb:`SQLite, JOIN, saxlanılan baza`,detail:`Yaddaşda SQLite — cədvəllər sessiyalar arasında qalır.`},{id:`c`,path:`/c`,label:`C`,short:`C`,file:`main.c`,blurb:`GCC və Clang`,detail:`Uzaq sandbox compiler, stdin və flag-lər.`}],t={"Salam dünya":{code:`ad = "NibrasCode"
for i in range(1, 4):
    print(f"{i}. Salam, {ad}!")

sum([10, 20, 30])`,stdin:``},"input() ilə":{code:`ad = input("Adınız: ")
yas = int(input("Yaşınız: "))
print(f"Salam, {ad}! 10 ildən sonra {yas + 10} yaşında olacaqsan.")`,stdin:``},"Siniflər (OOP)":{code:`class Heyvan:
    def __init__(self, ad):
        self.ad = ad
        self._say = 0

    def ses(self):
        self._say += 1
        return f"{self.ad} səs çıxarır ({self._say})"

class Pisik(Heyvan):
    def ses(self):
        return super().ses() + " — miyav!"

p = Pisik("Mırmır")
print(p.ses())
print(p.ses())`,stdin:``},NumPy:{code:`import numpy as np

a = np.arange(1, 11)
print("massiv:", a)
print("cəm:", int(a.sum()), "  orta:", float(a.mean()))
print("kvadrat:", a ** 2)

m = np.array([[1, 2], [3, 4]])
print("\\nmatris:\\n", m)
print("determinant:", float(np.linalg.det(m)))`,stdin:``},Pandas:{code:`import pandas as pd

df = pd.DataFrame({
    "ad": ["Əli", "Aysel", "Nigar", "Rəşad", "Leyla"],
    "bal": [91.5, 78, 95, 66.5, 84],
    "seher": ["Bakı", "Gəncə", "Bakı", "Sumqayıt", "Gəncə"],
})
print(df.to_string(index=False))
print()
print(df.groupby("seher")["bal"].agg(["count", "mean", "max"]))`,stdin:``},"Qrafik (matplotlib)":{code:`import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 240)
plt.figure(figsize=(7.2, 4.2), facecolor="#0c121c")
ax = plt.gca()
ax.set_facecolor("#0c121c")
ax.plot(x, np.sin(x), color="#2fd4bf", lw=2, label="sin")
ax.plot(x, np.cos(x), color="#82b4e8", lw=2, label="cos")
ax.set_title("Sinus və kosinus", color="#e8eef6")
ax.tick_params(colors="#8b9bb0")
for s in ax.spines.values():
    s.set_color("#1c2838")
ax.grid(True, alpha=0.25, color="#8b9bb0")
ax.legend(facecolor="#111827", labelcolor="#e8eef6", frameon=True)
plt.tight_layout()`,stdin:``},Rekursiya:{code:`from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print([fib(i) for i in range(15)])
fib(80)`,stdin:``}},n={"Kart dizaynı":{html:`<div class="card">
  <div class="avatar">N</div>
  <h2>Nibras Akademiyası</h2>
  <p>Ərəb dili və proqramlaşdırma</p>
  <a href="#" class="btn">Ətraflı</a>
</div>`,css:`body {
  margin: 0; min-height: 100vh; display: grid; place-items: center;
  background: #070b12;
  font-family: system-ui, sans-serif;
}
.card {
  width: 280px; padding: 28px; text-align: center; color: #e8eef6;
  background: #ffffff10; border: 1px solid #ffffff22;
  border-radius: 20px;
}
.avatar {
  width: 64px; height: 64px; margin: 0 auto 12px; border-radius: 50%;
  display: grid; place-items: center; font-size: 28px; font-weight: 700;
  background: #2fd4bf; color: #04221c;
}
.btn {
  display: inline-block; margin-top: 12px; padding: 10px 22px;
  border-radius: 999px; background: #2fd4bf; color: #04221c;
  text-decoration: none; font-weight: 600;
}`,js:``},Sayğac:{html:`<h1 id="n">0</h1>
<button id="plus">+1</button>
<button id="reset">Sıfırla</button>`,css:`body { font-family: system-ui; text-align: center; padding: 50px; background: #f4f7fb; color: #111; }
h1 { font-size: 80px; margin: 0 0 20px; }
button { font-size: 18px; padding: 10px 20px; margin: 4px; border: 0; border-radius: 10px; background: #2fd4bf; cursor: pointer; }`,js:`let n = 0;
const el = document.getElementById("n");
document.getElementById("plus").onclick = () => el.textContent = ++n;
document.getElementById("reset").onclick = () => el.textContent = n = 0;`},Forma:{html:`<form id="f">
  <label>Ad<input name="ad" required></label>
  <label>Mesaj<textarea name="mesaj" rows="3"></textarea></label>
  <button>Göndər</button>
</form>
<p id="out"></p>`,css:`body { font-family: system-ui; max-width: 360px; margin: 40px auto; color: #111; }
label { display: grid; gap: 6px; margin-bottom: 12px; font-size: 14px; }
input, textarea { padding: 10px; border: 1px solid #c9d2de; border-radius: 8px; font: inherit; }
button { width: 100%; padding: 12px; border: 0; border-radius: 8px; background: #2fd4bf; font-weight: 600; cursor: pointer; }`,js:`document.getElementById("f").onsubmit = (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  document.getElementById("out").textContent = "Salam, " + d.get("ad") + "!";
};`}},r={"Salam dünya":`const ad = "NibrasCode";
for (let i = 1; i <= 3; i++) {
  console.log(\`\${i}. Salam, \${ad}!\`);
}

[10, 20, 30].reduce((a, b) => a + b, 0)`,"input() ilə":'const ad = await input("Adınız: ");\nconst yas = Number(await input("Yaşınız: "));\nconsole.log(`Salam, ${ad}! 10 ildən sonra ${yas + 10} yaşında olacaqsan.`);',"Siniflər (OOP)":`class Heyvan {
  #say = 0;
  constructor(ad) { this.ad = ad; }
  ses() { this.#say++; return \`\${this.ad} səs çıxarır (\${this.#say})\`; }
}
class Pisik extends Heyvan {
  ses() { return super.ses() + " — miyav!"; }
}
const p = new Pisik("Mırmır");
console.log(p.ses());
console.log(p.ses());`,"Async / Promise":`const gozle = ms => new Promise(r => setTimeout(r, ms));

async function esas() {
  console.log("Başladı…");
  await gozle(400);
  console.log("0.4 saniyə keçdi");
  const netice = await Promise.all([1, 2, 3].map(async n => {
    await gozle(80 * n);
    return n * n;
  }));
  console.log("Kvadratlar:", netice);
}
await esas();`,Cədvəl:`const telebeler = [
  { ad: "Əli", bal: 91 },
  { ad: "Aysel", bal: 78 },
  { ad: "Nigar", bal: 95 }
];
console.table(telebeler);
console.log("Orta bal:", telebeler.reduce((s, t) => s + t.bal, 0) / telebeler.length);`},i={"Hamısını göstər":`SELECT * FROM telebeler;`,"Filtr və sıralama":`SELECT ad, yas, bal
FROM telebeler
WHERE seher = 'Bakı' AND bal >= 70
ORDER BY bal DESC;`,"JOIN (3 cədvəl)":`SELECT t.ad AS telebe, k.ad AS kurs, q.qiymet
FROM qeydiyyat q
JOIN telebeler t ON t.id = q.telebe_id
JOIN kurslar k ON k.id = q.kurs_id
ORDER BY q.qiymet DESC;`,"GROUP BY":`SELECT seher, COUNT(*) AS say, ROUND(AVG(bal), 1) AS orta_bal, MAX(bal) AS en_yuksek
FROM telebeler
GROUP BY seher
HAVING COUNT(*) >= 1
ORDER BY orta_bal DESC;`,"CREATE + INSERT":`CREATE TABLE IF NOT EXISTS kitablar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,
  muellif TEXT,
  qiymet REAL DEFAULT 0
);

INSERT INTO kitablar (ad, muellif, qiymet) VALUES
  ('Riyazus-Salihin', 'İmam Nəvəvi', 12.5),
  ('Kəlilə və Dimnə', 'İbn əl-Müqəffə', 8),
  ('Əl-Ərəbiyyə bəyn yədeyk', 'Abdurrahman', 15);

SELECT * FROM kitablar ORDER BY qiymet;`,"CTE / alt sorğu":`WITH orta AS (
  SELECT telebe_id, AVG(qiymet) AS o FROM qeydiyyat GROUP BY telebe_id
)
SELECT t.ad, ROUND(orta.o, 1) AS orta_qiymet
FROM orta JOIN telebeler t ON t.id = orta.telebe_id
WHERE orta.o > (SELECT AVG(qiymet) FROM qeydiyyat)
ORDER BY orta_qiymet DESC;`},a={"Salam dünya":{code:`#include <stdio.h>

int main(void) {
    printf("Salam, NibrasCode!\\n");
    return 0;
}`,stdin:``},"stdin ilə":{code:`#include <stdio.h>

int main(void) {
    int n;
    printf("Bir ədəd daxil edin: ");
    if (scanf("%d", &n) != 1) return 1;
    printf("Kvadratı: %d\\n", n * n);
    return 0;
}`,stdin:`12`},Faktorial:{code:`#include <stdio.h>

long fact(int n) {
    return n <= 1 ? 1 : n * fact(n - 1);
}

int main(void) {
    for (int i = 1; i <= 10; i++)
        printf("%2d! = %ld\\n", i, fact(i));
    return 0;
}`,stdin:``},Struct:{code:`#include <stdio.h>
#include <string.h>

typedef struct {
    char ad[32];
    int bal;
} Telebe;

int main(void) {
    Telebe t[] = {{"Əli", 91}, {"Aysel", 78}, {"Nigar", 95}};
    int n = 3, sum = 0;
    for (int i = 0; i < n; i++) {
        printf("%s — %d\\n", t[i].ad, t[i].bal);
        sum += t[i].bal;
    }
    printf("Orta: %.1f\\n", sum / (double)n);
    return 0;
}`,stdin:``}},o={NameError:`Dəyişən və ya funksiya əvvəlcədən təyin edilməyib, yaxud adda hərf səhvi var.`,SyntaxError:`Yazılış xətası: mötərizə, dırnaq və ya ":" işarəsini yoxlayın.`,IndentationError:`Boşluqlar (indent) düz deyil — hər blok 4 boşluqla sürüşməlidir.`,TypeError:`Dəyər tipi uyğun gəlmir (məs. mətn + rəqəm). str() və ya int() işlədin.`,ValueError:`Dəyər düzgün formatda deyil (məs. int("abc")).`,ZeroDivisionError:`Sıfıra bölmək olmaz.`,IndexError:`Siyahıda belə indeks yoxdur.`,KeyError:`Lüğətdə belə açar yoxdur.`,EOFError:`input() üçün dəyər çatmır — stdin bölməsinə yazın və ya konsolda cavab verin.`,PermissionError:`Təhlükəsiz rejimdə bu əməliyyata icazə verilmir.`,ImportError:`Bu modul mövcud deyil və ya təhlükəsizlik üçün bloklanıb.`,ModuleNotFoundError:`Bu modul yüklənməyib. numpy, pandas, matplotlib avtomatik gətirilir.`,RecursionError:`Sonsuz rekursiya — dayanma şərti əlavə edin.`,AttributeError:`Bu obyektdə belə atribut/metod yoxdur.`},s={ReferenceError:`Dəyişən və ya funksiya təyin edilməyib, yaxud adda hərf səhvi var.`,SyntaxError:`Yazılış xətası: mötərizə, dırnaq və ya nöqtəli vergül səhvi ola bilər.`,TypeError:`Dəyər tipi uyğun gəlmir (məs. undefined üzərində metod çağırmaq).`,RangeError:`Dəyər icazə verilən aralıqdan kənardadır (məs. sonsuz rekursiya).`,Error:`Proqram xəta atdı. Mesaja və sətir nömrəsinə baxın.`},c=[[/no such table/i,`Belə cədvəl yoxdur. Soldakı cədvəl siyahısına baxın.`],[/no such column/i,`Belə sütun yoxdur. Cədvəlin sütun adlarını yoxlayın.`],[/syntax error/i,`Yazılış xətası: vergül, mötərizə, dırnaq və ya açar sözü yoxlayın.`],[/already exists/i,`Bu adda cədvəl artıq var. IF NOT EXISTS və ya DB sıfırla.`],[/UNIQUE|PRIMARY KEY/i,`Bu dəyər artıq mövcuddur (təkrar ola bilməz).`],[/NOT NULL/i,`Bu sütun boş qala bilməz.`],[/FOREIGN KEY/i,`Əlaqəli cədvəldə belə qeyd yoxdur.`],[/ambiguous/i,`Sütun adı bir neçə cədvəldə var — cədvəl adı ilə yazın (t.ad).`]],l=`nibrascode.studio.`;function u(e,t){try{return localStorage.getItem(l+e)??t}catch{return t}}function d(e,t){try{localStorage.setItem(l+e,t)}catch{}}function f(e,t){try{let n=localStorage.getItem(l+e);return n?JSON.parse(n):t}catch{return t}}function p(e,t){try{localStorage.setItem(l+e,JSON.stringify(t))}catch{}}function m(e,t,n){let r=document.createElement(`a`);r.href=URL.createObjectURL(new Blob([t],{type:n})),r.download=e,r.click(),URL.revokeObjectURL(r.href)}function h(e,t,n){let r=document.createElement(`a`);r.href=URL.createObjectURL(new Blob([new Uint8Array(t)],{type:n})),r.download=e,r.click(),URL.revokeObjectURL(r.href)}var g=[`accelerometer *`,`autoplay *`,`camera *`,`clipboard-read *`,`clipboard-write *`,`display-capture *`,`encrypted-media *`,`fullscreen *`,`gamepad *`,`geolocation *`,`gyroscope *`,`hid *`,`identity-credentials-get *`,`idle-detection *`,`magnetometer *`,`microphone *`,`midi *`,`payment *`,`publickey-credentials-get *`,`screen-wake-lock *`,`serial *`,`usb *`,`xr-spatial-tracking *`].join(`; `),_=`<script data-nibras-bridge>
(function(){
  function send(d){
    try { parent.postMessage(Object.assign({source:"nibras-html"}, d), "*"); } catch (e) {}
  }
  function fmt(args){
    try {
      return Array.prototype.map.call(args, function(v){
        if (typeof v === "string") return v;
        if (v instanceof Error) return (v.name || "Error") + ": " + v.message;
        if (typeof v === "undefined") return "undefined";
        try { return JSON.stringify(v, null, 0); } catch (e) { return String(v); }
      }).join(" ");
    } catch (e) { return ""; }
  }
  function wrap(k, tone){
    var orig = console[k];
    console[k] = function(){
      send({ t: "console", k: tone, s: fmt(arguments) + "\\n" });
      if (orig) orig.apply(console, arguments);
    };
  }
  wrap("log", "log");
  wrap("info", "log");
  wrap("debug", "log");
  wrap("dir", "log");
  wrap("warn", "warn");
  wrap("error", "error");
  var oc = console.clear;
  console.clear = function(){
    send({ t: "console", k: "clear" });
    if (oc) oc.apply(console, arguments);
  };
  window.addEventListener("error", function(e){
    send({
      t: "error",
      msg: String(e.message || "Xəta"),
      line: e.lineno || 0,
      col: e.colno || 0,
      file: String(e.filename || ""),
      name: (e.error && e.error.name) || "Error"
    });
  });
  window.addEventListener("unhandledrejection", function(e){
    var r = e.reason;
    send({
      t: "error",
      msg: String((r && r.message) || r || "Promise xətası"),
      line: (r && r.lineNumber) || 0,
      name: (r && r.name) || "Error"
    });
  });
  window.addEventListener("message", function(e){
    var d = e.data;
    if (!d || d.source !== "nibras-parent") return;
    if (d.t === "eval") {
      try {
        var r = (0, eval)(String(d.code || ""));
        if (typeof r !== "undefined") send({ t: "console", k: "log", s: fmt([r]) + "\\n" });
      } catch (err) {
        send({
          t: "error",
          msg: String((err && err.message) || err),
          name: (err && err.name) || "Error",
          line: 0
        });
      }
    }
  });
})();
<\/script>`;function v(e){return e.replace(/<\/script/gi,`<\\/script`)}function y(e,t,n,r){let i=t.trim()?`<style>\n${t}\n</style>`:``,a=n.trim()?`<script>\n${v(n)}\n//# sourceURL=user.js\n<\/script>`:``,o=r?.bridge?_:``;if(/<html[\s>]/i.test(e)){let t=e;return o&&(t=/<head[\s>]/i.test(t)?t.replace(/<head[^>]*>/i,e=>e+`
`+o):o+t),t=i?/<\/head>/i.test(t)?t.replace(/<\/head>/i,()=>i+`
</head>`):i+t:t,a?/<\/body>/i.test(t)?t.replace(/<\/body>/i,()=>a+`
</body>`):t+a:t}return`<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NibrasCode</title>
${o}
${i}
</head>
<body>
${e}
${a}
</body>
</html>`}function b(e){return URL.createObjectURL(new Blob([e],{type:`text/html;charset=utf-8`}))}function x(e){let t=e.trim();return t?/^<!doctype/i.test(t)||/^<html[\s>]/i.test(t)?!0:t.startsWith(`<`)&&/<\/[a-z][\w:-]*>/i.test(t):!1}function S(e){try{d(`html.preview`,e)}catch{}try{sessionStorage.setItem(`nibrascode.studio.html.preview`,e)}catch{}try{let t=b(e),n=window.open(t,`_blank`);if(window.setTimeout(()=>URL.revokeObjectURL(t),18e4),n){try{n.opener=null}catch{}return!0}}catch{}try{if(window.open(`/html/preview`,`_blank`))return!0}catch{}return window.location.assign(`/html/preview`),!0}export{x as _,r as a,d as b,t as c,y as d,m as f,u as g,f as h,s as i,c as l,b as m,g as n,e as o,h as p,n as r,o as s,a as t,i as u,S as v,p as y};