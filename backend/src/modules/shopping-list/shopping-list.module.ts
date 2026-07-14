import { Module } from '@nestjs/common';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';
import { MeasurementProfilesModule } from '../measurement-profiles/measurement-profiles.module';

@Module({
  imports: [MeasurementProfilesModule],
  controllers: [ShoppingListController],
  providers: [ShoppingListService],
})
export class ShoppingListModule {}
