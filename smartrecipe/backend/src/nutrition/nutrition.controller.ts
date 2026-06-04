import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NutritionService } from './nutrition.service';

@ApiTags('nutrition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Szukaj składników w USDA FoodData Central',
    description:
      'Zwraca listę wyników z bazy USDA FDC - fdcId, opis i kcal/100 g. ' +
      'Polskie zapytania są tłumaczone przez DeepL (DEEPL_API_KEY). ' +
      'USDA: DEMO_KEY gdy brak NUTRITION_API_KEY (30 req/godz).',
  })
  @ApiQuery({
    name: 'q',
    description: 'Nazwa składnika (np. "chicken breast", "mąka pszenna")',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maks. wyników (domyślnie 10)',
  })
  search(@Query('q') q: string, @Query('limit') limit?: number) {
    return this.service.searchFoods(q ?? '', limit ? Number(limit) : 10);
  }

  @Post('enrich/:ingredientId')
  @ApiOperation({
    summary:
      'Automatycznie pobierz i zapisz dane kaloryczne składnika (najlepszy wynik USDA)',
    description:
      'Wyszukuje nazwę składnika w USDA FDC, bierze pierwszy wynik i zapisuje ' +
      'externalFoodId (fdcId), kcalPer100g oraz opcjonalnie gramsPerPiece (waga 1 szt z USDA) w bazie.',
  })
  enrichAuto(@Param('ingredientId', ParseUUIDPipe) ingredientId: string) {
    return this.service.enrichIngredient(ingredientId);
  }

  @Post('enrich/:ingredientId/fdc/:fdcId')
  @ApiOperation({
    summary:
      'Zapisz dane kaloryczne dla konkretnego FDC ID (po wcześniejszym wyszukiwaniu)',
    description:
      'Pobiera dane dla wybranego fdcId i aktualizuje składnik. ' +
      'Używaj po /nutrition/search gdy chcesz wybrać konkretny wynik zamiast automatycznego.',
  })
  @ApiParam({
    name: 'fdcId',
    type: Number,
    description: 'USDA FDC ID z wyników wyszukiwania',
    example: 171477,
  })
  enrichByFdc(
    @Param('ingredientId', ParseUUIDPipe) ingredientId: string,
    @Param('fdcId', ParseIntPipe) fdcId: number,
  ) {
    return this.service.enrichIngredientByFdcId(ingredientId, fdcId);
  }
}
