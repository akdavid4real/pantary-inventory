import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RecipeCategory, RecipeModerationStatus, RecipeReportStatus, RecipeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/query.dto';

export class RecipeIngredientInputDto {
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

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecipeStepInputDto {
  @IsInt()
  @Min(1)
  stepNumber!: number;

  @IsString()
  instruction!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;
}

export class CreateRecipeDto {
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RecipeCategory })
  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  cookTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  caloriesPerServing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinPerServing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsPerServing?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fatPerServing?: number;

  @ApiPropertyOptional({ type: [RecipeIngredientInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInputDto)
  ingredients?: RecipeIngredientInputDto[];

  @ApiPropertyOptional({ type: [RecipeStepInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStepInputDto)
  steps?: RecipeStepInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ enum: RecipeStatus, default: RecipeStatus.DRAFT })
  @IsOptional()
  @IsEnum(RecipeStatus)
  status?: RecipeStatus;
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export class RecipeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RecipeCategory })
  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ingredient?: string;
}

export class ReportRecipeDto {
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;
}

export class ModerateRecipeDto {
  @IsEnum(RecipeModerationStatus)
  moderationStatus!: RecipeModerationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  moderationNote?: string;
}

export class ResolveRecipeReportDto {
  @IsEnum(RecipeReportStatus)
  status!: RecipeReportStatus;
}

export class UploadRecipeImageDto {
  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsString()
  base64!: string;
}
