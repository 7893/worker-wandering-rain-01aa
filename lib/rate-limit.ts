// lib/rate-limit.ts

export class RateLimiter {
    private limit: number;
    private counter: number;
    private lastTimestamp: number;
  
    constructor(limit: number) {
      this.limit = limit;
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
  