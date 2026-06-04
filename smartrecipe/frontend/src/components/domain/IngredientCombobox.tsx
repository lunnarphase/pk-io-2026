import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { createIngredient, searchIngredients } from "@/api/ingredients";
import { useDebounce } from "@/hooks/useDebounce";
import { queryKeys } from "@/lib/query-keys";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { Ingredient } from "@/types/domain";

interface IngredientComboboxProps {
  value: Ingredient | null;
  onChange: (ingredient: Ingredient | null) => void;
  label?: string;
}

export function IngredientCombobox({
  value,
  onChange,
  label = "Szukaj składnika",
}: IngredientComboboxProps) {
  const valueKey = value?.id ?? "";
  const [prevValueKey, setPrevValueKey] = useState(valueKey);
  const [search, setSearch] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);

  if (prevValueKey !== valueKey) {
    setPrevValueKey(valueKey);
    setSearch(value?.name ?? "");
  }
  const debounced = useDebounce(search, 300);
  const queryTerm = debounced.trim();
  const inputId = useId();
  const listboxId = useId();

  const { data = [], isFetching } = useQuery({
    queryKey: queryKeys.ingredients(queryTerm || "__default__"),
    queryFn: () => searchIngredients(queryTerm),
    staleTime: 300_000,
    enabled: open,
  });

  const showCreate =
    queryTerm.length >= 2 &&
    !data.some((i) => i.name.toLowerCase() === queryTerm.toLowerCase());

  async function handleCreate() {
    const name = search.trim();
    if (!name) return;
    const created = await createIngredient(name);
    onChange(created);
    setSearch(created.name);
    setOpen(false);
  }

  function handleSelect(item: Ingredient) {
    onChange(item);
    setSearch(item.name);
    setOpen(false);
  }

  function handleSearchChange(next: string) {
    setSearch(next);
    if (value && next.trim() !== value.name) {
      onChange(null);
    }
    setOpen(true);
  }

  function openPicker() {
    setOpen(true);
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className="ingredient-search">
        <label className="ingredient-search__label" htmlFor={inputId}>
          {label}
        </label>
        <PopoverAnchor asChild>
          <div className="ingredient-search__anchor">
            <Input
              id={inputId}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={openPicker}
              onClick={openPicker}
              placeholder="np. mąka pszenna"
              role="combobox"
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              aria-autocomplete="list"
              autoComplete="off"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="ingredient-search__popover"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          {!queryTerm && data.length > 0 ? (
            <p className="ingredient-search__hint">Składniki z katalogu</p>
          ) : null}
          {isFetching ? (
            <p className="ingredient-search__status">Szukam...</p>
          ) : null}
          {data.length > 0 ? (
            <ul
              id={listboxId}
              className="ingredient-search__list"
              role="listbox"
              data-scroll-lock-scrollable=""
              onWheel={(e) => e.stopPropagation()}
            >
              {data.map((item) => (
                <li key={item.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className="ingredient-search__item"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : !isFetching ? (
            <p className="ingredient-search__status">
              {queryTerm ? "Brak wyników" : "Katalog jest pusty"}
            </p>
          ) : null}
          {showCreate ? (
            <div className="ingredient-search__footer">
              <button
                type="button"
                className="ingredient-search__create"
                onPointerDown={(e) => {
                  e.preventDefault();
                  void handleCreate();
                }}
              >
                Utwórz „{search.trim()}”
              </button>
            </div>
          ) : null}
        </PopoverContent>
      </div>
    </Popover>
  );
}
