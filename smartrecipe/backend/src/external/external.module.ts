import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalService } from './external.service';
import { ExternalController } from './external.controller';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [HttpModule, IngredientsModule, RecipesModule],
  providers: [ExternalService],
  controllers: [ExternalController],
})
export class ExternalModule {}
