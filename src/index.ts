/// <reference types="@cloudflare/workers-types" />
import { handleGetIndex, handleStaticAsset } from './controller';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      if (url.pathname === '/') return handleGetIndex();
      if (url.pathname.startsWith('/assets/')) return handleStaticAsset(url.pathname);
    }

    return new Response('Not Found', { status: 404 });
  }
};
