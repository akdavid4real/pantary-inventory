import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { OpenRoute } from '../../common/decorators/open-route.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RefreshSessionDto, SignUpDto } from './dto/auth.dto';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @OpenRoute()
  @Post('signup')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @OpenRoute()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @OpenRoute()
  @Post('refresh')
  refresh(@Body() dto: RefreshSessionDto) {
    return this.authService.refresh(dto);
  }

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return user;
  }
}
