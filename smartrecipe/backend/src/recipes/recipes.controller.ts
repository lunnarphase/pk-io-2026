import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { RecipesService } from './recipes.service';
import {
  CreateRecipeDto,
  EstimateRecipeKcalDto,
  RecipeFilterDto,
  SetIngredientsDto,
  UpdateRecipeDto,
} from './dto/recipe.dto';
import { RecipeLifecycleStatus } from '../domain/enums';

@ApiTags('recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista przepisów użytkownika (z filtrami)' })
  findAll(@CurrentUser() userId: string, @Query() filters: RecipeFilterDto) {
    return this.service.findAll(userId, filters);
  }

  @Post()
  @ApiOperation({ summary: 'Utwórz szkic przepisu' })
  create(@CurrentUser() userId: string, @Body() dto: CreateRecipeDto) {
    return this.service.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pobierz przepis ze składem' })
  findOne(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Aktualizuj metadane przepisu' })
  update(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Post(':id/estimate-kcal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Szacuj kcal/porcja ze składu (tylko szkic; wymaga kcal/100g i jednostek g/ml)',
  })
  estimateKcal(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EstimateRecipeKcalDto,
  ) {
    return this.service.estimateKcal(userId, id, dto);
  }

  @Put(':id/ingredients')
  @ApiOperation({ summary: 'Ustaw skład przepisu (zastępuje poprzedni)' })
  setIngredients(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetIngredientsDto,
  ) {
    return this.service.setIngredients(userId, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Opublikuj przepis (DRAFT → ACTIVE)' })
  publish(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(userId, id, RecipeLifecycleStatus.ACTIVE);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archiwizuj przepis (ACTIVE → ARCHIVED)' })
  archive(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(userId, id, RecipeLifecycleStatus.ARCHIVED);
  }

  @Post(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Przywróć z archiwum (ARCHIVED → ACTIVE)' })
  unarchive(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(userId, id, RecipeLifecycleStatus.ACTIVE);
  }

  @Post(':id/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cofnij do szkicu (ACTIVE → DRAFT)' })
  toDraft(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(userId, id, RecipeLifecycleStatus.DRAFT);
  }

  @Post(':id/cook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Oznacz jako ugotowany - odejmij składniki przepisu ze spiżarni',
  })
  cook(@CurrentUser() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.cookRecipe(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usuń przepis' })
  remove(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(userId, id);
  }
}
