import { ExecutionContext, HttpException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RateLimitGuard } from './rate-limit.guard';

function createHttpContext(address = '203.0.113.10') {
  const response = { setHeader: vi.fn() };
  const request = {
    headers: { 'x-forwarded-for': address },
    ip: address,
    socket: {},
  };
  const handler = function signup() {};
  class AuthController {}

  const context = {
    getType: () => 'http',
    getClass: () => AuthController,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return { context, response };
}

describe('RateLimitGuard', () => {
  afterEach(() => vi.useRealTimers());

  it('allows 120 requests per client and handler, then returns 429', () => {
    const guard = new RateLimitGuard();
    const { context, response } = createHttpContext();

    for (let requestNumber = 0; requestNumber < 120; requestNumber += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrowError(HttpException);
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
  });

  it('starts a fresh bucket after one minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T22:00:00Z'));
    const guard = new RateLimitGuard();
    const { context } = createHttpContext();

    for (let requestNumber = 0; requestNumber < 120; requestNumber += 1) {
      guard.canActivate(context);
    }
    vi.advanceTimersByTime(60_001);

    expect(guard.canActivate(context)).toBe(true);
  });
});
