import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

const DEEPL_PRO_BASE = 'https://api.deepl.com/v2';
const DEEPL_FREE_BASE = 'https://api-free.deepl.com/v2';

interface DeeplTranslateResponse {
  translations?: { text: string; detected_source_language?: string }[];
}

@Injectable()
export class DeeplTranslationService {
  private readonly logger = new Logger(DeeplTranslationService.name);
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /**
   * PL → EN for USDA search. Returns null when DeepL is unavailable (caller uses Polish name).
   */
  async translatePlToEn(text: string): Promise<string | null> {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const cacheKey = trimmed.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.config.get<string>('DEEPL_API_KEY');
    if (!apiKey || apiKey === 'REPLACE' || apiKey.trim() === '') {
      this.logger.debug('DEEPL_API_KEY not set - skipping translation');
      return null;
    }

    const baseUrl = this.resolveBaseUrl(apiKey);

    try {
      const { data } = await firstValueFrom(
        this.http.post<DeeplTranslateResponse>(
          `${baseUrl}/translate`,
          {
            text: [trimmed],
            source_lang: 'PL',
            target_lang: 'EN',
          },
          {
            headers: {
              Authorization: `DeepL-Auth-Key ${apiKey.trim()}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const translated = data.translations?.[0]?.text?.trim();
      if (!translated) return null;

      this.cache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      this.logger.warn(
        `DeepL translation failed for "${trimmed}": ${(err as Error).message}`,
      );
      return null;
    }
  }

  private resolveBaseUrl(apiKey: string): string {
    const override = this.config.get<string>('DEEPL_API_URL')?.trim();
    if (override) return override.replace(/\/$/, '');

    return apiKey.trimEnd().endsWith(':fx') ? DEEPL_FREE_BASE : DEEPL_PRO_BASE;
  }
}
