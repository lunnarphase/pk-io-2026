import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingList } from '../domain/entities/shopping-list.entity';
import { ShoppingListItem } from '../domain/entities/shopping-list-item.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';

const USER_ID = 'user-uuid';
const LIST_ID = 'list-uuid';

const makeList = (items: Partial<ShoppingListItem>[] = []): ShoppingList =>
  ({ id: LIST_ID, userId: USER_ID, isActive: true, items }) as ShoppingList;

const makeRi = (
  ingredientId: string,
  quantity: number,
  unit: string,
  recipeId = 'r1',
): RecipeIngredient =>
  ({ ingredientId, quantity, unit, recipeId }) as RecipeIngredient;

const makePantry = (
  ingredientId: string,
  quantity: number,
  unit: string,
): PantryItem =>
  ({ ingredientId, quantity, unit, userId: USER_ID }) as PantryItem;

const mockListRepo = {
  findOne: jest.fn(),
  create: jest.fn((dto: Partial<ShoppingList>) => ({ ...dto }) as ShoppingList),
  save: jest.fn((r: ShoppingList) => Promise.resolve(r)),
};

const mockItemRepo = {
  findOne: jest.fn(),
  create: jest.fn(
    (dto: Partial<ShoppingListItem>) => ({ ...dto }) as ShoppingListItem,
  ),
  save: jest.fn((r: ShoppingListItem) => Promise.resolve(r)),
  remove: jest.fn(),
};

const mockRiRepo = { find: jest.fn() };
const mockPantryRepo = { find: jest.fn() };

