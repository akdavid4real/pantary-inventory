import { BadGatewayException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EnvironmentService } from '../../common/config/environment.service';
import { LoginDto, RefreshSessionDto, ResendConfirmationDto, SignUpDto, VerifyEmailDto } from './dto/auth.dto';

type SupabaseAuthError = { error_description?: string; msg?: string; message?: string };

@Injectable()
export class AuthService {
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

  verifyEmail(dto: VerifyEmailDto) {
    return this.request('/verify', { email: dto.email, token: dto.token, type: 'signup' }, true);
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
}
