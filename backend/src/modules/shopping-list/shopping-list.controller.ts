import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { GenerateFromMealPlanDto, GenerateFromRecipeDto, UpdateShoppingListItemDto } from './dto/shopping-list.dto';
import { ShoppingListService } from './shopping-list.service';

@ApiTags('Shopping List')
@ApiBearerAuth()
@Controller('shopping-list')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  @Post('generate/from-recipe/:recipeId')
  generateFromRecipe(
    @CurrentUser() user: RequestUser,
    @Param('recipeId') recipeId: string,
    @Body() dto: GenerateFromRecipeDto,
  ) {
    return this.shoppingListService.generateFromRecipe(user.id, recipeId, dto.servings ?? 1);
  }

  @Post('generate/from-meal-plan')
  generateFromMealPlan(@CurrentUser() user: RequestUser, @Body() dto: GenerateFromMealPlanDto) {
    return this.shoppingListService.generateFromMealPlan(user.id, dto);
  }

  @Get('current')
  current(@CurrentUser() user: RequestUser) {
    return this.shoppingListService.current(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.shoppingListService.findOne(user.id, id);
  }

  @Patch('items/:itemId')
  updateItem(@CurrentUser() user: RequestUser, @Param('itemId') itemId: string, @Body() dto: UpdateShoppingListItemDto) {
    return this.shoppingListService.updateItem(user.id, itemId, dto);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.shoppingListService.complete(user.id, id);
  }
}
