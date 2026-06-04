import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getRecipe } from "@/api/recipes";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeDetailView } from "@/features/recipes/RecipeDetailView";
import { RecipeDraftDetail } from "@/features/recipes/RecipeDraftDetail";
import { queryKeys } from "@/lib/query-keys";
import { RecipeLifecycleStatus } from "@/types/domain";

export function RecipeDetailPage() {
  const { id = "" } = useParams();

  const {
    data: recipe,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => getRecipe(id),
    enabled: Boolean(id),
    staleTime: 120_000,
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !recipe) {
    return (
      <p className="recipes-error" role="alert">
        Nie znaleziono przepisu.
      </p>
    );
  }

  if (recipe.lifecycleStatus === RecipeLifecycleStatus.DRAFT) {
    return <RecipeDraftDetail recipe={recipe} />;
  }

  return <RecipeDetailView recipe={recipe} />;
}
