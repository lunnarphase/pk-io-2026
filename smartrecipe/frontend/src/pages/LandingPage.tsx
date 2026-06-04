import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LandingStage } from '@/features/landing/LandingStage'

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/suggestions" replace />
  }

  return (
    <>
      <header role="banner">
        <div className="wrap">
          <div className="masthead__body">
            <Link className="masthead__wordmark" to="/">
              SmartRecipe
            </Link>
            <p className="masthead__issue">System zarządzania przepisami kulinarnymi · 2026</p>
          </div>
        </div>
        <div className="masthead">
          <div className="wrap masthead__rules">
            <div className="masthead__rule" />
            <div className="masthead__rule" />
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-headline">
          <div className="wrap">
            <h1 className="hero__headline" id="hero-headline">
              Co ugotować z tego, co masz.
            </h1>
            <p className="hero__lede">
              SmartRecipe sprawdza Twoją spiżarnię i dobiera przepisy, które możesz zrealizować bez
              wychodzenia do sklepu.
            </p>
            <a className="hero__cta" href="#stages">
              Jak to działa <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section className="stages" id="stages" aria-label="Cztery etapy pracy z systemem">
          <LandingStage
            num="1.0"
            name="Spiżarnia"
            heading="Twój dom. Twoje składniki."
            text="Dodaj produkty, które masz na półkach i w lodówce - z ilościami i jednostkami. System zapamięta stan spiżarni i będzie go porównywał ze składem Twoich przepisów."
            visual="pantry"
            headingId="stage-1-heading"
          />
          <LandingStage
            num="2.0"
            name="Dopasowanie"
            heading="Przepisy gotowe do gotowania."
            text="Algorytm porównuje skład każdego przepisu ze stanem spiżarni - z normalizacją jednostek. Wyróżnia dania gotowe i te, do których brakuje co najwyżej dwóch składników."
            visual="match"
            headingId="stage-2-heading"
          />
          <LandingStage
            num="3.0"
            name="Przepisy"
            heading="Własna baza, na własnych zasadach."
            text="Twórz przepisy ze szkicu, definiuj składniki z ilościami, publikuj kiedy gotowy. Filtruj według diety, kuchni i kaloryczności. Importuj przepisy z zewnętrznych baz."
            visual="recipes"
            headingId="stage-3-heading"
          />
          <LandingStage
            num="4.0"
            name="Zakupy"
            heading="Lista, która liczy za Ciebie."
            text="Wybierz przepisy na ten tydzień. System odejmuje to, co masz w spiżarni, i generuje listę brakujących składników. Zaznacz jako kupione - i gotowe."
            visual="shopping"
            headingId="stage-4-heading"
          />
        </section>

        <section className="cta-section" aria-labelledby="cta-heading">
          <div className="wrap cta-section__inner">
            <p className="cta-section__prompt" id="cta-heading">
              Gotowy gotować z tym, co masz?
            </p>
            <Link className="cta-section__btn" to="/register">
              Zacznij teraz <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer" role="contentinfo">
        <div className="wrap">
          <p className="site-footer__statement">
            Mniej marnowania.
            <br />
            Więcej gotowania.
          </p>
          <div className="site-footer__rule" aria-hidden="true" />
          <div className="site-footer__meta">
            <span className="site-footer__wordmark">SmartRecipe</span>
            <span className="site-footer__sep" aria-hidden="true">
              ·
            </span>
            <span>Jakub Kapała, Grzegorz Kotkowski</span>
            <span className="site-footer__sep" aria-hidden="true">
              ·
            </span>
            <span>Inżynieria Oprogramowania · 2026</span>
          </div>
        </div>
      </footer>
    </>
  )
}
