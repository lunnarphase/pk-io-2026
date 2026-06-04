interface ShoppingListPageHeaderProps {
  pendingCount: number
  purchasedCount: number
  toolbar: React.ReactNode
}

export function ShoppingListPageHeader({
  pendingCount,
  purchasedCount,
  toolbar,
}: ShoppingListPageHeaderProps) {
  return (
    <div className="shopping-masthead">
      <header className="shopping-header">
        <h1 className="shopping-header__title">Lista zakupów</h1>
        <p className="shopping-header__kicker">
          <span className="shopping-header__kicker-value">{pendingCount}</span>
          {' do kupienia'}
          {purchasedCount > 0 ? (
            <span className="shopping-header__kicker-muted">
              {' · '}
              <span className="shopping-header__kicker-purchased">{purchasedCount}</span>
              {' kupione'}
            </span>
          ) : null}
        </p>
        <p className="shopping-header__lede">
          Zaznacz to, co już masz w koszyku, potem zsynchronizuj ze spiżarnią. Uzupełnij z
          przepisów lub dodaj ręcznie.
        </p>
      </header>
      <div className="shopping-toolbar">{toolbar}</div>
    </div>
  )
}
