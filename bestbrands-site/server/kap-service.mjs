import seed from '../src/data/kap-snapshot.json' with { type: 'json' };

export const KAP_SOURCE = 'https://kap.org.tr/tr/bildirim-sorgu-sonuc?member=8acae2c49b85f8ce019c0d9c2cc26b56';

function readObject(text, start) {
  let depth = 0, quoted = false, escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(text.slice(start, index + 1));
  }
  throw new Error('Incomplete KAP record');
}

export function parseKapHtml(html) {
  if (html.length > 8_000_000) throw new Error('Unexpected KAP response size');
  let flight = '';
  for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    const script = match[1].trim();
    const prefix = 'self.__next_f.push(';
    if (!script.startsWith(prefix)) continue;
    try {
      const chunk = JSON.parse(script.slice(prefix.length, script.lastIndexOf(')')));
      if (chunk[0] === 1 && typeof chunk[1] === 'string') flight += chunk[1];
    } catch { /* Skip non-data scripts; never evaluate remote JavaScript. */ }
  }
  const records = new Map();
  for (const match of flight.matchAll(/"disclosureBasic"\s*:\s*(\{)/g)) {
    const basic = readObject(flight, match.index + match[0].length - 1);
    if (basic.stockCode !== 'BESTE' || !basic.companyTitle?.startsWith('BEST BRANDS GRUP ENERJİ YATIRIM')) continue;
    if (!Number.isSafeInteger(basic.disclosureIndex) || basic.disclosureIndex <= 0 || typeof basic.title !== 'string') continue;
    const date = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(basic.publishDate || '');
    if (!date) continue;
    const iso = `${date[3]}-${date[2]}-${date[1]}T${date[4]}:${date[5]}:${date[6]}+03:00`;
    if (!Number.isFinite(Date.parse(iso))) continue;
    records.set(basic.disclosureIndex, {
      id: basic.disclosureIndex,
      title: basic.title.trim().slice(0, 500),
      summary: typeof basic.summary === 'string' ? basic.summary.trim().slice(0, 1500) : '',
      publishedAt: basic.publishDate,
      url: `https://kap.org.tr/tr/Bildirim/${basic.disclosureIndex}`,
      year: Number.isInteger(basic.year) ? basic.year : null,
      period: Number.isInteger(basic.period) ? basic.period : null,
      sortTime: Date.parse(iso),
    });
  }
  const items = [...records.values()].sort((a, b) => b.sortTime - a.sortTime || b.id - a.id)
    .map(({ sortTime, ...item }) => item);
  if (!items.length) throw new Error('KAP returned no verified BESTE disclosures');
  return items;
}

export function createKapService({ fetchImpl = fetch, now = () => new Date(), initial = seed } = {}) {
  let cache = initial;
  let freshUntil = 0;
  let pending;
  let unavailable = true;
  const payload = () => ({ ...cache, source: unavailable ? 'cached' : 'live', sourceUrl: KAP_SOURCE });
  return async function getDisclosures() {
    if (+now() < freshUntil) return payload();
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetchImpl(KAP_SOURCE, {
          headers: { Accept: 'text/html', 'Accept-Language': 'tr-TR,tr;q=0.9', 'User-Agent': 'BestBrands-InvestorRelations/1.0' },
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`KAP ${response.status}`);
        const all = parseKapHtml(await response.text());
        const financial = all.find(item => item.title === 'Finansal Rapor' && item.year && item.period);
        const activity = financial && all.find(item => item.title.startsWith('Faaliyet Raporu') && item.year === financial.year && item.period === financial.period);
        cache = { items: all.slice(0, 12), report: { financial: financial || null, activity: activity || null }, checkedAt: now().toISOString() };
        unavailable = false;
        freshUntil = +now() + 5 * 60_000;
      } catch {
        unavailable = true;
        freshUntil = +now() + 60_000;
      } finally { pending = undefined; }
      return payload();
    })();
    return pending;
  };
}

export const getKapDisclosures = createKapService();
export async function kapMiddleware(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET' }); res.end(); return;
  }
  const data = await getKapDisclosures();
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}
