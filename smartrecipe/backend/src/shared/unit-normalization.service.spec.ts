import { UnitNormalizationService } from './unit-normalization.service';

describe('UnitNormalizationService', () => {
  let svc: UnitNormalizationService;

  beforeEach(() => {
    svc = new UnitNormalizationService();
  });

  // ── normalize ─────────────────────────────────────────────────────────
  describe('normalize', () => {
    it('passes g through unchanged', () => {
      expect(svc.normalize(200, 'g')).toEqual({ value: 200, baseUnit: 'g' });
    });

    it('converts kg to g', () => {
      expect(svc.normalize(1.5, 'kg')).toEqual({ value: 1500, baseUnit: 'g' });
    });

    it('passes ml through unchanged', () => {
      expect(svc.normalize(500, 'ml')).toEqual({ value: 500, baseUnit: 'ml' });
    });

    it('converts l to ml', () => {
      expect(svc.normalize(2, 'l')).toEqual({ value: 2000, baseUnit: 'ml' });
    });

    it('converts łyżka to łyżeczka (×3)', () => {
      expect(svc.normalize(2, 'łyżka')).toEqual({
        value: 6,
        baseUnit: 'łyżeczka',
      });
    });

    it('converts łyżki to łyżeczka (×3)', () => {
      expect(svc.normalize(3, 'łyżki')).toEqual({
        value: 9,
        baseUnit: 'łyżeczka',
      });
    });

    it('passes łyżeczka through unchanged', () => {
      expect(svc.normalize(4, 'łyżeczka')).toEqual({
        value: 4,
        baseUnit: 'łyżeczka',
      });
    });

    it('converts cup to ml (×240)', () => {
      expect(svc.normalize(1, 'cup')).toEqual({ value: 240, baseUnit: 'ml' });
    });

    it('converts tbsp to tsp (×3)', () => {
      expect(svc.normalize(2, 'tbsp')).toEqual({ value: 6, baseUnit: 'tsp' });
    });

    it('returns original unit for unknowns', () => {
      expect(svc.normalize(3, 'szczypta')).toEqual({
        value: 3,
        baseUnit: 'szczypta',
      });
    });

    it('is case-insensitive for units', () => {
      expect(svc.normalize(1, 'KG')).toEqual({ value: 1000, baseUnit: 'g' });
    });

    it('converts quantity stored as decimal string correctly', () => {
      expect(svc.normalize(Number('0.5'), 'kg')).toEqual({
        value: 500,
        baseUnit: 'g',
      });
    });
  });

  // ── canCompare ────────────────────────────────────────────────────────
  describe('canCompare', () => {
    it('g and kg are comparable', () => {
      expect(svc.canCompare('g', 'kg')).toBe(true);
    });

    it('ml and l are comparable', () => {
      expect(svc.canCompare('ml', 'l')).toBe(true);
    });

    it('łyżka and łyżeczka are comparable', () => {
      expect(svc.canCompare('łyżka', 'łyżeczka')).toBe(true);
    });

    it('g and ml are NOT comparable', () => {
      expect(svc.canCompare('g', 'ml')).toBe(false);
    });

    it('szt and g are NOT comparable', () => {
      expect(svc.canCompare('szt', 'g')).toBe(false);
    });

    it('same unknown units are comparable with themselves', () => {
      expect(svc.canCompare('szczypta', 'szczypta')).toBe(true);
    });

    it('different unknown units are NOT comparable', () => {
      expect(svc.canCompare('szczypta', 'garść')).toBe(false);
    });
  });

  // ── isSufficient ──────────────────────────────────────────────────────
  describe('isSufficient', () => {
    it('returns true when pantry quantity exceeds recipe need (same unit)', () => {
      expect(svc.isSufficient(500, 'g', 200, 'g')).toBe(true);
    });

    it('returns true when pantry quantity equals recipe need exactly', () => {
      expect(svc.isSufficient(200, 'g', 200, 'g')).toBe(true);
    });

    it('returns false when pantry quantity is less than recipe need', () => {
      expect(svc.isSufficient(100, 'g', 200, 'g')).toBe(false);
    });

    it('cross-unit: 1 kg pantry satisfies 800 g recipe', () => {
      expect(svc.isSufficient(1, 'kg', 800, 'g')).toBe(true);
    });

    it('cross-unit: 200 ml pantry does NOT satisfy 1 l recipe', () => {
      expect(svc.isSufficient(200, 'ml', 1, 'l')).toBe(false);
    });

    it('cross-unit: 2 l pantry satisfies 500 ml recipe', () => {
      expect(svc.isSufficient(2, 'l', 500, 'ml')).toBe(true);
    });

    it('returns false when units are incomparable (g vs szt)', () => {
      expect(svc.isSufficient(1000, 'g', 2, 'szt')).toBe(false);
    });

    it('3 łyżki pantry satisfies 2 łyżeczki recipe (9 tsp ≥ 2 tsp)', () => {
      expect(svc.isSufficient(3, 'łyżki', 2, 'łyżeczka')).toBe(true);
    });
  });
});
