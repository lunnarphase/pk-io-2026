import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Recipe } from '../domain/entities/recipe.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { RecipeLifecycleStatus } from '../domain/enums';
import {
  CreateRecipeDto,
  EstimateRecipeKcalDto,
  RecipeFilterDto,
  SetIngredientsDto,
  UpdateRecipeDto,
} from './dto/recipe.dto';
import { PantryService } from '../pantry/pantry.service';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';
import {
  estimateRecipeKcal,
  type RecipeKcalEstimate,
} from './recipe-kcal-estimator';

export type RecipeDetail = Recipe & { pantryMissingCount?: number };

type AllowedTransition = Record<RecipeLifecycleStatus, RecipeLifecycleStatus[]>;

const ALLOWED_TRANSITIONS: AllowedTransition = {
  [RecipeLifecycleStatus.DRAFT]: [RecipeLifecycleStatus.ACTIVE],
  [RecipeLifecycleStatus.ACTIVE]: [
    RecipeLifecycleStatus.DRAFT,
    RecipeLifecycleStatus.ARCHIVED,
  ],
  [RecipeLifecycleStatus.ARCHIVED]: [RecipeLifecycleStatus.ACTIVE],
};

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private readonly riRepo: Repository<RecipeIngredient>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    private readonly pantryService: PantryService,
    private readonly units: UnitNormalizationService,
  ) {}

  async findAll(userId: string, filters: RecipeFilterDto): Promise<Recipe[]> {
    const qb = this.recipeRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredients', 'ri')
      .leftJoinAndSelect('ri.ingredient', 'i')
      .where('r.userId = :userId', { userId });

    if (filters.diet) qb.andWhere('r.dietType = :diet', { diet: filters.diet });
    if (filters.cuisine)
      qb.andWhere('r.cuisineType = :cuisine', { cuisine: filters.cuisine });
    if (filters.kcalMin)
      qb.andWhere('r.estimatedKcalPerServing >= :kcalMin', {
        kcalMin: filters.kcalMin,
      });
    if (filters.kcalMax)
      qb.andWhere('r.estimatedKcalPerServing <= :kcalMax', {
        kcalMax: filters.kcalMax,
      });

    return qb.orderBy('r.createdAt', 'DESC').getMany();
  }

  async findOne(userId: string, id: string): Promise<RecipeDetail> {
    const recipe = await this.recipeRepo.findOne({
      where: { id },
      relations: { ingredients: { ingredient: true } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.userId !== userId) throw new ForbiddenException();
    return this.withPantryStatus(userId, recipe);
  }

  private async withPantryStatus(
    userId: string,
    recipe: Recipe,
  ): Promise<RecipeDetail> {
    const detail: RecipeDetail = { ...recipe };
    if (recipe.lifecycleStatus !== RecipeLifecycleStatus.ACTIVE) {
      return detail;
    }
    const lines = (recipe.ingredients ?? []).map((ri) => ({
      ingredientId: ri.ingredientId,
      quantity: Number(ri.quantity),
      unit: ri.unit,
    }));
    const pantryItems = await this.pantryService.listPantry(userId);
    const pantryMap = new Map(
      pantryItems.map((p) => [
        p.ingredientId,
        { quantity: Number(p.quantity), unit: p.unit },
      ]),
    );
    const matches = this.pantryService.computeIngredientPantryMatches(
      lines,
      pantryMap,
    );
    detail.pantryMissingCount = matches.filter(
      (m) => m.status !== 'sufficient',
    ).length;
    detail.ingredients = (recipe.ingredients ?? []).map((ri, index) => ({
      ...ri,
      pantryMatch: matches[index],
    }));
    return detail;
  }

  async cookRecipe(userId: string, id: string): Promise<PantryItem[]> {
    const recipe = await this.findOne(userId, id);
    if (recipe.lifecycleStatus !== RecipeLifecycleStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        'Tylko opublikowany przepis można oznaczyć jako ugotowany',
      );
    }
    const lines = (recipe.ingredients ?? []).map((ri) => ({
      ingredientId: ri.ingredientId,
      quantity: Number(ri.quantity),
      unit: ri.unit,
    }));
    if (lines.length === 0) {
      throw new UnprocessableEntityException(
        'Przepis nie ma składników do odjęcia ze spiżarni',
      );
    }
    if ((recipe.pantryMissingCount ?? lines.length) > 0) {
      throw new UnprocessableEntityException(
        'Nie masz wszystkich składników w spiżarni',
      );
    }
    return this.pantryService.consumeIngredients(userId, lines);
  }

  async create(userId: string, dto: CreateRecipeDto): Promise<Recipe> {
    const recipe = this.recipeRepo.create({
      ...dto,
      userId,
      lifecycleStatus: RecipeLifecycleStatus.DRAFT,
    });
    return this.recipeRepo.save(recipe);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecipeDto,
  ): Promise<Recipe> {
    const recipe = await this.findOne(userId, id);
    Object.assign(recipe, dto);
    return this.recipeRepo.save(recipe);
  }

  async estimateKcal(
    userId: string,
    id: string,
    dto: EstimateRecipeKcalDto,
  ): Promise<RecipeKcalEstimate> {
    const recipe = await this.findOne(userId, id);
    if (recipe.lifecycleStatus !== RecipeLifecycleStatus.DRAFT) {
      throw new BadRequestException(
        'Obliczanie kcal jest dostępne tylko dla szkicu',
      );
    }

    let lines: { ingredientId: string; quantity: number; unit: string }[];
    if (dto.ingredients?.length) {
      lines = dto.ingredients.map((line) => {
        const resolved = this.units.resolveForStorage(line.quantity, line.unit);
        return {
          ingredientId: line.ingredientId,
          quantity: resolved.quantity,
          unit: resolved.unit,
        };
      });
    } else {
      const stored = await this.recipeRepo.findOne({
        where: { id },
        relations: { ingredients: true },
      });
      lines = (stored?.ingredients ?? []).map((ri) => ({
        ingredientId: ri.ingredientId,
        quantity: Number(ri.quantity),
        unit: ri.unit,
      }));
    }

    if (lines.length === 0) {
      throw new UnprocessableEntityException(
        'Dodaj składniki, zanim obliczysz kcal',
      );
    }

    const ingredientIds = [...new Set(lines.map((l) => l.ingredientId))];
    const ingredients = await this.ingredientRepo.findBy({
      id: In(ingredientIds),
    });
    const byId = new Map(ingredients.map((i) => [i.id, i]));

    const servings = dto.servings ?? recipe.servings ?? 1;
    const result = estimateRecipeKcal(lines, byId, servings, this.units);

    if (result.includedCount === 0) {
      throw new UnprocessableEntityException(
        'Żaden składnik nie ma kaloryki na 100 g lub ilości w gramach / ml',
      );
    }

    return result;
  }

  async setIngredients(
    userId: string,
    id: string,
    dto: SetIngredientsDto,
  ): Promise<Recipe> {
    await this.findOne(userId, id);
    await this.riRepo.delete({ recipeId: id });
    const lines = dto.ingredients.map((line) => {
      const resolved = this.units.resolveForStorage(line.quantity, line.unit);
      return this.riRepo.create({
        recipeId: id,
        ingredientId: line.ingredientId,
        quantity: resolved.quantity,
        unit: resolved.unit,
      });
    });
    await this.riRepo.save(lines);
    return this.findOne(userId, id);
  }

  async transition(
    userId: string,
    id: string,
    to: RecipeLifecycleStatus,
  ): Promise<Recipe> {
    const recipe = await this.findOne(userId, id);
    const allowed = ALLOWED_TRANSITIONS[recipe.lifecycleStatus];
    if (!allowed.includes(to)) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${recipe.lifecycleStatus} to ${to}`,
      );
    }
    if (to === RecipeLifecycleStatus.ACTIVE) {
      const count = await this.riRepo.count({ where: { recipeId: id } });
      if (count === 0)
        throw new UnprocessableEntityException(
          'Cannot publish a recipe with no ingredients',
        );
    }
    recipe.lifecycleStatus = to;
    return this.recipeRepo.save(recipe);
  }

  async remove(userId: string, id: string): Promise<void> {
    const recipe = await this.findOne(userId, id);
    await this.recipeRepo.remove(recipe);
  }
}
