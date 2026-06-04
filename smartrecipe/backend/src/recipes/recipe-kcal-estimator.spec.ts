import { UnitNormalizationService } from '../shared/unit-normalization.service';
import { Ingredient } from '../domain/entities/ingredient.entity';
import { estimateRecipeKcal } from './recipe-kcal-estimator';

function ing(
  id: string,
  name: string,
  kcal: number | null,
  gramsPerPiece?: number | null,
): Ingredient {
  return {
    id,
    name,
    kcalPer100g: kcal,
    gramsPerPiece: gramsPerPiece ?? null,
  } as Ingredient;
}

describe('estimateRecipeKcal', () => {
  const units = new UnitNormalizationService();

  it('sums kcal from grams and divides by servings', () => {
    const byId = new Map([
      ['a', ing('a', 'Mąka', 364)],
      ['b', ing('b', 'Mleko', 42)],
    ]);
    const result = estimateRecipeKcal(
      [
        { ingredientId: 'a', quantity: 200, unit: 'g' },
        { ingredientId: 'b', quantity: 250, unit: 'ml' },
      ],
      byId,
      2,
      units,
    );
    expect(result.totalKcal).toBe(Math.round(200 * 3.64 + 250 * 0.42));
    expect(result.estimatedKcalPerServing).toBe(
      Math.round(result.totalKcal / 2),
    );
    expect(result.includedCount).toBe(2);
    expect(result.skipped).toHaveLength(0);
  });

  it('converts szt using USDA gramsPerPiece on ingredient', () => {
    const byId = new Map([['egg', ing('egg', 'Jajko', 143, 44)]]);
    const result = estimateRecipeKcal(
      [{ ingredientId: 'egg', quantity: 2, unit: 'szt' }],
      byId,
      1,
      units,
    );
    expect(result.includedCount).toBe(1);
    expect(result.totalKcal).toBe(Math.round((88 / 100) * 143));
    expect(result.skipped).toHaveLength(0);
  });

  it('skips szt when ingredient has no gramsPerPiece', () => {
    const byId = new Map([['egg', ing('egg', 'Jajko', 143)]]);
    const result = estimateRecipeKcal(
      [{ ingredientId: 'egg', quantity: 2, unit: 'szt' }],
      byId,
      1,
      units,
    );
    expect(result.includedCount).toBe(0);
    expect(result.skipped[0]).toMatchObject({ reason: 'no_mass_unit' });
  });

  it('skips lines without kcal or non-mass units', () => {
    const byId = new Map([
      ['a', ing('a', 'Jajko', null)],
      ['b', ing('b', 'Sól', 0)],
      ['c', ing('c', 'Masło', 717)],
    ]);
    const result = estimateRecipeKcal(
      [
        { ingredientId: 'a', quantity: 2, unit: 'szt' },
        { ingredientId: 'b', quantity: 5, unit: 'g' },
        { ingredientId: 'c', quantity: 30, unit: 'g' },
      ],
      byId,
      1,
      units,
    );
    expect(result.includedCount).toBe(1);
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'no_kcal_data', name: 'Jajko' }),
        expect.objectContaining({ reason: 'no_kcal_data', name: 'Sól' }),
      ]),
    );
    expect(result.totalKcal).toBe(Math.round(30 * 7.17));
  });
});
