import { UnitNormalizationService } from '../shared/unit-normalization.service';
import { Ingredient } from '../domain/entities/ingredient.entity';

export type KcalSkipReason = 'no_kcal_data' | 'no_mass_unit';

export interface KcalEstimateLineInput {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface KcalEstimateSkipped {
  ingredientId: string;
  name: string;
  reason: KcalSkipReason;
  unit?: string;
}

export interface RecipeKcalEstimate {
  servings: number;
  totalKcal: number;
  estimatedKcalPerServing: number;
  includedCount: number;
  skipped: KcalEstimateSkipped[];
}

export function estimateRecipeKcal(
  lines: KcalEstimateLineInput[],
  ingredientsById: Map<string, Ingredient>,
  servings: number,
  units: UnitNormalizationService,
): RecipeKcalEstimate {
  const safeServings =
    Number.isFinite(servings) && servings >= 1 ? servings : 1;
  let totalKcal = 0;
  let includedCount = 0;
  const skipped: KcalEstimateSkipped[] = [];

  for (const line of lines) {
    const ingredient = ingredientsById.get(line.ingredientId);
    const name = ingredient?.name ?? line.ingredientId;
    const kcalPer100g =
      ingredient?.kcalPer100g != null ? Number(ingredient.kcalPer100g) : null;

    if (
      kcalPer100g == null ||
      !Number.isFinite(kcalPer100g) ||
      kcalPer100g <= 0
    ) {
      skipped.push({
        ingredientId: line.ingredientId,
        name,
        reason: 'no_kcal_data',
      });
      continue;
    }

    const grams = lineQuantityToGrams(
      Number(line.quantity),
      line.unit,
      ingredient,
      units,
    );
    if (grams == null || grams <= 0) {
      skipped.push({
        ingredientId: line.ingredientId,
        name,
        reason: 'no_mass_unit',
        unit: line.unit,
      });
      continue;
    }

    totalKcal += (grams / 100) * kcalPer100g;
    includedCount += 1;
  }

  const roundedTotal = Math.round(totalKcal);
  const perServing = Math.round(roundedTotal / safeServings);

  return {
    servings: safeServings,
    totalKcal: roundedTotal,
    estimatedKcalPerServing: perServing,
    includedCount,
    skipped,
  };
}

function lineQuantityToGrams(
  quantity: number,
  unit: string,
  ingredient: Ingredient | undefined,
  units: UnitNormalizationService,
): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const fromMass = units.toGrams(quantity, unit);
  if (fromMass != null && fromMass > 0) return fromMass;

  const norm = units.normalize(quantity, unit);
  if (norm.baseUnit !== 'szt') return null;

  const perPiece =
    ingredient?.gramsPerPiece != null ? Number(ingredient.gramsPerPiece) : null;
  if (perPiece == null || !Number.isFinite(perPiece) || perPiece <= 0) {
    return null;
  }

  return norm.value * perPiece;
}