describe('ShoppingListService', () => {
  let service: ShoppingListService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockListRepo.create.mockImplementation(
      (dto: Partial<ShoppingList>) => ({ ...dto }) as ShoppingList,
    );
    mockItemRepo.create.mockImplementation(
      (dto: Partial<ShoppingListItem>) => ({ ...dto }) as ShoppingListItem,
    );
    mockListRepo.save.mockImplementation((r: ShoppingList) =>
      Promise.resolve(r),
    );
    mockItemRepo.save.mockImplementation((r: ShoppingListItem) =>
      Promise.resolve(r),
    );
    const module = await Test.createTestingModule({
      providers: [
        ShoppingListService,
        UnitNormalizationService,
        { provide: getRepositoryToken(ShoppingList), useValue: mockListRepo },
        {
          provide: getRepositoryToken(ShoppingListItem),
          useValue: mockItemRepo,
        },
        { provide: getRepositoryToken(RecipeIngredient), useValue: mockRiRepo },
        { provide: getRepositoryToken(PantryItem), useValue: mockPantryRepo },
      ],
    }).compile();
    service = module.get(ShoppingListService);
  });

  // ── getOrCreate ───────────────────────────────────────────────────────
  describe('getOrCreate', () => {
    it('returns existing active list', async () => {
      const list = makeList();
      mockListRepo.findOne.mockResolvedValue(list);
      const result = await service.getOrCreate(USER_ID);
      expect(result.id).toBe(LIST_ID);
      expect(mockListRepo.save).not.toHaveBeenCalled();
    });

    it('creates a new list when none exists', async () => {
      const newList = makeList();
      mockListRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newList);
      mockListRepo.save.mockResolvedValue(newList);
      const result = await service.getOrCreate(USER_ID);
      expect(mockListRepo.save).toHaveBeenCalled();
      expect(result.items).toEqual([]);
    });
  });

  // ── fillFromRecipes ───────────────────────────────────────────────────
  describe('fillFromRecipes', () => {
    it('adds nothing when recipe ingredients are fully covered by pantry', async () => {
      const list = makeList();
      mockListRepo.findOne.mockResolvedValue(list);
      mockRiRepo.find.mockResolvedValue([makeRi('ing-a', 200, 'g')]);
      mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 300, 'g')]);
      mockItemRepo.findOne.mockResolvedValue(null);
      await service.fillFromRecipes(USER_ID, { recipeIds: ['r1'] });
      expect(mockItemRepo.save).not.toHaveBeenCalled();
    });

    it('adds missing ingredient when pantry has none', async () => {
      const list = makeList();
      mockListRepo.findOne.mockResolvedValue(list);
      mockRiRepo.find.mockResolvedValue([makeRi('ing-a', 200, 'g')]);
      mockPantryRepo.find.mockResolvedValue([]);
      mockItemRepo.findOne.mockResolvedValue(null);
      await service.fillFromRecipes(USER_ID, { recipeIds: ['r1'] });
      expect(mockItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ingredientId: 'ing-a', unit: 'g' }),
      );
      expect(mockItemRepo.save).toHaveBeenCalled();
    });

    it('adds deficit quantity when pantry covers only part of the need', async () => {
      const list = makeList();
      mockListRepo.findOne.mockResolvedValue(list);
      mockRiRepo.find.mockResolvedValue([makeRi('ing-a', 500, 'g')]);
      mockPantryRepo.find.mockResolvedValue([makePantry('ing-a', 200, 'g')]);
      mockItemRepo.findOne.mockResolvedValue(null);
      const savedItem = {
        ingredientId: 'ing-a',
        quantityNeeded: 300,
        unit: 'g',
      };
      mockItemRepo.create.mockReturnValue(savedItem);
      await service.fillFromRecipes(USER_ID, { recipeIds: ['r1'] });
      expect(mockItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ingredientId: 'ing-a' }),
      );
      const [[createdItem]] = mockItemRepo.create.mock.calls as [
        [{ quantityNeeded: number }],
      ];
      expect(createdItem.quantityNeeded).toBe(300);
    });

    it('merges same ingredient from two recipes into one item (RF11)', async () => {
      const list = makeList();
      mockListRepo.findOne.mockResolvedValue(list);
      mockRiRepo.find.mockResolvedValue([
        makeRi('ing-a', 200, 'g', 'r1'),
        makeRi('ing-a', 150, 'g', 'r2'),
      ]);
      mockPantryRepo.find.mockResolvedValue([]);
      mockItemRepo.findOne.mockResolvedValue(null);
      await service.fillFromRecipes(USER_ID, { recipeIds: ['r1', 'r2'] });
      // Only one save call (one merged item)
      expect(mockItemRepo.save).toHaveBeenCalledTimes(1);
      const [[savedArg]] = mockItemRepo.save.mock.calls as [
        [{ quantityNeeded: number }],
      ];
      expect(savedArg.quantityNeeded).toBe(350);
    });

    it('sums existing item quantity when ingredient already on list (RF11)', async () => {
      const list = makeList();
      const existingItem = {
        id: 'item-1',
        shoppingListId: LIST_ID,
        ingredientId: 'ing-a',
        quantityNeeded: 100,
        unit: 'g',
        purchased: true,
      };
      mockListRepo.findOne.mockResolvedValue(list);
      mockRiRepo.find.mockResolvedValue([makeRi('ing-a', 200, 'g')]);
      mockPantryRepo.find.mockResolvedValue([]);
      mockItemRepo.findOne.mockResolvedValue(existingItem);
      await service.fillFromRecipes(USER_ID, { recipeIds: ['r1'] });
      expect(existingItem.purchased).toBe(false);
      expect(existingItem.quantityNeeded).toBe(300);
    });
  });

  // ── addManualItem ─────────────────────────────────────────────────────
  describe('addManualItem', () => {
    it('creates a new item when not on list yet', async () => {
      mockListRepo.findOne.mockResolvedValue(makeList());
      mockItemRepo.findOne.mockResolvedValue(null);
      await service.addManualItem(USER_ID, {
        ingredientId: 'ing-z',
        quantityNeeded: 3,
        unit: 'szt',
      });
      expect(mockItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredientId: 'ing-z',
          quantityNeeded: 3,
          unit: 'szt',
        }),
      );
    });

    it('sums quantity when item already on list', async () => {
      const existingItem = {
        id: 'i1',
        ingredientId: 'ing-z',
        quantityNeeded: 2,
        unit: 'szt',
      };
      mockListRepo.findOne.mockResolvedValue(makeList());
      mockItemRepo.findOne.mockResolvedValue(existingItem);
      await service.addManualItem(USER_ID, {
        ingredientId: 'ing-z',
        quantityNeeded: 3,
        unit: 'szt',
      });
      expect(existingItem.quantityNeeded).toBe(5);
    });
  });

  // ── patchItem ─────────────────────────────────────────────────────────
  describe('patchItem', () => {
    it('marks item as purchased', async () => {
      const item = { id: 'i1', shoppingListId: LIST_ID, purchased: false };
      mockListRepo.findOne.mockResolvedValue(makeList());
      mockItemRepo.findOne.mockResolvedValue(item);
      await service.patchItem(USER_ID, 'i1', { purchased: true });
      expect(item.purchased).toBe(true);
      expect(mockItemRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException for item not on this list', async () => {
      mockListRepo.findOne.mockResolvedValue(makeList());
      mockItemRepo.findOne.mockResolvedValue(null);
      await expect(
        service.patchItem(USER_ID, 'bad-id', { purchased: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
