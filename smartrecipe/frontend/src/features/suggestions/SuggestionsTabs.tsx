import { useEffect, useId } from "react";
import { Link } from "react-router-dom";
import { AddRecipeToShoppingListButton } from "@/features/recipes/AddRecipeToShoppingListButton";
import { SuggestionRecipeRow } from "@/features/suggestions/SuggestionRecipeRow";
import type { SuggestTabId } from "@/features/suggestions/suggest-tab-utils";
import type { Recipe } from "@/types/domain";

type AlmostEntry = { recipe: Recipe; missingCount: number };

interface TabDef {
  id: SuggestTabId;
  label: string;
  shortLabel: string;
  lede: string;
  empty: string;
}

const TAB_DEFS: TabDef[] = [
  {
    id: "ready",
    label: "Ze spiżarni",
    shortLabel: "Ready!",
    lede: "Masz wszystkie składniki - możesz od razu gotować.",
    empty: "Brak w pełni dopasowanych przepisów przy tych filtrach.",
  },
  {
    id: "almost",
    label: "Lekkie braki",
    shortLabel: "Lekkie braki",
    lede: "Brakuje co najwyżej dwóch składników - dodaj je na listę zakupów.",
    empty: "Żaden przepis nie mieści się w tym progu.",
  },
  {
    id: "needs-more",
    label: "Konieczne zakupy",
    shortLabel: "Na zakupy!",
    lede: "Do tych dań potrzebujesz większych zakupów.",
    empty:
      "Żaden aktywny przepis nie wymaga więcej niż dwóch brakujących składników.",
  },
];

interface SuggestionsTabsProps {
  activeTab: SuggestTabId;
  onTabChange: (tab: SuggestTabId) => void;
  available: Recipe[];
  almostAvailable: AlmostEntry[];
  needsMore: AlmostEntry[];
}

export function SuggestionsTabs({
  activeTab,
  onTabChange,
  available,
  almostAvailable,
  needsMore,
}: SuggestionsTabsProps) {
  const baseId = useId();
  const counts: Record<SuggestTabId, number> = {
    ready: available.length,
    almost: almostAvailable.length,
    "needs-more": needsMore.length,
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('input, textarea, select, [role="combobox"]'))
      ) {
        return;
      }
      const idx = TAB_DEFS.findIndex((t) => t.id === activeTab);
      if (idx < 0) return;
      e.preventDefault();
      const next =
        e.key === "ArrowRight"
          ? TAB_DEFS[(idx + 1) % TAB_DEFS.length]
          : TAB_DEFS[(idx - 1 + TAB_DEFS.length) % TAB_DEFS.length];
      onTabChange(next.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, onTabChange]);

  return (
    <div className="suggest-tabs">
      <div
        className="suggest-tabs__list"
        role="tablist"
        aria-label="Kategorie sugestii"
      >
        {TAB_DEFS.map((tab) => {
          const selected = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-label={`${tab.label}, ${count === 1 ? "1 przepis" : `${count} przepisów`}`}
              tabIndex={selected ? 0 : -1}
              className={`suggest-tabs__tab${selected ? " suggest-tabs__tab--active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="suggest-tabs__tab-label suggest-tabs__tab-label--long">
                {tab.label}
              </span>
              <span className="suggest-tabs__tab-label suggest-tabs__tab-label--short">
                {tab.shortLabel}
              </span>
              <span className="suggest-tabs__tab-count" aria-hidden="true">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeTab}`}
        className="suggest-tabs__panel"
      >
        <p className="suggest-tabs__lede">
          {TAB_DEFS.find((t) => t.id === activeTab)?.lede}
        </p>
        <TabPanelContent
          tabId={activeTab}
          empty={TAB_DEFS.find((t) => t.id === activeTab)?.empty ?? ""}
          available={available}
          almostAvailable={almostAvailable}
          needsMore={needsMore}
        />
      </div>
    </div>
  );
}

function TabPanelContent({
  tabId,
  empty,
  available,
  almostAvailable,
  needsMore,
}: {
  tabId: SuggestTabId;
  empty: string;
  available: Recipe[];
  almostAvailable: AlmostEntry[];
  needsMore: AlmostEntry[];
}) {
  if (tabId === "ready") {
    if (available.length === 0) return <p className="suggest-muted">{empty}</p>;
    return (
      <ul className="suggest-list">
        {available.map((recipe) => (
          <SuggestionRecipeRow
            key={recipe.id}
            recipe={recipe}
            actions={
              <Link to={`/recipes/${recipe.id}`} className="suggest-row__cta">
                Zobacz przepis
              </Link>
            }
          />
        ))}
      </ul>
    );
  }

  if (tabId === "almost") {
    if (almostAvailable.length === 0)
      return <p className="suggest-muted">{empty}</p>;
    return (
      <ul className="suggest-list">
        {almostAvailable.map(({ recipe, missingCount }) => (
          <SuggestionRecipeRow
            key={recipe.id}
            recipe={recipe}
            missingCount={missingCount}
            variant="almost"
            actions={
              <AddRecipeToShoppingListButton
                recipeId={recipe.id}
                className="suggest-row__cta"
                label="Dodaj braki"
              />
            }
          />
        ))}
      </ul>
    );
  }

  if (needsMore.length === 0) return <p className="suggest-muted">{empty}</p>;
  return (
    <ul className="suggest-list">
      {needsMore.map(({ recipe, missingCount }) => (
        <SuggestionRecipeRow
          key={recipe.id}
          recipe={recipe}
          missingCount={missingCount}
          variant="needs-more"
          actions={
            <AddRecipeToShoppingListButton
              recipeId={recipe.id}
              className="suggest-row__cta"
              label="Dodaj braki"
            />
          }
        />
      ))}
    </ul>
  );
}
