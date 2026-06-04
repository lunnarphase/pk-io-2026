import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { PantryService } from './pantry.service';
import { PantryController } from './pantry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PantryItem])],
  providers: [PantryService],
  controllers: [PantryController],
  exports: [PantryService],
})
export class PantryModule {}
