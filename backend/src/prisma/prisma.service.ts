import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(`Database unavailable during startup; readiness will remain unavailable until it reconnects. ${error instanceof Error ? error.message : ''}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
