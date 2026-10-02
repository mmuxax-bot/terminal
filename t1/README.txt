NibrasCode Python Terminal V1
1) Bütün faylları (index.html, app.js, worker.js, sandbox.py, styles.css) /pythontest/ qovluğuna köçürün və HTTPS üzərindən açın.
2) Köhnə worker.mjs faylını silin (artıq worker.js istifadə olunur).
V1: yoxlamalar azaldıldı — yalnız təhlükəli şeylər (js/şəbəkə/sistem modulları, __subclasses__ və s.) xəta verir; adi kodlar, eval/exec, open, os/sys/time işləyir.
Tövsiyə: bu qovluğu AYRI Vercel layihəsində və ayrı subdomendə (run.nibrascode.com) yerləşdirin.
Yeniliklər: siniflər/super()/_atributlar/dataclass/enum işləyir, Python hər icradan sonra yenidən yüklənmir (sürətli),
canlı çıxış, sintaksis rəngləmə, avto-indent, nümunələr, kopyala/.py yüklə, avto-yadda saxla, Azərbaycanca xəta izahları.
Qeyd: brauzer filtri mütləq təhlükəsizlik zəmanəti deyil. Kod serverdə icra olunmur, istifadəçinin öz brauzerində işləyir.
