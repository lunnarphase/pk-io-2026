import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ShoppingList } from '../domain/entities/shopping-list.entity';
import { ShoppingListItem } from '../domain/entities/shopping-list-item.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';
import {
  AddManualItemDto,
  FillFromRecipesDto,
  PatchShoppingListItemDto,
} from './dto/shopping-list.dto';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly listRepo: Repository<ShoppingList>,
    @InjectRepository(ShoppingListItem)
    private readonly itemRepo: Repository<ShoppingListItem>,
    @InjectRepository(RecipeIngredient)
    private readonly riRepo: Repository<RecipeIngredient>,
    @InjectRepository(PantryItem)
    private readonly pantryRepo: Repository<PantryItem>,
    private readonly units: UnitNormalizationService,
  ) {}

  async getOrCreate(userId: string): Promise<ShoppingList> {
    let list = await this.listRepo.findOne({
      where: { userId, isActive: true },
      relations: { items: { ingredient: true } },
    });
    if (!list) {
      list = await this.listRepo.save(
        this.listRepo.create({ userId, isActive: true }),
      );
      list.items = [];
    }
    return list;
  }

  async fillFromRecipes(
    userId: string,
    dto: FillFromRecipesDto,
  ): Promise<ShoppingList> {
    const list = await this.getOrCreate(userId);

    const recipeIngredients = await this.riRepo.find({
      where: { recipeId: In(dto.recipeIds) },
    });

    const pantryItems = await this.pantryRepo.find({ where: { userId } });
    const pantryMap = new Map(pantryItems.map((p) => [p.ingredientId, p]));

    const needed = new Map<string, { quantity: number; unit: string }>();
    for (const ri of recipeIngredients) {
      const pantry = pantryMap.get(ri.ingredientId);
      let deficit = Number(ri.quantity);

      if (pantry && this.units.canCompare(pantry.unit, ri.unit)) {
        const norm = this.units.normalize(Number(pantry.quantity), pantry.unit);
        const recipeNorm = this.units.normalize(Number(ri.quantity), ri.unit);
        deficit = Math.max(0, recipeNorm.value - norm.value);
        if (deficit === 0) continue;
        deficit = deficit / this.units.normalize(1, ri.unit).value;
      }

      if (needed.has(ri.ingredientId)) {
        needed.get(ri.ingredientId)!.quantity += deficit;
      } else {
        needed.set(ri.ingredientId, { quantity: deficit, unit: ri.unit });
      }
    }

    for (const [ingredientId, { quantity, unit }] of needed.entries()) {
      let item = await this.itemRepo.findOne({
        where: { shoppingListId: list.id, ingredientId },
      });
      if (item) {
        item.quantityNeeded = Number(item.quantityNeeded) + quantity;
        item.purchased = false;
      } else {
        item = this.itemRepo.create({
          shoppingListId: list.id,
          ingredientId,
          quantityNeeded: quantity,
          unit,
        });
      }
      await this.itemRepo.save(item);
    }

    return this.getOrCreate(userId);
  }

  async addManualItem(
    userId: string,
    dto: AddManualItemDto,
  ): Promise<ShoppingListItem> {
    const list = await this.getOrCreate(userId);
    let item = await this.itemRepo.findOne({
      where: { shoppingListId: list.id, ingredientId: dto.ingredientId },
    });
    if (item) {
      item.quantityNeeded = Number(item.quantityNeeded) + dto.quantityNeeded;
    } else {
      item = this.itemRepo.create({
        shoppingListId: list.id,
        ingredientId: dto.ingredientId,
        quantityNeeded: dto.quantityNeeded,
        unit: dto.unit,
      });
    }
    return this.itemRepo.save(item);
  }

  async patchItem(
    userId: string,
    itemId: string,
    dto: PatchShoppingListItemDto,
  ): Promise<ShoppingListItem> {
    const list = await this.getOrCreate(userId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, shoppingListId: list.id },
    });
    if (!item) throw new NotFoundException('Shopping list item not found');
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const list = await this.getOrCreate(userId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, shoppingListId: list.id },
    });
    if (!item) throw new NotFoundException('Shopping list item not found');
    await this.itemRepo.remove(item);
  }
}
