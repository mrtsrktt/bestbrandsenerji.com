# Best Brands Enerji - Web Sitesi Yeniden Tasarımı

Bu proje, **Best Brands Grup Enerji Yatırım A.Ş.** kurumsal web sitesinin modern, fotoğraf ve video odaklı, yüksek erişilebilirlik ve performans standartlarına sahip yeni ön yüzüdür.

Bu ilk aşamada **Proje Kurulumu**, **Şeffaf Header & Geniş Mega Menü** ve **Video Hero** bölümleri eksiksiz olarak uygulanmıştır.

Güncel sürüm ayrıca rakamlarla Best Brands, otomatik KAP bildirimli Yatırımcı İlişkileri, hareketli iletişim alanı ve footer içerir. KAP veri akışı ve yayın gereksinimleri için [INVESTOR-RELATIONS.md](./INVESTOR-RELATIONS.md) belgesine bakın.

---

## 1. Tasarım Sistemi ve Renkler

Tasarım dili [Stellar Management](https://www.stellarmanagement.com/) referansındaki şeffaf header ve video üzeri kesintisiz mega menü etkileşimini esas alır:

- **Ana Marka Yeşili (`--brand-green`):** `#00AA3E` (Birebir korunmuştur, mega menü ana zemininde ve birincil aksiyonlarda kullanılır).
- **Yardımcı Marka Mavisi (`--brand-blue`):** `#3B5BA5` (Yalnızca küçük yardımcı etiket, gösterge ve aktif vurgularda dengeli kullanılır).
- **Nötr Tonlar:** `#ffffff`, `#f7f9f7`, `#121914`, `#0b110e`.
- **Tipografi:** Türkçe karakterleri eksiksiz destekleyen modern sans-serif ailesi (`Plus Jakarta Sans` / `system-ui`).
- **Kontrast ve Okunurluk Stratejisi:** `#00AA3E` zemini üzerindeki küçük saf beyaz metinlerin kontrastı (~3.03:1) WCAG AA eşiğini (4.5:1) karşılayamadığından, menü içi bağlantı ve kart alanlarında açık renk bağlantı yüzeyleri (`#ffffff` / `#f7f9f7`) ve koyu renk metinler (`#121914`, kontrast > 12:1) kullanılmıştır.

---

## 2. Görsel Kaynakları ve Kullanım Envanteri

Şirkete ait olmayan stok tesisler gerçek yatırım gibi gösterilmemiştir. Tüm varlıklar şirketin mevcut kurumsal sitesinden ve onaylı video/logo kaynaklarından derlenmiştir:

| Varlık | Dosya Adı / Konumu | Orijinal Kaynak | Kullanım Yeri / Açıklama |
| :--- | :--- | :--- | :--- |
| **Hero Video** | `/assets/bestbrands-hero.mp4` | Müşteri teslim paketi (`BestBrands_9Sahne_Birlesik_Onizleme.mp4`) | Hero bölümü tam ekran 46.5 sn tek seferlik oynatım |
| **Hero Poster** | `/assets/bestbrands-hero-poster.jpg` | FFmpeg ile videonun 00:00:00.00 karesinden üretildi | Autoplay engeli, prefers-reduced-motion ve hata fallback görseli |
| **Kurumsal Logo** | `/assets/bestbrands-logo.png` | `public/assets/bestbrands-original.png` | Header sol alanı; anasayfaya yönlendirir, filtre uygulanmadan orijinal oranlarıyla korunmuştur |
| **Güneş Enerjisi Santralleri** | `/assets/investments-solar-erzurum.jpg` | [bestbrandsenerji.com/wp-content/uploads/2020/09/erzurum-1.jpg](https://bestbrandsenerji.com/) | Mega Menü Yatırımlarımız kartı 1 (Şirketin Erzurum sahası görseli) |
| **Araç Muayene İstasyonları** | `/assets/investments-vehicle-inspection.webp` | [bestbrandsenerji.com/wp-content/uploads/2026/06/BestEsbi-Arac-Muayene-Istasyonlari-768x432.webp](https://bestbrandsenerji.com/) | Mega Menü Yatırımlarımız kartı 2 (Beste & Esbi iş birliği duyurusunda kullanılan temsili istasyon görseli / basın bülteni görselidir; işletme kanıtı veya gerçek saha tescili değildir) |
| **Kurumsal Görsel** | `/assets/corporate-overview.jpg` | [bestbrandsenerji.com/wp-content/uploads/2024/07/](https://bestbrandsenerji.com/) | Mega Menü Kurumsal paneli sağ görsel alanı (Şirket sitesinden alınan genel tanıtım karesi) |

---

## 3. Mimari ve Bileşen Yapısı

```text
bestbrands-site/
├── public/
│   └── assets/                  # Video, poster, logo ve doğrulanmış görseller
├── src/
│   ├── config/
│   │   └── siteConfig.ts        # Video, poster, iletişim ve marka konfigürasyonu
│   ├── types/
│   │   └── navigation.ts        # Tipli menü ve panel veri modelleri
│   ├── data/
│   │   └── navigationData.ts    # Merkezi, doğrulanmış URL ve bağlantı verileri
│   ├── styles/
│   │   ├── variables.css        # Renk, ölçü, tipografi ve animasyon değişkenleri
│   │   └── globals.css          # CSS reset, focus-visible ve erişilebilirlik
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Header.tsx       # Şeffaf navbar, hover/click gecikme, klavye yönetimi
│   │   │   ├── Header.module.css
│   │   │   ├── MegaMenu.tsx     # Kurumsal, Yatırımlarımız, Yatırımcı İlişkileri panelleri
│   │   │   ├── MegaMenu.module.css
│   │   │   ├── MobileMenu.tsx   # Hamburger çekmecesi ve dokunmatik akordeon
│   │   │   └── MobileMenu.module.css
│   │   └── Hero/
│   │       ├── HeroVideo.tsx    # Tek seferlik oynatım, pause/play, tekrar izle butonu
│   │       └── HeroVideo.module.css
│   ├── App.tsx                  # Ana layout kapsayıcısı
│   ├── main.tsx                 # React giriş noktası
│   └── index.css                # Kök layout stilleri
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Uygulanan Başlıca Davranışlar

### Header & Mega Menü
- Masaüstü sıralaması: `Logo | Kurumsal ↓ | Yatırımlarımız ↓ | Yatırımcı İlişkileri ↓ | Basın Odası | İletişim`.
- Video üzerinde kapalıyken şeffaftır; menü açıldığında header ve panel kesintisiz tek yeşil yüzey (`#00AA3E`) oluşturur.
- Panel, video üzerine overlay olarak açılır; sayfa içeriğini aşağı itmez.
- Hover ve tıklama ile açılabilir. Menü butonundan panele geçerken kapanmaması için 180ms tolerans gecikmesi (`pointer leave debounce`) bulunur.
- Aynı anda yalnızca seçili panel açık kalır. İnce aktif başlık çizgisi ve küçük yön oku animasyonu yer alır.
- **Klavye Erişilebilirliği:** `Escape` tuşuna basıldığında veya dışarı tıklandığında menü kapanır ve odak açma butonuna iade edilir.
- `aria-expanded`, `aria-controls`, `aria-haspopup` ve belirgin `:focus-visible` stilleri tam olarak uygulanmıştır.
- **Mobil & Tablet:** Hamburger butonu ve dokunarak açılan akordeon grupları içerir; taşma yapmaz ve kendi içinde kaydırılabilir.

### Hero Video
- Verilen 46.5 saniyelik `BestBrands_9Sahne_Birlesik_Onizleme.mp4` kullanılır.
- `muted`, `playsInline` ve `autoplay` ile açılışta bir kez oynar (`loop: false`).
- Menü açılıp kapandığında veya yeniden render sırasında video asla baştan başlamaz.
- Oynatma bittiğinde son karede kalır ve sağ altta ikonlu **“Tekrar İzle”** butonu belirir; tıklandığında videoyu başa sarıp bir kez daha oynatır.
- Tarayıcı autoplay ilkesi otomatik oynatmayı engellerse veya `prefers-reduced-motion` aktifse poster üzerinde belirgin bir **“Videoyu Oynat”** butonu görüntülenir; siyah alan bırakılmaz.
- Sol altta erişilebilir duraklat/devam kontrolü yer alır.
- Video yüklenememe durumunda poster ve anlaşılır durum bildirimi sunulur.

---

## 5. Çalıştırma, Build ve Dağıtım

### Yerel Geliştirme (Development)
```bash
npm install
npm run dev
```
Yerel adres: `http://127.0.0.1:5173/`

### Üretim Derlemesi (Production Build)
```bash
npm run build
```
Ön yüz çıktısı `dist/` klasörüne üretilir. Otomatik KAP akışı için aynı origin altında `/api/kap-disclosures` sunucusu gerekir; `npm start` ön yüzü ve bu API'yi birlikte sunar.

### Önizleme (Local Preview)
```bash
npm run preview
```

---

## 6. Barındırma ve Dağıtım Notları

1. **GitHub:** Kaynak kod depoya Vite + React + TS ön yüzü ve Node KAP servisiyle aktarılabilir.
2. **Node sunucusu:** `npm run build` ardından `npm start`. `server/`, `src/data/kap-snapshot.json`, `package.json` ve `dist/` birlikte tutulmalıdır. `HOST` ve `PORT` ortam değişkenleriyle yapılandırılır.
3. **Statik/CDN barındırma:** `dist/` tek başına arayüzü sunar; otomatik KAP akışı için `/api/kap-disclosures` ayrıca sunucu/sunucusuz işlev olarak bağlanmalıdır. Bu servis olmadığında arayüz son doğrulanmış kayıtları bağlantı durumu ile gösterir. Ayrıntılar `INVESTOR-RELATIONS.md` içindedir.
