import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { SimulateRecipeMatchDto } from './dto/recipe-matcher.dto';
import { RecipeMatcherService } from './recipe-matcher.service';

@ApiTags('Recipe Matcher')
@ApiBearerAuth()
@Controller('recipe-matcher')
export class RecipeMatcherController {
  constructor(private readonly recipeMatcherService: RecipeMatcherService) {}

  @Get('from-pantry')
  fromPantry(@CurrentUser() user: RequestUser) {
    return this.recipeMatcherService.fromPantry(user.id);
  }

  @Get('expiring-first')
  expiringFirst(@CurrentUser() user: RequestUser, @Query('days') days?: number) {
    return this.recipeMatcherService.expiringFirst(user.id, days ? Number(days) : 7);
  }

  @Post('simulate')
  simulate(@Body() dto: SimulateRecipeMatchDto) {
    return this.recipeMatcherService.simulate(dto);
  }

  @Get(':recipeId/check')
  checkRecipe(@CurrentUser() user: RequestUser, @Param('recipeId') recipeId: string) {
    return this.recipeMatcherService.checkRecipe(user.id, recipeId);
  }
}
