import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface RequestWindow {
    count: number;
    startTime: number;
}

export class RateLimiterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RateLimiterError';
    }
}

export class RateLimiter {
    private minuteWindow: RequestWindow;
    private hourWindow: RequestWindow;
    private readonly MAX_REQUESTS_PER_MINUTE = config.MAX_REQUESTS_PER_MINUTE;
    private readonly MAX_REQUESTS_PER_HOUR = config.MAX_REQUESTS_PER_HOUR;
    private readonly MINUTE_IN_MS = config.MINUTE_IN_MS;
    private readonly HOUR_IN_MS = config.HOUR_IN_MS;

    constructor() {
        const now = Date.now();
        this.minuteWindow = { count: 0, startTime: now };
        this.hourWindow = { count: 0, startTime: now };
    }

    async checkLimit(): Promise<boolean> {
        const now = Date.now();
        this.resetWindowsIfNeeded(now);

        if (this.minuteWindow.count >= this.MAX_REQUESTS_PER_MINUTE) {
            const waitTime = this.minuteWindow.startTime + this.MINUTE_IN_MS - now;
            logger.warn('Rate limit exceeded (per minute)', {
                currentCount: this.minuteWindow.count,
                limit: this.MAX_REQUESTS_PER_MINUTE,
                waitTime
            });
            throw new RateLimiterError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
        }

        if (this.hourWindow.count >= this.MAX_REQUESTS_PER_HOUR) {
            const waitTime = this.hourWindow.startTime + this.HOUR_IN_MS - now;
            logger.warn('Rate limit exceeded (per hour)', {
                currentCount: this.hourWindow.count,
                limit: this.MAX_REQUESTS_PER_HOUR,
                waitTime
            });
            throw new RateLimiterError(`Hourly rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000 / 60)} minutes.`);
        }

        this.minuteWindow.count++;
        this.hourWindow.count++;
        
        logger.debug('Rate limit check passed', {
            minuteCount: this.minuteWindow.count,
            hourCount: this.hourWindow.count
        });

        return true;
    }

    private resetWindowsIfNeeded(now: number): void {
        // Reset minute window if needed
        if (now - this.minuteWindow.startTime >= this.MINUTE_IN_MS) {
            logger.debug('Resetting minute window', {
                previousCount: this.minuteWindow.count
            });
            this.minuteWindow = { count: 0, startTime: now };
        }

        // Reset hour window if needed
        if (now - this.hourWindow.startTime >= this.HOUR_IN_MS) {
            logger.debug('Resetting hour window', {
                previousCount: this.hourWindow.count
            });
            this.hourWindow = { count: 0, startTime: now };
        }
    }

    getCurrentStatus(): { minuteRequests: number; hourRequests: number } {
        return {
            minuteRequests: this.minuteWindow.count,
            hourRequests: this.hourWindow.count
        };
    }
} 