import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { CompleteOnboardingDto, UpdatePreferencesDto, UpdateProfileDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me/profile')
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/preferences')
  updatePreferences(@CurrentUser() user: RequestUser, @Body() dto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(user.id, dto);
  }

  @Post('me/onboarding')
  completeOnboarding(@CurrentUser() user: RequestUser, @Body() dto: CompleteOnboardingDto) {
    return this.usersService.completeOnboarding(user.id, dto);
  }
}
