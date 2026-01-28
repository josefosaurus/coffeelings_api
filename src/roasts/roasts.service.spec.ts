import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoastsService } from './roasts.service';
import { FirebaseService } from '../firebase/firebase.service';
import { MockStorageService } from '../firebase/mock-storage.service';
import { RoastType } from './entities/roast.entity';

describe('RoastsService', () => {
  let service: RoastsService;
  let firebaseService: FirebaseService;

  const mockFirestoreDoc = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFirestoreCollection = {
    doc: jest.fn(() => mockFirestoreDoc),
    where: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
      get: jest.fn(),
    })),
  };

  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => mockFirestoreCollection),
      })),
    })),
  };

  const mockFirebaseService = {
    getFirestore: jest.fn(() => mockFirestore),
  };

  const mockStorageService = {
    getRoasts: jest.fn(),
    getRoast: jest.fn(),
    createRoast: jest.fn(),
    updateRoast: jest.fn(),
    deleteRoast: jest.fn(),
  };

  beforeEach(async () => {
    // Disable dev mode for tests
    process.env.ENABLE_DEV_AUTH = 'false';
    process.env.NODE_ENV = 'test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoastsService,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: MockStorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<RoastsService>(RoastsService);
    firebaseService = module.get<FirebaseService>(FirebaseService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment variables
    delete process.env.ENABLE_DEV_AUTH;
    delete process.env.NODE_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCalendar', () => {
    it('should return empty calendar for month with no roasts', async () => {
      const mockSnapshot = {
        docs: [],
      };

      mockFirestoreCollection.where = jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockSnapshot),
        })),
      }));

      const result = await service.getCalendar('user123', '2025', '01');

      expect(result).toEqual({
        '2025': {
          '01': [],
        },
      });
    });

    it('should return calendar with roasts', async () => {
      const mockRoast = {
        id: 'roast123',
        roast: RoastType.EXCITED,
        message: 'Great day!',
        date: 1704067200000,
      };

      const mockSnapshot = {
        docs: [
          {
            data: () => mockRoast,
          },
        ],
      };

      mockFirestoreCollection.where = jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockSnapshot),
        })),
      }));

      const result = await service.getCalendar('user123', '2025', '01');

      expect(result).toEqual({
        '2025': {
          '01': [mockRoast],
        },
      });
    });
  });

  describe('createRoast', () => {
    it('should create a new roast', async () => {
      const createDto = {
        roast: RoastType.EXCITED,
        message: 'Great coffee!',
        date: 1704067200000,
      };

      mockFirestoreDoc.set.mockResolvedValue(undefined);

      const result = await service.createRoast('user123', createDto);

      expect(result).toMatchObject({
        roast: RoastType.EXCITED,
        message: 'Great coffee!',
        date: 1704067200000,
      });
      expect(result.id).toBeDefined();
      expect(mockFirestoreDoc.set).toHaveBeenCalled();
    });

    it('should create roast without message', async () => {
      const createDto = {
        roast: RoastType.OK,
        date: 1704067200000,
      };

      mockFirestoreDoc.set.mockResolvedValue(undefined);

      const result = await service.createRoast('user123', createDto);

      expect(result.roast).toBe(RoastType.OK);
      expect(result.message).toBeUndefined();
    });
  });

  describe('updateRoast', () => {
    it('should update an existing roast', async () => {
      const existingRoast = {
        id: 'roast123',
        roast: RoastType.EXCITED,
        message: 'Original message',
        date: 1704067200000,
        userId: 'user123',
        year: '2025',
        month: '01',
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
      };

      const updatedRoast = {
        ...existingRoast,
        roast: RoastType.OK,
        message: 'Updated message',
        updatedAt: Date.now(),
      };

      mockFirestoreDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => existingRoast,
      });

      mockFirestoreDoc.update.mockResolvedValue(undefined);

      mockFirestoreDoc.get.mockResolvedValueOnce({
        exists: true,
        data: () => updatedRoast,
      });

      const updateDto = {
        roast: RoastType.OK,
        message: 'Updated message',
      };

      const result = await service.updateRoast('user123', 'roast123', updateDto);

      expect(result.roast).toBe(RoastType.OK);
      expect(result.message).toBe('Updated message');
      expect(mockFirestoreDoc.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if roast does not exist', async () => {
      mockFirestoreDoc.get.mockResolvedValue({
        exists: false,
      });

      const updateDto = {
        roast: RoastType.OK,
      };

      await expect(
        service.updateRoast('user123', 'nonexistent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own roast', async () => {
      const existingRoast = {
        id: 'roast123',
        userId: 'otherUser',
        roast: RoastType.EXCITED,
        date: 1704067200000,
      };

      mockFirestoreDoc.get.mockResolvedValue({
        exists: true,
        data: () => existingRoast,
      });

      const updateDto = {
        roast: RoastType.OK,
      };

      await expect(
        service.updateRoast('user123', 'roast123', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteRoast', () => {
    it('should delete an existing roast', async () => {
      const existingRoast = {
        id: 'roast123',
        userId: 'user123',
        roast: RoastType.EXCITED,
        date: 1704067200000,
      };

      mockFirestoreDoc.get.mockResolvedValue({
        exists: true,
        data: () => existingRoast,
      });

      mockFirestoreDoc.delete.mockResolvedValue(undefined);

      await service.deleteRoast('user123', 'roast123');

      expect(mockFirestoreDoc.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if roast does not exist', async () => {
      mockFirestoreDoc.get.mockResolvedValue({
        exists: false,
      });

      await expect(
        service.deleteRoast('user123', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own roast', async () => {
      const existingRoast = {
        id: 'roast123',
        userId: 'otherUser',
        roast: RoastType.EXCITED,
        date: 1704067200000,
      };

      mockFirestoreDoc.get.mockResolvedValue({
        exists: true,
        data: () => existingRoast,
      });

      await expect(
        service.deleteRoast('user123', 'roast123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
