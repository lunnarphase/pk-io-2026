import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { SuggestionsService } from './suggestions.service';
import { Recipe } from '../domain/entities/recipe.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';
import { RecipeLifecycleStatus } from '../domain/enums';

const USER_ID = 'user-uuid';

const makeRecipe = (
  id: string,
  ingredients: { ingredientId: string; quantity: number; unit: string }[],
): Recipe =>
  ({
    id,
    title: `Recipe ${id}`,
    lifecycleStatus: RecipeLifecycleStatus.ACTIVE,
    userId: USER_ID,
    ingredients: ingredients as RecipeIngredient[],
  }) as Recipe;

const makePantry = (
  ingredientId: string,
  quantity: number,
  unit: string,
): PantryItem =>
  ({ ingredientId, quantity, unit, userId: USER_ID }) as PantryItem;

const buildQbMock = (recipes: Recipe[]) => {
  const qb: Partial<SelectQueryBuilder<Recipe>> = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(recipes),
  };
  return qb as SelectQueryBuilder<Recipe>;
};

const mockRecipeRepo = { createQueryBuilder: jest.fn() };
const mockPantryRepo = { find: jest.fn() };

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        UnitNormalizationService,
        { provide: getRepositoryToken(Recipe), useValue: mockRecipeRepo },
        { provide: getRepositoryToken(PantryItem), useValue: mockPantryRepo },
      ],
    }).compile();
    service = module.get(SuggestionsService);
  });

  // ── empty pantry + 3 missing → fully excluded ────────────────────────
  it('excludes recipe from all results when pantry is empty and recipe has 3 ingredients', async () => {
    mockPantryRepo.find.mockResolvedValue([]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [
          { ingredientId: 'ing-a', quantity: 200, unit: 'g' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-c', quantity: 2, unit: 'szt' },
        ]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(0);
    expect(result.almostAvailable).toHaveLength(0);
    expect(result.needsMore).toHaveLength(1);
    expect(result.needsMore[0].missingCount).toBe(3);
  });

  // ── empty pantry + 1 ingredient → almostAvailable ─────────────────────
  it('puts single-ingredient recipe in almostAvailable when pantry is empty (1 missing ≤ 2)', async () => {
    mockPantryRepo.find.mockResolvedValue([]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [{ ingredientId: 'ing-a', quantity: 200, unit: 'g' }]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(0);
    expect(result.almostAvailable).toHaveLength(1);
    expect(result.almostAvailable[0].missingCount).toBe(1);
  });

  // ── exact match ───────────────────────────────────────────────────────
  it('puts recipe in available when all ingredients are present and sufficient', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 300, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [{ ingredientId: 'ing-a', quantity: 200, unit: 'g' }]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(1);
    expect(result.available[0].id).toBe('r1');
    expect(result.almostAvailable).toHaveLength(0);
  });

  // ── cross-unit match ──────────────────────────────────────────────────
  it('matches cross-unit: 1 kg pantry satisfies 500 g recipe need', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 1, 'kg')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [{ ingredientId: 'ing-a', quantity: 500, unit: 'g' }]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(1);
  });

  // ── insufficient quantity → almostAvailable (1 missing) ──────────────
  it('puts recipe in almostAvailable when pantry has ingredient but insufficient quantity', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 100, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [{ ingredientId: 'ing-a', quantity: 200, unit: 'g' }]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(0);
    expect(result.almostAvailable).toHaveLength(1);
    expect(result.almostAvailable[0].missingCount).toBe(1);
  });

  // ── 1 ingredient completely missing → almostAvailable ────────────────
  it('puts recipe in almostAvailable when 1 ingredient is absent from pantry', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 500, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [
          { ingredientId: 'ing-a', quantity: 200, unit: 'g' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
        ]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.almostAvailable).toHaveLength(1);
    expect(result.almostAvailable[0].missingCount).toBe(1);
  });

  // ── exactly 2 missing → almostAvailable (RF08) ────────────────────────
  it('includes recipe in almostAvailable when exactly 2 ingredients are missing (RF08)', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 500, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [
          { ingredientId: 'ing-a', quantity: 200, unit: 'g' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-c', quantity: 2, unit: 'szt' },
        ]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.almostAvailable).toHaveLength(1);
    expect(result.almostAvailable[0].missingCount).toBe(2);
  });

  // ── 3+ missing → needsMore ───────────────────────────────────────────
  it('puts recipe in needsMore when more than 2 ingredients are missing', async () => {
    mockPantryRepo.find.mockResolvedValue([]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [
          { ingredientId: 'ing-a', quantity: 200, unit: 'g' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-c', quantity: 2, unit: 'szt' },
        ]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(0);
    expect(result.almostAvailable).toHaveLength(0);
    expect(result.needsMore).toHaveLength(1);
    expect(result.needsMore[0].missingCount).toBe(3);
  });

  it('sorts needsMore by missingCount descending', async () => {
    mockPantryRepo.find.mockResolvedValue([]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('three-missing', [
          { ingredientId: 'ing-a', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-c', quantity: 1, unit: 'szt' },
        ]),
        makeRecipe('four-missing', [
          { ingredientId: 'ing-a', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-c', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-d', quantity: 1, unit: 'szt' },
        ]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.needsMore[0].recipe.id).toBe('four-missing');
    expect(result.needsMore[1].recipe.id).toBe('three-missing');
  });

  // ── multiple recipes sorted by missing count ──────────────────────────
  it('sorts almostAvailable by missingCount ascending', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 500, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('two-missing', [
          { ingredientId: 'ing-a', quantity: 100, unit: 'g' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
          { ingredientId: 'ing-c', quantity: 1, unit: 'szt' },
        ]),
        makeRecipe('one-missing', [
          { ingredientId: 'ing-a', quantity: 100, unit: 'g' },
          { ingredientId: 'ing-b', quantity: 1, unit: 'szt' },
        ]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.almostAvailable[0].recipe.id).toBe('one-missing');
    expect(result.almostAvailable[1].recipe.id).toBe('two-missing');
  });

  // ── incomparable units → treated as missing ───────────────────────────
  it('treats ingredient as missing when units are incomparable (g vs szt)', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 1000, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(
      buildQbMock([
        makeRecipe('r1', [{ ingredientId: 'ing-a', quantity: 2, unit: 'szt' }]),
      ]),
    );
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(0);
    expect(result.almostAvailable).toHaveLength(1);
  });

  // ── no active recipes ─────────────────────────────────────────────────
  it('returns empty when user has no ACTIVE recipes', async () => {
    mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 500, 'g')]);
    mockRecipeRepo.createQueryBuilder.mockReturnValue(buildQbMock([]));
    const result = await service.suggestRecipes(USER_ID);
    expect(result.available).toHaveLength(0);
    expect(result.almostAvailable).toHaveLength(0);
    expect(result.needsMore).toHaveLength(0);
  });
});
