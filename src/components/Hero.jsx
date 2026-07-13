import { motion } from 'motion/react'
import { hero } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import Atmosphere from './Atmosphere'
import HeroFilm from './HeroFilm'

const EASE = [0.16, 1, 0.3, 1]

// Plain 100vh hero: the atmosphere canvas base, the filmed loop over it, a warm
// scrim, and the headline / sub / CTAs. Copy still reveals on load; there is no
// scroll-driven sequence.
export default function Hero() {
  const { reducedMotion } = useUnpinned()

  return (
    <section className="hero">
      <div className="hero-bg">
        <Atmosphere animate={false} />
        {!reducedMotion && <HeroFilm show />}
        <div className="hero-scrim" />
      </div>
      <div className="hero-copy">
        <h1 className="h-display">
          {hero.headline.map((line, i) => (
            <span className="mask" key={line}>
              <motion.span
                className="mask-line"
                initial={reducedMotion ? false : { y: 110 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.12 + i * 0.09 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="hero-sub"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
        >
          {hero.sub}
        </motion.p>
        <motion.div
          className="hero-ctas"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.68 }}
        >
          <a className="pill pill-royal" href={hero.cta.href}>
            {hero.cta.label}
          </a>
          <a className="quiet-link" href={hero.secondary.href}>
            {hero.secondary.label}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
