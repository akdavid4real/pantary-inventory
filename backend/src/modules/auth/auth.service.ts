import { BadGatewayException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { EnvironmentService } from '../../common/config/environment.service';
import { LoginDto, RefreshSessionDto, ResendConfirmationDto, SignUpDto, VerifyEmailDto } from './dto/auth.dto';

type SupabaseAuthError = { error_description?: string; msg?: string; message?: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly config: EnvironmentService) {}

  signUp(dto: SignUpDto) {
    return this.request('/signup', {
      email: dto.email,
      password: dto.password,
      data: { display_name: dto.displayName },
    });
  }

  login(dto: LoginDto) {
    return this.request('/token?grant_type=password', dto, true);
  }

  refresh(dto: RefreshSessionDto) {
    return this.request('/token?grant_type=refresh_token', { refresh_token: dto.refreshToken }, true);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const url = this.config.get<string>('SUPABASE_URL');
    const apiKey = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    if (!url || !apiKey) throw new BadGatewayException('Supabase Auth is not configured.');

    const supabase = createClient(url, apiKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data, error } = await supabase.auth.verifyOtp({
      email: dto.email,
      token: dto.token,
      type: 'signup',
    });

    if (error || !data.session) {
      throw new UnauthorizedException(error?.message ?? 'Unable to verify this code.');
    }

    const displayName = typeof data.user?.user_metadata?.display_name === 'string'
      ? data.user.user_metadata.display_name
      : undefined;
    await this.sendWelcomeEmail(dto.email, displayName);

    return data.session;
  }

  resendConfirmation(dto: ResendConfirmationDto) {
    return this.request('/resend', { email: dto.email, type: 'signup' });
  }

  private async request(path: string, body: unknown, unauthorizedOnFailure = false) {
    const url = this.config.get<string>('SUPABASE_URL');
    const apiKey = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    if (!url || !apiKey) throw new BadGatewayException('Supabase Auth is not configured.');

    const response = await fetch(`${url}/auth/v1${path}`, {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as SupabaseAuthError;
    if (!response.ok) {
      const message = data.error_description ?? data.msg ?? data.message ?? 'Authentication failed.';
      if (unauthorizedOnFailure) throw new UnauthorizedException(message);
      throw new BadGatewayException(message);
    }
    return data;
  }

  private async sendWelcomeEmail(email: string, displayName?: string) {
    const apiKey = this.config.get<string>('RESEND_API_KEY') ?? this.config.get<string>('resend');
    if (!apiKey) {
      this.logger.warn('Welcome email skipped because RESEND_API_KEY is not configured.');
      return;
    }

    const firstName = displayName?.trim().split(/\s+/)[0] || 'there';
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pantry-to-Plate <welcome@pantrytoplate.name.ng>',
          to: [email],
          subject: 'Welcome to Pantry-to-Plate',
          html: `
            <div style="background:#f7f2e9;padding:32px 16px;font-family:Arial,sans-serif;color:#173f36">
              <div style="max-width:560px;margin:auto;background:#fffdf8;border:1px solid #dfd5c5;border-radius:18px;overflow:hidden">
                <div style="background:#07513f;padding:28px 32px;color:#fff">
                  <p style="margin:0 0 8px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#d9e8dc">Pantry-to-Plate</p>
                  <h1 style="margin:0;font-family:Georgia,serif;font-size:34px;font-weight:500">Welcome to your smarter kitchen.</h1>
                </div>
                <div style="padding:30px 32px">
                  <p style="font-size:18px;margin-top:0">Hi ${this.escapeHtml(firstName)},</p>
                  <p style="font-size:15px;line-height:1.7;color:#52645f">Your email is confirmed and your Pantry-to-Plate account is ready. Add what you have, discover Nigerian meals that fit your pantry, and turn your plan into a focused grocery list.</p>
                  <a href="https://www.pantrytoplate.name.ng/login" style="display:inline-block;margin-top:12px;background:#07513f;color:#fff;text-decoration:none;border-radius:10px;padding:13px 22px;font-weight:700">Open Pantry-to-Plate</a>
                  <p style="margin:28px 0 0;font-size:13px;color:#71807b">Better planning. Better food. Better you.</p>
                </div>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Welcome email failed with status ${response.status}.`);
      }
    } catch (error) {
      this.logger.warn(`Welcome email failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
