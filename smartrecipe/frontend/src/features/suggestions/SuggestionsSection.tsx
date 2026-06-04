import type { ReactNode } from 'react'

interface SuggestionsSectionProps {
  label: string
  title: string
  count: number
  children: ReactNode
}

export function SuggestionsSection({ label, title, count, children }: SuggestionsSectionProps) {
  return (
    <section className="suggest-section">
      <header className="suggest-section__head">
        <div className="suggest-section__rule" aria-hidden="true" />
        <p className="suggest-section__label">{label}</p>
        <h2 className="suggest-section__title">
          {title}{' '}
          <span className="suggest-section__count">({count})</span>
        </h2>
      </header>
      {children}
    </section>
  )
}
