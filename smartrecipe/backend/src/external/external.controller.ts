import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { ExternalService } from './external.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipesService } from '../recipes/recipes.service';

class ImportRecipeDto {
  @ApiProperty({ description: 'External recipe ID (Spoonacular)' })
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
  ) {}

  @Get('recipes/search')
  @ApiOperation({
    summary: 'Szukaj przepisów w zewnętrznej bazie (Spoonacular)',
  })
  search(@Query('q') q: string) {
    return this.externalService.searchRecipes(q ?? '');
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

    const recipe = await this.recipesService.create(userId, {
      title,
      instructions,
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
        return {
          ingredientId: ingredient.id,
          quantity: ei.amount || 1,
          unit: ei.unit || 'szt',
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
