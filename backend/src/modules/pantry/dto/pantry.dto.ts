import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PantryAdjustmentType, StorageLocation } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePantryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  unit!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;

  @ApiPropertyOptional({ enum: StorageLocation })
  @IsOptional()
  @IsEnum(StorageLocation)
  storageLocation?: StorageLocation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdatePantryItemDto extends PartialType(CreatePantryItemDto) {}

export class AdjustPantryItemDto {
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  unit!: string;

  @IsEnum(PantryAdjustmentType)
  type!: PantryAdjustmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCostNaira?: number;
}
