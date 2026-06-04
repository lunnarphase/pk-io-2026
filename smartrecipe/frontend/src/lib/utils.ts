import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CuisineType, DietType, RecipeLifecycleStatus } from '@/types/domain'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DIET_LABELS: Record<DietType, string> = {
  [DietType.OMNIVORE]: 'Wszystkożerny',
  [DietType.VEGETARIAN]: 'Wegetariańska',
  [DietType.VEGAN]: 'Wegańska',
  [DietType.KETO]: 'Keto',
}

const CUISINE_LABELS: Record<CuisineType, string> = {
  [CuisineType.ITALIAN]: 'Włoska',
  [CuisineType.POLISH]: 'Polska',
  [CuisineType.EUROPEAN_OTHER]: 'Europejska',
  [CuisineType.SOUTH_AMERICAN]: 'Południowoamerykańska',
  [CuisineType.MIDDLE_EASTERN]: 'Bliskowschodnia',
  [CuisineType.ASIAN]: 'Azjatycka',
  [CuisineType.OTHER]: 'Inna',
}

const STATUS_LABELS: Record<RecipeLifecycleStatus, string> = {
  [RecipeLifecycleStatus.DRAFT]: 'Szkic',
  [RecipeLifecycleStatus.ACTIVE]: 'Aktywny',
  [RecipeLifecycleStatus.ARCHIVED]: 'Archiwum',
}

export function displayEnum(value: DietType | CuisineType | RecipeLifecycleStatus | null | undefined): string {
  if (!value) return '-'
  if (value in DIET_LABELS) return DIET_LABELS[value as DietType]
  if (value in CUISINE_LABELS) return CUISINE_LABELS[value as CuisineType]
  if (value in STATUS_LABELS) return STATUS_LABELS[value as RecipeLifecycleStatus]
  return value
}

export function formatUnit(quantity: number, unit: string): string {
  if (!unit) return ''
  const q = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1)
  return `${q} ${unit}`
}
