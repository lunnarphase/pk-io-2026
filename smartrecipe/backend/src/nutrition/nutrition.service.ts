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

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const ENERGY_NUTRIENT_ID = 1008;

interface UsdaFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
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
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
  ) {}

  private get apiKey(): string {
    const key = this.config.get<string>('NUTRITION_API_KEY');
    if (!key || key === 'REPLACE' || key.trim() === '') {
      this.logger.warn(
        'NUTRITION_API_KEY not set — using DEMO_KEY (rate-limited: 30 req/hr)',
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

    const hits = await this.searchFoods(ingredient.name, 1);
    if (!hits.length) {
      this.logger.warn(`No USDA match for "${ingredient.name}"`);
      return ingredient;
    }

    const best = hits[0];
    ingredient.externalFoodId = String(best.fdcId);
    ingredient.kcalPer100g = best.kcalPer100g;
    return this.ingredientRepo.save(ingredient);
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
      const { data } = await firstValueFrom(
        this.http.get<UsdaFood>(`${USDA_BASE}/food/${fdcId}`, {
          params: { api_key: this.apiKey },
        }),
      );
      ingredient.externalFoodId = String(fdcId);
      ingredient.kcalPer100g = this.extractKcal(data.foodNutrients ?? []);
      return this.ingredientRepo.save(ingredient);
    } catch (err) {
      this.logger.error('USDA food fetch failed', (err as Error).message);
      throw new ServiceUnavailableException('Nutrition API unavailable');
    }
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
