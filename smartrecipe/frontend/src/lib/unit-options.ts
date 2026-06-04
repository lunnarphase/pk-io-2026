import type { ComboboxOption } from '@/components/ui/combobox'

export const NO_UNIT = ''

/** Jednostki zgodne z UnitNormalizationService (backend). */
export const UNIT_OPTIONS: ComboboxOption[] = [
  { value: NO_UNIT, label: '- brak jednostki' },
  { value: 'g', label: 'g - gram' },
  { value: 'kg', label: 'kg - kilogram' },
  { value: 'ml', label: 'ml - mililitr' },
  { value: 'l', label: 'l - litr' },
  { value: 'szt', label: 'szt - sztuka' },
  { value: 'tbsp', label: 'tbsp - łyżka stołowa' },
  { value: 'tsp', label: 'tsp - łyżeczka' },
  { value: 'garść', label: 'garść' },
  { value: 'cup', label: 'szklanka (240 ml)' },
]

export const DEFAULT_UNIT = 'szt'

export function isKnownUnit(unit: string): boolean {
  return UNIT_OPTIONS.some((o) => o.value === unit)
}
