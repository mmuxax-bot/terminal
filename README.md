# NibrasCode Studio

Brauzer IDE: **Python, HTML/CSS, JavaScript, SQL, C** və **Digər dillər** (C++, Java, PHP, Go, Rust, Node.js, TypeScript, Ruby, Perl, Lua, Bash, Julia, R, Haskell).
TanStack Start + Vite + Nitro (Vercel preset). UI Azərbaycan dilindədir.

## Necə işləyir

| Dil | İcra | Harada |
| --- | --- | --- |
| Python | Pyodide (WebAssembly), numpy/pandas/matplotlib | istifadəçinin brauzerində |
| JavaScript | sandbox iframe + Web Worker | istifadəçinin brauzerində |
| HTML / CSS / JS | `sandbox`-lu iframe (opaque origin, `allow-same-origin` yoxdur) | istifadəçinin brauzerində |
| SQL | SQLite (sql.js, WebAssembly) | istifadəçinin brauzerində |
| C, C++, Java, PHP, Go, Rust, Node.js, TypeScript, Ruby, Perl, Lua, Bash, Julia, R, Haskell | [Wandbox](https://wandbox.org) uzaq sandbox compiler (əvvəl brauzerdən, alınmasa `/_serverFn` ilə serverdən) | uzaq xidmət |

### Nəticə YALNIZ yeni səhifədə
Redaktor ekranında heç bir önizləmə/çıxış paneli yoxdur: yalnız redaktor, alətlər paneli və kiçik status sətri.
**Başlat** (və ya Ctrl+Enter) kliklə eyni anda `/preview?lang=…` tabını açır/təkrar istifadə edir (həmişə, söndürmək olmur).
Pop-up bloklansa status sətri xəbərdarlıq göstərir; **«Önizləməni aç»** həqiqi linkdir, bloklanmır.
Səhifə studio ilə canlı sinxronlaşır (BroadcastChannel + localStorage). `input()` / `await input()` cavabı redaktor ekranında kiçik giriş sətri ilə verilir.
HTML önizləməsi tam səhifədir (konsol paneli, yenilə, tam ekran). Digər dillərdə çıxış (mətn, cədvəl, qrafik şəkli) formatlı göstərilir.

### Birbaşa icra linki: `/run`
`/run#l=python|html|javascript&c=<base64url kod>[&z=1]` — kod linkin hash hissəsindədir (serverə getmir), səhifə açılan kimi kodu avtomatik işlədir:
HTML tam səhifədə (sandbox iframe), Python brauzerdə (Pyodide) çıxışla. `z=1` kodun deflate-raw ilə sıxıldığını bildirir. `input()` üçün giriş sətri çıxır.
Nibras AI-dəki «Aç» düyməsi bu linki yeni tabda açır. Format: `src/lib/run-link.ts`.

### Kodu yüklə
Toolbar-da **Yüklə** menyusu: cari fayl(lar), «Bütün fayllar (.zip)», «Bütün dillər (.zip)», Paylaş (Web Share API varsa).
Mobil: gizli `<a download>`; dəstəklənmirsə Web Share API (fayl) → yeni tabda açma. ZIP istənilən asılılıqsız yazılıb (`src/lib/files.ts`).

## Əmrlər
```
npm install
npm run dev          # http://localhost:8080
npm run typecheck && npm run lint && npm run build
node --experimental-strip-types --test src/lib/files.test.ts src/lib/wandbox.test.ts
npm run e2e          # Playwright + Chrome, işləyən tətbiqə qarşı (BASE=http://localhost:8080)
npm run verify:wandbox   # bütün «Digər dillər» nümunələrini canlı Wandbox-da yoxlayır
```

## Deploy (Vercel)
Əlavə mühit dəyişəni **lazım deyil**. `vite.config.ts`-də `renderer: false` mütləqdir: kökdəki köhnə statik `index.html`
Nitro tərəfindən SSR şablonu kimi götürülməsin (əks halda hər marşrut həmin səhifəni qaytarır).

`t1/ … t5/` və kökdəki `index.html` ayrı statik köhnə versiyalardır (öz Vercel layihələri üçün); tətbiqə təsir etmir.
