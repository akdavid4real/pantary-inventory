import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MealType, RecipeSource } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
