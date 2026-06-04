import { Injectable } from '@nestjs/common';

interface Normalized {
  value: number;
  baseUnit: string;
}

/** Canonical units stored in DB (matches frontend UNIT_OPTIONS). */
export const KNOWN_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'szt',
  'tbsp',
  'tsp',
  'garść',
  'cup',
] as const;

export type KnownUnit = (typeof KNOWN_UNITS)[number];

const CONVERSIONS: Record<string, { base: string; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  g: { base: 'g', factor: 1 },
  oz: { base: 'g', factor: 28.3495 },
  lb: { base: 'g', factor: 453.592 },

  l: { base: 'ml', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  floz: { base: 'ml', factor: 29.5735 },

  łyżka: { base: 'tsp', factor: 3 },
  łyżki: { base: 'tsp', factor: 3 },
  łyżeczka: { base: 'tsp', factor: 1 },
  łyżeczki: { base: 'tsp', factor: 1 },
  tbsp: { base: 'tsp', factor: 3 },
  tsp: { base: 'tsp', factor: 1 },

  cup: { base: 'ml', factor: 240 },
  szt: { base: 'szt', factor: 1 },
  sztuka: { base: 'szt', factor: 1 },
  sztuki: { base: 'szt', factor: 1 },
  garść: { base: 'garść', factor: 1 },
  garście: { base: 'garść', factor: 1 },
};

/** Spoonacular / US recipe labels → canonical conversion key. */
const UNIT_ALIASES: Record<string, string> = {
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',

  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  'fluid ounce': 'floz',
  'fluid ounces': 'floz',
  'fl oz': 'floz',
  floz: 'floz',

  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  cups: 'cup',

  piece: 'szt',
  pieces: 'szt',
  slice: 'szt',
  slices: 'szt',
  clove: 'szt',
  cloves: 'szt',
  head: 'szt',
  heads: 'szt',
  can: 'szt',
  cans: 'szt',
  package: 'szt',
  packages: 'szt',
  packet: 'szt',
  serving: 'szt',
  servings: 'szt',
  small: 'szt',
  medium: 'szt',
  large: 'szt',
  leaf: 'szt',
  leaves: 'szt',
  stalk: 'szt',
  stalks: 'szt',
  strip: 'szt',
  strips: 'szt',

  bunch: 'garść',
  bunches: 'garść',
  sprig: 'garść',
  sprigs: 'garść',
  handful: 'garść',
  handfuls: 'garść',

  pinch: 'tsp',
  pinches: 'tsp',
  dash: 'tsp',
  dashes: 'tsp',
};

@Injectable()
export class UnitNormalizationService {
  normalize(quantity: number, unit: string): Normalized {
    const key = this.resolveAlias(unit);
    const conv = CONVERSIONS[key];
    if (!conv) {
      return { value: Number(quantity), baseUnit: key };
    }
    return { value: Number(quantity) * conv.factor, baseUnit: conv.base };
  }

  /**
   * Map variant labels (e.g. "tablespoons", "ounces") to a known catalog unit
   * and scale quantity (e.g. 2 oz → ~56.7 g).
   */
  resolveForStorage(
    quantity: number,
    unit: string,
  ): { quantity: number; unit: string } {
    const rawQty = Number(quantity);
    const qty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
    const trimmed = unit?.trim() ?? '';
    if (!trimmed) {
      return { quantity: this.roundQty(qty), unit: 'szt' };
    }

    const key = this.resolveAlias(trimmed);
    if (!CONVERSIONS[key]) {
      if (KNOWN_UNITS.includes(key as KnownUnit)) {
        return { quantity: this.roundQty(qty), unit: key };
      }
      return { quantity: this.roundQty(qty), unit: 'szt' };
    }

    const norm = this.normalize(qty, key);
    return this.toDisplayAmount(norm.value, norm.baseUnit);
  }

  isKnownUnit(unit: string): boolean {
    const key = this.resolveAlias(unit);
    return KNOWN_UNITS.includes(key as KnownUnit) || Boolean(CONVERSIONS[key]);
  }

  /**
   * Mass in grams when the unit maps to weight (g) or volume (ml, ~1 g/ml).
   * Returns null for szt, łyżki, garść, etc.
   */
  toGrams(quantity: number, unit: string): number | null {
    const norm = this.normalize(quantity, unit);
    if (norm.baseUnit === 'g') return norm.value;
    if (norm.baseUnit === 'ml') return norm.value;
    return null;
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

  subtractQuantities(
    pantryQuantity: number,
    pantryUnit: string,
    recipeQuantity: number,
    recipeUnit: string,
    resultUnit: string = pantryUnit,
  ): number {
    if (!this.canCompare(pantryUnit, recipeUnit)) {
      throw new Error('INCOMPATIBLE_UNITS');
    }
    const pantry = this.normalize(pantryQuantity, pantryUnit);
    const recipe = this.normalize(recipeQuantity, recipeUnit);
    const remaining = pantry.value - recipe.value;
    if (remaining < 0) {
      throw new Error('INSUFFICIENT_QUANTITY');
    }
    return this.fromBase(remaining, resultUnit);
  }

  addQuantities(
    qtyA: number,
    unitA: string,
    qtyB: number,
    unitB: string,
    resultUnit: string = unitA,
  ): number {
    if (!this.canCompare(unitA, unitB)) {
      throw new Error('INCOMPATIBLE_UNITS');
    }
    const a = this.normalize(qtyA, unitA);
    const b = this.normalize(qtyB, unitB);
    return this.fromBase(a.value + b.value, resultUnit);
  }

  fromBase(value: number, unit: string): number {
    const key = this.resolveAlias(unit);
    const conv = CONVERSIONS[key];
    if (!conv) return value;
    return value / conv.factor;
  }

  private resolveAlias(unit: string): string {
    const key = unit
      .toLowerCase()
      .trim()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ');
    return UNIT_ALIASES[key] ?? key;
  }

  private toDisplayAmount(
    baseValue: number,
    baseUnit: string,
  ): { quantity: number; unit: string } {
    if (baseUnit === 'g') {
      if (baseValue >= 1000) {
        return {
          quantity: this.roundQty(baseValue / 1000),
          unit: 'kg',
        };
      }
      return { quantity: this.roundQty(baseValue), unit: 'g' };
    }

    if (baseUnit === 'ml') {
      if (baseValue >= 1000) {
        return {
          quantity: this.roundQty(baseValue / 1000),
          unit: 'l',
        };
      }
      if (baseValue >= 240 && baseValue % 240 === 0) {
        return {
          quantity: this.roundQty(baseValue / 240),
          unit: 'cup',
        };
      }
      return { quantity: this.roundQty(baseValue), unit: 'ml' };
    }

    if (baseUnit === 'tsp') {
      if (baseValue >= 3 && baseValue % 3 === 0) {
        return {
          quantity: this.roundQty(baseValue / 3),
          unit: 'tbsp',
        };
      }
      return { quantity: this.roundQty(baseValue), unit: 'tsp' };
    }

    if (baseUnit === 'szt') {
      return { quantity: this.roundQty(baseValue), unit: 'szt' };
    }

    if (baseUnit === 'garść') {
      return { quantity: this.roundQty(baseValue), unit: 'garść' };
    }

    return { quantity: this.roundQty(baseValue), unit: baseUnit };
  }

  private roundQty(n: number): number {
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? rounded : rounded;
  }
}
