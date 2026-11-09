import { useState, useRef, useEffect } from 'react';
import styles from './PressRoom.module.css';

const archive = 'https://bestbrandsenerji.com/basin-bulteni/';
const news = [
  { date: 'Şubat 2026', category: 'Sermaye piyasaları', title: 'Borsa İstanbul’da yeni bir dönemin başlangıcı.', image: '2026/02/daa59344-9472-4e23-877b-ffab361aa58e-1280x854.jpg', alt: 'Best Brands Enerji Borsa İstanbul gong töreni', text: 'Best Brands Grup Enerji, halka arz sürecini tamamlayarak 11 Şubat 2026 itibarıyla BESTE koduyla Borsa İstanbul Ana Pazar’da işlem görmeye başladı. Şirket, şeffaflık, sürdürülebilirlik ve kurumsal büyüme hedefleri doğrultusunda yatırımlarını sürdürmeyi hedefliyor.' },
  { date: 'Haziran 2026', category: 'Yeni yatırımlar', title: 'Araç muayene hizmetlerinde yeni iş birliği.', image: '2026/06/BestEsbi-Arac-Muayene-Istasyonlari.webp', alt: 'Araç muayene istasyonu görseli', text: 'BESTE ve ESBİ Araç Muayene İstasyonları, TURKA ile gerçekleştirilen iş birliği kapsamında 9 ilde toplam 14 araç muayene istasyonunun alt işletmeciliğini üstlenecek. Yatırım, düzenli, güvenilir ve özenli bir hizmet anlayışını hedefliyor.' },
  { date: 'Temmuz 2026', category: 'Grup şirketlerinden', title: 'NP Petrol’ün Bakü’de halka arzı için ilk imza.', image: '2026/07/nppetrol-haber.webp', alt: 'NP Petrol ve Bakü Borsası toplantısı', text: 'NP Petrol’ün Bakü Menkul Kıymetler Borsası’nda halka arzı için BSE ile Listing Advisory Program danışmanlık anlaşması imzalandı. Bu gelişme, Sürkit Holding’in İstanbul ve Bakü sermaye piyasalarındaki büyüme vizyonunun bir parçası.' },
];
news.splice(1, 0, { date: 'Eylül 2026', category: 'Sürkit Holding', title: 'Kayıtlı sermaye sistemine geçiş başvurusu.', image: 'surkit-holding.svg', alt: 'Sürkit Holding logosu', text: 'Best Brands Enerji’nin %71 ortağı Sürkit Holding A.Ş., 16 Eylül 2026 tarihli yönetim kurulu kararı doğrultusunda halka arz amaçlı kayıtlı sermaye sistemine geçiş ve esas sözleşme değişiklikleri için Sermaye Piyasası Kurulu’na başvuruda bulundu. Önemli gelişmeler kamuoyu ile ayrıca paylaşılacak.' });
const Arrow = () => <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.3" /></svg>;

export function PressRoom() {
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (selected !== null) dialog.current?.showModal(); }, [selected]);
  return <section className={styles.section} id="basin-odasi" aria-labelledby="press-title">
    <div className={styles.container}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}><span /> HABERLER & GÜNCEL GELİŞMELER</p><h2 id="press-title">Basın <em>odası.</em></h2></div>
        <div className={styles.intro}><p>Yatırımlarımızdan, iş birliklerimizden<br />ve büyüme yolculuğumuzdan.</p><a href={archive} target="_blank" rel="noopener noreferrer">Tüm haberleri keşfedin <Arrow /></a></div>
      </header>
      <div className={styles.grid}>
        <button className={styles.feature} onClick={() => setSelected(0)} aria-label={news[0].title + ' Haberi oku'}>
          <img src={'/press/' + news[0].image} alt={news[0].alt} loading="lazy" />
          <div className={styles.featureCopy}><div className={styles.meta}><span>ÖNE ÇIKAN HABER</span><time>{news[0].date}</time></div><h3>{news[0].title}</h3><span className={styles.read}>Haberi okuyun <Arrow /></span></div>
        </button>
        <div className={styles.side}>{news.slice(1).map((item, i) => <button key={item.title} className={styles.story} onClick={() => setSelected(i + 1)}>
          <div className={styles.thumb}><img src={'/press/' + item.image} alt={item.alt} loading="lazy" /></div>
          <div className={styles.storyCopy}><div className={styles.meta}><span>{item.category}</span><time>{item.date}</time></div><h3>{item.title}</h3><span className={styles.read}>Haberi okuyun <Arrow /></span></div>
        </button>)}</div>
      </div>
    </div>
    <dialog ref={dialog} className={styles.dialog} onClose={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      {selected !== null && <><button className={styles.close} onClick={() => dialog.current?.close()} aria-label="Haberi kapat">✕</button><img src={'https://bestbrandsenerji.com/wp-content/uploads/' + news[selected].image} alt={news[selected].alt} /><div className={styles.dialogCopy}><p className={styles.eyebrow}>{news[selected].category} · {news[selected].date}</p><h2>{news[selected].title}</h2><p>{news[selected].text}</p><a href={archive} target="_blank" rel="noopener noreferrer">Kaynak: Best Brands Enerji basın bülteni ↗</a></div></>}
    </dialog>
  </section>;
}
