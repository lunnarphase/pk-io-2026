import DOMPurify from "dompurify";
import { RecipeLifecycleStatus, type Recipe } from "@/types/domain";
import { AddRecipeToShoppingListButton } from "@/features/recipes/AddRecipeToShoppingListButton";
import { CookRecipeButton } from "@/features/recipes/CookRecipeButton";
import { getIngredientPantryTooltip } from "@/features/recipes/recipe-pantry-tooltip";
import { LifecycleActions } from "@/features/recipes/LifecycleActions";
import { RecipeEditorShell } from "@/features/recipes/RecipeEditorShell";
import { cn, displayEnum, formatUnit } from "@/lib/utils";

interface RecipeDetailViewProps {
  recipe: Recipe;
}

export function RecipeDetailView({ recipe }: RecipeDetailViewProps) {
  const ingredients = recipe.ingredients ?? [];
  const isActive = recipe.lifecycleStatus === RecipeLifecycleStatus.ACTIVE;
  const hasIngredients = ingredients.length > 0;
  const pantryMissing = recipe.pantryMissingCount;
  const canCook =
    isActive && hasIngredients && pantryMissing !== undefined && pantryMissing === 0;
  const showAddMissing =
    isActive &&
    hasIngredients &&
    (pantryMissing === undefined || pantryMissing > 0);

  const toolbar = (
    <div className="recipe-editor__toolbar-actions">
      {canCook ? <CookRecipeButton recipeId={recipe.id} /> : null}
      {showAddMissing ? (
        <AddRecipeToShoppingListButton recipeId={recipe.id} />
      ) : null}
      <LifecycleActions recipe={recipe} />
    </div>
  );

  return (
    <RecipeEditorShell
      className="recipe-detail-view"
      title={recipe.title}
      lede={
        isActive
          ? "Opublikowany przepis - przeglądasz skład i instrukcje. Aby edytować, cofnij do szkicu."
          : "Przepis w archiwum - tylko podgląd. Przywróć, jeśli chcesz z niego ponownie korzystać."
      }
      mainPanelTitle="Przepis"
      status={
        <span
          className={`recipe-editor__status recipe-editor__status--${recipe.lifecycleStatus.toLowerCase()}`}
        >
          {displayEnum(recipe.lifecycleStatus)}
        </span>
      }
      toolbar={toolbar}
      main={
        <article className="recipe-detail-view__body">
          <dl className="recipe-detail-view__meta">
            {recipe.servings != null ? (
              <div className="recipe-detail-view__meta-item">
                <dt>Porcje</dt>
                <dd>{recipe.servings}</dd>
              </div>
            ) : null}
            {recipe.estimatedKcalPerServing != null ? (
              <div className="recipe-detail-view__meta-item">
                <dt>kcal / porcja</dt>
                <dd>{recipe.estimatedKcalPerServing}</dd>
              </div>
            ) : null}
            {recipe.dietType ? (
              <div className="recipe-detail-view__meta-item">
                <dt>Dieta</dt>
                <dd>{displayEnum(recipe.dietType)}</dd>
              </div>
            ) : null}
            {recipe.cuisineType ? (
              <div className="recipe-detail-view__meta-item">
                <dt>Kuchnia</dt>
                <dd>{displayEnum(recipe.cuisineType)}</dd>
              </div>
            ) : null}
          </dl>

          {recipe.instructions ? (
            <section
              className="recipe-detail-view__section"
              aria-labelledby="recipe-view-instructions"
            >
              <h3
                id="recipe-view-instructions"
                className="recipe-detail-view__section-title"
              >
                Instrukcje
              </h3>
              <div
                className="recipe-detail-view__instructions rte-output"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(recipe.instructions),
                }}
              />
            </section>
          ) : (
            <p className="recipe-detail-view__empty">Brak instrukcji.</p>
          )}
        </article>
      }
      aside={
        ingredients.length > 0 ? (
          <ul className="recipe-detail__ingredients-read recipe-detail-view__ingredients">
            {ingredients.map((l) => {
              const match = isActive ? l.pantryMatch : undefined;
              const isShort = match != null && match.status !== "sufficient";
              const tooltip = match ? getIngredientPantryTooltip(match) : undefined;

              return (
                <li key={l.ingredientId}>
                  <span className="recipe-detail__ingredient-name">
                    {l.ingredient?.name ?? l.ingredientId}
                  </span>
                  {l.unit ? (
                    <span
                      className={cn(
                        "recipe-detail__ingredient-qty",
                        isShort && "recipe-detail__ingredient-qty--short",
                        tooltip && "recipe-detail__ingredient-qty--tip",
                      )}
                      {...(tooltip
                        ? {
                            "data-tooltip": tooltip,
                            tabIndex: 0,
                            "aria-label": tooltip,
                          }
                        : {})}
                    >
                      {formatUnit(Number(l.quantity), l.unit)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="recipe-ingredients__empty">Brak składników w tym przepisie.</p>
        )
      }
    />
  );
}
