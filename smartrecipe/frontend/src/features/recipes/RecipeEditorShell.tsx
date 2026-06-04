import { Link } from 'react-router-dom'

interface RecipeEditorShellProps {
  title: string
  lede?: string
  status?: React.ReactNode
  /** Lifecycle / secondary actions - Workbench action band below the title. */
  toolbar?: React.ReactNode
  main: React.ReactNode
  aside: React.ReactNode
  mainPanelTitle?: string
  asidePanelTitle?: string
  className?: string
  /** Sticky page footer - used for primary submit on mobile (below ingredients). */
  footer?: React.ReactNode
}

export function RecipeEditorShell({
  title,
  lede,
  status,
  toolbar,
  main,
  aside,
  mainPanelTitle = 'Dane przepisu',
  asidePanelTitle = 'Składniki',
  className,
  footer,
}: RecipeEditorShellProps) {
  return (
    <div
      className={[
        'recipe-editor',
        footer ? 'recipe-editor--has-footer' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className="recipe-editor__crumb" aria-label="Nawigacja">
        <Link className="recipe-editor__back" to="/recipes">
          ← Przepisy
        </Link>
      </nav>

      <header className="recipe-editor__header">
        <div className="recipe-editor__title-row">
          <h1 className="recipe-editor__title">{title}</h1>
          {status ? <div className="recipe-editor__status-slot">{status}</div> : null}
        </div>
        {lede ? <p className="recipe-editor__lede">{lede}</p> : null}
        {toolbar ? (
          <div className="recipe-editor__toolbar" role="toolbar" aria-label="Akcje przepisu">
            {toolbar}
          </div>
        ) : null}
      </header>

      <div className="recipe-editor__split">
        <section className="recipe-editor__panel recipe-editor__panel--main" aria-labelledby="recipe-panel-main">
          <h2 id="recipe-panel-main" className="recipe-editor__panel-title">
            {mainPanelTitle}
          </h2>
          {main}
        </section>

        <aside className="recipe-editor__panel recipe-editor__panel--aside" aria-labelledby="recipe-panel-aside">
          <h2 id="recipe-panel-aside" className="recipe-editor__panel-title">
            {asidePanelTitle}
          </h2>
          {aside}
        </aside>
      </div>

      {footer ? <footer className="recipe-editor__footer">{footer}</footer> : null}
    </div>
  )
}
