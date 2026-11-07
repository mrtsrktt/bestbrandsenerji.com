import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStockResponse, createStockService } from './stock-service.mjs';
const response = overrides => ({ chart: { result: [{ meta: {
  symbol: 'BESTE.IS', currency: 'TRY', exchangeName: 'IST', regularMarketPrice: 16.18,
  regularMarketTime: 1793977745, chartPreviousClose: 14.93, fulldayChange: .57, ...overrides,
}, timestamp: [1793860200, 1793946600], indicators: { quote: [{ close: [15.61, 16.18] }] } }] } });

test('daily change uses previous session, never the five-day chart baseline', () => {
  const quote = parseStockResponse(response());
  assert.equal(quote.change, .57);
  assert.equal(quote.changePercent, 3.651505);
  assert.equal(quote.delayMinutes, 15);
});
test('falls back to previous dated candle when daily change is absent', () => {
  assert.equal(parseStockResponse(response({ fulldayChange: undefined })).change, .57);
});
test('handles negative and flat changes and rejects invalid identity/prices', () => {
  assert.equal(parseStockResponse(response({ regularMarketPrice: 15, previousClose: 16 })).change, -1);
  assert.equal(parseStockResponse(response({ regularMarketPrice: 15, previousClose: 15 })).change, 0);
  assert.throws(() => parseStockResponse(response({ symbol: 'BEGYO.IS' })));
  assert.throws(() => parseStockResponse(response({ regularMarketPrice: 0 })));
  assert.throws(() => parseStockResponse(response({ currency: 'USD' })));
});
test('caches/coalesces requests, preserves original quote time during outage, recovers', async () => {
  let time = new Date('2026-11-06T16:00:00Z'), calls = 0, failed = false;
  const get = createStockService({ now: () => time, fetchImpl: async () => {
    calls++; if (failed) throw new Error('Unavailable');
    return { ok: true, json: async () => response() };
  } });
  const [good] = await Promise.all([get(), get()]);
  assert.equal(calls, 1); assert.equal(good.status, 'available');
  time = new Date(+time + 61_000); failed = true;
  const cached = await get();
  assert.equal(cached.status, 'cached'); assert.deepEqual(cached.quote, good.quote); assert.equal(cached.checkedAt, good.checkedAt);
  time = new Date(+time + 61_000); failed = false;
  assert.equal((await get()).status, 'available');
});
test('initial outage returns unavailable without inventing a price', async () => {
  const get = createStockService({ fetchImpl: async () => { throw new Error('Offline'); } });
  const data = await get(); assert.equal(data.quote, null); assert.equal(data.status, 'unavailable');
});

test('switches to the second host when the first is unavailable', async () => {
  const urls = [];
  const get = createStockService({ fetchImpl: async url => {
    urls.push(url);
    if (url.includes('query1.')) return { ok: false, status: 503 };
    return { ok: true, json: async () => response() };
  } });
  const data = await get();
  assert.equal(data.status, 'available'); assert.equal(data.quote.price, 16.18);
  assert.equal(urls.length, 2); assert.ok(urls[1].includes('query2.'));
});

test('restores persisted price on restart when both hosts fail', async () => {
  let saved;
  const first = createStockService({ saveCached: async data => { saved = data; }, fetchImpl: async () => ({ ok: true, json: async () => response() }) });
  const original = await first();
  const restarted = createStockService({ loadCached: async () => saved, fetchImpl: async () => { throw new Error('Offline'); } });
  const restored = await restarted();
  assert.equal(restored.status, 'cached'); assert.deepEqual(restored.quote, original.quote); assert.equal(restored.checkedAt, original.checkedAt);
});

test('rejects an older source quote and retains original market timestamp', async () => {
  const saved = { quote: parseStockResponse(response()), checkedAt: '2026-11-06T17:00:00Z' };
  const get = createStockService({ loadCached: async () => saved, fetchImpl: async () => ({ ok: true, json: async () => response({ regularMarketTime: 1793860200 }) }) });
  const data = await get(); assert.equal(data.status, 'cached'); assert.equal(data.quote.quotedAt, saved.quote.quotedAt);
});
