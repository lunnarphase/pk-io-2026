import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPantry } from '@/api/pantry'
import { getSuggestions } from '@/api/suggestions'
import { SuggestionFilters } from '@/features/suggestions/SuggestionFilters'
import { SuggestionsTabs } from '@/features/suggestions/SuggestionsTabs'
import {
  defaultSuggestTab,
  parseSuggestTab,
  type SuggestTabId,
} from '@/features/suggestions/suggest-tab-utils'
import { SuggestionsPageHeader } from '@/features/suggestions/SuggestionsPageHeader'
import { queryKeys } from '@/lib/query-keys'
import { CuisineType, DietType } from '@/types/domain'

export function SuggestionsPage() {
  const [params, setParams] = useSearchParams()
  const diet = (params.get('diet') as DietType | null) ?? undefined
  const cuisine = (params.get('cuisine') as CuisineType | null) ?? undefined
  const filters = { diet, cuisine }
  const tabFromUrl = parseSuggestTab(params.get('tab'))

  const pantryQuery = useQuery({
    queryKey: queryKeys.pantry(),
    queryFn: getPantry,
    staleTime: 30_000,
  })

  const suggestionsQuery = useQuery({
    queryKey: queryKeys.suggestions(filters),
    queryFn: () => getSuggestions(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  function setFilter(key: 'diet' | 'cuisine', value?: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  function clearAllFilters() {
    const tab = params.get('tab')
    const next = new URLSearchParams()
    if (tab) next.set('tab', tab)
    setParams(next, { replace: true })
  }

  function setTab(tab: SuggestTabId) {
    const next = new URLSearchParams(params)
    next.set('tab', tab)
    setParams(next, { replace: true })
  }

  const pantryCount = pantryQuery.data?.length ?? 0
  const suggestionData = suggestionsQuery.data
  const { available = [], almostAvailable = [], needsMore = [] } = suggestionData ?? {}
  const isInitialSuggestionsLoad = suggestionsQuery.isPending && !suggestionData
  const isRefetchingSuggestions = suggestionsQuery.isFetching && !isInitialSuggestionsLoad

  const activeTab =
    tabFromUrl ??
    defaultSuggestTab({
      ready: available.length,
      almost: almostAvailable.length,
      needsMore: needsMore.length,
    })

  useEffect(() => {
    if (!suggestionData || params.get('tab')) return
    const next = new URLSearchParams(params)
    next.set(
      'tab',
      defaultSuggestTab({
        ready: available.length,
        almost: almostAvailable.length,
        needsMore: needsMore.length,
      }),
    )
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync default tab once when URL omits ?tab=
  }, [suggestionData])

  return (
    <div className="suggest-page">
      <SuggestionsPageHeader pantryCount={pantryCount} />

      <SuggestionFilters
        diet={diet}
        cuisine={cuisine}
        onDietChange={(d) => setFilter('diet', d)}
        onCuisineChange={(c) => setFilter('cuisine', c)}
        onClearAll={clearAllFilters}
        isUpdating={isRefetchingSuggestions}
      />

      {isInitialSuggestionsLoad ? (
        <div className="suggest-list" aria-busy="true" aria-label="Ładowanie sugestii">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="suggest-skeleton-row" />
          ))}
        </div>
      ) : null}

      {suggestionsQuery.isError && !suggestionData ? (
        <p className="suggest-error" role="alert">
          Nie udało się wczytać sugestii. Sprawdź połączenie i spróbuj odświeżyć stronę.
        </p>
      ) : null}

      {pantryCount === 0 && !isInitialSuggestionsLoad ? (
        <div className="suggest-empty">
          <p className="suggest-empty__title">Spiżarnia jest pusta</p>
          <p className="suggest-empty__text">
            Dodaj składniki, które masz w domu - wtedy pokażemy przepisy dopasowane do Twoich zapasów.
          </p>
          <Link className="suggest-empty__btn" to="/pantry">
            Uzupełnij spiżarnię
          </Link>
        </div>
      ) : null}

      {pantryCount > 0 && suggestionData ? (
        <div
          className={isRefetchingSuggestions ? 'suggest-content suggest-content--loading' : 'suggest-content'}
          aria-busy={isRefetchingSuggestions}
        >
          <SuggestionsTabs
            activeTab={activeTab}
            onTabChange={setTab}
            available={available}
            almostAvailable={almostAvailable}
            needsMore={needsMore}
          />
        </div>
      ) : null}
    </div>
  )
}
