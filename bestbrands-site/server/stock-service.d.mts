import type { IncomingMessage, ServerResponse } from 'node:http';
export function stockMiddleware(req: IncomingMessage, res: ServerResponse): Promise<void>;
