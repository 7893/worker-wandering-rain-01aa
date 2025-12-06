import { handleRequest } from './router';
import { handleScheduled } from './controller';
import { Env } from '../lib/db-utils';

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return handleRequest(request, env, ctx);
    },

    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        await handleScheduled(event, env, ctx);
    }
};