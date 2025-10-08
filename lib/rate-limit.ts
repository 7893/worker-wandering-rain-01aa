export class RateLimiter {
    private limit: number;
    private counter: number;
    private lastTimestamp: number;

    constructor(limit: number) {
        if (limit <= 0 || !Number.isFinite(limit)) {
            throw new Error("Rate limit must be a positive finite number");
        }
        this.limit = Math.floor(limit);
        this.counter = 0;
        this.lastTimestamp = Date.now();
    }

    canProceed(): boolean {
        const now = Date.now();
        if (now - this.lastTimestamp > 1000) {
            this.counter = 0;
            this.lastTimestamp = now;
        }
        if (this.counter < this.limit) {
            this.counter++;
            return true;
        }
        return false;
    }
}
