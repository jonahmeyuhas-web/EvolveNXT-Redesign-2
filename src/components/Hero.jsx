import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useSpring, useTransform } from 'motion/react'
import { hero } from '../content/site'
import { useUnpinned } from '../lib/useUnpinned'
import Atmosphere from './Atmosphere'

const EASE = [0.16, 1, 0.3, 1]

export default function Hero() {
  const ref = useRef(null)
  const { unpinned, reducedMotion } = useUnpinned()
  const pinned = !unpinned

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  // The headline holds, then lifts away while the media frame opens like an
  // aperture: a low strip below the copy widening into a near full-bleed
  // cinematic surface. Clip-path only, so the canvas never re-lays-out.
  const headY = useTransform(p, [0.05, 0.45], ['0vh', '-11vh'])
  const headOpacity = useTransform(p, [0.1, 0.42], [1, 0])
  const clipTop = useTransform(p, [0.02, 0.75], [62, 0])
  const clipSide = useTransform(p, [0.02, 0.75], [9, 0])
  const clipPath = useMotionTemplate`inset(${clipTop}% ${clipSide}% 0% ${clipSide}% round var(--radius-media))`
  const mediaY = useTransform(p, [0.02, 0.75], ['8vh', '0vh'])
  const captionOpacity = useTransform(p, [0.6, 0.78], [0, 1])

  return (
    <section ref={ref} className={`hero${pinned ? ' hero-pinned' : ''}`}>
      <div className="hero-sticky">
        <motion.div
          className="hero-copy"
          style={pinned ? { y: headY, opacity: headOpacity } : undefined}
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

        <motion.div
          className="hero-media-holder"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
        >
          <motion.div
            className="hero-media"
            style={pinned ? { y: mediaY, clipPath } : undefined}
          >
            <Atmosphere animate={!reducedMotion} />
            <motion.span
              className="hero-media-caption"
              style={pinned ? { opacity: captionOpacity } : undefined}
            >
              {hero.mediaCaption}
            </motion.span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
