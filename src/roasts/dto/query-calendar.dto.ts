import { IsString, Matches } from 'class-validator';

export class QueryCalendarDto {
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'year must be a 4-digit string (e.g., "2025")',
  })
  year: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'month must be a zero-padded 2-digit string from "01" to "12"',
  })
  month: string;
}
