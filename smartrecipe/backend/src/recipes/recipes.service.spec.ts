import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecipesService } from './recipes.service';
import { PantryService } from '../pantry/pantry.service';
import { UnitNormalizationService } from '../shared/unit-normalization.service';
import { Recipe } from '../domain/entities/recipe.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { RecipeLifecycleStatus } from '../domain/enums';

const OWNER_ID = 'owner-uuid';
const OTHER_ID = 'other-uuid';
const RECIPE_ID = 'recipe-uuid';

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: RECIPE_ID,
  title: 'Test Recipe',
  instructions: null,
  estimatedKcalPerServing: null,
  servings: null,
  lifecycleStatus: RecipeLifecycleStatus.DRAFT,
  dietType: null,
  cuisineType: null,
  userId: OWNER_ID,
  user: undefined!,
  ingredients: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockRecipeRepo = {
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((dto: Partial<Recipe>) => ({ ...dto }) as Recipe),
  save: jest.fn((r: Recipe) => Promise.resolve(r)),
  remove: jest.fn(),
};

const mockIngredientRepo = {
  findBy: jest.fn().mockResolvedValue([]),
};

const mockRiRepo = {
  delete: jest.fn(),
  create: jest.fn(
    (dto: Partial<RecipeIngredient>) => ({ ...dto }) as RecipeIngredient,
  ),
  save: jest.fn((items: RecipeIngredient[]) => Promise.resolve(items)),
  count: jest.fn(),
};

const mockPantryService = {
  listPantry: jest.fn().mockResolvedValue([]),
  countMissingIngredients: jest.fn().mockReturnValue(0),
  computeIngredientPantryMatches: jest.fn().mockReturnValue([]),
  consumeIngredients: jest.fn().mockResolvedValue([]),
};

describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: getRepositoryToken(Recipe), useValue: mockRecipeRepo },
        { provide: getRepositoryToken(RecipeIngredient), useValue: mockRiRepo },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockIngredientRepo,
        },
        { provide: PantryService, useValue: mockPantryService },
        UnitNormalizationService,
      ],
    }).compile();
    service = module.get(RecipesService);
  });

  // ── findOne ───────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('returns recipe for its owner', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(makeRecipe());
      const recipe = await service.findOne(OWNER_ID, RECIPE_ID);
      expect(recipe.id).toBe(RECIPE_ID);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(OWNER_ID, 'bad-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when userId does not match owner', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ userId: OWNER_ID }),
      );
      await expect(service.findOne(OTHER_ID, RECIPE_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────
  describe('create', () => {
    it('creates a recipe with DRAFT status', async () => {
      const saved = makeRecipe();
      mockRecipeRepo.save.mockResolvedValue(saved);
      await service.create(OWNER_ID, { title: 'New Recipe' });
      expect(mockRecipeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: OWNER_ID,
          lifecycleStatus: RecipeLifecycleStatus.DRAFT,
        }),
      );
    });
  });

  // ── transition (state machine) ────────────────────────────────────────
  describe('transition', () => {
    it('DRAFT → ACTIVE succeeds when ingredients exist', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.DRAFT }),
      );
      mockRiRepo.count.mockResolvedValue(2);
      mockRecipeRepo.save.mockImplementation((r: Recipe) => Promise.resolve(r));
      const result = await service.transition(
        OWNER_ID,
        RECIPE_ID,
        RecipeLifecycleStatus.ACTIVE,
      );
      expect(result.lifecycleStatus).toBe(RecipeLifecycleStatus.ACTIVE);
    });

    it('DRAFT → ACTIVE fails when recipe has no ingredients (RF03)', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.DRAFT }),
      );
      mockRiRepo.count.mockResolvedValue(0);
      await expect(
        service.transition(OWNER_ID, RECIPE_ID, RecipeLifecycleStatus.ACTIVE),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('ACTIVE → ARCHIVED succeeds', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.ACTIVE }),
      );
      mockRecipeRepo.save.mockImplementation((r: Recipe) => Promise.resolve(r));
      const result = await service.transition(
        OWNER_ID,
        RECIPE_ID,
        RecipeLifecycleStatus.ARCHIVED,
      );
      expect(result.lifecycleStatus).toBe(RecipeLifecycleStatus.ARCHIVED);
    });

    it('ACTIVE → DRAFT succeeds', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.ACTIVE }),
      );
      mockRecipeRepo.save.mockImplementation((r: Recipe) => Promise.resolve(r));
      const result = await service.transition(
        OWNER_ID,
        RECIPE_ID,
        RecipeLifecycleStatus.DRAFT,
      );
      expect(result.lifecycleStatus).toBe(RecipeLifecycleStatus.DRAFT);
    });

    it('ARCHIVED → ACTIVE succeeds', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.ARCHIVED }),
      );
      mockRiRepo.count.mockResolvedValue(2);
      mockRecipeRepo.save.mockImplementation((r: Recipe) => Promise.resolve(r));
      const result = await service.transition(
        OWNER_ID,
        RECIPE_ID,
        RecipeLifecycleStatus.ACTIVE,
      );
      expect(result.lifecycleStatus).toBe(RecipeLifecycleStatus.ACTIVE);
    });

    it('DRAFT → ARCHIVED is forbidden (RF03)', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.DRAFT }),
      );
      await expect(
        service.transition(OWNER_ID, RECIPE_ID, RecipeLifecycleStatus.ARCHIVED),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('ARCHIVED → DRAFT is forbidden (RF03)', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.ARCHIVED }),
      );
      await expect(
        service.transition(OWNER_ID, RECIPE_ID, RecipeLifecycleStatus.DRAFT),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('ACTIVE → ACTIVE is forbidden (idempotent transition blocked)', async () => {
      mockRecipeRepo.findOne.mockResolvedValue(
        makeRecipe({ lifecycleStatus: RecipeLifecycleStatus.ACTIVE }),
      );
      await expect(
        service.transition(OWNER_ID, RECIPE_ID, RecipeLifecycleStatus.ACTIVE),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  // ── setIngredients ────────────────────────────────────────────────────
  describe('setIngredients', () => {
    it('replaces the ingredient list and returns updated recipe', async () => {
      const recipe = makeRecipe();
      mockRecipeRepo.findOne.mockResolvedValue(recipe);
      mockRiRepo.delete.mockResolvedValue({});
      mockRiRepo.save.mockResolvedValue([]);
      await service.setIngredients(OWNER_ID, RECIPE_ID, {
        ingredients: [{ ingredientId: 'ing-1', quantity: 200, unit: 'g' }],
      });
      expect(mockRiRepo.delete).toHaveBeenCalledWith({ recipeId: RECIPE_ID });
      expect(mockRiRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredientId: 'ing-1',
          quantity: 200,
          unit: 'g',
        }),
      );
    });
  });
});
