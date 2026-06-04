import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { Ingredient } from './domain/entities/ingredient.entity';
import { Recipe } from './domain/entities/recipe.entity';
import { RecipeIngredient } from './domain/entities/recipe-ingredient.entity';
import { PantryItem } from './domain/entities/pantry-item.entity';
import { ShoppingList } from './domain/entities/shopping-list.entity';
import { ShoppingListItem } from './domain/entities/shopping-list-item.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { PantryModule } from './pantry/pantry.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { ShoppingListModule } from './shopping-list/shopping-list.module';
import { ExternalModule } from './external/external.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'smartrecipe'),
        password: config.get('DB_PASS', 'smartrecipe'),
        database: config.get('DB_NAME', 'smartrecipe'),
        entities: [
          User,
          Ingredient,
          Recipe,
          RecipeIngredient,
          PantryItem,
          ShoppingList,
          ShoppingListItem,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    SharedModule,
    AuthModule,
    UsersModule,
    IngredientsModule,
    RecipesModule,
    PantryModule,
    SuggestionsModule,
    ShoppingListModule,
    ExternalModule,
    NutritionModule,
  ],
})
export class AppModule {}
