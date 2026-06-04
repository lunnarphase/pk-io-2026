import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { PantryService } from './pantry.service';
import { UpsertPantryItemDto } from './dto/pantry.dto';

@ApiTags('pantry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pantry')
export class PantryController {
  constructor(private readonly service: PantryService) {}

  @Get()
  @ApiOperation({ summary: 'Stan spiżarni użytkownika' })
  list(@CurrentUser() userId: string) {
    return this.service.listPantry(userId);
  }

  @Put('items/:ingredientId')
  @ApiOperation({ summary: 'Dodaj lub zaktualizuj pozycję w spiżarni' })
  upsert(
    @CurrentUser() userId: string,
    @Param('ingredientId', ParseUUIDPipe) ingredientId: string,
    @Body() dto: UpsertPantryItemDto,
  ) {
    return this.service.upsertItem(userId, ingredientId, dto);
  }

  @Delete('items/:ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usuń pozycję ze spiżarni' })
  remove(
    @CurrentUser() userId: string,
    @Param('ingredientId', ParseUUIDPipe) ingredientId: string,
  ) {
    return this.service.removeItem(userId, ingredientId);
  }
}
