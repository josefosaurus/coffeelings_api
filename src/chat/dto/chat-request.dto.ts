import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMessageDto } from './chat-message.dto';

class DayContextDto {
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  roast?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsIn(['gentle', 'stoic', 'poetic'])
  persona: 'gentle' | 'stoic' | 'poetic';

  @IsOptional()
  @ValidateNested()
  @Type(() => DayContextDto)
  context?: DayContextDto;
}
