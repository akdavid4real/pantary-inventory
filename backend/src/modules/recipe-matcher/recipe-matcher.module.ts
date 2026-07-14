import { Module } from '@nestjs/common';
import { RecipeMatcherController } from './recipe-matcher.controller';
import { RecipeMatcherService } from './recipe-matcher.service';
import { MeasurementProfilesModule } from '../measurement-profiles/measurement-profiles.module';

@Module({
  imports: [MeasurementProfilesModule],
  controllers: [RecipeMatcherController],
  providers: [RecipeMatcherService],
  exports: [RecipeMatcherService],
})
export class RecipeMatcherModule {}
