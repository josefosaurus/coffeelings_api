import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { RoastsService } from '../roasts/roasts.service';
import { ChatRequestDto, SupportedModel } from './dto/chat-request.dto';

const DEFAULT_MODEL: SupportedModel = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly anthropic: Anthropic;
  private readonly defaultModel: SupportedModel;

  constructor(
    private readonly configService: ConfigService,
    private readonly roastsService: RoastsService,
  ) {
    const apiKey = this.configService.get<string>('anthropic.apiKey');
    this.anthropic = new Anthropic({ apiKey });
    this.defaultModel =
      (this.configService.get<string>('anthropic.defaultModel') as SupportedModel) ||
      DEFAULT_MODEL;
  }

  async chat(
    userId: string,
    dto: ChatRequestDto,
  ): Promise<{ reply: string; model: string }> {
    const entry = await this.roastsService.getRoastById(userId, dto.entryId);
    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    const model = dto.model ?? this.defaultModel;
    const systemPrompt = this.buildSystemPrompt(entry);

    const messages: Anthropic.MessageParam[] = [
      ...dto.history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: dto.message },
    ];

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
      });

      const firstBlock = response.content[0];
      const reply = firstBlock.type === 'text' ? firstBlock.text : '';

      return { reply, model };
    } catch (error) {
      this.logger.error('Anthropic API error', error);
      throw new BadGatewayException('Failed to get response from AI service');
    }
  }

  private buildSystemPrompt(entry: {
    roast: string;
    message?: string;
    date: number;
  }): string {
    const date = new Date(entry.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const lines = [
      'You are a compassionate AI companion helping the user reflect on their mood journal entry.',
      '',
      'Entry context:',
      `- Date: ${date}`,
      `- Mood: ${entry.roast}`,
    ];

    if (entry.message) {
      lines.push(`- Journal note: "${entry.message}"`);
    }

    lines.push(
      '',
      'Be loving, kind, and compassionate. Help the user explore their feelings with warmth and care. Keep responses concise and conversational.',
      '',
      'At the end of each response, suggest a coffee blend, brewing method, or tea — and something small to enjoy alongside it (a snack, a moment, a ritual) — that fits the mood of the entry. Frame it as a gentle invitation to a relaxed, nurturing experience.',
    );

    return lines.join('\n');
  }
}
