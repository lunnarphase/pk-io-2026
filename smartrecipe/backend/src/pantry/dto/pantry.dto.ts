import { ApiProperty } from '@nestjs/swagger';
import { IsPositive, IsString, MaxLength } from 'class-validator';

export class UpsertPantryItemDto {
  @ApiProperty({ example: 500 })
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 'g' })
  @IsString()
  @MaxLength(50)
  unit: string;
}
