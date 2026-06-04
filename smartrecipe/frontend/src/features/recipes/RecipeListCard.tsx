import { Link } from 'react-router-dom'
import { displayEnum } from '@/lib/utils'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'

const STATUS_CLASS: Record<RecipeLifecycleStatus, string> = {
  [RecipeLifecycleStatus.DRAFT]: 'recipes-card__status--draft',
  [RecipeLifecycleStatus.ACTIVE]: 'recipes-card__status--active',
  [RecipeLifecycleStatus.ARCHIVED]: 'recipes-card__status--archived',
}

const MAX_INGREDIENT_NAMES = 5

interface RecipeListCardProps {
  recipe: Recipe
}

function recipeIngredientNames(recipe: Recipe): {
  items: { id: string; name: string }[]
  extra: number
} {
  const lines = recipe.ingredients ?? []
  const items = lines
    .map((line) => {
      const name = line.ingredient?.name?.trim()
      if (!name) return null
      return { id: line.ingredientId, name }
    })
    .filter((item): item is { id: string; name: string } => item !== null)
  return {
    items: items.slice(0, MAX_INGREDIENT_NAMES),
    extra: Math.max(0, items.length - MAX_INGREDIENT_NAMES),
  }
}

export function RecipeListCard({ recipe }: RecipeListCardProps) {
  const { items, extra } = recipeIngredientNames(recipe)
  const hasMeta = Boolean(recipe.dietType || recipe.cuisineType)
  const href = `/recipes/${recipe.id}`

  return (
    <Link to={href} className="recipes-card">
      <div className="recipes-card__top">
        <span className={`recipes-card__status ${STATUS_CLASS[recipe.lifecycleStatus]}`}>
          {displayEnum(recipe.lifecycleStatus)}
        </span>
        {recipe.estimatedKcalPerServing ? (
          <span className="recipes-card__kcal">{recipe.estimatedKcalPerServing} kcal</span>
        ) : (
          <span className="recipes-card__kcal recipes-card__kcal--placeholder" aria-hidden="true">
            -
          </span>
        )}
      </div>

      <h2 className="recipes-card__title">{recipe.title}</h2>

      {hasMeta ? (
        <div className="recipes-card__meta">
          {recipe.dietType ? (
            <span className="recipes-card__chip">{displayEnum(recipe.dietType)}</span>
          ) : null}
          {recipe.cuisineType ? (
            <span className="recipes-card__chip">{displayEnum(recipe.cuisineType)}</span>
          ) : null}
        </div>
      ) : (
        <div className="recipes-card__meta recipes-card__meta--placeholder" aria-hidden="true" />
      )}

      {items.length > 0 ? (
        <ul className="recipes-card__ingredients" aria-label="Składniki">
          {items.map((item) => (
            <li key={item.id} className="recipes-card__ingredient" title={item.name}>
              {item.name}
            </li>
          ))}
          {extra > 0 ? (
            <li className="recipes-card__ingredient recipes-card__ingredient--more">
              +{extra} więcej
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="recipes-card__ingredients-empty">Brak składników</p>
      )}

      <span className="recipes-card__cta">Otwórz przepis →</span>
    </Link>
  )
}
