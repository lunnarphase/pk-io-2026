import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from '../domain/entities/shopping-list.entity';
import { ShoppingListItem } from '../domain/entities/shopping-list-item.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListController } from './shopping-list.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShoppingList,
      ShoppingListItem,
      RecipeIngredient,
      PantryItem,
    ]),
  ],
  providers: [ShoppingListService],
  controllers: [ShoppingListController],
})
export class ShoppingListModule {}
