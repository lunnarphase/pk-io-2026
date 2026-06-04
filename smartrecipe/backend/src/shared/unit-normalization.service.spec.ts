import { UnitNormalizationService } from './unit-normalization.service';

describe('UnitNormalizationService', () => {
  let svc: UnitNormalizationService;

  beforeEach(() => {
    svc = new UnitNormalizationService();
  });

  describe('normalize', () => {
    it('passes g through unchanged', () => {
      expect(svc.normalize(200, 'g')).toEqual({ value: 200, baseUnit: 'g' });
    });

    it('converts kg to g', () => {
      expect(svc.normalize(1.5, 'kg')).toEqual({ value: 1500, baseUnit: 'g' });
    });

    it('converts ounce to g', () => {
      expect(svc.normalize(1, 'ounce')).toEqual({
        value: 28.3495,
        baseUnit: 'g',
      });
    });

    it('converts tablespoons to tsp', () => {
      expect(svc.normalize(2, 'tablespoons')).toEqual({
        value: 6,
        baseUnit: 'tsp',
      });
    });

    it('converts teaspoons to tsp', () => {
      expect(svc.normalize(4, 'teaspoons')).toEqual({
        value: 4,
        baseUnit: 'tsp',
      });
    });

    it('converts łyżka to tsp (×3)', () => {
      expect(svc.normalize(2, 'łyżka')).toEqual({
        value: 6,
        baseUnit: 'tsp',
      });
    });

    it('converts cup to ml (×240)', () => {
      expect(svc.normalize(1, 'cup')).toEqual({ value: 240, baseUnit: 'ml' });
    });

    it('is case-insensitive for units', () => {
      expect(svc.normalize(1, 'KG')).toEqual({ value: 1000, baseUnit: 'g' });
    });
  });

  describe('resolveForStorage', () => {
    it('maps ounces to grams', () => {
      const result = svc.resolveForStorage(2, 'ounces');
      expect(result.unit).toBe('g');
      expect(result.quantity).toBeCloseTo(56.7, 0);
    });

    it('maps tablespoons to tbsp', () => {
      expect(svc.resolveForStorage(2, 'tablespoons')).toEqual({
        quantity: 2,
        unit: 'tbsp',
      });
    });

    it('maps teaspoons to tsp (or tbsp when equivalent)', () => {
      expect(svc.resolveForStorage(2, 'teaspoons')).toEqual({
        quantity: 2,
        unit: 'tsp',
      });
      expect(svc.resolveForStorage(3, 'teaspoons')).toEqual({
        quantity: 1,
        unit: 'tbsp',
      });
    });

    it('maps grams label to g', () => {
      expect(svc.resolveForStorage(250, 'grams')).toEqual({
        quantity: 250,
        unit: 'g',
      });
    });

    it('maps empty unit to szt', () => {
      expect(svc.resolveForStorage(1, '')).toEqual({
        quantity: 1,
        unit: 'szt',
      });
    });

    it('maps unknown piece-like labels to szt', () => {
      expect(svc.resolveForStorage(2, 'cloves')).toEqual({
        quantity: 2,
        unit: 'szt',
      });
    });

    it('converts large ml to liters', () => {
      expect(svc.resolveForStorage(1500, 'milliliters')).toEqual({
        quantity: 1.5,
        unit: 'l',
      });
    });
  });

  describe('toGrams', () => {
    it('returns grams for weight units', () => {
      expect(svc.toGrams(500, 'g')).toBe(500);
      expect(svc.toGrams(1, 'kg')).toBe(1000);
    });

    it('treats ml as ~1 g/ml', () => {
      expect(svc.toGrams(250, 'ml')).toBe(250);
    });

    it('returns null for piece-like units', () => {
      expect(svc.toGrams(2, 'szt')).toBeNull();
      expect(svc.toGrams(1, 'łyżka')).toBeNull();
    });
  });

  describe('canCompare', () => {
    it('g and kg are comparable', () => {
      expect(svc.canCompare('g', 'kg')).toBe(true);
    });

    it('tablespoons and tsp are comparable', () => {
      expect(svc.canCompare('tablespoons', 'tsp')).toBe(true);
    });

    it('g and ml are NOT comparable', () => {
      expect(svc.canCompare('g', 'ml')).toBe(false);
    });
  });

  describe('isSufficient', () => {
    it('cross-unit: 1 kg pantry satisfies 800 g recipe', () => {
      expect(svc.isSufficient(1, 'kg', 800, 'g')).toBe(true);
    });

    it('3 tbsp pantry satisfies 6 tsp recipe', () => {
      expect(svc.isSufficient(3, 'tbsp', 6, 'tsp')).toBe(true);
    });
  });

  describe('subtractQuantities', () => {
    it('subtracts cross-unit (1 kg − 200 g = 800 g)', () => {
      expect(svc.subtractQuantities(1, 'kg', 200, 'g', 'g')).toBe(800);
    });
  });
});
