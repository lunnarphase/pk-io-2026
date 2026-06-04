import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PantryItem } from '../domain/entities/pantry-item.entity';
import { UnitNormalizationService } from '../shared/unit-normalization.service';
import { UpsertPantryItemDto } from './dto/pantry.dto';

const REMAINING_EPS = 1e-3;

export type RecipeIngredientLine = {
  ingredientId: string;
  quantity: number;
  unit: string;
};

export type IngredientPantryMatch = {
  status: 'sufficient' | 'deficit' | 'missing' | 'incompatible';
  pantryQuantity?: number;
  pantryUnit?: string;
  deficitQuantity?: number;
  deficitUnit?: string;
};

@Injectable()
export class PantryService {
  constructor(
    @InjectRepository(PantryItem)
    private readonly repo: Repository<PantryItem>,
    private readonly units: UnitNormalizationService,
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
    const mode = dto.mode ?? 'set';
    const incoming = this.units.resolveForStorage(dto.quantity, dto.unit);
    let item = await this.repo.findOne({ where: { userId, ingredientId } });
    if (item) {
      if (mode === 'add') {
        try {
          item.quantity = this.units.addQuantities(
            Number(item.quantity),
            item.unit,
            incoming.quantity,
            incoming.unit,
            item.unit,
          );
        } catch {
          throw new BadRequestException(
            'Nie można dodać - jednostki są niezgodne z tym, co już jest w spiżarni',
          );
        }
      } else {
        item.quantity = incoming.quantity;
        item.unit = incoming.unit;
      }
    } else {
      item = this.repo.create({
        userId,
        ingredientId,
        quantity: incoming.quantity,
        unit: incoming.unit,
      });
    }
    return this.repo.save(item);
  }

  async removeItem(userId: string, ingredientId: string): Promise<void> {
    const item = await this.repo.findOne({ where: { userId, ingredientId } });
    if (!item) throw new NotFoundException('Pantry item not found');
    await this.repo.remove(item);
  }

  computeIngredientPantryMatches(
    lines: RecipeIngredientLine[],
    pantry: Map<string, { quantity: number; unit: string }>,
  ): IngredientPantryMatch[] {
    return lines.map((line) => {
      const requiredQty = Number(line.quantity);
      const inPantry = pantry.get(line.ingredientId);

      if (!inPantry) {
        return {
          status: 'missing',
          deficitQuantity: requiredQty,
          deficitUnit: line.unit,
        };
      }

      if (!this.units.canCompare(inPantry.unit, line.unit)) {
        return { status: 'incompatible' };
      }

      if (
        this.units.isSufficient(
          inPantry.quantity,
          inPantry.unit,
          requiredQty,
          line.unit,
        )
      ) {
        return {
          status: 'sufficient',
          pantryQuantity: inPantry.quantity,
          pantryUnit: inPantry.unit,
        };
      }

      const pantryNorm = this.units.normalize(inPantry.quantity, inPantry.unit);
      const recipeNorm = this.units.normalize(requiredQty, line.unit);
      const deficitBase = recipeNorm.value - pantryNorm.value;
      const perRecipeUnit = this.units.normalize(1, line.unit).value;
      const deficitQuantity = deficitBase / perRecipeUnit;

      return {
        status: 'deficit',
        pantryQuantity: inPantry.quantity,
        pantryUnit: inPantry.unit,
        deficitQuantity,
        deficitUnit: line.unit,
      };
    });
  }

  countMissingIngredients(
    lines: RecipeIngredientLine[],
    pantry: Map<string, { quantity: number; unit: string }>,
  ): number {
    return this.computeIngredientPantryMatches(lines, pantry).filter(
      (m) => m.status !== 'sufficient',
    ).length;
  }

  async consumeIngredients(
    userId: string,
    lines: RecipeIngredientLine[],
  ): Promise<PantryItem[]> {
    if (lines.length === 0) {
      throw new BadRequestException('Przepis nie ma składników do odjęcia');
    }

    const pantryItems = await this.repo.find({ where: { userId } });
    const pantryMap = new Map(
      pantryItems.map((p) => [
        p.ingredientId,
        { item: p, quantity: Number(p.quantity), unit: p.unit },
      ]),
    );

    for (const line of lines) {
      const entry = pantryMap.get(line.ingredientId);
      if (
        !entry ||
        !this.units.isSufficient(
          entry.quantity,
          entry.unit,
          Number(line.quantity),
          line.unit,
        )
      ) {
        throw new BadRequestException(
          'Nie masz wystarczającej ilości składników w spiżarni',
        );
      }

      let remaining: number;
      try {
        remaining = this.units.subtractQuantities(
          entry.quantity,
          entry.unit,
          Number(line.quantity),
          line.unit,
          entry.unit,
        );
      } catch {
        throw new BadRequestException(
          'Nie można odjąć - jednostki są niezgodne z tym, co jest w spiżarni',
        );
      }

      if (remaining <= REMAINING_EPS) {
        await this.repo.remove(entry.item);
        pantryMap.delete(line.ingredientId);
      } else {
        entry.item.quantity = remaining;
        await this.repo.save(entry.item);
        entry.quantity = remaining;
      }
    }

    return this.listPantry(userId);
  }
}
