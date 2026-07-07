import { ApiPropertyOptional } from '@nestjs/swagger';
import { IngredientCategory, StorageLocation } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class IngredientNutritionDto {
  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseQuantity?: number;

  @ApiPropertyOptional({ default: 'g' })
  @IsOptional()
  @IsString()
  baseUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class CreateIngredientDto {
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IngredientCategory })
  @IsOptional()
  @IsEnum(IngredientCategory)
  category?: IngredientCategory;

  @ApiPropertyOptional({ default: 'g' })
  @IsOptional()
  @IsString()
  defaultUnit?: string;

  @ApiPropertyOptional({ enum: StorageLocation })
  @IsOptional()
  @IsEnum(StorageLocation)
  storageLocation?: StorageLocation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  shelfLifeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageCostNaira?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  aliases?: string[];

  @ApiPropertyOptional({ type: IngredientNutritionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => IngredientNutritionDto)
  nutrition?: IngredientNutritionDto;
}

export class UpdateIngredientDto extends CreateIngredientDto {}
