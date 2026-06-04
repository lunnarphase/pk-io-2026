import type { IngredientPantryMatch } from '@/types/domain'
import { formatUnit } from '@/lib/utils'

function formatDeficit(quantity: number, unit: string): string {
  const rounded = Math.round(quantity * 100) / 100
  return formatUnit(rounded, unit)
}

export function getIngredientPantryTooltip(match: IngredientPantryMatch): string | undefined {
  if (match.status === 'sufficient') return undefined

  if (match.status === 'incompatible') {
    return 'W spiżarni jest inna jednostka - uzupełnij ręcznie.'
  }

  if (
    match.deficitQuantity != null &&
    match.deficitUnit &&
    match.pantryQuantity != null &&
    match.pantryUnit
  ) {
    return `Brakuje ${formatDeficit(match.deficitQuantity, match.deficitUnit)}. W spiżarni masz ${formatUnit(match.pantryQuantity, match.pantryUnit)}.`
  }

  if (match.deficitQuantity != null && match.deficitUnit) {
    return `Brakuje ${formatDeficit(match.deficitQuantity, match.deficitUnit)} w spiżarni.`
  }

  return 'Brakuje w spiżarni.'
}
