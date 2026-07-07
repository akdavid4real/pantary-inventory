import { Module } from '@nestjs/common';
import { RecipeMatcherController } from './recipe-matcher.controller';
import { RecipeMatcherService } from './recipe-matcher.service';

@Module({
  controllers: [RecipeMatcherController],
  providers: [RecipeMatcherService],
  exports: [RecipeMatcherService],
})
export class RecipeMatcherModule {}
