import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PantryService } from './pantry.service';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';

const USER_ID = 'user-uuid';
const ING_ID = 'ing-uuid';

const makeItem = (overrides: Partial<PantryItem> = {}): PantryItem =>
  ({
    id: 'pantry-uuid',
    userId: USER_ID,
    ingredientId: ING_ID,
    quantity: 500,
    unit: 'g',
    ...overrides,
  }) as PantryItem;

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((dto: Partial<PantryItem>) => ({ ...dto }) as PantryItem),
  save: jest.fn((item: PantryItem) => Promise.resolve(item)),
  remove: jest.fn(),
};

describe('PantryService', () => {
  let service: PantryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PantryService,
        UnitNormalizationService,
        { provide: getRepositoryToken(PantryItem), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(PantryService);
  });

  describe('listPantry', () => {
    it('returns pantry items for user', async () => {
      mockRepo.find.mockResolvedValue([makeItem()]);
      const items = await service.listPantry(USER_ID);
      expect(items).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
    });
  });

  describe('upsertItem', () => {
    it('creates a new pantry item in set mode', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const saved = makeItem({ quantity: 200, unit: 'g' });
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.upsertItem(USER_ID, ING_ID, {
        quantity: 200,
        unit: 'g',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          ingredientId: ING_ID,
          quantity: 200,
          unit: 'g',
        }),
      );
      expect(result.quantity).toBe(200);
    });

    it('adds quantity when item exists and mode is add', async () => {
      mockRepo.findOne.mockResolvedValue(
        makeItem({ quantity: 100, unit: 'g' }),
      );
      mockRepo.save.mockImplementation((item: PantryItem) =>
        Promise.resolve(item),
      );

      const result = await service.upsertItem(USER_ID, ING_ID, {
        quantity: 50,
        unit: 'g',
        mode: 'add',
      });

      expect(result.quantity).toBe(150);
    });

    it('throws BadRequestException when add mode uses incompatible units', async () => {
      mockRepo.findOne.mockResolvedValue(
        makeItem({ quantity: 100, unit: 'g' }),
      );

      await expect(
        service.upsertItem(USER_ID, ING_ID, {
          quantity: 1,
          unit: 'ml',
          mode: 'add',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('removes existing item', async () => {
      const item = makeItem();
      mockRepo.findOne.mockResolvedValue(item);
      await service.removeItem(USER_ID, ING_ID);
      expect(mockRepo.remove).toHaveBeenCalledWith(item);
    });

    it('throws NotFoundException when item missing', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.removeItem(USER_ID, ING_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('computeIngredientPantryMatches', () => {
    const lines = [{ ingredientId: ING_ID, quantity: 200, unit: 'g' }];

    it('marks missing ingredients', () => {
      const matches = service.computeIngredientPantryMatches(lines, new Map());
      expect(matches[0].status).toBe('missing');
    });

    it('marks sufficient ingredients', () => {
      const pantry = new Map([[ING_ID, { quantity: 500, unit: 'g' }]]);
      const matches = service.computeIngredientPantryMatches(lines, pantry);
      expect(matches[0].status).toBe('sufficient');
    });

    it('marks deficit when pantry quantity is too low', () => {
      const pantry = new Map([[ING_ID, { quantity: 50, unit: 'g' }]]);
      const matches = service.computeIngredientPantryMatches(lines, pantry);
      expect(matches[0].status).toBe('deficit');
      expect(matches[0].deficitQuantity).toBeGreaterThan(0);
    });
  });

  describe('countMissingIngredients', () => {
    it('counts non-sufficient matches', () => {
      const lines = [
        { ingredientId: 'a', quantity: 1, unit: 'g' },
        { ingredientId: 'b', quantity: 1, unit: 'g' },
      ];
      const pantry = new Map([['a', { quantity: 10, unit: 'g' }]]);
      expect(service.countMissingIngredients(lines, pantry)).toBe(1);
    });
  });

  describe('consumeIngredients', () => {
    it('throws when recipe has no ingredients', async () => {
      await expect(
        service.consumeIngredients(USER_ID, []),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when pantry lacks sufficient quantity', async () => {
      mockRepo.find.mockResolvedValue([makeItem({ quantity: 10, unit: 'g' })]);
      await expect(
        service.consumeIngredients(USER_ID, [
          { ingredientId: ING_ID, quantity: 200, unit: 'g' },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deducts ingredients and removes depleted items', async () => {
      const item = makeItem({ quantity: 200, unit: 'g' });
      mockRepo.find.mockResolvedValueOnce([item]).mockResolvedValueOnce([]);
      mockRepo.save.mockResolvedValue(item);

      await service.consumeIngredients(USER_ID, [
        { ingredientId: ING_ID, quantity: 200, unit: 'g' },
      ]);

      expect(mockRepo.remove).toHaveBeenCalledWith(item);
    });
  });
});
