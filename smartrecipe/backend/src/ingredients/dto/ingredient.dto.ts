import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Makaron spaghetti' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'usda-food-id-123' })
  @IsOptional()
  @IsString()
  externalFoodId?: string;
}
