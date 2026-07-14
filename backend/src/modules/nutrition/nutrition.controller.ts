import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { NutritionWeekQueryDto } from './dto/nutrition.dto';
import { NutritionService } from './nutrition.service';

@ApiTags('Nutrition')
@ApiBearerAuth()
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('recipe/:recipeId')
  recipeNutrition(@Param('recipeId') recipeId: string) {
    return this.nutritionService.recipeNutrition(recipeId);
  }

  @Post('calculate-recipe/:recipeId')
  calculateRecipe(@Param('recipeId') recipeId: string) {
    return this.nutritionService.calculateRecipe(recipeId);
  }

  @Get('day/:date')
  daySummary(@CurrentUser() user: RequestUser, @Param('date') date: string) {
    return this.nutritionService.daySummary(user.id, date);
  }

  @Get('week')
  weekSummary(@CurrentUser() user: RequestUser, @Query() query: NutritionWeekQueryDto) {
    return this.nutritionService.weekSummary(user.id, query.date);
  }

  @Get('meal-plan/week')
  mealPlanWeekSummary(@CurrentUser() user: RequestUser, @Query() query: NutritionWeekQueryDto) {
    return this.nutritionService.weekSummary(user.id, query.date);
  }

  @Get('catalog-validation')
  validateCatalog() {
    return this.nutritionService.validateCatalog();
  }
}
