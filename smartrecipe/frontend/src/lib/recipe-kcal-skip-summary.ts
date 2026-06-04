import type { RecipeKcalEstimate } from '@/api/recipes'

export function skipSummary(skipped: RecipeKcalEstimate['skipped']): string {
  const noKcal = skipped.filter((s) => s.reason === 'no_kcal_data').length
  const noMass = skipped.filter((s) => s.reason === 'no_mass_unit').length
  const parts: string[] = []
  if (noKcal > 0) {
    parts.push(
      `${noKcal} bez kaloryki (ustaw „kcal / 100 g” przy składniku)`,
    )
  }
  if (noMass > 0) {
    parts.push(
      `${noMass} w szt./łyżkach - użyj gramów lub ml, żeby wliczyć`,
    )
  }
  return parts.join(' · ')
}
