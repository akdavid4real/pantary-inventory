import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRecipeDto, ModerateRecipeDto, RecipeQueryDto, ReportRecipeDto, ResolveRecipeReportDto, UpdateRecipeDto, UploadRecipeImageDto } from './dto/recipe.dto';
import { RecipesService } from './recipes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Recipes')
@ApiBearerAuth()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, dto);
  }

  @Get()
  findAll(@Query() query: RecipeQueryDto) {
    return this.recipesService.findAll(query);
  }

  @Get('mine')
  findMine(@CurrentUser() user: RequestUser) {
    return this.recipesService.findMine(user.id);
  }

  @Post('images')
  uploadImage(@CurrentUser() user: RequestUser, @Body() dto: UploadRecipeImageDto, @Headers('authorization') authorization?: string) {
    return this.recipesService.uploadImage(user.id, dto, authorization);
  }

  @Get('moderation/queue')
  @Roles(UserRole.ADMIN)
  moderationQueue() {
    return this.recipesService.moderationQueue();
  }

  @Patch('reports/:reportId')
  @Roles(UserRole.ADMIN)
  resolveReport(@Param('reportId') reportId: string, @Body() dto: ResolveRecipeReportDto) {
    return this.recipesService.resolveReport(reportId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Post(':id/reports')
  report(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ReportRecipeDto) {
    return this.recipesService.report(user.id, id, dto);
  }

  @Patch(':id/moderation')
  @Roles(UserRole.ADMIN)
  moderate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ModerateRecipeDto) {
    return this.recipesService.moderate(user.id, id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.recipesService.remove(user, id);
  }
}
