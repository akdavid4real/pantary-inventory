import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class MatchIngredientInputDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class SimulateRecipeMatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchIngredientInputDto)
  ingredients!: MatchIngredientInputDto[];
}
