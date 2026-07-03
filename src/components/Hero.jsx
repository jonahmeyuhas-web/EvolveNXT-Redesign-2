import { useRef, useState } from 'react'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
  useMotionValueEvent,
} from 'motion/react'
import { hero } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import Atmosphere from './Atmosphere'
import HeroFilm from './HeroFilm'
import HeroFX from './HeroFX'

const EASE = [0.16, 1, 0.3, 1]
// The bright point of the glass to dive into (screen %). Zoom origin and the
// iris center share this so the reveal reads as diving through the glass.
const GX = 33
const GY = 30

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

  // headline lifts and fades early, before the dive begins
  const contentY = useTransform(p, [0, 0.32], ['0vh', '-10vh'])
  const contentOpacity = useTransform(p, [0.05, 0.32], [1, 0])
  // the dive: push into the glass
  const filmScale = useTransform(p, [0.26, 0.92], [1, 2.5])
  // the iris: white light blooms from the glass, an electric rim leading it
  const rWhite = useTransform(p, [0.4, 0.9], ['0%', '165%'])
  const rBlue = useTransform(p, [0.37, 0.86], ['0%', '172%'])
  const whiteClip = useMotionTemplate`circle(${rWhite} at ${GX}% ${GY}%)`
  const blueClip = useMotionTemplate`circle(${rBlue} at ${GX}% ${GY}%)`

  // Pause the film during the dive so we scale a static frame (cheap + smooth);
  // resume if the user scrolls back up into the resting hero.
  useMotionValueEvent(p, 'change', (v) => {
    const vid = stickyRef.current && stickyRef.current.querySelector('.hero-film')
    if (!vid) return
    if (v > 0.26 && !vid.paused) vid.pause()
    else if (v <= 0.26 && vid.paused) vid.play().catch(() => {})
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

  // Fallback (mobile / reduced motion): a plain hero, no dive.
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
        <motion.div
          className="hero-bg"
          style={{ scale: filmScale, transformOrigin: `${GX}% ${GY}%` }}
        >
          <Atmosphere animate={false} />
          <HeroFilm show />
          <div className="hero-scrim" />
          {usingFX && <HeroFX sectionRef={stickyRef} />}
        </motion.div>

        <motion.div
          className="hero-copy"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          {copy}
        </motion.div>

        <motion.div className="hero-iris hero-iris-blue" style={{ clipPath: blueClip }} />
        <motion.div className="hero-iris hero-iris-white" style={{ clipPath: whiteClip }} />
      </div>
    </section>
  )
}
