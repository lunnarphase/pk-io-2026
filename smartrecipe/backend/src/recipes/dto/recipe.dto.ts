import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CuisineType, DietType } from '../../domain/enums';

export class RecipeIngredientLineDto {
  @ApiProperty({ example: 'uuid-of-ingredient' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: 400 })
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 'g' })
  @IsString()
  @MaxLength(50)
  unit: string;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Makaron z pesto' })
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 'Ugotuj makaron...' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedKcalPerServing?: number;

  @ApiPropertyOptional({ enum: DietType })
  @IsOptional()
  @IsEnum(DietType)
  dietType?: DietType;

  @ApiPropertyOptional({ enum: CuisineType })
  @IsOptional()
  @IsEnum(CuisineType)
  cuisineType?: CuisineType;
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

export class SetIngredientsDto {
  @ApiProperty({ type: [RecipeIngredientLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientLineDto)
  ingredients: RecipeIngredientLineDto[];
}

export class RecipeFilterDto {
  @ApiPropertyOptional({ enum: DietType })
  @IsOptional()
  @IsEnum(DietType)
  diet?: DietType;

  @ApiPropertyOptional({ enum: CuisineType })
  @IsOptional()
  @IsEnum(CuisineType)
  cuisine?: CuisineType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kcalMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kcalMax?: number;
}
