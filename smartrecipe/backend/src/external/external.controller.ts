import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { ExternalService } from './external.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipesService } from '../recipes/recipes.service';
import { UnitNormalizationService } from '../shared/unit-normalization.service';

function transformExternalId(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return String(value);
  return undefined;
}

class ImportRecipeDto {
  @ApiProperty({ description: 'External recipe ID (Spoonacular)' })
  @Transform(({ value }: { value: unknown }) => transformExternalId(value))
  @IsString()
  @MaxLength(50)
  externalId: string;
}

@ApiTags('external')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('external')
export class ExternalController {
  constructor(
    private readonly externalService: ExternalService,
    private readonly ingredientsService: IngredientsService,
    private readonly recipesService: RecipesService,
    private readonly units: UnitNormalizationService,
  ) {}

  @Get('recipes/search')
  @ApiOperation({
    summary: 'Szukaj przepisów w zewnętrznej bazie (Spoonacular)',
  })
  search(@Query('q') q: string, @Query('offset') offsetRaw?: string) {
    const parsed = Number.parseInt(offsetRaw ?? '0', 10);
    const offset = Number.isFinite(parsed) ? parsed : 0;
    return this.externalService.searchRecipes(q ?? '', offset);
  }

  @Post('recipes/import')
  @ApiOperation({ summary: 'Importuj przepis z zewnętrznej bazy jako DRAFT' })
  async importRecipe(
    @CurrentUser() userId: string,
    @Body() dto: ImportRecipeDto,
  ) {
    const detail = await this.externalService.fetchRecipeDetail(dto.externalId);

    const title =
      typeof detail.title === 'string' ? detail.title : 'Imported recipe';
    const instructions =
      typeof detail.instructions === 'string' ? detail.instructions : '';
    const rawServings = detail.servings;
    const servings =
      typeof rawServings === 'number' &&
      Number.isFinite(rawServings) &&
      rawServings >= 1
        ? Math.round(rawServings)
        : undefined;

    const recipe = await this.recipesService.create(userId, {
      title,
      instructions,
      ...(servings != null ? { servings } : {}),
    });

    const extIngredients =
      (detail['extendedIngredients'] as Array<{
        name: string;
        amount: number;
        unit: string;
      }>) ?? [];
    const lines = await Promise.all(
      extIngredients.map(async (ei) => {
        const ingredient = await this.ingredientsService.findOrCreate(ei.name);
        const resolved = this.units.resolveForStorage(
          ei.amount || 1,
          ei.unit || 'szt',
        );
        return {
          ingredientId: ingredient.id,
          quantity: resolved.quantity,
          unit: resolved.unit,
        };
      }),
    );

    if (lines.length > 0) {
      await this.recipesService.setIngredients(userId, recipe.id, {
        ingredients: lines,
      });
    }

    return this.recipesService.findOne(userId, recipe.id);
  }
}
