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

// 按 IP 的限流器
export class IPRateLimiter {
    private ipLimits: Map<string, { count: number; resetTime: number }>;
    private maxRequestsPerMinute: number;
    private cleanupInterval: number;

    constructor(maxRequestsPerMinute: number = 10) {
        this.ipLimits = new Map();
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.cleanupInterval = 60000; // 每分钟清理一次
    }

    canProceed(ip: string): boolean {
        const now = Date.now();
        const ipData = this.ipLimits.get(ip);

        // 清理过期数据
        if (this.ipLimits.size > 1000) {
            for (const [key, value] of this.ipLimits.entries()) {
                if (now > value.resetTime) {
                    this.ipLimits.delete(key);
                }
            }
        }

        if (!ipData || now > ipData.resetTime) {
            // 新 IP 或时间窗口已过期
            this.ipLimits.set(ip, {
                count: 1,
                resetTime: now + this.cleanupInterval
            });
            return true;
        }

        if (ipData.count < this.maxRequestsPerMinute) {
            ipData.count++;
            return true;
        }

        return false;
    }

    getRemainingRequests(ip: string): number {
        const ipData = this.ipLimits.get(ip);
        if (!ipData || Date.now() > ipData.resetTime) {
            return this.maxRequestsPerMinute;
        }
        return Math.max(0, this.maxRequestsPerMinute - ipData.count);
    }
}
