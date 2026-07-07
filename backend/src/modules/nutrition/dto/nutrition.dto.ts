import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class NutritionWeekQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}
