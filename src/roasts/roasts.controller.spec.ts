import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { RoastsController } from './roasts.controller';
import { RoastsService } from './roasts.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RoastType } from './entities/roast.entity';
import { CreateRoastDto } from './dto/create-roast.dto';
import { UpdateRoastDto } from './dto/update-roast.dto';

describe('RoastsController', () => {
  let controller: RoastsController;
  let service: RoastsService;

  const mockRoastsService = {
    getCalendar: jest.fn(),
    createRoast: jest.fn(),
    updateRoast: jest.fn(),
    deleteRoast: jest.fn(),
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
      controllers: [RoastsController],
      providers: [
        {
          provide: RoastsService,
          useValue: mockRoastsService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<RoastsController>(RoastsController);
    service = module.get<RoastsService>(RoastsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCalendar', () => {
    it('should return calendar for specified month', async () => {
      const mockResponse = {
        '2025': {
          '01': [
            {
              id: 'roast123',
              roast: RoastType.EXCITED,
              message: 'Great day!',
              date: 1704067200000,
            },
          ],
        },
      };

      mockRoastsService.getCalendar.mockResolvedValue(mockResponse);

      const result = await controller.getCalendar('user123', {
        year: '2025',
        month: '01',
      });

      expect(result).toEqual(mockResponse);
      expect(service.getCalendar).toHaveBeenCalledWith('user123', '2025', '01');
    });
  });

  describe('createRoast', () => {
    it('should create a new roast', async () => {
      const createDto: CreateRoastDto = {
        roast: RoastType.EXCITED,
        message: 'Great coffee!',
        date: 1704067200000,
      };

      const mockResponse = {
        id: 'roast123',
        roast: RoastType.EXCITED,
        message: 'Great coffee!',
        date: 1704067200000,
      };

      mockRoastsService.createRoast.mockResolvedValue(mockResponse);

      const result = await controller.createRoast('user123', createDto);

      expect(result).toEqual(mockResponse);
      expect(service.createRoast).toHaveBeenCalledWith('user123', createDto);
    });
  });

  describe('updateRoast', () => {
    it('should update an existing roast', async () => {
      const updateDto: UpdateRoastDto = {
        roast: RoastType.OK,
        message: 'Updated message',
      };

      const mockResponse = {
        id: 'roast123',
        roast: RoastType.OK,
        message: 'Updated message',
        date: 1704067200000,
      };

      mockRoastsService.updateRoast.mockResolvedValue(mockResponse);

      const result = await controller.updateRoast('user123', 'roast123', updateDto);

      expect(result).toEqual(mockResponse);
      expect(service.updateRoast).toHaveBeenCalledWith(
        'user123',
        'roast123',
        updateDto,
      );
    });
  });

  describe('deleteRoast', () => {
    it('should delete a roast', async () => {
      mockRoastsService.deleteRoast.mockResolvedValue(undefined);

      await controller.deleteRoast('user123', 'roast123');

      expect(service.deleteRoast).toHaveBeenCalledWith('user123', 'roast123');
    });
  });
});
