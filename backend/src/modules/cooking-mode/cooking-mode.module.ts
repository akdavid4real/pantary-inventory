import { Module } from '@nestjs/common';
import { CookingModeController } from './cooking-mode.controller';
import { CookingModeService } from './cooking-mode.service';

@Module({
  controllers: [CookingModeController],
  providers: [CookingModeService],
})
export class CookingModeModule {}
