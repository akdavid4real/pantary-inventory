import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { CreateMeasurementProfileDto, UpdateMeasurementProfileDto } from './dto/measurement-profile.dto';
import { MeasurementProfilesService } from './measurement-profiles.service';

@ApiTags('Measurement profiles')
@ApiBearerAuth()
@Controller('measurement-profiles')
export class MeasurementProfilesController {
  constructor(private readonly service: MeasurementProfilesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) { return this.service.list(user.id); }

  @Get('active')
  active(@CurrentUser() user: RequestUser) { return this.service.active(user.id); }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMeasurementProfileDto) { return this.service.create(user.id, dto); }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateMeasurementProfileDto) { return this.service.update(user.id, id, dto); }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) { return this.service.remove(user.id, id); }
}
