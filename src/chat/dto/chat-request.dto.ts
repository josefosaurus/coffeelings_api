import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;
}

export const SUPPORTED_MODELS = [
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
] as const;

export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

export class ChatRequestDto {
  @IsUUID()
  entryId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  history: MessageDto[];

  @IsOptional()
  @IsEnum(SUPPORTED_MODELS)
  model?: SupportedModel;
}
