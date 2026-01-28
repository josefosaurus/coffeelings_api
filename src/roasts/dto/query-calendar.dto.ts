import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCalendarDto {
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'year must be a 4-digit string (e.g., "2025")',
  })
  year: string;

  @Transform(({ value }) => {
    // Ensure value stays as string and is zero-padded
    const str = String(value).trim();
    // If it's a single digit, pad it
    return str.length === 1 ? `0${str}` : str;
  })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'month must be a zero-padded 2-digit string from "01" to "12"',
  })
  month: string;
}
