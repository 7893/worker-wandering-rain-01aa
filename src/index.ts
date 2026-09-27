import { handleRequest } from './router';

export default {
    async fetch(request: Request): Promise<Response> {
        return handleRequest(request);
    }
};
