import { Module } from '@nestjs/common';
import { RecipeMatcherModule } from '../recipe-matcher/recipe-matcher.module';
import { AiMealPlannerService } from './ai-meal-planner.service';
import { MealPlannerController } from './meal-planner.controller';
import { MealPlannerService } from './meal-planner.service';

@Module({
  imports: [RecipeMatcherModule],
  controllers: [MealPlannerController],
  providers: [MealPlannerService, AiMealPlannerService],
  exports: [MealPlannerService],
})
export class MealPlannerModule {}
