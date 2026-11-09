import { getKapDisclosures } from '../../server/kap-service.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  return Response.json(await getKapDisclosures(), { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export const config = { path: '/api/kap-disclosures' };
