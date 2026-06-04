/**
 * Pick a default "grams per 1 piece" from USDA FDC food detail (no user choice).
 * Used when recipe lines use szt and the ingredient is linked to FDC.
 */

export interface UsdaFoodPortion {
  gramWeight?: number;
  amount?: number;
  modifier?: string;
  portionDescription?: string;
  measureUnit?: { name?: string; abbreviation?: string };
}

export interface UsdaPortionSource {
  foodPortions?: UsdaFoodPortion[];
  servingSize?: number;
  servingSizeUnit?: string;
}

const MULTI_MEASURE =
  /\b(cup|cups|pint|quart|gallon|tablespoon|teaspoon|tbsp|tsp|fluid|dash|pinch)\b/i;

const PREFERRED_MODIFIERS = [
  'medium',
  'large',
  'small',
  'extra large',
  'jumbo',
] as const;

function portionText(p: UsdaFoodPortion): string {
  return `${p.modifier ?? ''} ${p.portionDescription ?? ''}`
    .trim()
    .toLowerCase();
}

function isSinglePiecePortion(p: UsdaFoodPortion): boolean {
  const text = portionText(p);
  if (MULTI_MEASURE.test(text)) return false;

  const amount = p.amount ?? 1;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 2) return false;

  const gw = p.gramWeight;
  if (gw == null || !Number.isFinite(gw) || gw <= 0 || gw > 500) return false;

  return true;
}

function gramsPerOne(p: UsdaFoodPortion): number {
  return Number(p.gramWeight) / (p.amount ?? 1);
}

function roundGrams(n: number): number {
  return Math.round(n * 10) / 10;
}

function pickFromFoodPortions(portions?: UsdaFoodPortion[]): number | null {
  if (!portions?.length) return null;

  const singles = portions.filter(isSinglePiecePortion);
  if (!singles.length) return null;

  for (const pref of PREFERRED_MODIFIERS) {
    const hit = singles.find((p) => portionText(p).includes(pref));
    if (hit) return roundGrams(gramsPerOne(hit));
  }

  const withAmountOne = singles.filter((p) => (p.amount ?? 1) === 1);
  const pool = withAmountOne.length ? withAmountOne : singles;
  return roundGrams(gramsPerOne(pool[0]));
}

function pickFromBrandedServing(
  servingSize?: number,
  servingSizeUnit?: string,
): number | null {
  if (
    servingSize == null ||
    !Number.isFinite(servingSize) ||
    servingSize <= 0
  ) {
    return null;
  }
  const unit = (servingSizeUnit ?? '').toLowerCase().trim();
  if (unit === 'g' || unit === 'grm' || unit === 'gram' || unit === 'grams') {
    return roundGrams(servingSize);
  }
  if (unit === 'ml' || unit === 'mlt') {
    return roundGrams(servingSize);
  }
  if (unit === 'oz' || unit === 'onz') {
    return roundGrams(servingSize * 28.3495);
  }
  return null;
}

export function pickDefaultGramsPerPiece(
  source: UsdaPortionSource,
): number | null {
  return (
    pickFromFoodPortions(source.foodPortions) ??
    pickFromBrandedServing(source.servingSize, source.servingSizeUnit)
  );
}
