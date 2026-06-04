import { Link } from 'react-router-dom'

interface RecipesPageHeaderProps {
  recipeCount: number
  actions: React.ReactNode
}

export function RecipesPageHeader({ recipeCount, actions }: RecipesPageHeaderProps) {
  return (
    <header className="recipes-header">
      <div className="recipes-header__main">
        <h1 className="recipes-header__title">Moje przepisy</h1>
        <p className="recipes-header__lede">
          Katalog dań, które tworzysz i publikujesz - filtruj po diecie, kuchni i kaloriach.
        </p>
      </div>
      <div className="recipes-header__aside">
        <div className="recipes-header__meta">
          <span className="recipes-header__stat" aria-label={`${recipeCount} przepisów w katalogu`}>
            {recipeCount}
          </span>
          <span className="recipes-header__stat-label">przepisów</span>
          <Link className="recipes-header__suggest-link" to="/suggestions">
            Zobacz sugestie →
          </Link>
        </div>
        <div className="recipes-header__actions">{actions}</div>
      </div>
    </header>
  )
}
