import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ListEventsDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  calendarId?: string;
}
