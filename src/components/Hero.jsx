import { useRef, useState } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from 'motion/react'
import { hero } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import Atmosphere from './Atmosphere'
import HeroFilm from './HeroFilm'
import HeroFX from './HeroFX'
import HeroConstellation from './HeroConstellation'

const EASE = [0.16, 1, 0.3, 1]

export default function Hero() {
  const ref = useRef(null)
  const stickyRef = useRef(null)
  const { unpinned, reducedMotion } = useUnpinned()
  const [finePointer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )
  const usingFX = !reducedMotion && finePointer
  const pinned = !unpinned

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const p = useSpring(scrollYProgress, { stiffness: 150, damping: 34, restDelta: 0.0004 })

  // headline lifts and fades before the strands take over
  const contentY = useTransform(p, [0, 0.3], ['0vh', '-10vh'])
  const contentOpacity = useTransform(p, [0.04, 0.28], [1, 0])
  // deep navy rises over the film (the contained dark moment)
  const nightOpacity = useTransform(p, [0, 0.22], [0, 0.94])
  // warm-white resolve fades in at the end and hands off to the statement
  const resolveOpacity = useTransform(p, [0.82, 0.99], [0, 1])

  // Pause the film during the sequence (navy covers it); resume when scrolled
  // back up into the resting hero.
  useMotionValueEvent(p, 'change', (v) => {
    const vid = stickyRef.current && stickyRef.current.querySelector('.hero-film')
    if (!vid) return
    if (v > 0.15 && !vid.paused) vid.pause()
    else if (v <= 0.15 && vid.paused) vid.play().catch(() => {})
  })

  const copy = (
    <>
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
    </>
  )

  // Fallback (mobile / reduced motion): a plain hero, no sequence.
  if (!pinned) {
    return (
      <section className="hero" ref={stickyRef}>
        <div className="hero-bg">
          <Atmosphere animate={false} />
          {!reducedMotion && <HeroFilm show />}
          <div className="hero-scrim" />
        </div>
        <div className="hero-copy">{copy}</div>
      </section>
    )
  }

  return (
    <section ref={ref} className="hero-scene">
      <div className="hero-sticky" ref={stickyRef}>
        <div className="hero-bg">
          <Atmosphere animate={false} />
          <HeroFilm show />
          <div className="hero-scrim" />
          {usingFX && <HeroFX sectionRef={stickyRef} />}
        </div>

        <motion.div className="hero-night" style={{ opacity: nightOpacity }} />

        <HeroConstellation progress={p} />

        <motion.div
          className="hero-copy"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          {copy}
        </motion.div>

        <motion.div className="hero-resolve" style={{ opacity: resolveOpacity }} />
      </div>
    </section>
  )
}
