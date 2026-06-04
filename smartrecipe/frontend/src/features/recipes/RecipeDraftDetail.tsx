import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { setRecipeIngredients, updateRecipe } from "@/api/recipes";
import { IngredientListEditor } from "@/features/recipes/IngredientListEditor";
import { LifecycleActions } from "@/features/recipes/LifecycleActions";
import { EstimateRecipeKcalButton } from "@/features/recipes/EstimateRecipeKcalButton";
import {
  RecipeForm,
  type RecipeFormValues,
} from "@/features/recipes/RecipeForm";
import { RecipeEditorShell } from "@/features/recipes/RecipeEditorShell";
import { normalizeIngredientLine } from "@/lib/recipe-ingredients";
import { displayEnum } from "@/lib/utils";
import {
  RecipeLifecycleStatus,
  type Recipe,
  type RecipeIngredientLine,
} from "@/types/domain";

const FORM_ID = "recipe-detail-form";

interface SaveRecipePayload {
  values: RecipeFormValues;
  lines: RecipeIngredientLine[];
}

interface RecipeDraftDetailProps {
  recipe: Recipe;
}

export function RecipeDraftDetail({ recipe }: RecipeDraftDetailProps) {
  const qc = useQueryClient();
  const submitFormRef = useRef<() => void>(() => {});
  const formApiRef = useRef<{
    setKcal: (value: number) => void;
    getServings: () => number | undefined;
  } | null>(null);
  const recipeId = recipe.id;
  const [syncedRecipeId, setSyncedRecipeId] = useState(recipeId);
  const [lines, setLines] = useState<RecipeIngredientLine[]>(() =>
    (recipe.ingredients ?? []).map(normalizeIngredientLine),
  );

  if (syncedRecipeId !== recipeId) {
    setSyncedRecipeId(recipeId);
    setLines((recipe.ingredients ?? []).map(normalizeIngredientLine));
  }

  const saveMutation = useMutation({
    mutationFn: async ({ values, lines }: SaveRecipePayload) => {
      await updateRecipe(recipe.id, {
        title: values.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        servings: values.servings || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      });
      await setRecipeIngredients(recipe.id, lines);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: "recipes" }] });
      toast.success("Zmiany zapisane");
    },
    onError: () => toast.error("Nie udało się zapisać zmian"),
  });

  const toolbar = (
    <div className="recipe-editor__toolbar-actions">
      <button
        type="button"
        className="recipe-form__submit recipe-editor__toolbar-save"
        disabled={saveMutation.isPending}
        onClick={() => submitFormRef.current()}
      >
        {saveMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
      </button>
      <LifecycleActions recipe={recipe} />
    </div>
  );

  return (
    <RecipeEditorShell
      title={recipe.title}
      lede="Szkic - uzupełnij dane i składniki, zapisz zmiany, a gdy będzie gotowy opublikuj."
      status={
        <span className="recipe-editor__status recipe-editor__status--draft">
          {displayEnum(RecipeLifecycleStatus.DRAFT)}
        </span>
      }
      toolbar={toolbar}
      main={
        <RecipeForm
          formId={FORM_ID}
          defaultValues={recipe}
          onSubmit={(values) => saveMutation.mutate({ values, lines })}
          isPending={saveMutation.isPending}
          submitPlacement="none"
          onRegisterSubmit={(submit) => {
            submitFormRef.current = submit;
          }}
          onRegisterFormApi={(api) => {
            formApiRef.current = api;
          }}
          kcalFieldAddon={
            <EstimateRecipeKcalButton
              recipeId={recipe.id}
              lines={lines}
              resolveDefaultServings={() =>
                formApiRef.current?.getServings() ?? recipe.servings
              }
              onEstimated={(result) => {
                formApiRef.current?.setKcal(result.estimatedKcalPerServing);
              }}
            />
          }
        />
      }
      aside={<IngredientListEditor lines={lines} onChange={setLines} />}
    />
  );
}
