import { useEffect, useState } from 'react';
import styles from './StockTicker.module.css';

type Quote = { symbol: string; exchange: string; currency: string; price: number; change: number; changePercent: number; quotedAt: string; delayMinutes: number; provider: string; sourceUrl: string };
type StockData = { quote: Quote | null; checkedAt: string | null; status: string };
const amount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (number: number) => `${number > 0 ? '+' : number < 0 ? '−' : ''}${amount.format(Math.abs(number))}`;

export function StockTicker() {
  const [data, setData] = useState<StockData>({ quote: null, checkedAt: null, status: 'loading' });
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    let lastAttempt = 0;
    const refresh = async () => {
      if (document.hidden || Date.now() - lastAttempt < 15_000) return;
      lastAttempt = Date.now();
      controller?.abort();
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 10_000);
      try {
        const response = await fetch('/api/stock-quote', { signal: controller.signal });
        if (!response.ok) throw new Error('Unavailable');
        const result: StockData = await response.json();
        const quote = result.quote;
        if (quote && (quote.symbol !== 'BESTE' || quote.exchange !== 'BIST' || quote.currency !== 'TRY' ||
          !Number.isFinite(quote.price) || quote.price <= 0 || !Number.isFinite(quote.change) || !Number.isFinite(quote.changePercent) || !Number.isFinite(Date.parse(quote.quotedAt)))) throw new Error('Invalid quote');
        if (!disposed) setData(previous => !quote && previous.quote ? { ...previous, status: 'cached' } : result);
      } catch {
        if (!disposed) setData(previous => ({ ...previous, status: previous.quote ? 'cached' : 'unavailable' }));
      } finally { window.clearTimeout(timeout); }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { disposed = true; controller?.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  const quote = data.quote;
  const direction = quote ? (quote.change > 0 ? 'up' : quote.change < 0 ? 'down' : 'flat') : 'flat';
  return (
    <section className={styles.strip} aria-label="BESTE hisse performansı">
      <div className={styles.container}>
        <div className={styles.values}>
          <svg className={styles.chartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 17 6-6 4 4 8-10M15 5h6v6" /></svg>
          <span className={styles.symbol}>BIST: BESTE</span>
          {quote ? <>
            <span className={styles.price}>{amount.format(quote.price)} <span>TL</span></span>
            <span className={styles.divider} aria-hidden="true" />
            <span className={`${styles.change} ${styles[direction]}`}>
              {signed(quote.change)} TL <span>({signed(quote.changePercent)}%)</span>
              <span className={styles.direction} aria-label={direction === 'up' ? 'Yükseliş' : direction === 'down' ? 'Düşüş' : 'Değişim yok'}>{direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—'}</span>
            </span>
          </> : <span className={styles.empty} role="status">{data.status === 'loading' ? 'Fiyat bilgisi yükleniyor…' : 'Fiyat bilgisine şu anda ulaşılamıyor.'}</span>}
        </div>
        <p className={styles.metadata}>
          <a href="https://finance.yahoo.com/quote/BESTE.IS/" target="_blank" rel="noopener noreferrer">Yahoo Finance</a>
          <span aria-hidden="true">·</span><span>15 dk gecikmeli</span>
          {quote && <><span aria-hidden="true">·</span><time dateTime={quote.quotedAt}>{new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(quote.quotedAt))}</time></>}
          {data.status === 'cached' && <span className={styles.cached}>Son alınan veri</span>}
        </p>
      </div>
    </section>
  );
}
