import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKapHtml, createKapService } from './kap-service.mjs';

const basic = (id, overrides = {}) => ({ disclosureIndex: id, stockCode: 'BESTE', companyTitle: 'BEST BRANDS GRUP ENERJİ YATIRIM A.Ş.', title: 'Finansal Rapor', summary: 'Alıntı " ve {parantez} — Türkçe', publishDate: '30.10.2026 18:14:02', year: 2026, period: 3, ...overrides });
const html = records => `<script>self.__next_f.push(${JSON.stringify([1, JSON.stringify({ data: records.map(disclosureBasic => ({ disclosureBasic })) })])})</script>`;

test('parses data without executing scripts, preserves escaped strings, filters companies and deduplicates', () => {
  const items = parseKapHtml(html([basic(5), basic(4, { stockCode: 'BEGYO' }), basic(3, { companyTitle: 'OTHER COMPANY' }), basic(5), basic(8, { publishDate: '01.11.2026 10:00:00' })]));
  assert.deepEqual(items.map(item => item.id), [8, 5]);
  assert.equal(items[1].summary, 'Alıntı " ve {parantez} — Türkçe');
  assert.equal(items[0].url, 'https://kap.org.tr/tr/Bildirim/8');
});

test('rejects changed markup and responses with no verified company records', () => {
  assert.throws(() => parseKapHtml('<html>Unavailable</html>'));
  assert.throws(() => parseKapHtml(html([basic(1, { stockCode: 'OTHER' })])));
});

test('coalesces requests and refreshes after five minutes', async () => {
  let calls = 0;
  let time = new Date('2026-11-06T12:00:00Z');
  const get = createKapService({ now: () => time, fetchImpl: async () => { calls++; return { ok: true, text: async () => html([basic(calls)]) }; } });
  const [one, two] = await Promise.all([get(), get()]);
  assert.equal(calls, 1); assert.equal(one.source, 'live'); assert.equal(two.items[0].id, 1);
  await get(); assert.equal(calls, 1);
  time = new Date(+time + 301_000);
  assert.equal((await get()).items[0].id, 2); assert.equal(calls, 2);
});

test('outage retains last good values and their original timestamp, then recovers', async () => {
  let time = new Date('2026-11-06T12:00:00Z');
  let unavailable = false;
  const get = createKapService({ now: () => time, fetchImpl: async () => {
    if (unavailable) throw new Error('Network down');
    return { ok: true, text: async () => html([basic(123)]) };
  } });
  const good = await get();
  time = new Date(+time + 301_000); unavailable = true;
  const stale = await get();
  assert.equal(stale.source, 'cached'); assert.deepEqual(stale.items, good.items); assert.equal(stale.checkedAt, good.checkedAt);
  time = new Date(+time + 61_000); unavailable = false;
  assert.equal((await get()).source, 'live');
});

test('latest report remains available after more than twelve newer disclosures', async () => {
  const news = Array.from({ length: 15 }, (_, index) => basic(100 + index, { title: 'Özel Durum Açıklaması', publishDate: '01.11.2026 10:00:00', year: null, period: null }));
  const get = createKapService({ fetchImpl: async () => ({ ok: true, text: async () => html([...news, basic(1)]) }) });
  const result = await get();
  assert.equal(result.items.length, 12);
  assert.equal(result.report.financial.id, 1);
  assert.ok(!result.items.some(item => item.id === 1));
});
