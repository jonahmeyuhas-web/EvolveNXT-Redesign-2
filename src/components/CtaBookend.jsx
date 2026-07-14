import { cta } from '../content/site'
import heroPoster from '../assets/hero-poster.jpg'
import heroLoop from '../assets/hero-loop.mp4'

// CTA bookend: the second royal film panel. The film is present and STATIC (no
// clip, scale or zoom on entry); only the content cascades in via the shared
// .ri masked rise. The film is lazy (armed on reveal in useHomepageMotion).
export default function CtaBookend() {
  return (
    <section className="cta-sec">
      <div className="cta-panel rv">
        <div className="panel-media" aria-hidden="true">
          <video
            className="panel-photo film"
            data-lazy="1"
            muted
            loop
            playsInline
            preload="none"
            poster={heroPoster}
          >
            <source src={heroLoop} type="video/mp4" />
          </video>
          <div className="tint-color"></div>
          <div className="tint-deep"></div>
          <div className="tint-lift"></div>
          <div className="ov-settle"></div>
        </div>
        <div className="cta-content">
          <span className="cta-label ri" style={{ '--d': '0.1s' }}>
            {cta.label}
          </span>
          <h2 className="cta-headline ri" style={{ '--d': '0.18s' }}>
            {cta.headline}
          </h2>
          <p className="cta-body ri" style={{ '--d': '0.26s' }}>
            {cta.body}
          </p>
          <a className="pill pill-white ri" style={{ '--d': '0.34s' }} href={cta.button.href}>
            {cta.button.label}
          </a>
        </div>
      </div>
    </section>
  )
}
