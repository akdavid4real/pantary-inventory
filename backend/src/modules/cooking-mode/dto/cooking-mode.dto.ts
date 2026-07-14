import { ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class StartCookingSessionDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;
}

export class CompleteCookingSessionDto {
  @ApiPropertyOptional({ enum: MealType })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientUsageDto)
  actualUsage?: IngredientUsageDto[];
}

export class IngredientUsageDto {
  @IsString()
  ingredientId!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  unit!: string;
}
