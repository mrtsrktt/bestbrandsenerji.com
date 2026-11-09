import { getStockQuote } from '../../server/stock-service.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  return Response.json(await getStockQuote(), { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export const config = { path: '/api/stock-quote' };
