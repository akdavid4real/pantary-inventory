import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OPEN_ROUTE_KEY } from '../decorators/open-route.decorator';
import { RequestWithUser } from '../types/request-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
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
    const secret = this.config.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('SUPABASE_JWT_SECRET is required for bearer token verification.');
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const metadata = payload.app_metadata as Record<string, unknown> | undefined;
    const roleFromMetadata = metadata?.role === 'ADMIN' ? UserRole.ADMIN : undefined;

    return {
      id: String(payload.sub),
      email,
      role: roleFromMetadata ?? (email?.toLowerCase() === adminEmail ? UserRole.ADMIN : UserRole.USER),
    };
  }

  private async ensureUser(user: { id: string; email?: string; role: UserRole }) {
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
  }
}
