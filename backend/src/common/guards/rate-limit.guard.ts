import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private nextCleanupAt = 0;

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    const key = this.createKey(context, request);
    const existingBucket = this.buckets.get(key);
    const bucket = !existingBucket || existingBucket.resetAt <= now
      ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
      : existingBucket;

    bucket.count += 1;
    this.buckets.set(key, bucket);
    this.cleanupExpiredBuckets(now);

    response.setHeader('RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    response.setHeader('RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count));
    response.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
      response.setHeader('Retry-After', Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private createKey(context: ExecutionContext, request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedAddress = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      ?.split(',')[0]
      ?.trim();
    const clientAddress = forwardedAddress || request.ip || request.socket.remoteAddress || 'unknown';
    return `${clientAddress}:${context.getClass().name}:${context.getHandler().name}`;
  }

  private cleanupExpiredBuckets(now: number) {
    if (now < this.nextCleanupAt) return;

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    this.nextCleanupAt = now + RATE_LIMIT_WINDOW_MS;
  }
}
