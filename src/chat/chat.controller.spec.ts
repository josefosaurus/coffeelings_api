import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockChatService = {
    chat: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.userId = 'user123';
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should return the reply from the service', async () => {
      const dto = {
        entryId: 'entry-123',
        message: 'I feel drained',
        history: [],
      };

      const mockResponse = { reply: 'I hear you.', model: 'claude-sonnet-4-6' };
      mockChatService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat('user123', dto);

      expect(result).toEqual(mockResponse);
      expect(service.chat).toHaveBeenCalledWith('user123', dto);
    });

    it('should forward model override to service', async () => {
      const dto = {
        entryId: 'entry-123',
        message: 'Hello',
        history: [],
        model: 'claude-haiku-4-5-20251001' as const,
      };

      mockChatService.chat.mockResolvedValue({
        reply: 'Fast reply.',
        model: 'claude-haiku-4-5-20251001',
      });

      await controller.chat('user123', dto);

      expect(service.chat).toHaveBeenCalledWith('user123', dto);
    });

    it('should forward conversation history to service', async () => {
      const dto = {
        entryId: 'entry-123',
        message: 'Follow-up',
        history: [
          { role: 'user' as const, content: 'First message' },
          { role: 'assistant' as const, content: 'First reply' },
        ],
      };

      mockChatService.chat.mockResolvedValue({
        reply: 'Continued.',
        model: 'claude-sonnet-4-6',
      });

      await controller.chat('user123', dto);

      expect(service.chat).toHaveBeenCalledWith('user123', dto);
    });
  });
});
