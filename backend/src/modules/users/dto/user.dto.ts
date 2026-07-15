import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

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

  @ApiPropertyOptional({ minimum: 50, maximum: 260 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(260)
  heightCm?: number;

  @ApiPropertyOptional({ minimum: 20, maximum: 500 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weightKg?: number;
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

  @ApiPropertyOptional({ enum: ['Easy', 'Comfortable', 'Adventurous'] })
  @IsOptional()
  @IsIn(['Easy', 'Comfortable', 'Adventurous'])
  cookingComfort?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  defaultServings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mealPlanReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  groceryReminders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  expiryAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lowStockAlerts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklyInsights?: boolean;
}

export class UploadProfileImageDto {
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @IsString()
  contentType!: string;

  @IsString()
  base64!: string;
}

export class OnboardingPantryItemDto {
  @IsUUID()
  ingredientId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsString()
  unit!: string;
}

export class CompleteOnboardingDto extends UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsString()
  displayName!: string;

  @ApiPropertyOptional({ type: [OnboardingPantryItemDto] })
  @IsArray()
  @ArrayUnique((item: OnboardingPantryItemDto) => `${item.ingredientId}:${item.unit.trim().toLowerCase()}`)
  @ValidateNested({ each: true })
  @Type(() => OnboardingPantryItemDto)
  pantryItems!: OnboardingPantryItemDto[];
}
