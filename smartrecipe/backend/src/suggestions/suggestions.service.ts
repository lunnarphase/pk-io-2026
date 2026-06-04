import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../domain/entities/recipe.entity';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { RecipeLifecycleStatus, DietType, CuisineType } from '../domain/enums';
import { UnitNormalizationService } from '../shared/unit-normalization.service';

export interface SuggestionResult {
  available: Recipe[];
  almostAvailable: { recipe: Recipe; missingCount: number }[];
}

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(PantryItem)
    private readonly pantryRepo: Repository<PantryItem>,
    private readonly units: UnitNormalizationService,
  ) {}

  async suggestRecipes(
    userId: string,
    filters?: { diet?: DietType; cuisine?: CuisineType },
  ): Promise<SuggestionResult> {
    const pantryItems = await this.pantryRepo.find({ where: { userId } });

    const pantryMap = new Map<string, { quantity: number; unit: string }>();
    for (const item of pantryItems) {
      pantryMap.set(item.ingredientId, {
        quantity: Number(item.quantity),
        unit: item.unit,
      });
    }

    const qb = this.recipeRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredients', 'ri')
      .leftJoinAndSelect('ri.ingredient', 'i')
      .where('r.userId = :userId', { userId })
      .andWhere('r.lifecycleStatus = :status', {
        status: RecipeLifecycleStatus.ACTIVE,
      });

    if (filters?.diet)
      qb.andWhere('r.dietType = :diet', { diet: filters.diet });
    if (filters?.cuisine)
      qb.andWhere('r.cuisineType = :cuisine', { cuisine: filters.cuisine });

    const recipes = await qb.getMany();

    const available: Recipe[] = [];
    const almostAvailable: { recipe: Recipe; missingCount: number }[] = [];

    for (const recipe of recipes) {
      const missingCount = this.countMissing(
        recipe.ingredients ?? [],
        pantryMap,
      );

      if (missingCount === 0) {
        available.push(recipe);
      } else if (missingCount <= 2) {
        almostAvailable.push({ recipe, missingCount });
      }
    }

    almostAvailable.sort((a, b) => a.missingCount - b.missingCount);

    return { available, almostAvailable };
  }

  private countMissing(
    recipeIngredients: {
      ingredientId: string;
      quantity: number;
      unit: string;
    }[],
    pantry: Map<string, { quantity: number; unit: string }>,
  ): number {
    let missing = 0;
    for (const ri of recipeIngredients) {
      const inPantry = pantry.get(ri.ingredientId);
      if (!inPantry) {
        missing++;
        continue;
      }
      const sufficient = this.units.isSufficient(
        inPantry.quantity,
        inPantry.unit,
        Number(ri.quantity),
        ri.unit,
      );
      if (!sufficient) missing++;
    }
    return missing;
  }
}
