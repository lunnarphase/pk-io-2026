import { Link } from 'react-router-dom'
import { displayEnum } from '@/lib/utils'
import type { Recipe } from '@/types/domain'

interface SuggestionRecipeRowProps {
  recipe: Recipe
  missingCount?: number
  variant?: 'almost' | 'needs-more'
  actions?: React.ReactNode
}

export function SuggestionRecipeRow({
  recipe,
  missingCount,
  variant,
  actions,
}: SuggestionRecipeRowProps) {
  const showMissing = missingCount !== undefined
  const rowMod =
    variant === 'needs-more'
      ? ' suggest-row--needs-more'
      : showMissing
        ? ' suggest-row--almost'
        : ''

  return (
    <li className={`suggest-row${rowMod}`}>
      <div className="suggest-row__main">
        <h3 className="suggest-row__title">
          <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
        </h3>
        <div className="suggest-row__meta">
          {recipe.dietType ? <span className="suggest-row__chip">{displayEnum(recipe.dietType)}</span> : null}
          {recipe.cuisineType ? (
            <span className="suggest-row__chip">{displayEnum(recipe.cuisineType)}</span>
          ) : null}
          {recipe.estimatedKcalPerServing ? (
            <span className="suggest-row__chip">{recipe.estimatedKcalPerServing} kcal</span>
          ) : null}
          {showMissing ? (
            <span className="suggest-row__chip suggest-row__chip--match">
              Brakuje {missingCount} {missingCount === 1 ? 'składnika' : 'składników'}
            </span>
          ) : (
            <span className="suggest-row__chip suggest-row__chip--match">100% składników</span>
          )}
        </div>
      </div>
      {actions ? <div className="suggest-row__actions">{actions}</div> : null}
    </li>
  )
}
