import { IsString, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  summary!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDateTime!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  calendarId?: string;
}
