import { IsDateString } from 'class-validator';

export class AnalyticsRangeDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
