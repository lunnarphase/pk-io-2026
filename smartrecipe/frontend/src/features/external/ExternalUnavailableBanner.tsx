export function ExternalUnavailableBanner() {
  return (
    <div className="external-banner" role="status">
      <p className="external-banner__title">Wyszukiwanie niedostępne</p>
      <p className="external-banner__text">
        Katalog zewnętrznych przepisów jest chwilowo niedostępny - brak konfiguracji API lub
        limit serwisu. Pozostałe funkcje aplikacji działają normalnie.
      </p>
    </div>
  )
}
