import { useEffect, useRef } from 'react'
import { hero } from '../content/site'
import heroPoster from '../assets/hero-poster.jpg'
import heroLoop from '../assets/hero-loop.mp4'
import LivingConsole from './LivingConsole'

// Hero: masked-line headline + sub + CTAs (load-time reveal), then the royal
// film panel that holds the living console. The Push-to-Focus dolly (headline
// scale/opacity, film settle, console focus-in + recede) is wired in
// useHomepageMotion.
export default function Hero() {
  const videoRef = useRef(null)

  // Start the film only when the panel is scrolled into view; pause it when it
  // leaves. Honors reduced motion by leaving the poster frame in place.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.4 },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>
            {hero.headline.map((line) => (
              <span className="mask" key={line}>
                <span className="mask-line">{line}</span>
              </span>
            ))}
          </h1>
          <p className="hero-sub">{hero.sub}</p>
          <div className="hero-ctas">
            <a className="pill pill-royal" href={hero.cta.href}>
              {hero.cta.label}
            </a>
            <a className="quiet-link" href={hero.secondary.href}>
              {hero.secondary.label} <span className="arrow">&#8594;</span>
            </a>
          </div>
        </div>
      </section>

      <section className="panel-section">
        <div className="panel">
          <div className="panel-media" aria-hidden="true">
            <video
              ref={videoRef}
              className="panel-photo film"
              muted
              loop
              playsInline
              preload="auto"
              poster={heroPoster}
            >
              <source src={heroLoop} type="video/mp4" />
            </video>
            <div className="tint-color"></div>
            <div className="tint-deep"></div>
            <div className="tint-lift"></div>
          </div>

          <LivingConsole />
        </div>
      </section>
    </>
  )
}
