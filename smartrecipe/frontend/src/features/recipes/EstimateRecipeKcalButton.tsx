import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { estimateRecipeKcal, type RecipeKcalEstimate } from "@/api/recipes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { normalizeRecipeIngredientLines } from "@/lib/recipe-ingredients";
import { skipSummary } from "@/lib/recipe-kcal-skip-summary";
import type { RecipeIngredientLine } from "@/types/domain";

interface EstimateRecipeKcalButtonProps {
  recipeId: string;
  lines: RecipeIngredientLine[];
  /** Porcje z formularza lub zapisane w przepisie - wstępna wartość w dialogu. */
  resolveDefaultServings?: () => number | null | undefined;
  onEstimated: (result: RecipeKcalEstimate) => void;
}

function formatServingsInput(value: number | null | undefined): string {
  if (value != null && Number.isFinite(value) && value >= 1) {
    return String(Math.round(value));
  }
  return "1";
}

export function EstimateRecipeKcalButton({
  recipeId,
  lines,
  resolveDefaultServings,
  onEstimated,
}: EstimateRecipeKcalButtonProps) {
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState("1");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setServings(formatServingsInput(resolveDefaultServings?.()));
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = Number.parseInt(servings, 10);
      const safeServings = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
      return estimateRecipeKcal(recipeId, {
        servings: safeServings,
        ingredients: normalizeRecipeIngredientLines(lines),
      });
    },
    onSuccess: (result) => {
      onEstimated(result);
      handleOpenChange(false);
      const base = `~${result.estimatedKcalPerServing} kcal/porcja (${result.includedCount} składników, ${result.servings} porc.)`;
      if (result.skipped.length > 0) {
        toast.success(base);
        toast.info(skipSummary(result.skipped), { duration: 8000 });
      } else {
        toast.success(base);
      }
    },
    onError: (err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String(
              (err.response.data as { message: string | string[] }).message,
            )
          : null;
      toast.error(
        Array.isArray(msg)
          ? msg.join(", ")
          : (msg ?? "Nie udało się obliczyć kcal"),
      );
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="recipe-form__estimate-kcal"
        onClick={() => handleOpenChange(true)}
        disabled={lines.length === 0}
      >
        Oblicz kcal
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="recipe-kcal-dialog">
          <DialogHeader>
            <DialogTitle className="recipe-kcal-dialog__title">
              Kalorie przepisu
            </DialogTitle>
            <p className="recipe-kcal-dialog__lede">
              Sumujemy składniki z zapisaną kaloryką na 100 g i ilością w
              gramach lub ml (1 ml ≈ 1 g). Używamy liczby porcji z dialogu
              (domyślnie z pola „Porcje”, jeśli zapisane). Wynik trafi do kcal /
              porcja - zapisz przepis, żeby utrwalić.
            </p>
          </DialogHeader>

          <div className="recipe-kcal-dialog__field">
            <label
              className="recipe-kcal-dialog__label"
              htmlFor="kcal-servings"
            >
              Liczba porcji
            </label>
            <Input
              id="kcal-servings"
              type="number"
              min={1}
              step={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>

          <div className="recipe-kcal-dialog__actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Liczenie..." : "Oblicz"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
