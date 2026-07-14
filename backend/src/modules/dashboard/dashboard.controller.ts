import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { DashboardService } from './dashboard.service';
import { AnalyticsRangeDto } from './dto/analytics.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.summary(user.id);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: RequestUser, @Query() query: AnalyticsRangeDto) {
    return this.dashboardService.analytics(user.id, query.startDate, query.endDate);
  }
}
