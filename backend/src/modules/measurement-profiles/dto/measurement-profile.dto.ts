import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class MeasurementOverrideDto {
  @IsUUID()
  ingredientId!: string;

  @IsString()
  fromUnit!: string;

  @ApiPropertyOptional({ default: 'g' })
  @IsOptional()
  @IsString()
  toUnit?: string;

  @IsNumber()
  @Min(0.000001)
  multiplier!: number;
}

export class CreateMeasurementProfileDto {
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsNumber()
  @Min(1)
  cupMl!: number;

  @IsNumber()
  @Min(1)
  tablespoonMl!: number;

  @IsNumber()
  @Min(1)
  teaspoonMl!: number;

  @IsNumber()
  @Min(1)
  dericaMl!: number;

  @ApiPropertyOptional({ type: [MeasurementOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasurementOverrideDto)
  overrides?: MeasurementOverrideDto[];
}

export class UpdateMeasurementProfileDto extends PartialType(CreateMeasurementProfileDto) {}
