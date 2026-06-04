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

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async searchRecipes(query: string): Promise<ExternalRecipeHit[]> {
    const apiKey = this.config.get<string>('RECIPE_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'RECIPE_API_KEY not set — external recipe search unavailable',
      );
      throw new ServiceUnavailableException(
        'External recipe API not configured',
      );
    }
    try {
      const url = `https://api.spoonacular.com/recipes/complexSearch`;
      const { data } = await firstValueFrom(
        this.http.get<{ results: ExternalRecipeHit[] }>(url, {
          params: { query, number: 10, apiKey },
        }),
      );
      return data.results ?? [];
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
