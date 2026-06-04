import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class FillFromRecipesDto {
  @ApiProperty({
    type: [String],
    description: 'IDs przepisów do uwzględnienia',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  recipeIds: string[];
}

export class AddManualItemDto {
  @ApiProperty()
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: 2 })
  @IsPositive()
  quantityNeeded: number;

  @ApiProperty({ example: 'szt' })
  @IsString()
  @MaxLength(50)
  unit: string;
}

export class PatchShoppingListItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  purchased?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPositive()
  quantityNeeded?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;
}
