import { Module } from '@nestjs/common';
import { RecipeMatcherModule } from '../recipe-matcher/recipe-matcher.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [RecipeMatcherModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
