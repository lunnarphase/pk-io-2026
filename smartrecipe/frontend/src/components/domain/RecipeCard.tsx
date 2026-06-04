import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { displayEnum } from "@/lib/utils";
import type { Recipe } from "@/types/domain";

interface RecipeCardProps {
  recipe: Recipe;
  missingCount?: number;
  actions?: React.ReactNode;
}

export function RecipeCard({ recipe, missingCount, actions }: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <h3 className="recipe-card__title">
        <Link
          to={`/recipes/${recipe.id}`}
          className="hover:text-[var(--color-accent)]"
        >
          {recipe.title}
        </Link>
      </h3>
      <div className="flex flex-wrap gap-2">
        {recipe.dietType ? <Badge>{displayEnum(recipe.dietType)}</Badge> : null}
        {recipe.cuisineType ? (
          <Badge variant="muted">{displayEnum(recipe.cuisineType)}</Badge>
        ) : null}
        {recipe.estimatedKcalPerServing ? (
          <Badge variant="muted">{recipe.estimatedKcalPerServing} kcal</Badge>
        ) : null}
        {missingCount === undefined ? (
          <Badge variant="accent">100% składników</Badge>
        ) : (
          <Badge variant="accent">Brakuje {missingCount} składników</Badge>
        )}
      </div>
      {actions ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-2">{actions}</div>
      ) : null}
    </article>
  );
}
