import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { RoastsService } from '../roasts/roasts.service';
import { RoastType } from '../roasts/entities/roast.entity';

const mockMessagesCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () =>
  jest.fn().mockImplementation(() => ({
    messages: { create: mockMessagesCreate },
  })),
);

describe('ChatService', () => {
  let service: ChatService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'anthropic.apiKey': 'test-api-key',
        'anthropic.defaultModel': 'claude-sonnet-4-6',
      };
      return config[key];
    }),
  };

  const mockRoastsService = {
    getRoastById: jest.fn(),
  };

  const mockEntry = {
    id: 'entry-123',
    roast: RoastType.TIRED,
    message: 'Rough day at work',
    date: 1745280000000,
    userId: 'user123',
    year: '2025',
    month: '04',
    createdAt: 1745280000000,
    updatedAt: 1745280000000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RoastsService, useValue: mockRoastsService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should return reply and model using default model', async () => {
      mockRoastsService.getRoastById.mockResolvedValue(mockEntry);
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'I hear you, that sounds tough.' }],
      });

      const result = await service.chat('user123', {
        entryId: 'entry-123',
        message: 'I feel drained',
        history: [],
      });

      expect(result).toEqual({
        reply: 'I hear you, that sounds tough.',
        model: 'claude-sonnet-4-6',
      });
    });

    it('should use model specified in the request', async () => {
      mockRoastsService.getRoastById.mockResolvedValue(mockEntry);
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Fast reply.' }],
      });

      const result = await service.chat('user123', {
        entryId: 'entry-123',
        message: 'Hello',
        history: [],
        model: 'claude-haiku-4-5-20251001',
      });

      expect(result.model).toBe('claude-haiku-4-5-20251001');
      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-haiku-4-5-20251001' }),
      );
    });

    it('should append new message after history when calling Anthropic', async () => {
      mockRoastsService.getRoastById.mockResolvedValue(mockEntry);
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Follow-up reply.' }],
      });

      await service.chat('user123', {
        entryId: 'entry-123',
        message: 'Second message',
        history: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First reply' },
        ],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First reply' },
            { role: 'user', content: 'Second message' },
          ],
        }),
      );
    });

    it('should include mood and journal note in system prompt', async () => {
      mockRoastsService.getRoastById.mockResolvedValue(mockEntry);
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Reply.' }],
      });

      await service.chat('user123', {
        entryId: 'entry-123',
        message: 'Hello',
        history: [],
      });

      const { system } = mockMessagesCreate.mock.calls[0][0];
      expect(system).toContain('tired');
      expect(system).toContain('Rough day at work');
    });

    it('should omit journal note line from system prompt when entry has no message', async () => {
      mockRoastsService.getRoastById.mockResolvedValue({
        ...mockEntry,
        message: undefined,
      });
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Reply.' }],
      });

      await service.chat('user123', {
        entryId: 'entry-123',
        message: 'Hello',
        history: [],
      });

      const { system } = mockMessagesCreate.mock.calls[0][0];
      expect(system).not.toContain('Journal note');
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      mockRoastsService.getRoastById.mockResolvedValue(null);

      await expect(
        service.chat('user123', {
          entryId: 'nonexistent',
          message: 'Hello',
          history: [],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });

    it('should throw BadGatewayException when Anthropic API fails', async () => {
      mockRoastsService.getRoastById.mockResolvedValue(mockEntry);
      mockMessagesCreate.mockRejectedValue(new Error('Network error'));

      await expect(
        service.chat('user123', {
          entryId: 'entry-123',
          message: 'Hello',
          history: [],
        }),
      ).rejects.toThrow(BadGatewayException);
    });
  });
});
