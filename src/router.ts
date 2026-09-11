/// <reference types="@cloudflare/workers-types" />
import { handleGetIndex, handleStaticAsset } from './controller';

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    if (url.pathname === '/') return handleGetIndex(request);
    if (url.pathname.startsWith('/assets/')) return handleStaticAsset(url.pathname);
  }

  return new Response('Not Found', { status: 404 });
}
