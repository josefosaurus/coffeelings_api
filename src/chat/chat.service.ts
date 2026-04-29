import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ChatRequestDto } from './dto/chat-request.dto';

type Persona = 'gentle' | 'stoic' | 'poetic';

interface DayContext {
  date: string;
  roast?: string;
  message?: string;
}

@Injectable()
export class ChatService {
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async *stream(dto: ChatRequestDto): AsyncGenerator<string> {
    const stream = await this.anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: this.buildSystemPrompt(dto.persona, dto.context),
      messages: dto.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  private buildSystemPrompt(persona: Persona, context?: DayContext): string {
    const instructions: Record<Persona, string> = {
      gentle:
        'Speak with warmth and care. Validate feelings before asking. Soft, thoughtful language.',
      stoic:
        'Be direct and grounded. Few words, honest observations. No filler or softening.',
      poetic:
        'Use gentle imagery — seasons, coffee, light, paper. Lyrical but grounded.',
    };

    const contextBlock = context
      ? `\n\nThe user is looking at their journal entry from ${context.date}.` +
        (context.roast ? ` Their mood (roast) was: ${context.roast}.` : '') +
        (context.message ? ` They wrote: "${context.message}"` : '')
      : '';

    return `You are "the barista" — a warm, wise presence in a coffee shop journaling app called Coffeelings. Users track their daily emotional state as a "roast": excited, ok, tired, sad, or angry. You listen deeply and respond with care.

${instructions[persona]}${contextBlock}

Rules:
- Keep responses short: 1–3 sentences maximum, then one grounding question.
- Never diagnose, prescribe, or give medical advice.
- Never break character. You are the barista, not an AI assistant.
- End questions with "_?" to match the app's typographic style.`;
  }
}
