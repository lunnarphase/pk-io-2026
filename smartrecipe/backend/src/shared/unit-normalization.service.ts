import { Injectable } from '@nestjs/common';

interface Normalized {
  value: number;
  baseUnit: string;
}

const CONVERSIONS: Record<string, { base: string; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  g: { base: 'g', factor: 1 },
  l: { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  łyżka: { base: 'łyżeczka', factor: 3 },
  łyżki: { base: 'łyżeczka', factor: 3 },
  łyżeczka: { base: 'łyżeczka', factor: 1 },
  łyżeczki: { base: 'łyżeczka', factor: 1 },
  tbsp: { base: 'tsp', factor: 3 },
  tsp: { base: 'tsp', factor: 1 },
  cup: { base: 'ml', factor: 240 },
  szt: { base: 'szt', factor: 1 },
  sztuka: { base: 'szt', factor: 1 },
  sztuki: { base: 'szt', factor: 1 },
  garść: { base: 'garść', factor: 1 },
};

@Injectable()
export class UnitNormalizationService {
  normalize(quantity: number, unit: string): Normalized {
    const key = unit.toLowerCase().trim();
    const conv = CONVERSIONS[key];
    if (!conv) {
      return { value: Number(quantity), baseUnit: key };
    }
    return { value: Number(quantity) * conv.factor, baseUnit: conv.base };
  }

  canCompare(unitA: string, unitB: string): boolean {
    const a = this.normalize(1, unitA).baseUnit;
    const b = this.normalize(1, unitB).baseUnit;
    return a === b;
  }

  isSufficient(
    pantryQuantity: number,
    pantryUnit: string,
    recipeQuantity: number,
    recipeUnit: string,
  ): boolean {
    if (!this.canCompare(pantryUnit, recipeUnit)) return false;
    const pantry = this.normalize(pantryQuantity, pantryUnit);
    const recipe = this.normalize(recipeQuantity, recipeUnit);
    return pantry.value >= recipe.value;
  }
}
