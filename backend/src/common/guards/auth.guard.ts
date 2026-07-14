import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { EnvironmentService } from '../config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OPEN_ROUTE_KEY } from '../decorators/open-route.decorator';
import { RequestWithUser } from '../types/request-user';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly verifiedTokens = new Map<string, { expiresAt: number; user: { id: string; email?: string; role: UserRole } }>();
  private readonly ensuredUsers = new Map<string, number>();

  constructor(
    private readonly config: EnvironmentService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOpen = this.reflector.getAllAndOverride<boolean>(OPEN_ROUTE_KEY, [context.getHandler(), context.getClass()]);
    if (isOpen) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authMode = this.config.get<string>('AUTH_MODE') ?? 'dev';
    const adminEmail = this.config.get<string>('ADMIN_EMAIL')?.toLowerCase();

    const bearerToken = this.extractBearerToken(request.headers.authorization);
    if (bearerToken) {
      const user = await this.verifyBearerToken(bearerToken, adminEmail);
      request.user = user;
      await this.ensureUser(user);
      return true;
    }

    if (authMode !== 'strict') {
      const demoUserId = this.readHeader(request, 'x-user-id') ?? 'demo-user';
      const demoEmail = this.readHeader(request, 'x-user-email') ?? 'demo@pantry-to-plate.local';
      const demoRole = demoEmail.toLowerCase() === adminEmail ? UserRole.ADMIN : UserRole.USER;

      request.user = {
        id: demoUserId,
        email: demoEmail,
        role: demoRole,
      };
      await this.ensureUser(request.user);
      return true;
    }

    throw new UnauthorizedException('Missing or invalid authentication token.');
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) return null;
    const [type, token] = authorization.split(' ');
    return type?.toLowerCase() === 'bearer' && token ? token : null;
  }

  private readHeader(request: RequestWithUser, name: string): string | undefined {
    const value = request.headers[name];
    if (Array.isArray(value)) return value[0];
    return value;
  }

  private async verifyBearerToken(token: string, adminEmail?: string) {
    const cached = this.verifiedTokens.get(token);
    if (cached && cached.expiresAt > Date.now()) return cached.user;
    if (cached) this.verifiedTokens.delete(token);

    const url = this.config.get<string>('SUPABASE_URL');
    const apiKey = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    if (!url || !apiKey) throw new UnauthorizedException('Supabase Auth is not configured.');

    let response: Response;
    try {
      response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: apiKey, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException({
        message: 'Authentication is temporarily unavailable. Please retry.',
        retryable: true,
      });
    }
    if (!response.ok) throw new UnauthorizedException('Invalid or expired authentication token.');

    const payload = (await response.json()) as {
      id: string;
      email?: string;
      app_metadata?: Record<string, unknown>;
    };
    const email = payload.email;
    const metadata = payload.app_metadata;
    const roleFromMetadata = metadata?.role === 'ADMIN' ? UserRole.ADMIN : undefined;

    const user = {
      id: payload.id,
      email,
      role: roleFromMetadata ?? (email?.toLowerCase() === adminEmail ? UserRole.ADMIN : UserRole.USER),
    };
    if (this.verifiedTokens.size >= 1000) {
      const oldest = this.verifiedTokens.keys().next().value as string | undefined;
      if (oldest) this.verifiedTokens.delete(oldest);
    }
    this.verifiedTokens.set(token, { user, expiresAt: Date.now() + 15 * 60 * 1000 });
    return user;
  }

  private async ensureUser(user: { id: string; email?: string; role: UserRole }) {
    const ensuredUntil = this.ensuredUsers.get(user.id) ?? 0;
    if (ensuredUntil > Date.now()) return;
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        supabaseId: user.id,
        email: user.email,
        role: user.role,
        profile: {
          create: {
            displayName: user.email?.split('@')[0] ?? 'Pantry User',
          },
        },
        preferences: {
          create: {},
        },
      },
      update: {
        ...(user.email ? { email: user.email } : {}),
        role: user.role,
      },
    });
    this.ensuredUsers.set(user.id, Date.now() + 15 * 60 * 1000);
  }
}
