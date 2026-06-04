import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/ingredient.dto';

@ApiTags('ingredients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista składników (z opcjonalnym wyszukiwaniem)' })
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Post()
  @ApiOperation({ summary: 'Dodaj składnik do katalogu' })
  create(@Body() dto: CreateIngredientDto) {
    return this.service.create(dto);
  }
}
