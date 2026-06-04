import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { NutritionService } from './nutrition.service';
import { Ingredient } from '../domain/entities/ingredient.entity';

const ING_ID = 'ing-uuid';

const makeIngredient = (overrides: Partial<Ingredient> = {}): Ingredient =>
  ({
    id: ING_ID,
    name: 'Chicken breast',
    externalFoodId: null,
    kcalPer100g: null,
    ...overrides,
  }) as Ingredient;

const mockHttp = { get: jest.fn() };

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'NUTRITION_API_KEY') return '';
    return undefined;
  }),
  getOrThrow: jest.fn(),
};

const mockIngredientRepo = {
  findOne: jest.fn(),
  save: jest.fn((r: Ingredient) => Promise.resolve(r)),
};

const usdaSearchResponse = {
  foods: [
    {
      fdcId: 2187885,
      description: 'CHICKEN BREAST',
      foodNutrients: [
        {
          nutrientId: 1008,
          nutrientName: 'Energy',
          value: 165,
          unitName: 'KCAL',
        },
        { nutrientId: 1003, nutrientName: 'Protein', value: 31, unitName: 'G' },
      ],
    },
    {
      fdcId: 2092152,
      description: 'CHICKEN BREAST FILLET',
      foodNutrients: [
        {
          nutrientId: 1008,
          nutrientName: 'Energy',
          value: 143,
          unitName: 'KCAL',
        },
      ],
    },
  ],
  totalHits: 2,
};

describe('NutritionService', () => {
  let service: NutritionService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockIngredientRepo.save.mockImplementation((r: Ingredient) =>
      Promise.resolve(r),
    );
    const module = await Test.createTestingModule({
      providers: [
        NutritionService,
        { provide: HttpService, useValue: mockHttp },
        { provide: ConfigService, useValue: mockConfig },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockIngredientRepo,
        },
      ],
    }).compile();
    service = module.get(NutritionService);
  });

  // ── searchFoods ───────────────────────────────────────────────────────
  describe('searchFoods', () => {
    it('returns hits with fdcId, description, and kcalPer100g', async () => {
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      const hits = await service.searchFoods('chicken breast', 5);
      expect(hits).toHaveLength(2);
      expect(hits[0]).toEqual({
        fdcId: 2187885,
        description: 'CHICKEN BREAST',
        kcalPer100g: 165,
      });
      expect(hits[1]).toEqual({
        fdcId: 2092152,
        description: 'CHICKEN BREAST FILLET',
        kcalPer100g: 143,
      });
    });

    it('returns empty array for empty query without calling API', async () => {
      const hits = await service.searchFoods('  ');
      expect(mockHttp.get).not.toHaveBeenCalled();
      expect(hits).toHaveLength(0);
    });

    it('uses DEMO_KEY when NUTRITION_API_KEY is not configured', async () => {
      mockConfig.get.mockReturnValue('');
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      await service.searchFoods('pasta');
      const [[, config]] = mockHttp.get.mock.calls as [
        [string, { params: { api_key: string } }],
      ];
      expect(config.params.api_key).toBe('DEMO_KEY');
    });

    it('uses real key when NUTRITION_API_KEY is set', async () => {
      mockConfig.get.mockImplementation((key: string) =>
        key === 'NUTRITION_API_KEY' ? 'my-real-key' : undefined,
      );
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      await service.searchFoods('pasta');
      const [[, config]] = mockHttp.get.mock.calls as [
        [string, { params: { api_key: string } }],
      ];
      expect(config.params.api_key).toBe('my-real-key');
    });

    it('throws ServiceUnavailableException on API error', async () => {
      mockHttp.get.mockReturnValue(
        throwError(() => new Error('network error')),
      );
      await expect(service.searchFoods('chicken')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('returns null kcalPer100g when energy nutrient is absent', async () => {
      mockHttp.get.mockReturnValue(
        of({
          data: {
            foods: [
              { fdcId: 999, description: 'Mystery food', foodNutrients: [] },
            ],
            totalHits: 1,
          },
        }),
      );
      const hits = await service.searchFoods('mystery');
      expect(hits[0].kcalPer100g).toBeNull();
    });
  });

  // ── enrichIngredient ──────────────────────────────────────────────────
  describe('enrichIngredient', () => {
    it('throws NotFoundException for unknown ingredient', async () => {
      mockIngredientRepo.findOne.mockResolvedValue(null);
      await expect(service.enrichIngredient('bad-uuid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('saves fdcId and kcalPer100g on the ingredient', async () => {
      const ing = makeIngredient();
      mockIngredientRepo.findOne.mockResolvedValue(ing);
      mockHttp.get.mockReturnValue(of({ data: usdaSearchResponse }));
      const result = await service.enrichIngredient(ING_ID);
      expect(result.externalFoodId).toBe('2187885');
      expect(result.kcalPer100g).toBe(165);
      expect(mockIngredientRepo.save).toHaveBeenCalled();
    });

    it('returns ingredient unchanged when USDA returns no hits', async () => {
      const ing = makeIngredient();
      mockIngredientRepo.findOne.mockResolvedValue(ing);
      mockHttp.get.mockReturnValue(of({ data: { foods: [], totalHits: 0 } }));
      const result = await service.enrichIngredient(ING_ID);
      expect(result.externalFoodId).toBeNull();
      expect(mockIngredientRepo.save).not.toHaveBeenCalled();
    });
  });
});
