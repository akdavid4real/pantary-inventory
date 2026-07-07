import { Module } from '@nestjs/common';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';

@Module({
  imports: [IngredientsModule],
  controllers: [PantryController],
  providers: [PantryService],
  exports: [PantryService],
})
export class PantryModule {}
