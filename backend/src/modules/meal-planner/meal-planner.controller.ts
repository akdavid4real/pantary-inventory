import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import {
  AiMealPlanPreviewDto,
  ApplyAiMealPlanDto,
  CreateMealPlanEntryDto,
  UpdateMealPlanEntryDto,
  WeekQueryDto,
} from './dto/meal-planner.dto';
import { AiMealPlannerService } from './ai-meal-planner.service';
import { MealPlannerService } from './meal-planner.service';

@ApiTags('Meal Planner')
@ApiBearerAuth()
@Controller('meal-planner')
export class MealPlannerController {
  constructor(
    private readonly mealPlannerService: MealPlannerService,
    private readonly aiMealPlannerService: AiMealPlannerService,
  ) {}

  @Post('ai/preview')
  previewAiPlan(@CurrentUser() user: RequestUser, @Body() dto: AiMealPlanPreviewDto) {
    return this.aiMealPlannerService.preview(user.id, dto);
  }

  @Post('ai/apply')
  applyAiPlan(@CurrentUser() user: RequestUser, @Body() dto: ApplyAiMealPlanDto) {
    return this.aiMealPlannerService.apply(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMealPlanEntryDto) {
    return this.mealPlannerService.create(user.id, dto);
  }

  @Get('week')
  findWeek(@CurrentUser() user: RequestUser, @Query() query: WeekQueryDto) {
    return this.mealPlannerService.findWeek(user.id, query.date);
  }

  @Get('day/:date')
  findDay(@CurrentUser() user: RequestUser, @Param('date') date: string) {
    return this.mealPlannerService.findDay(user.id, date);
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateMealPlanEntryDto) {
    return this.mealPlannerService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.mealPlannerService.remove(user.id, id);
  }
}
