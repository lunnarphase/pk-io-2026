import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { DeeplTranslationService } from './deepl-translation.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Ingredient])],
  providers: [DeeplTranslationService, NutritionService],
  controllers: [NutritionController],
  exports: [NutritionService],
})
export class NutritionModule {}
