import { motion } from 'motion/react'
import { cta } from '../content/site'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

export default function CtaBookend() {
  const [ref, inView] = useInViewOnce('-10% 0px')

  return (
    <section className="cta" ref={ref}>
      <motion.div
        className="cta-surface"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <span className="label cta-label">{cta.label}</span>
        <h2 className="h-lg cta-headline">{cta.headline}</h2>
        <p className="cta-body">{cta.body}</p>
        <a className="pill pill-light" href={cta.button.href}>
          {cta.button.label}
        </a>
      </motion.div>
    </section>
  )
}
