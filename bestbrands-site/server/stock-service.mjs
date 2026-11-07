import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';

export const STOCK_SOURCE = 'https://query1.finance.yahoo.com/v8/finance/chart/BESTE.IS?interval=1d&range=5d';
export const STOCK_BACKUP = 'https://query2.finance.yahoo.com/v8/finance/chart/BESTE.IS?interval=1d&range=5d';
const localDay = seconds => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(seconds * 1000));
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function parseStockResponse(data) {
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (meta?.symbol !== 'BESTE.IS' || meta.currency !== 'TRY' || meta.exchangeName !== 'IST' || !positive(meta.regularMarketPrice) || !positive(meta.regularMarketTime)) throw new Error('Invalid BESTE quote');
  const price = meta.regularMarketPrice;
  let previousClose = meta.regularMarketPreviousClose ?? meta.previousClose;
  if (!positive(previousClose) && typeof meta.fulldayChange === 'number' && Number.isFinite(meta.fulldayChange)) previousClose = price - meta.fulldayChange;
  if (!positive(previousClose)) {
    const times = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const day = localDay(meta.regularMarketTime);
    for (let index = times.length - 1; index >= 0; index--) {
      if (positive(times[index]) && localDay(times[index]) < day && positive(closes[index])) { previousClose = closes[index]; break; }
    }
  }
  // chartPreviousClose is the start of the requested range, not yesterday's close.
  if (!positive(previousClose)) throw new Error('Missing previous session close');
  const change = Number((price - previousClose).toFixed(6));
  return {
    symbol: 'BESTE', exchange: 'BIST', currency: 'TRY', price,
    change, changePercent: Number((change / previousClose * 100).toFixed(6)),
    quotedAt: new Date(meta.regularMarketTime * 1000).toISOString(),
    delayMinutes: 15, provider: 'Yahoo Finance',
    sourceUrl: 'https://finance.yahoo.com/quote/BESTE.IS/',
  };
}

function validSaved(data) {
  const quote = data?.quote;
  return quote?.symbol === 'BESTE' && quote.exchange === 'BIST' && quote.currency === 'TRY' &&
    positive(quote.price) && Number.isFinite(quote.change) && Number.isFinite(quote.changePercent) &&
    Number.isFinite(Date.parse(quote.quotedAt)) && Number.isFinite(Date.parse(data.checkedAt));
}

export function createStockService({ fetchImpl = fetch, now = () => new Date(), loadCached, saveCached } = {}) {
  let quote = null, checkedAt = null, freshUntil = 0, unavailable = true, pending;
  let restored = false;
  const endpoints = [STOCK_SOURCE, STOCK_BACKUP];
  const backoff = new Map();
  const payload = () => ({ quote, checkedAt, status: quote ? (unavailable ? 'cached' : 'available') : 'unavailable' });
  return async () => {
    if (+now() < freshUntil) return payload();
    if (pending) return pending;
    pending = (async () => {
      try {
        if (!restored) {
          restored = true;
          try {
            const saved = await loadCached?.();
            if (validSaved(saved)) { quote = saved.quote; checkedAt = saved.checkedAt; }
          } catch { /* A missing cache never prevents a source request. */ }
        }
        let nextQuote;
        for (const endpoint of endpoints) {
          if ((backoff.get(endpoint) || 0) > +now()) continue;
          try {
            const response = await fetchImpl(endpoint, { signal: AbortSignal.timeout(4000), headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(`Stock source ${response.status}`);
            const candidate = parseStockResponse(await response.json());
            if (quote && Date.parse(candidate.quotedAt) < Date.parse(quote.quotedAt)) throw new Error('Older quote');
            nextQuote = candidate;
            backoff.delete(endpoint);
            break;
          } catch { backoff.set(endpoint, +now() + 60_000); }
        }
        if (!nextQuote) throw new Error('Both quote endpoints unavailable');
        quote = nextQuote;
        checkedAt = now().toISOString(); unavailable = false;
        freshUntil = +now() + 60_000;
        try { await saveCached?.({ quote, checkedAt }); } catch { /* Keep valid in-memory data if disk is unavailable. */ }
      } catch { unavailable = true; freshUntil = +now() + 30_000; }
      finally { pending = undefined; }
      return payload();
    })();
    return pending;
  };
}
// Vercel deployment files are read-only; temporary cache belongs in /tmp.
const runtime = process.env.VERCEL
  ? new URL('file:///tmp/bestbrands-runtime/')
  : new URL('../.runtime/', import.meta.url);
const cacheFile = new URL('stock-quote.json', runtime);
export const getStockQuote = createStockService({
  loadCached: async () => JSON.parse(await readFile(cacheFile, 'utf8')),
  saveCached: async data => {
    await mkdir(runtime, { recursive: true });
    const temporary = new URL('stock-quote.tmp', runtime);
    await writeFile(temporary, JSON.stringify(data), 'utf8');
    await rename(temporary, cacheFile);
  },
});
export async function stockMiddleware(req, res) {
  if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); res.end(); return; }
  const data = await getStockQuote();
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}
