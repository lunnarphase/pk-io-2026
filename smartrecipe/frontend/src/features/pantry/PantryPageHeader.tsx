import { Link } from 'react-router-dom'

interface PantryPageHeaderProps {
  itemCount: number
  actions: React.ReactNode
}

export function PantryPageHeader({ itemCount, actions }: PantryPageHeaderProps) {
  return (
    <header className="pantry-header">
      <div className="pantry-header__main">
        <h1 className="pantry-header__title">Spiżarnia</h1>
        <p className="pantry-header__lede">
          Katalog tego, co masz w domu - od tego zależą sugestie przepisów.
        </p>
      </div>
      <div className="pantry-header__aside">
        <div className="pantry-header__meta">
          <span className="pantry-header__stat" aria-label={`${itemCount} pozycji w spiżarni`}>
            {itemCount}
          </span>
          <span className="pantry-header__stat-label">pozycji</span>
          <Link className="pantry-header__suggest-link" to="/suggestions">
            Zobacz sugestie →
          </Link>
        </div>
        <div className="pantry-header__actions">{actions}</div>
      </div>
    </header>
  )
}
