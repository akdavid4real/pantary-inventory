import { Module } from '@nestjs/common';
import { RecipeMatcherModule } from '../recipe-matcher/recipe-matcher.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [RecipeMatcherModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
