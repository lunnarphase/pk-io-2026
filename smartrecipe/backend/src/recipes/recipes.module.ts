import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from '../domain/entities/recipe.entity';
import { RecipeIngredient } from '../domain/entities/recipe-ingredient.entity';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PantryModule } from '../pantry/pantry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, RecipeIngredient, Ingredient]),
    PantryModule,
  ],
  providers: [RecipesService],
  controllers: [RecipesController],
  exports: [RecipesService],
})
export class RecipesModule {}
