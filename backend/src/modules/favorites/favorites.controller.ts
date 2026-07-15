import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.favoritesService.findAll(user.id);
  }

  @Post(':recipeId')
  add(@CurrentUser() user: RequestUser, @Param('recipeId') recipeId: string) {
    return this.favoritesService.add(user.id, recipeId);
  }

  @Delete(':recipeId')
  remove(@CurrentUser() user: RequestUser, @Param('recipeId') recipeId: string) {
    return this.favoritesService.remove(user.id, recipeId);
  }
}
