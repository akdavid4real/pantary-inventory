import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { AdjustPantryItemDto, CreatePantryItemDto, UpdatePantryItemDto } from './dto/pantry.dto';
import { PantryService } from './pantry.service';

@ApiTags('Pantry')
@ApiBearerAuth()
@Controller('pantry')
export class PantryController {
  constructor(private readonly pantryService: PantryService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePantryItemDto) {
    return this.pantryService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.pantryService.findAll(user.id);
  }

  @Get('expiring-soon')
  expiringSoon(@CurrentUser() user: RequestUser, @Query('days') days?: number) {
    return this.pantryService.expiringSoon(user.id, days ? Number(days) : 7);
  }

  @Get('low-stock')
  lowStock(@CurrentUser() user: RequestUser) {
    return this.pantryService.lowStock(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.pantryService.findOne(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdatePantryItemDto) {
    return this.pantryService.update(user.id, id, dto);
  }

  @Post(':id/adjust')
  adjust(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AdjustPantryItemDto) {
    return this.pantryService.adjust(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.pantryService.remove(user.id, id);
  }
}
