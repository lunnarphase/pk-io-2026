import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertPantryItemDto {
  @ApiProperty({ example: 500 })
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 'g' })
  @IsString()
  @MaxLength(50)
  unit: string;

  /** `add` - dodaj do istniejącej ilości; `set` (domyślnie) - ustaw bezwzględną wartość. */
  @ApiPropertyOptional({ enum: ['set', 'add'], default: 'set' })
  @IsOptional()
  @IsIn(['set', 'add'])
  mode?: 'set' | 'add';
}
