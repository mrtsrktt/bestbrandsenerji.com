import { useEffect, useMemo, useState } from 'react';
import snapshot from '../../data/kap-snapshot.json';
import styles from './InvestorRelations.module.css';

type Disclosure = {
  id: number; title: string; summary: string; publishedAt: string;
  url: string; year: number | null; period: number | null;
};
type Feed = { items: Disclosure[]; checkedAt: string; source: string; report?: { financial: Disclosure | null; activity: Disclosure | null } };
const kapUrl = 'https://kap.org.tr/tr/bildirim-sorgu-sonuc?member=8acae2c49b85f8ce019c0d9c2cc26b56';
const pinned = {
  title: 'Olağanüstü Genel Kurul Toplantısı',
  description: '13 Kasım 2026 tarihinde gerçekleştirilecek toplantıya ilişkin gündem ve bilgilendirme dokümanları.',
  date: '19 Ekim 2026',
  url: 'https://kap.org.tr/tr/Bildirim/1683800',
};

function Arrow({ download = false }: { download?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    {download ? <path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}
  </svg>;
}

function displayDate(value: string) {
  const [day, month, year] = value.split(' ')[0].split('.').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
}

export function InvestorRelations() {
  const [feed, setFeed] = useState<Feed>(snapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    let lastAttempt = 0;
    const refresh = async () => {
      if (document.hidden || Date.now() - lastAttempt < 30_000) return;
      lastAttempt = Date.now();
      controller?.abort();
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 18_000);
      try {
        const response = await fetch('/api/kap-disclosures', { signal: controller.signal });
        if (!response.ok) throw new Error('KAP unavailable');
        const data: Feed = await response.json();
        if (!Array.isArray(data.items) || !data.items.length || !Number.isFinite(Date.parse(data.checkedAt))) throw new Error('Invalid response');
        const validItems = data.items.filter(item => Number.isSafeInteger(item.id) &&
          item.url === `https://kap.org.tr/tr/Bildirim/${item.id}` && typeof item.title === 'string' &&
          /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/.test(item.publishedAt));
        if (!validItems.length) throw new Error('Invalid records');
        if (!disposed) setFeed({ ...data, items: validItems });
      } catch {
        if (!disposed) setFeed(previous => ({ ...previous, source: 'cached' }));
      } finally {
        window.clearTimeout(timeout);
        if (!disposed) setLoading(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5 * 60_000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { disposed = true; controller?.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const report = useMemo(() => {
    const financial = feed.report?.financial || feed.items.find(item => item.title === 'Finansal Rapor' && item.year && item.period);
    const year = financial?.year || 2026;
    const months = (financial?.period || 3) * 3;
    const activity = feed.report?.activity || feed.items.find(item => item.title.startsWith('Faaliyet Raporu') && item.year === year && item.period === financial?.period);
    const end = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(year, months, 0));
    return {
      year, months, end,
      url: financial?.url || 'https://kap.org.tr/tr/Bildirim/1689906',
      pdf: financial?.id === 1689906 || !financial ? 'https://kap.org.tr/tr/api/file/download/4028328ca17e4f5d01a18cdf3d167921' : `https://kap.org.tr/tr/api/BildirimPdf/${financial.id}`,
      activity: activity?.url || 'https://bestbrandsenerji.com/mali-tablolar-faaliyet-raporlari/',
    };
  }, [feed.items, feed.report]);

  return (
    <section className={styles.section} id="yatirimci-iliskileri" data-header-theme="dark" aria-labelledby="investor-title">
      <div className={styles.container}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>ŞEFFAF İLETİŞİM, SÜRDÜRÜLEBİLİR DEĞER</p>
          <h2 id="investor-title">Yatırımcı İlişkileri</h2>
        </div>
        <div className={styles.columns}>
          <div className={styles.featured}>
            <p className={styles.columnLabel}>Son Dönem Raporu</p>
            <a className={styles.cover} href={report.url} target="_blank" rel="noopener noreferrer" aria-label={`${report.year} ${report.months} aylık finansal raporu KAP’ta aç (yeni sekme)`}>
              <img className={styles.coverPhoto} src="/assets/corporate-overview.jpg" alt="" width="2560" height="1080" loading="lazy" />
              <img className={styles.coverLogo} src="/assets/bestbrands-white.png" alt="Best Brands Energy Group" width="164" height="82" loading="lazy" />
              <span className={styles.year}>{report.year}<small>{report.months} AYLIK</small></span>
              <span className={styles.coverCopy}><span>Geleceğe değer katan yatırımlar.</span><strong>Finansal<br />Rapor</strong><span>1 Ocak — {report.end} {report.year}</span></span>
              <span className={styles.coverCorner}><Arrow /></span>
            </a>
            <div className={styles.reportLinks}>
              <a href={report.pdf} target="_blank" rel="noopener noreferrer"><span><small>PDF</small> Finansal Rapor</span><Arrow download /></a>
              <a href={report.activity} target="_blank" rel="noopener noreferrer"><span>Faaliyet Raporu</span><Arrow /></a>
            </div>
            <article className={styles.pinned}>
              <p className={styles.columnLabel}>Öne Çıkan Duyuru</p>
              <a href={pinned.url} target="_blank" rel="noopener noreferrer">
                <time dateTime="2026-10-19">{pinned.date}</time>
                <h3>{pinned.title}<Arrow /></h3>
                <p>{pinned.description}</p>
                <span className={styles.pinnedLink}>KAP’ta inceleyin <span aria-hidden="true">↗</span></span>
              </a>
            </article>
          </div>
          <div className={styles.disclosures}>
            <div className={styles.listHeading}><h3>KAP Bildirimleri</h3><a href={kapUrl} target="_blank" rel="noopener noreferrer">Tüm bildirimler <span aria-hidden="true">↗</span></a></div>
            <ol className={styles.list}>
              {feed.items.slice(0, 6).map(item => <li key={item.id}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <time dateTime={item.publishedAt.split(' ')[0].split('.').reverse().join('-')}>{displayDate(item.publishedAt)}</time>
                  <div className={styles.itemTitle}><h4>{item.title}</h4><Arrow /></div>
                  {item.summary && item.summary.toLocaleLowerCase('tr') !== item.title.toLocaleLowerCase('tr') && <p>{item.summary}</p>}
                </a>
              </li>)}
            </ol>
            <p className={styles.status} role="status">
              {loading ? 'KAP bildirimleri güncelleniyor…' : feed.source === 'live' ? 'Kaynak: KAP · Otomatik güncellenir.' : 'KAP’a şu anda ulaşılamıyor. Son alınan bildirimler gösteriliyor.'}
              <span>Son kontrol: {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(feed.checkedAt))}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
