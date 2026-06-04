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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { ShoppingListService } from './shopping-list.service';
import {
  AddManualItemDto,
  FillFromRecipesDto,
  PatchShoppingListItemDto,
} from './dto/shopping-list.dto';

@ApiTags('shopping-list')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shopping-list')
export class ShoppingListController {
  constructor(private readonly service: ShoppingListService) {}

  @Get()
  @ApiOperation({ summary: 'Aktywna lista zakupów (tworzona automatycznie)' })
  get(@CurrentUser() userId: string) {
    return this.service.getOrCreate(userId);
  }

  @Post('fill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Wypełnij listę brakującymi składnikami z wybranych przepisów',
  })
  fill(@CurrentUser() userId: string, @Body() dto: FillFromRecipesDto) {
    return this.service.fillFromRecipes(userId, dto);
  }

  @Post('items')
  @ApiOperation({ summary: 'Ręcznie dodaj pozycję do listy zakupów' })
  addItem(@CurrentUser() userId: string, @Body() dto: AddManualItemDto) {
    return this.service.addManualItem(userId, dto);
  }

  @Post('sync-pantry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Dodaj wszystkie kupione pozycje do spiżarni i usuń je z listy zakupów',
  })
  syncPurchasedToPantry(@CurrentUser() userId: string) {
    return this.service.syncPurchasedToPantry(userId);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Aktualizuj pozycję (np. oznacz jako kupioną)' })
  patchItem(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchShoppingListItemDto,
  ) {
    return this.service.patchItem(userId, id, dto);
  }

  @Delete('items')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usuń wszystkie pozycje z aktywnej listy zakupów' })
  clearItems(@CurrentUser() userId: string) {
    return this.service.clearAllItems(userId);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Usuń pozycję z listy zakupów' })
  removeItem(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.removeItem(userId, id);
  }
}
