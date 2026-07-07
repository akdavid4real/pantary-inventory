import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;
}

export class PaginationQueryDto extends SearchQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export function getPagination(query: PaginationQueryDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}
