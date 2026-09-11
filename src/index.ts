import { handleRequest } from './router';

export default {
    async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
        return handleRequest(request);
    }
};
