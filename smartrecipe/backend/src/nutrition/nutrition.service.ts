import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { buildUsdaSearchQueries } from './ingredient-usda-query';
import { DeeplTranslationService } from './deepl-translation.service';
import { pickDefaultGramsPerPiece } from './usda-portion-grams';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const ENERGY_NUTRIENT_ID = 1008;

interface UsdaFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface UsdaFoodPortion {
  gramWeight?: number;
  amount?: number;
  modifier?: string;
  portionDescription?: string;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
  foodPortions?: UsdaFoodPortion[];
  servingSize?: number;
  servingSizeUnit?: string;
}

interface UsdaSearchResponse {
  foods: UsdaFood[];
  totalHits: number;
}

export interface NutritionSearchHit {
  fdcId: number;
  description: string;
  kcalPer100g: number | null;
}

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly deepl: DeeplTranslationService,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
  ) {}

  private get apiKey(): string {
    const key = this.config.get<string>('NUTRITION_API_KEY');
    if (!key || key === 'REPLACE' || key.trim() === '') {
      this.logger.warn(
        'NUTRITION_API_KEY not set - using DEMO_KEY (rate-limited: 30 req/hr)',
      );
      return 'DEMO_KEY';
    }
    return key;
  }

  async searchFoods(
    query: string,
    pageSize = 10,
  ): Promise<NutritionSearchHit[]> {
    if (!query.trim()) return [];
    const english = await this.deepl.translatePlToEn(query);
    const queries = buildUsdaSearchQueries(query, english);
    const seen = new Set<number>();
    const merged: NutritionSearchHit[] = [];

    for (const q of queries) {
      const hits = await this.searchFoodsOnce(q, pageSize);
      for (const hit of hits) {
        if (seen.has(hit.fdcId)) continue;
        seen.add(hit.fdcId);
        merged.push(hit);
        if (merged.length >= pageSize) return merged;
      }
    }

    return merged;
  }

  private async searchFoodsOnce(
    query: string,
    pageSize: number,
  ): Promise<NutritionSearchHit[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<UsdaSearchResponse>(`${USDA_BASE}/foods/search`, {
          params: { query, pageSize, api_key: this.apiKey },
        }),
      );
      return (data.foods ?? []).map((food) => ({
        fdcId: food.fdcId,
        description: food.description,
        kcalPer100g: this.extractKcal(food.foodNutrients),
      }));
    } catch (err) {
      this.logger.error('USDA search failed', (err as Error).message);
      throw new ServiceUnavailableException('Nutrition API unavailable');
    }
  }

  async enrichIngredient(ingredientId: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({
      where: { id: ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    if (ingredient.kcalPer100g != null && ingredient.gramsPerPiece != null) {
      return ingredient;
    }

    const linkedFdc = Number(ingredient.externalFoodId);
    if (
      ingredient.kcalPer100g != null &&
      Number.isFinite(linkedFdc) &&
      linkedFdc > 0
    ) {
      return this.applyFdcToIngredient(
        ingredient,
        linkedFdc,
        ingredient.kcalPer100g,
      );
    }

    const hits = await this.searchFoods(ingredient.name, 5);
    if (!hits.length) {
      this.logger.warn(`No USDA match for "${ingredient.name}"`);
      return ingredient;
    }

    const best = hits.find((hit) => hit.kcalPer100g != null) ?? hits[0];
    return this.applyFdcToIngredient(ingredient, best.fdcId, best.kcalPer100g);
  }

  async enrichIngredientByFdcId(
    ingredientId: string,
    fdcId: number,
  ): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({
      where: { id: ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    try {
      const detail = await this.fetchFoodDetail(fdcId);
      let kcal = this.extractKcal(detail.foodNutrients ?? []);
      if (kcal == null) {
        const searchHits = await this.searchFoodsOnce(ingredient.name, 10);
        kcal =
          searchHits.find((hit) => hit.fdcId === fdcId)?.kcalPer100g ?? null;
      }
      return this.applyFdcToIngredient(ingredient, fdcId, kcal, detail);
    } catch (err) {
      this.logger.error('USDA food fetch failed', (err as Error).message);
      throw new ServiceUnavailableException('Nutrition API unavailable');
    }
  }

  private async fetchFoodDetail(fdcId: number): Promise<UsdaFood> {
    const { data } = await firstValueFrom(
      this.http.get<UsdaFood>(`${USDA_BASE}/food/${fdcId}`, {
        params: { api_key: this.apiKey },
      }),
    );
    return data;
  }

  private async applyFdcToIngredient(
    ingredient: Ingredient,
    fdcId: number,
    kcalFromSearch: number | null,
    detail?: UsdaFood,
  ): Promise<Ingredient> {
    const food = detail ?? (await this.fetchFoodDetail(fdcId));
    ingredient.externalFoodId = String(fdcId);
    const kcal = kcalFromSearch ?? this.extractKcal(food.foodNutrients ?? []);
    if (kcal != null) {
      ingredient.kcalPer100g = kcal;
    }
    const gramsPerPiece = pickDefaultGramsPerPiece({
      foodPortions: food.foodPortions,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
    });
    if (gramsPerPiece != null) {
      ingredient.gramsPerPiece = gramsPerPiece;
    }
    return this.ingredientRepo.save(ingredient);
  }

  private extractKcal(nutrients: UsdaFoodNutrient[]): number | null {
    const energy = nutrients.find(
      (n) =>
        n.nutrientId === ENERGY_NUTRIENT_ID ||
        n.nutrientName?.toUpperCase().includes('ENERGY'),
    );
    return energy ? Math.round(Number(energy.value)) : null;
  }
}
