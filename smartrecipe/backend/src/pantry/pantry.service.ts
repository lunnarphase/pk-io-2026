import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UpsertPantryItemDto } from './dto/pantry.dto';

@Injectable()
export class PantryService {
  constructor(
    @InjectRepository(PantryItem)
    private readonly repo: Repository<PantryItem>,
  ) {}

  listPantry(userId: string): Promise<PantryItem[]> {
    return this.repo.find({
      where: { userId },
      relations: { ingredient: true },
      order: { ingredient: { name: 'ASC' } },
    });
  }

  async upsertItem(
    userId: string,
    ingredientId: string,
    dto: UpsertPantryItemDto,
  ): Promise<PantryItem> {
    let item = await this.repo.findOne({ where: { userId, ingredientId } });
    if (item) {
      item.quantity = dto.quantity;
      item.unit = dto.unit;
    } else {
      item = this.repo.create({
        userId,
        ingredientId,
        quantity: dto.quantity,
        unit: dto.unit,
      });
    }
    return this.repo.save(item);
  }

  async removeItem(userId: string, ingredientId: string): Promise<void> {
    const item = await this.repo.findOne({ where: { userId, ingredientId } });
    if (!item) throw new NotFoundException('Pantry item not found');
    await this.repo.remove(item);
  }
}
