import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OpenRoute } from './common/decorators/open-route.decorator';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @OpenRoute()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'pantry-to-plate-api',
      engine: 'PlateSense Food Engine',
      timestamp: new Date().toISOString(),
    };
  }


  @OpenRoute()
  @Get('health/ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'reachable', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({
        message: 'The database is temporarily unavailable. Please retry shortly.',
        retryable: true,
      });
    }
  }
}
