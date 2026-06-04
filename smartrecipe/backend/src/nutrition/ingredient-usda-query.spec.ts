import { buildUsdaSearchQueries } from './ingredient-usda-query';

describe('buildUsdaSearchQueries', () => {
  it('puts English translation first', () => {
    expect(buildUsdaSearchQueries('mąka', 'wheat flour')).toEqual([
      'wheat flour',
      'mąka',
    ]);
  });

  it('falls back to Polish name only when translation is missing', () => {
    expect(buildUsdaSearchQueries('tofu', null)).toEqual(['tofu']);
  });

  it('deduplicates when translation matches normalized Polish', () => {
    expect(buildUsdaSearchQueries('Tofu', 'tofu')).toEqual(['tofu']);
  });
});
