import { Module } from '@nestjs/common';
import { CookingModeController } from './cooking-mode.controller';
import { CookingModeService } from './cooking-mode.service';
import { MeasurementProfilesModule } from '../measurement-profiles/measurement-profiles.module';

@Module({
  imports: [MeasurementProfilesModule],
  controllers: [CookingModeController],
  providers: [CookingModeService],
})
export class CookingModeModule {}
