import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MealType, RecipeSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateMealPlanEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipeId?: string;

  @ApiPropertyOptional({ enum: RecipeSource, default: RecipeSource.LOCAL })
  @IsOptional()
  @IsEnum(RecipeSource)
  recipeSource?: RecipeSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalRecipeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalImageUrl?: string;

  @IsDateString()
  plannedDate!: string;

  @IsEnum(MealType)
  mealType!: MealType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMealPlanEntryDto extends PartialType(CreateMealPlanEntryDto) {}

export class WeekQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class AiMealPlanPreviewDto {
  @ApiPropertyOptional({ description: 'Any date in the week to plan.' })
  @IsOptional()
  @IsDateString()
  weekDate?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 14, default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  mealCount?: number;
}

export class AiMealPlanEntryDto {
  @IsUUID()
  recipeId!: string;

  @IsDateString()
  plannedDate!: string;

  @IsEnum(MealType)
  mealType!: MealType;

  @IsInt()
  @Min(1)
  @Max(20)
  servings!: number;

  @IsString()
  @MaxLength(240)
  reason!: string;
}

export class ApplyAiMealPlanDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(14)
  @ValidateNested({ each: true })
  @Type(() => AiMealPlanEntryDto)
  entries!: AiMealPlanEntryDto[];
}
