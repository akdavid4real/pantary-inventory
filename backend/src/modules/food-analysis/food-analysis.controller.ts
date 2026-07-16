import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { AnalyzeFoodPhotoDto } from './dto/food-analysis.dto';
import { FoodAnalysisService } from './food-analysis.service';

@ApiTags('Food Analysis')
@ApiBearerAuth()
@Controller('food-analysis')
export class FoodAnalysisController {
  constructor(private readonly foodAnalysisService: FoodAnalysisService) {}

  @Post('photo')
  analyzePhoto(@CurrentUser() user: RequestUser, @Body() dto: AnalyzeFoodPhotoDto) {
    return this.foodAnalysisService.analyze(user.id, dto);
  }
}
