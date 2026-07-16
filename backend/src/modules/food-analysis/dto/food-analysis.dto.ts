import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AnalyzeFoodPhotoDto {
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: 'image/jpeg' | 'image/png' | 'image/webp';

  @IsString()
  @MaxLength(3_600_000)
  base64!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  question?: string;
}
