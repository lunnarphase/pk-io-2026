import { X } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { CuisineType, DietType } from '@/types/domain'
import {
  cuisineFilterOptions,
  dietFilterOptions,
  parseFilterValue,
  toFilterValue,
} from '@/lib/filter-options'
import { displayEnum } from '@/lib/utils'

interface SuggestionFiltersProps {
  diet?: DietType
  cuisine?: CuisineType
  onDietChange: (d?: DietType) => void
  onCuisineChange: (c?: CuisineType) => void
  onClearAll?: () => void
  isUpdating?: boolean
}

export function SuggestionFilters({
  diet,
  cuisine,
  onDietChange,
  onCuisineChange,
  onClearAll,
  isUpdating = false,
}: SuggestionFiltersProps) {
  const hasActiveFilters = Boolean(diet || cuisine)

  return (
    <div
      className={isUpdating ? 'suggest-filters suggest-filters--busy' : 'suggest-filters'}
      role="search"
      aria-label="Filtry sugestii"
      aria-busy={isUpdating}
    >
      <div className="suggest-filters__grid">
        <div className="suggest-filters__field">
          <span className="suggest-filters__label" id="filter-diet-label">
            Dieta
          </span>
          <Combobox
            id="filter-diet"
            aria-labelledby="filter-diet-label"
            value={toFilterValue(diet)}
            onValueChange={(v) => onDietChange(parseFilterValue<DietType>(v))}
            options={dietFilterOptions()}
            placeholder="Wszystkie diety"
            searchPlaceholder="Szukaj diety..."
            allowSearch={false}
          />
        </div>
        <div className="suggest-filters__field">
          <span className="suggest-filters__label" id="filter-cuisine-label">
            Kuchnia
          </span>
          <Combobox
            id="filter-cuisine"
            aria-labelledby="filter-cuisine-label"
            value={toFilterValue(cuisine)}
            onValueChange={(v) => onCuisineChange(parseFilterValue<CuisineType>(v))}
            options={cuisineFilterOptions()}
            placeholder="Wszystkie kuchnie"
            searchPlaceholder="Szukaj kuchni..."
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="suggest-filters__active">
          <div className="suggest-filters__chips" aria-live="polite">
            {diet ? (
              <span className="suggest-filters__chip">
                Dieta: {displayEnum(diet)}
                <button
                  type="button"
                  className="suggest-filters__chip-remove"
                  onClick={() => onDietChange(undefined)}
                  aria-label={`Usuń filtr diety: ${displayEnum(diet)}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ) : null}
            {cuisine ? (
              <span className="suggest-filters__chip">
                Kuchnia: {displayEnum(cuisine)}
                <button
                  type="button"
                  className="suggest-filters__chip-remove"
                  onClick={() => onCuisineChange(undefined)}
                  aria-label={`Usuń filtr kuchni: ${displayEnum(cuisine)}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ) : null}
          </div>
          {onClearAll ? (
            <button type="button" className="suggest-filters__clear" onClick={onClearAll}>
              Wyczyść filtry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
