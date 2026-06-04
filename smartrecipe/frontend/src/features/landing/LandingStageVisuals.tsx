export type Visual = 'pantry' | 'match' | 'recipes' | 'shopping'

export function LandingStageVisual({ type }: { type: Visual }) {
  switch (type) {
    case 'pantry':
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
          <line x1="8" y1="44" x2="132" y2="44" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="88" x2="132" y2="88" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="132" x2="132" y2="132" stroke="currentColor" strokeWidth="2" />
          <circle cx="30" cy="27" r="11" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="64" cy="25" r="13" stroke="currentColor" strokeWidth="1.5" fill="oklch(38% 0.17 148 / 0.18)" />
          <circle cx="98" cy="28" r="10" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="124" cy="30" r="7" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="24" cy="70" r="13" stroke="currentColor" strokeWidth="1.5" fill="oklch(38% 0.17 148 / 0.18)" />
          <circle cx="62" cy="71" r="11" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="96" cy="68" r="14" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="34" cy="114" r="11" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="72" cy="112" r="15" stroke="currentColor" strokeWidth="1.5" fill="oklch(38% 0.17 148 / 0.18)" />
          <circle cx="112" cy="115" r="11" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'match':
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
          <circle cx="22" cy="24" r="9" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="22" cy="56" r="9" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="22" cy="88" r="9" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="22" cy="120" r="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="31" y1="24" x2="96" y2="68" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <line x1="31" y1="56" x2="96" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <line x1="31" y1="88" x2="96" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <line x1="31" y1="120" x2="96" y2="74" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <circle cx="112" cy="70" r="22" stroke="currentColor" strokeWidth="2" fill="oklch(38% 0.17 148 / 0.15)" />
          <line x1="102" y1="70" x2="122" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="108" y1="63" x2="117" y2="77" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    case 'recipes':
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
          <rect x="10" y="8" width="100" height="124" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <line x1="22" y1="28" x2="98" y2="28" stroke="currentColor" strokeWidth="3" />
          <line x1="22" y1="46" x2="94" y2="46" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="22" y1="57" x2="88" y2="57" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="22" y1="68" x2="96" y2="68" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="22" y1="80" x2="98" y2="80" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
          <circle cx="26" cy="93" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="36" y1="93" x2="84" y2="93" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="26" cy="107" r="3.5" fill="oklch(38% 0.17 148 / 0.5)" stroke="currentColor" strokeWidth="1.5" />
          <line x1="36" y1="107" x2="78" y2="107" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="26" cy="121" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="36" y1="121" x2="88" y2="121" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <path d="M 114 8 L 130 8 L 130 44 L 122 36 L 114 44 Z" fill="oklch(38% 0.17 148 / 0.7)" />
        </svg>
      )
    case 'shopping':
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="124" height="124" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <rect x="20" y="26" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="oklch(38% 0.17 148 / 0.2)" />
          <path d="M 23.5 34 L 27 37.5 L 33.5 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="46" y1="34" x2="116" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <rect x="20" y="52" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="oklch(38% 0.17 148 / 0.2)" />
          <path d="M 23.5 60 L 27 63.5 L 33.5 55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="46" y1="60" x2="110" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <rect x="20" y="78" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="46" y1="86" x2="108" y2="86" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <rect x="20" y="104" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="46" y1="112" x2="100" y2="112" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
      )
  }
}
