import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentService } from '../../common/config/environment.service';
import { AuthService } from './auth.service';

describe('AuthService email verification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exchanges a six-digit email code for a Supabase session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'access', refresh_token: 'refresh' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const config = {
      get: (key: string) =>
        key === 'SUPABASE_URL' ? 'https://project.supabase.co' : key === 'SUPABASE_PUBLISHABLE_KEY' ? 'publishable' : undefined,
    } as EnvironmentService;

    const service = new AuthService(config);
    await service.verifyEmail({ email: 'cook@example.com', token: '123456' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'cook@example.com', token: '123456', type: 'email' }),
      }),
    );
  });

  it('requests a replacement signup code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const config = {
      get: (key: string) =>
        key === 'SUPABASE_URL' ? 'https://project.supabase.co' : key === 'SUPABASE_PUBLISHABLE_KEY' ? 'publishable' : undefined,
    } as EnvironmentService;

    const service = new AuthService(config);
    await service.resendConfirmation({ email: 'cook@example.com' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/resend',
      expect.objectContaining({ body: JSON.stringify({ email: 'cook@example.com', type: 'signup' }) }),
    );
  });
});
