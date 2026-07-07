import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Recommendations')
@ApiBearerAuth()
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('from-pantry')
  fromPantry(@CurrentUser() user: RequestUser) {
    return this.recommendationsService.fromPantry(user.id);
  }

  @Get('expiring-items')
  expiringItems(@CurrentUser() user: RequestUser) {
    return this.recommendationsService.expiringItems(user.id);
  }

  @Get('low-budget')
  lowBudget() {
    return this.recommendationsService.lowBudget();
  }

  @Get('high-protein')
  highProtein() {
    return this.recommendationsService.highProtein();
  }

  @Get('quick-meals')
  quickMeals(@Query('maxMinutes') maxMinutes?: number) {
    return this.recommendationsService.quickMeals(maxMinutes ? Number(maxMinutes) : 35);
  }
}
