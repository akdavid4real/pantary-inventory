import { Module } from '@nestjs/common';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { MeasurementProfilesModule } from '../measurement-profiles/measurement-profiles.module';

@Module({
  imports: [IngredientsModule, MeasurementProfilesModule],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
