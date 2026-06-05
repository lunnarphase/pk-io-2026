import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setRecipeIngredients, updateRecipe } from "@/api/recipes";
import { DeleteRecipeButton } from "@/features/recipes/DeleteRecipeButton";
import { IngredientListEditor } from "@/features/recipes/IngredientListEditor";
import { LifecycleActions } from "@/features/recipes/LifecycleActions";
import { EstimateRecipeKcalButton } from "@/features/recipes/EstimateRecipeKcalButton";
import {
  RecipeForm,
  type RecipeFormValues,
} from "@/features/recipes/RecipeForm";
import { RecipeEditorShell } from "@/features/recipes/RecipeEditorShell";
import {
  recipeDraftSnapshot,
  recipeDraftSnapshotFromRecipe,
} from "@/features/recipes/recipe-draft-snapshot";
import { useRecipeDraftLeaveGuard } from "@/features/recipes/useRecipeDraftLeaveGuard";
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
    getValues: () => RecipeFormValues;
  } | null>(null);
  const linesRef = useRef<RecipeIngredientLine[]>([]);
  const baselineRef = useRef(recipeDraftSnapshotFromRecipe(recipe));
  const skipSuccessToastRef = useRef(false);
  const recipeId = recipe.id;
  const loadedRecipeIdRef = useRef(recipeId);
  const [lines, setLines] = useState<RecipeIngredientLine[]>(() =>
    (recipe.ingredients ?? []).map(normalizeIngredientLine),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    if (loadedRecipeIdRef.current === recipeId) return;
    loadedRecipeIdRef.current = recipeId;
    setLines((recipe.ingredients ?? []).map(normalizeIngredientLine));
    baselineRef.current = recipeDraftSnapshotFromRecipe(recipe);
  }, [recipe, recipeId]);

  const saveMutation = useMutation({
    mutationFn: async ({ values, lines }: SaveRecipePayload) => {
      await updateRecipe(recipe.id, {
        title: values.title.trim() || recipe.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        servings: values.servings || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      });
      await setRecipeIngredients(recipe.id, lines);
    },
    onSuccess: (_data, variables) => {
      baselineRef.current = recipeDraftSnapshot(variables.values, variables.lines);
      void qc.invalidateQueries({ queryKey: [{ resource: "recipes" }] });
      if (!skipSuccessToastRef.current) {
        toast.success("Zmiany zapisane");
      }
    },
    onError: () => {
      if (!skipSuccessToastRef.current) {
        toast.error("Nie udało się zapisać zmian");
      }
    },
  });

  const resolveDraftValues = useCallback((): RecipeFormValues => {
    return (
      formApiRef.current?.getValues() ?? {
        title: recipe.title,
        instructions: recipe.instructions ?? "",
        estimatedKcalPerServing: recipe.estimatedKcalPerServing ?? undefined,
        servings: recipe.servings ?? undefined,
        dietType: recipe.dietType,
        cuisineType: recipe.cuisineType,
      }
    );
  }, [recipe]);

  const saveDraftSnapshot = useCallback(async () => {
    const values = resolveDraftValues();
    const payload = { values, lines: linesRef.current };
    skipSuccessToastRef.current = true;
    try {
      await saveMutation.mutateAsync(payload);
    } finally {
      skipSuccessToastRef.current = false;
    }
  }, [resolveDraftValues, saveMutation]);

  const hasPendingChanges = useCallback(() => {
    return (
      recipeDraftSnapshot(resolveDraftValues(), linesRef.current) !==
      baselineRef.current
    );
  }, [resolveDraftValues]);

  useRecipeDraftLeaveGuard({
    enabled: !isDeleting,
    hasPendingChanges,
    saveDraft: saveDraftSnapshot,
  });

  const toolbar = (
    <div className="recipe-editor__toolbar-actions">
      <div className="recipe-editor__toolbar-start">
        <DeleteRecipeButton
          variant="draft"
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          disabled={saveMutation.isPending}
          onDeletingChange={setIsDeleting}
        />
      </div>
      <div className="recipe-editor__toolbar-end">
        <button
          type="button"
          className="recipe-form__submit recipe-editor__toolbar-save"
          disabled={saveMutation.isPending || isDeleting}
          onClick={() => submitFormRef.current()}
        >
          {saveMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
        <LifecycleActions recipe={recipe} />
      </div>
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
