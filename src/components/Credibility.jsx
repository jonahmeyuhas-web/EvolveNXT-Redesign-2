import { motion } from 'motion/react'
import { credibility } from '../content/site'
import { useInViewOnce } from '../lib/useInViewOnce'

const EASE = [0.16, 1, 0.3, 1]

export default function Credibility() {
  const [ref, inView] = useInViewOnce('-12% 0px')

  return (
    <section className="credibility">
      <div className="container" ref={ref}>
        <motion.h2
          className="credibility-line"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {credibility.line}
        </motion.h2>
        <div className="credibility-facts">
          {credibility.facts.map((fact, i) => (
            <motion.span
              className="credibility-fact"
              key={fact}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.08 }}
            >
              {fact}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
