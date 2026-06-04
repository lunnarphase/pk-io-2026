import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { SuggestionsService } from './suggestions.service';
import { DietType, CuisineType } from '../domain/enums';

@ApiTags('suggestions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly service: SuggestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Propozycje posiłków z dostępnych składników' })
  @ApiQuery({ name: 'diet', enum: DietType, required: false })
  @ApiQuery({ name: 'cuisine', enum: CuisineType, required: false })
  suggest(
    @CurrentUser() userId: string,
    @Query('diet') diet?: DietType,
    @Query('cuisine') cuisine?: CuisineType,
  ) {
    return this.service.suggestRecipes(userId, { diet, cuisine });
  }
}
