import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  cuisineFormOptions,
  dietFormOptions,
  parseFormValue,
  toFormValue,
} from "@/lib/filter-options";
import { CuisineType, DietType, type Recipe } from "@/types/domain";

const schema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany").max(300),
  instructions: z.string().optional(),
  estimatedKcalPerServing: z.coerce.number().int().min(0).optional(),
  servings: z.coerce.number().int().min(1).optional(),
  dietType: z.nativeEnum(DietType).optional(),
  cuisineType: z.nativeEnum(CuisineType).optional(),
});

export type RecipeFormValues = z.infer<typeof schema>;

interface RecipeFormProps {
  defaultValues?: Partial<Recipe>;
  onSubmit: (values: RecipeFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
  formId?: string;
  /** inline = under form · footer = desktop only under form · none = submit lives outside (toolbar). */
  submitPlacement?: "inline" | "footer" | "none";
  /** Toolbar / footer buttons call this to run validation + onSubmit. */
  onRegisterSubmit?: (submit: () => void) => void;
  /** Optional control beside kcal / porcja (e.g. draft estimate button). */
  kcalFieldAddon?: ReactNode;
  onRegisterFormApi?: (api: {
    setKcal: (value: number) => void;
    getServings: () => number | undefined;
  }) => void;
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = "Zapisz",
  formId = "recipe-form",
  submitPlacement = "inline",
  onRegisterSubmit,
  kcalFieldAddon,
  onRegisterFormApi,
}: RecipeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      instructions: defaultValues?.instructions ?? "",
      estimatedKcalPerServing:
        defaultValues?.estimatedKcalPerServing ?? undefined,
      servings: defaultValues?.servings ?? undefined,
      dietType: defaultValues?.dietType ?? undefined,
      cuisineType: defaultValues?.cuisineType ?? undefined,
    },
  });

  const dietType = useWatch({ control, name: "dietType" });
  const cuisineType = useWatch({ control, name: "cuisineType" });

  useEffect(() => {
    onRegisterSubmit?.(() => {
      void handleSubmit(onSubmit)();
    });
  }, [handleSubmit, onSubmit, onRegisterSubmit]);

  useEffect(() => {
    onRegisterFormApi?.({
      setKcal: (value) => setValue("estimatedKcalPerServing", value),
      getServings: () => {
        const raw = getValues("servings");
        if (raw == null) return undefined;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 1 ? Math.round(n) : undefined;
      },
    });
  }, [onRegisterFormApi, setValue, getValues]);

  return (
    <form id={formId} className="recipe-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="recipe-form__stack">
        <div className="recipe-form__field recipe-form__field--title">
          <label className="recipe-form__label" htmlFor="recipe-title">
            Tytuł
          </label>
          <Input
            id="recipe-title"
            className="recipe-form__input"
            placeholder="np. Zupa pomidorowa"
            {...register("title")}
          />
          {errors.title ? (
            <p className="recipe-form__error" role="alert">
              {errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="recipe-form__field">
          <label className="recipe-form__label" htmlFor="recipe-instructions">
            Instrukcje
          </label>
          <Controller
            name="instructions"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Krok po kroku - możesz uzupełnić później."
              />
            )}
          />
        </div>

        <div className="recipe-form__meta">
          <div className="recipe-form__field">
            <label className="recipe-form__label" htmlFor="recipe-servings">
              Porcje
            </label>
            <Input
              id="recipe-servings"
              type="number"
              min={1}
              step={1}
              className="recipe-form__input"
              placeholder="-"
              {...register("servings")}
            />
          </div>
          <div className="recipe-form__field recipe-form__field--kcal">
            <label className="recipe-form__label" htmlFor="recipe-kcal">
              kcal / porcja
            </label>
            <div className="recipe-form__kcal-row">
              <Input
                id="recipe-kcal"
                type="number"
                className="recipe-form__input"
                placeholder="-"
                {...register("estimatedKcalPerServing")}
              />
              {kcalFieldAddon}
            </div>
          </div>
          <div className="recipe-form__field">
            <label className="recipe-form__label" id="recipe-diet-label">
              Dieta
            </label>
            <Combobox
              id="recipe-diet"
              aria-labelledby="recipe-diet-label"
              value={toFormValue(dietType)}
              onValueChange={(v) =>
                setValue("dietType", parseFormValue<DietType>(v))
              }
              options={dietFormOptions()}
              placeholder="-"
              allowSearch={false}
            />
          </div>
          <div className="recipe-form__field">
            <label className="recipe-form__label" id="recipe-cuisine-label">
              Kuchnia
            </label>
            <Combobox
              id="recipe-cuisine"
              aria-labelledby="recipe-cuisine-label"
              value={toFormValue(cuisineType)}
              onValueChange={(v) =>
                setValue("cuisineType", parseFormValue<CuisineType>(v))
              }
              options={cuisineFormOptions()}
              placeholder="-"
              searchPlaceholder="Szukaj kuchni..."
            />
          </div>
        </div>
      </div>

      {submitPlacement !== "none" ? (
        <div
          className={
            submitPlacement === "footer"
              ? "recipe-form__actions recipe-form__actions--desktop"
              : "recipe-form__actions"
          }
        >
          <button
            type="submit"
            className="recipe-form__submit"
            disabled={isPending}
          >
            {isPending ? "Zapisywanie..." : submitLabel}
          </button>
        </div>
      ) : null}
    </form>
  );
}
