import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OpenRoute } from './common/decorators/open-route.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
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
}
