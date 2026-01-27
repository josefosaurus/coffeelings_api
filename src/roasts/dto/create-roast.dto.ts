import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RoastType } from '../entities/roast.entity';

export class CreateRoastDto {
  @IsEnum(RoastType, {
    message: `roast must be one of: ${Object.values(RoastType).join(', ')}`,
  })
  roast: RoastType;

  @IsOptional()
  @IsString()
  message?: string;

  @IsNumber()
  date: number;
}
