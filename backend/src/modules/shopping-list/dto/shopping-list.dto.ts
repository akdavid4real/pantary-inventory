import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShoppingItemStatus, StorageLocation } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class GenerateFromRecipeDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;
}

export class GenerateFromMealPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateShoppingListItemDto {
  @ApiPropertyOptional({ enum: ShoppingItemStatus })
  @IsOptional()
  @IsEnum(ShoppingItemStatus)
  status?: ShoppingItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateManualShoppingListItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsString()
  name!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsString()
  unit!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PurchasedItemDto {
  @IsString()
  itemId!: string;

  @IsEnum(StorageLocation)
  @IsIn([StorageLocation.PANTRY, StorageLocation.FRIDGE, StorageLocation.FREEZER, StorageLocation.COUNTER])
  storageLocation!: StorageLocation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  purchasedQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasedUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCostNaira?: number;
}

export class CompleteShoppingListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchasedItemDto)
  purchasedItems!: PurchasedItemDto[];
}
