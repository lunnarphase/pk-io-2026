import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ExternalRecipeHit {
  id: string | number;
  title: string;
  sourceUrl?: string;
}

export interface ExternalRecipeSearchPage {
  results: ExternalRecipeHit[];
  offset: number;
  number: number;
  totalResults: number;
}

const PAGE_SIZE = 20;

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async searchRecipes(
    query: string,
    offset = 0,
  ): Promise<ExternalRecipeSearchPage> {
    const apiKey = this.config.get<string>('RECIPE_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RECIPE_API_KEY not set - external recipe search unavailable',
      );
      throw new ServiceUnavailableException(
        'External recipe API not configured',
      );
    }
    const safeOffset = Math.max(0, Math.min(offset, 900));
    try {
      const url = `https://api.spoonacular.com/recipes/complexSearch`;
      const { data } = await firstValueFrom(
        this.http.get<{
          results?: ExternalRecipeHit[];
          offset?: number;
          number?: number;
          totalResults?: number;
        }>(url, {
          params: {
            query,
            number: PAGE_SIZE,
            offset: safeOffset,
            apiKey,
          },
        }),
      );
      const results = data.results ?? [];
      return {
        results,
        offset: data.offset ?? safeOffset,
        number: data.number ?? PAGE_SIZE,
        totalResults: data.totalResults ?? results.length,
      };
    } catch (err) {
      this.logger.error(
        'External recipe search failed',
        (err as Error).message,
      );
      throw new ServiceUnavailableException('External recipe API unavailable');
    }
  }

  async fetchRecipeDetail(
    externalId: string,
  ): Promise<Record<string, unknown>> {
    const apiKey = this.config.get<string>('RECIPE_API_KEY');
    if (!apiKey)
      throw new ServiceUnavailableException(
        'External recipe API not configured',
      );
    try {
      const { data } = await firstValueFrom(
        this.http.get<Record<string, unknown>>(
          `https://api.spoonacular.com/recipes/${externalId}/information`,
          { params: { apiKey, includeNutrition: false } },
        ),
      );
      return data;
    } catch (err) {
      this.logger.error('Fetch recipe detail failed', (err as Error).message);
      throw new ServiceUnavailableException('External recipe API unavailable');
    }
  }
}
