import { pickDefaultGramsPerPiece } from './usda-portion-grams';

describe('pickDefaultGramsPerPiece', () => {
  it('prefers medium single-piece portion (SR Legacy egg)', () => {
    const grams = pickDefaultGramsPerPiece({
      foodPortions: [
        {
          amount: 1,
          modifier: 'cup (4.86 large eggs)',
          gramWeight: 243,
        },
        { amount: 1, modifier: 'large', gramWeight: 50 },
        { amount: 1, modifier: 'medium', gramWeight: 44 },
        { amount: 1, modifier: 'small', gramWeight: 38 },
      ],
    });
    expect(grams).toBe(44);
  });

  it('uses branded serving size in grams as one serving = one piece', () => {
    expect(
      pickDefaultGramsPerPiece({
        servingSize: 28,
        servingSizeUnit: 'g',
      }),
    ).toBe(28);
  });

  it('returns null when only volume-style portions exist', () => {
    expect(
      pickDefaultGramsPerPiece({
        foodPortions: [
          { amount: 1, modifier: 'cup, chopped', gramWeight: 120 },
        ],
      }),
    ).toBeNull();
  });
});
