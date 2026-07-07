import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dietaryPreference?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  allergyList?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  avoidedIngredients?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  calorieGoal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinGoal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsGoal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fatGoal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(240)
  maxCookingMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  preferNigerianMeals?: boolean;
}
