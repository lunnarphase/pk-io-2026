import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IngredientsService } from './ingredients.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { Ingredient } from '../domain/entities/ingredient.entity';

const ING_ID = 'ing-uuid';

const makeIngredient = (overrides: Partial<Ingredient> = {}): Ingredient =>
  ({
    id: ING_ID,
    name: 'Mąka',
    externalFoodId: null,
    kcalPer100g: null,
    gramsPerPiece: null,
    ...overrides,
  }) as Ingredient;

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((dto: Partial<Ingredient>) => ({ ...dto }) as Ingredient),
  save: jest.fn((item: Ingredient) => Promise.resolve(item)),
};

const mockNutrition = {
  enrichIngredient: jest.fn().mockResolvedValue(makeIngredient()),
};

describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: getRepositoryToken(Ingredient), useValue: mockRepo },
        { provide: NutritionService, useValue: mockNutrition },
      ],
    }).compile();
    service = module.get(IngredientsService);
  });

  describe('findAll', () => {
    it('returns ingredients without search filter', async () => {
      mockRepo.find.mockResolvedValue([makeIngredient()]);
      const items = await service.findAll();
      expect(items).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({ take: 50 });
    });

    it('searches ingredients by name', async () => {
      mockRepo.find.mockResolvedValue([makeIngredient()]);
      await service.findAll('mąka');
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
      const calls = mockRepo.find.mock.calls as Array<
        [{ take: number; where: { name: unknown } }]
      >;
      const callArg = calls[0][0];
      expect(callArg.take).toBe(50);
      expect(callArg.where.name).toBeDefined();
    });
  });

  describe('findById', () => {
    it('returns ingredient by id', async () => {
      mockRepo.findOne.mockResolvedValue(makeIngredient());
      const item = await service.findById(ING_ID);
      expect(item?.id).toBe(ING_ID);
    });
  });

  describe('findOrCreate', () => {
    it('returns existing ingredient', async () => {
      mockRepo.findOne.mockResolvedValue(makeIngredient());
      const item = await service.findOrCreate('Mąka');
      expect(item.name).toBe('Mąka');
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('creates ingredient when missing', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(makeIngredient({ name: 'Sól' }));
      const item = await service.findOrCreate('Sól');
      expect(item.name).toBe('Sól');
      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Sól' });
    });
  });

  describe('create', () => {
    it('throws ConflictException for duplicate name', async () => {
      mockRepo.findOne.mockResolvedValue(makeIngredient());
      await expect(service.create({ name: 'Mąka' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('creates a new ingredient', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(makeIngredient({ name: 'Drożdże' }));
      const item = await service.create({ name: 'Drożdże' });
      expect(item.name).toBe('Drożdże');
    });
  });
});
