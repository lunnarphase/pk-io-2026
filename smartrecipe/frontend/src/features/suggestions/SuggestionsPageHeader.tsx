import { Link } from "react-router-dom";

interface SuggestionsPageHeaderProps {
  pantryCount: number;
}

export function SuggestionsPageHeader({
  pantryCount,
}: SuggestionsPageHeaderProps) {
  return (
    <header className="suggest-masthead">
      <div className="suggest-masthead__main">
        <h1 className="suggest-masthead__title">Co dziś ugotować?</h1>
        <p className="suggest-masthead__lede">
          Przepisy dopasowane do tego, co masz na półkach - gotowe od razu albo
          z drobnymi brakami.
        </p>
      </div>
      <div className="suggest-masthead__aside">
        <span
          className="suggest-masthead__stat"
          aria-label={`${pantryCount} składników w spiżarni`}
        >
          {pantryCount}
        </span>
        <span className="suggest-masthead__stat-label">w spiżarni</span>
        <Link className="suggest-masthead__pantry-link" to="/pantry">
          Zarządzaj spiżarnią →
        </Link>
      </div>
    </header>
  );
}
