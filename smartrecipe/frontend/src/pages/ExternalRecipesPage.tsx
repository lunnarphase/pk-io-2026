import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { searchExternalRecipes } from '@/api/external'
import { Input } from '@/components/ui/input'
import { ExternalRecipeCard } from '@/features/external/ExternalRecipeCard'
import { ExternalRecipesPageHeader } from '@/features/external/ExternalRecipesPageHeader'
import { ExternalUnavailableBanner } from '@/features/external/ExternalUnavailableBanner'
import { useDebounce } from '@/hooks/useDebounce'
import { useLoadMoreOnIntersect } from '@/hooks/useLoadMoreOnIntersect'
import { queryKeys } from '@/lib/query-keys'

const MIN_QUERY_LENGTH = 3

export function ExternalRecipesPage() {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 400)
  const canSearch = debounced.length >= MIN_QUERY_LENGTH

  const {
    data,
    isFetching,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.externalRecipes(debounced),
    queryFn: ({ pageParam }) => searchExternalRecipes(debounced, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.results.length
      if (nextOffset >= lastPage.totalResults || lastPage.results.length === 0) {
        return undefined
      }
      return nextOffset
    },
    enabled: canSearch,
    retry: 0,
    staleTime: 300_000,
  })

  const hits = useMemo(() => data?.pages.flatMap((page) => page.results) ?? [], [data])
  const totalResults = data?.pages[0]?.totalResults ?? null
  const isInitialLoading = canSearch && isFetching && hits.length === 0

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const loadMoreRef = useLoadMoreOnIntersect(loadMore, Boolean(canSearch && hasNextPage))

  const resultCount =
    canSearch && !isError
      ? isInitialLoading
        ? null
        : (totalResults ?? hits.length)
      : null

  return (
    <div className="external-page">
      <ExternalRecipesPageHeader
        resultCount={resultCount}
        isSearching={isInitialLoading}
        loadedCount={hits.length}
        totalResults={totalResults}
      />

      <section className="external-search" aria-labelledby="external-search-label">
        <label id="external-search-label" className="external-search__label" htmlFor="external-q">
          Szukaj w katalogu
        </label>
        <Input
          id="external-q"
          className="external-search__field"
          placeholder="np. tofu, makaron, curry..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        {!canSearch ? (
          <p className="external-search__hint external-search__hint--idle">
            Wpisz co najmniej {MIN_QUERY_LENGTH} znaki, aby rozpocząć wyszukiwanie.
          </p>
        ) : null}
      </section>

      {isError ? <ExternalUnavailableBanner /> : null}

      {!isError && !canSearch ? (
        <div className="external-idle" role="status">
          <p className="external-idle__title">Zacznij od frazy</p>
          <p className="external-idle__hint">
            Wpisz składnik lub nazwę dania - wyniki pojawią się poniżej.
          </p>
        </div>
      ) : null}

      {!isError && isInitialLoading ? (
        <ul className="external-grid" aria-busy="true" aria-label="Ładowanie wyników">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="external-skeleton-card" />
            </li>
          ))}
        </ul>
      ) : null}

      {!isError && canSearch && !isInitialLoading && hits.length > 0 ? (
        <>
          <ul className="external-grid" aria-label="Wyniki wyszukiwania">
            {hits.map((hit) => (
              <ExternalRecipeCard key={String(hit.id)} hit={hit} />
            ))}
            {isFetchingNextPage
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={`loading-${i}`}>
                    <div className="external-skeleton-card" />
                  </li>
                ))
              : null}
          </ul>
          <div
            ref={loadMoreRef}
            className="external-load-more"
            aria-hidden={!hasNextPage}
          >
            {hasNextPage && !isFetchingNextPage ? (
              <p className="external-load-more__hint">Przewiń, aby załadować więcej</p>
            ) : null}
            {!hasNextPage && totalResults != null && hits.length > 0 ? (
              <p className="external-load-more__end" role="status">
                Wszystkie wyniki załadowane ({hits.length} z {totalResults}).
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {!isError && canSearch && !isInitialLoading && hits.length === 0 ? (
        <div className="external-empty" role="status">
          <p className="external-empty__title">Brak wyników</p>
          <p className="external-empty__hint">
            Spróbuj krótszej frazy lub innego składnika - katalog może nie mieć dokładnego
            dopasowania.
          </p>
        </div>
      ) : null}
    </div>
  )
}
