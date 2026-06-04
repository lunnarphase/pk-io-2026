import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { IngredientCombobox } from "@/components/domain/IngredientCombobox";
import { UnitCombobox } from "@/components/domain/UnitCombobox";
import { DEFAULT_UNIT } from "@/lib/unit-options";
import type { Ingredient, PantryItem } from "@/types/domain";

const schema = z.object({
  quantity: z.coerce.number().positive("Ilość musi być dodatnia"),
  unit: z.string().min(1, "Wybierz jednostkę"),
});

type FormValues = z.infer<typeof schema>;

interface UpsertPantryItemDialogProps {
  trigger: React.ReactNode;
  item?: PantryItem;
  onSubmit: (ingredientId: string, values: FormValues) => void;
}

export function UpsertPantryItemDialog({
  trigger,
  item,
  onSubmit,
}: UpsertPantryItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, unit: DEFAULT_UNIT },
  });

  function resolveIngredientId(): string | undefined {
    return item?.ingredientId ?? ingredient?.id;
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      if (item) {
        reset({ quantity: Number(item.quantity), unit: item.unit });
        const ing = item.ingredient;
        setIngredient(ing ?? { id: item.ingredientId, name: "" });
      } else {
        reset({ quantity: 1, unit: DEFAULT_UNIT });
        setIngredient(null);
      }
      return;
    }
    if (!item) {
      setIngredient(null);
    }
  }

  const ingredientId = resolveIngredientId();
  const canSave = Boolean(ingredientId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="pantry-dialog">
        <DialogHeader className="pantry-dialog__header">
          <DialogTitle className="pantry-dialog__title">
            {item ? "Edytuj pozycję" : "Dodaj do spiżarni"}
          </DialogTitle>
        </DialogHeader>

        <div className="pantry-dialog__body">
          {item ? (
            <p className="pantry-dialog__ingredient-name">
              {item.ingredient?.name ?? item.ingredientId}
            </p>
          ) : (
            <IngredientCombobox value={ingredient} onChange={setIngredient} />
          )}

          <form
            className="pantry-dialog__form"
            onSubmit={handleSubmit((values) => {
              const id = resolveIngredientId();
              if (!id) return;
              onSubmit(id, values);
              setOpen(false);
            })}
          >
            <div className="pantry-dialog__field">
              <label className="pantry-dialog__label" htmlFor="pantry-qty">
                Ilość
              </label>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    id="pantry-qty"
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    step="any"
                    stepAmount={1}
                    minValue={0.01}
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(raw === "" ? "" : Number.parseFloat(raw));
                    }}
                  />
                )}
              />
              {errors.quantity ? (
                <p className="pantry-dialog__error" role="alert">
                  {errors.quantity.message}
                </p>
              ) : null}
            </div>

            <div className="pantry-dialog__field">
              <label className="pantry-dialog__label" id="pantry-unit-label">
                Jednostka
              </label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <UnitCombobox
                    id="pantry-unit"
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-labelledby="pantry-unit-label"
                  />
                )}
              />
              {errors.unit ? (
                <p className="pantry-dialog__error" role="alert">
                  {errors.unit.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="pantry-dialog__submit"
              disabled={!canSave}
            >
              Zapisz
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
