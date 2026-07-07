import { Module } from '@nestjs/common';
import { MealPlannerController } from './meal-planner.controller';
import { MealPlannerService } from './meal-planner.service';

@Module({
  controllers: [MealPlannerController],
  providers: [MealPlannerService],
  exports: [MealPlannerService],
})
export class MealPlannerModule {}
