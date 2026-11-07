# Yatırımcı İlişkileri

Bölüm iletişim alanının üstündedir. Soldaki tasarım kapağı, şirketin mevcut GES fotoğrafı ve marka öğelerinden HTML/CSS ile oluşturulmuştur; bağlantısı gerçek resmî rapora gider. Kapak, PDF belgesinin özgün ilk sayfası olarak sunulmaz.

## Veri kaynağı

- KAP şirket kodu **BESTE**, üye kimliği `8acae2c49b85f8ce019c0d9c2cc26b56`.
- Sunucu yalnızca bu üyenin resmî KAP sayfasını okur. Sayfanın JSON veri blokları ayrıştırılır; uzak JavaScript çalıştırılmaz. Borsa İstanbul ve başka şirketlerin bildirimleri elenir.
- `/api/kap-disclosures`, en yeni 12 şirket bildirimini döndürür; arayüz ilk altısını gösterir. Son finansal/faaliyet raporu bu listeye sığmasa bile ayrıca korunur.
- Başarılı veri 5 dakika önbellekte tutulur. Eşzamanlı istekler tek kaynak isteğine birleştirilir. Bağlantı hatasında son başarılı kayıtlar ve **asıl kontrol zamanı** korunur, 1 dakika sonra kaynak yeniden denenir.
- Arayüz açılışta, görünür sekmede 5 dakikada bir ve sekmeye dönünce yenilenir. Son kontrol zamanı ve kesinti durumu kullanıcıya gösterilir.
- İlk kesintiye karşı doğrulanmış kaynak kaydı `src/data/kap-snapshot.json` içindedir. Kayıt zamanı gerçek kaynak kontrolünden gelir.
- Duyuru sabitlemesi: `InvestorRelations.tsx` içindeki `pinned`. Şimdiki seçim 13 Kasım 2026 olağanüstü genel kurul bildirimidir; yeni bir duyuru öne çıkarılacağında burası güncellenir.

## Çalıştırma ve yayın

Yerel geliştirme: `npm run dev`. Vite eklentisi API'yi aynı portta çalıştırır. `npm run preview` da API'yi içerir.

Üretim: `npm run build`, ardından `npm start`. Varsayılan `127.0.0.1:4173`; sunucuda `HOST=0.0.0.0` ve `PORT` ortam değişkenleriyle yapılandırılabilir. `server/`, `src/data/kap-snapshot.json`, `package.json` ve `dist/` birlikte tutulmalıdır. Video oynatma/arama için HTTP byte-range desteklenir.

**Sadece dist/ klasörünü statik barındırmaya yüklemek otomatik KAP servisini çalıştırmaz.** Böyle bir kurulumda aynı origin altında `/api/kap-disclosures` için sunucu veya sunucusuz işlev bağlanmalıdır. Arayüz bu durumda son doğrulanmış kayıtları gösterir ve kaynağa erişilemediğini belirtir. Mevcut iş yerel önizlemede tamamlanmıştır; dış ortama dağıtım yapılmamıştır.

KAP'ın web sayfası veri formatı değişirse ayrıştırıcı güncellenmelidir. Bu entegrasyon herkese açık web kaynağını okur; lisanslı KAP veri dağıtım API'si veya erişilebilirlik garantisi değildir.

## Kontroller

`node --test server/kap-service.test.mjs`: şirket filtresi, kaçış karakterleri, yinelenen kayıtlar, tarih sırası, eşzamanlı istekler, önbellek, kesinti/iyileşme ve son raporun listeden düşmemesi.

## Hisse performans şeridi

Yatırımcı İlişkileri bölümünün hemen altında içerikle hizalı, kompakt `StockTicker` kutusu bulunur. `/api/stock-quote` geliştirme, önizleme ve Node üretim sunucularına bağlıdır. Veri kaynağı Yahoo Finance `BESTE.IS` chart JSON servisidir; `query1` başarısızsa `query2` erişim noktasına otomatik geçer. Bu iki adres aynı sağlayıcıya aittir; bağımsız sağlayıcı yedekliliği olarak sunulmaz. Sayfa görünürken 60 saniyede bir yenilenir; sunucu 60 saniyelik önbellek ve eşzamanlı istek birleştirmesi uygular. Her erişim noktası isteği 4 saniyede zaman aşımına uğrar; hata alan adrese 60 saniyelik bekleme uygulanır.

Bu, sıfır gecikmeli borsa verisi değildir. Yahoo'nun Borsa İstanbul verisi **15 dakika gecikmelidir**; şeritte kaynak, gecikme ve gerçek fiyat zamanı görünür. Fiyatın zamanı, API'ye yapılan son isteğin zamanı ile değiştirilmez. Kaynak kesilirse son alınan fiyat “Son alınan veri” etiketiyle korunur; ilk istek başarısızsa fiyat uydurulmaz.

Son doğrulanmış fiyat atomik dosya yazımıyla `.runtime/stock-quote.json` içinde korunur. Sunucu yeniden başlatıldığında iki adres de erişilemezse bu kayıt özgün fiyat ve kontrol zamanlarıyla geri yüklenir. Kaynaktan gelen daha eski tarihli bir fiyat kayıtlı yeni fiyatın üzerine yazılmaz. `.runtime/` klasörüne yazma izni verilmelidir; salt okunur disk, çalışan bellek önbelleğini veya geçerli kaynağın yanıtını bozmaz. Kalıcı önbellek güncel fiyat garantisi değildir; eski verinin tarihi ve kesinti etiketi kullanıcıdan saklanmaz.

Günlük değişim önceki işlem günü kapanışına göredir. Chart API'sinin çok günlük aralık başlangıcını gösteren `chartPreviousClose` değeri bu hesap için kullanılmaz. Kaynak kimliği BESTE.IS/IST/TRY olarak doğrulanır. Kaynak herkese açık, garantisiz bir JSON uç noktasıdır; sıfır gecikmeli veri istendiğinde yetkilendirilmiş bir piyasa veri sağlayıcısı aynı sunucu adaptörüne bağlanmalıdır.

`node --test server/stock-service.test.mjs`: doğru kapanış bazının seçimi, artış/düşüş/sabit yön, kimlik/sayı kontrolü, önbellek, kesinti ve iyileşme.

Kaynak gecikme bilgisi: https://help.yahoo.com/kb/finance/article-exchanges-data-delays-sln2310.html

Resmî kaynaklar:

- https://kap.org.tr/tr/bildirim-sorgu-sonuc?member=8acae2c49b85f8ce019c0d9c2cc26b56
- https://bestbrandsenerji.com/mali-tablolar-faaliyet-raporlari/
- https://kap.org.tr/tr/Bildirim/1689906 — 2026 / 9 aylık finansal rapor
- https://kap.org.tr/tr/Bildirim/1689910 — aynı dönemin faaliyet raporu
- https://kap.org.tr/tr/Bildirim/1683800 — sabit genel kurul duyurusu
