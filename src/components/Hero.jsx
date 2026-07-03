import { useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { hero } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import Atmosphere from './Atmosphere'
import HeroFilm from './HeroFilm'
import HeroFX from './HeroFX'

const EASE = [0.16, 1, 0.3, 1]

export default function Hero() {
  const ref = useRef(null)
  const { reducedMotion } = useUnpinned()
  const [finePointer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  )
  const usingFX = !reducedMotion && finePointer

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  // Gentle parallax as the hero leaves: the words lift and fade a little
  // faster than the film, which settles back a touch. No scroll pin.
  const contentY = useTransform(p, [0, 1], ['0vh', '-8vh'])
  const contentOpacity = useTransform(p, [0, 0.7], [1, 0])
  const bgScale = useTransform(p, [0, 1], [1, 1.08])
  const bgY = useTransform(p, [0, 1], ['0vh', '4vh'])

  return (
    <section ref={ref} className="hero">
      <motion.div
        className="hero-bg"
        style={reducedMotion ? undefined : { scale: bgScale, y: bgY }}
      >
        <Atmosphere animate={!reducedMotion} />
        {!reducedMotion && <HeroFilm show />}
        <div className="hero-scrim" />
        {usingFX && <HeroFX sectionRef={ref} />}
      </motion.div>

      <motion.div
        className="hero-copy"
        style={reducedMotion ? undefined : { y: contentY, opacity: contentOpacity }}
      >
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
      </motion.div>
    </section>
  )
}
