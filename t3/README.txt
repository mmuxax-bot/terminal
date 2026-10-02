NibrasCode JavaScript Terminal V1
1) Faylları (index.html, app.js, highlight.js, runner.html, runner.js, styles.css) ayrı Vercel layihəsinin kök qovluğuna yükləyin.
2) İstifadəçi kodu sandbox iframe + Web Worker-də icra olunur (cookie/yaddaşa çıxışı yoxdur), 40 saniyə və 200 000 simvol limiti var.
3) input üçün:  const ad = await input("Ad: ");   (await vacibdir)
Qeyd: runner.html-dəki CSP-də connect-src https: yazılıb (fetch ilə https sorğularına icazə). Tam söndürmək üçün 'none' yazın.
Tövsiyə: ayrı subdomendə (məs. js.nibrascode.com) yerləşdirin.
