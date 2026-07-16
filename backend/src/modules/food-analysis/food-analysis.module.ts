import { Module } from '@nestjs/common';
import { FoodAnalysisController } from './food-analysis.controller';
import { FoodAnalysisService } from './food-analysis.service';

@Module({
  controllers: [FoodAnalysisController],
  providers: [FoodAnalysisService],
})
export class FoodAnalysisModule {}
