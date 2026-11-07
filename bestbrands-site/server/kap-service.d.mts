import type { IncomingMessage, ServerResponse } from 'node:http';
export function kapMiddleware(req: IncomingMessage, res: ServerResponse): Promise<void>;
