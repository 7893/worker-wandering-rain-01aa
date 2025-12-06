import { handleGetIndex, handlePostColor, handleStaticAsset } from './controller';
import { Env } from '../lib/db-utils';

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  
  if (request.method === 'GET') {
    if (url.pathname === '/') {
      return handleGetIndex(request, env);
    }
    if (url.pathname.startsWith('/assets/')) {
      return handleStaticAsset(url.pathname);
    }
  } else if (request.method === 'POST' && url.pathname === '/') {
    return handlePostColor(request, env, ctx);
  }

  return new Response('Not Found', { status: 404 });
}
