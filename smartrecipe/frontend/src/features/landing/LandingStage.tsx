import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { LandingStageVisual, type Visual } from '@/features/landing/LandingStageVisuals'

interface LandingStageProps {
  num: string
  name: string
  heading: string
  text: string
  visual: Visual
  headingId: string
}

export function LandingStage({ num, name, heading, text, visual, headingId }: LandingStageProps) {
  const [ref, visible] = useIntersectionObserver<HTMLElement>()

  return (
    <article ref={ref} className={`stage${visible ? ' is-visible' : ''}`} aria-labelledby={headingId}>
      <div className="wrap">
        <header>
          <div className="stage__rule-bar" aria-hidden="true" />
          <div className="stage__label">
            <span className="stage__num">{num}</span>
            <span className="stage__name">{name}</span>
          </div>
        </header>
        <div className="stage__body">
          <div className="stage__content">
            <h2 className="stage__heading" id={headingId}>
              {heading}
            </h2>
            <p className="stage__text">{text}</p>
          </div>
          <figure className="stage__visual" aria-hidden="true">
            <LandingStageVisual type={visual} />
          </figure>
        </div>
      </div>
    </article>
  )
}
