import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { CompleteCookingSessionDto, StartCookingSessionDto } from './dto/cooking-mode.dto';
import { CookingModeService } from './cooking-mode.service';

@ApiTags('Cooking Mode')
@ApiBearerAuth()
@Controller('cooking')
export class CookingModeController {
  constructor(private readonly cookingModeService: CookingModeService) {}

  @Post('start/:recipeId')
  start(@CurrentUser() user: RequestUser, @Param('recipeId') recipeId: string, @Body() dto: StartCookingSessionDto) {
    return this.cookingModeService.start(user.id, recipeId, dto);
  }

  @Get('session/:sessionId')
  getSession(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.cookingModeService.getSession(user.id, sessionId);
  }

  @Patch('session/:sessionId/next')
  next(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.cookingModeService.next(user.id, sessionId);
  }

  @Patch('session/:sessionId/previous')
  previous(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.cookingModeService.previous(user.id, sessionId);
  }

  @Post('session/:sessionId/complete')
  complete(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string, @Body() dto: CompleteCookingSessionDto) {
    return this.cookingModeService.complete(user.id, sessionId, dto);
  }

  @Post('session/:sessionId/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('sessionId') sessionId: string) {
    return this.cookingModeService.cancel(user.id, sessionId);
  }
}
