import { Link } from 'react-router-dom'

interface ExternalRecipesPageHeaderProps {
  resultCount: number | null
  isSearching: boolean
  loadedCount: number
  totalResults: number | null
}

export function ExternalRecipesPageHeader({
  resultCount,
  isSearching,
  loadedCount,
  totalResults,
}: ExternalRecipesPageHeaderProps) {
  const showStat = resultCount !== null
  const showProgress =
    !isSearching &&
    totalResults != null &&
    loadedCount > 0 &&
    loadedCount < totalResults

  return (
    <header className="external-header">
      <div className="external-header__main">
        <h1 className="external-header__title">Przepisy zewnętrzne</h1>
        <p className="external-header__lede">
          Wyszukaj gotowe przepisy w katalogu zewnętrznym i zaimportuj wybrane jako szkic do
          swojego katalogu.
        </p>
      </div>
      <div className="external-header__aside">
        {showStat ? (
          <div className="external-header__meta">
            <span
              className="external-header__stat"
              aria-label={
                isSearching
                  ? 'Wyszukiwanie w toku'
                  : showProgress
                    ? `Załadowano ${loadedCount} z ${totalResults} wyników`
                    : `${resultCount} wyników wyszukiwania`
              }
            >
              {isSearching ? '...' : resultCount}
            </span>
            <span className="external-header__stat-label">
              {showProgress ? `załadowano · ${loadedCount} z ${totalResults}` : 'wyników'}
            </span>
          </div>
        ) : null}
        <Link className="external-header__recipes-link" to="/recipes">
          Moje przepisy →
        </Link>
      </div>
    </header>
  )
}
